import { tokenize } from '../../../src/tokenizer';

export interface TemplateSuggestion {
  label: string;
  type: string;
  detail?: string;
  info?: string;
  boost?: number;
  parameterValues?: string[];
}

const logic = [
  ['if', 'Start a condition'], ['for', 'Iterate over an array'],
  ['set', 'Assign a variable'], ['elseif', 'Add another condition'],
  ['else', 'Use a fallback branch'], ['endif', 'Close a condition'],
  ['endfor', 'Close a loop'],
].map(([label, detail], index) => ({ label, detail, type: 'keyword', boost: 7 - index }));

const operators = [
  ['==', 'Equal to'], ['!=', 'Not equal to'],
  ['>', 'Greater than'], ['<', 'Less than'],
  ['>=', 'Greater than or equal to'], ['<=', 'Less than or equal to'],
  ['contains', 'String substring or array member'],
  ['and', 'Both sides are true'], ['or', 'Either side is true'],
  ['&&', 'Both sides are true'], ['||', 'Either side is true'],
  ['??', 'Fallback value'], ['|', 'Apply a filter'],
].map(([label, detail], index) => ({ label, detail, type: /^[a-z]/.test(label) ? 'keyword' : 'operator', boost: 13 - index }));

const conditionValues: TemplateSuggestion[] = [
  { label: 'not', type: 'keyword', detail: 'Negate an expression', boost: -2 },
  { label: '!', type: 'operator', detail: 'Negate an expression', boost: -3 },
  ...['true', 'false', 'null'].map((label) => ({ label, type: 'keyword', boost: -1 })),
];

function conditionOperatorRange(body: string, position: number, source: string) {
  const condition = body.match(/^\s*(?:if|elseif)\s+([\s\S]*)$/)?.[1];
  if (condition === undefined) return undefined;
  const partial = condition.match(/[\w$]+$|[!<>=&|?]+$/)?.[0] ?? '';
  const prefix = condition.slice(0, condition.length - partial.length);
  if (prefix.trimEnd().endsWith('.')) return null;
  // Use Knap's tokenizer so strings, numbers, property access, and grouped
  // expressions all have the same boundaries as the actual template language.
  const tokens = tokenize('{{' + prefix + '}}').tokens;
  const last = tokens.at(-3);
  if (!last || !['identifier', 'string', 'number', 'boolean', 'null', 'rparen', 'rbracket', 'rbrace'].includes(last.type)) return null;
  const suffix = source.slice(position).match(/^[\w$]+|^[!<>=&|?]+/)?.[0] ?? '';
  return { from: position - partial.length, to: position + suffix.length, options: operators };
}

// Scan delimiters outside strings, including unfinished tags while typing.
export function templateTags(source: string) {
  const tags: { from: number; body: string; kind: string; closed: boolean; quoted: boolean }[] = [];
  const opener = /\{[{%]/g;
  let match: RegExpExecArray | null;
  while ((match = opener.exec(source))) {
    const kind = match[0];
    const close = kind === '{{' ? '}}' : '%}';
    const from = match.index + 2;
    let quote = '';
    let index = from;
    for (; index < source.length; index++) {
      const char = source[index];
      if (quote) {
        if (char === '\\') index++;
        else if (char === quote) quote = '';
      } else if (char === '"' || char === "'") quote = char;
      else if (source.startsWith(close, index)) break;
    }
    const closed = index < source.length;
    tags.push({ from, body: source.slice(from, index), kind, closed, quoted: !!quote });
    opener.lastIndex = index + 2;
  }
  return tags;
}

type Scope = Map<string, unknown[]>;
function resolve(path: string, scope: Scope): unknown[] {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let values = scope.get(parts.shift()!) ?? [];
  for (const part of parts) {
    values = values.flatMap((value) => value !== null && typeof value === 'object' && Object.hasOwn(value, part)
      ? [(value as Record<string, unknown>)[part]] : []);
  }
  return values;
}

function scopeAt(source: string, variables: Record<string, unknown>) {
  let scope: Scope = new Map(Object.entries(variables).map(([key, value]) => [key, [value]]));
  const loops: Scope[] = [];
  for (const tag of templateTags(source)) {
    if (!tag.closed || tag.kind !== '{%') continue;
    const loop = tag.body.match(/^\s*for\s+(\w+)\s+in\s+([\w.\[\]]+)\s*$/);
    const assignment = tag.body.match(/^\s*set\s+(\w+)\s*=\s*([\s\S]+?)\s*$/);
    if (loop) {
      const items = resolve(loop[2], scope).flatMap((value) => Array.isArray(value) ? value : []);
      loops.push(scope);
      scope = new Map(scope);
      scope.set(loop[1], items);
      scope.set(`${loop[1]}_index`, [0]);
      scope.set('loop', [{ index: 1, index0: 0, first: true, last: false, length: 0 }]);
    } else if (/^\s*endfor\s*$/.test(tag.body)) {
      scope = loops.pop() ?? scope;
    } else if (assignment) {
      let values = resolve(assignment[2], scope);
      if (!values.length) {
        try { values = [JSON.parse(assignment[2])]; } catch { /* Unknown expression type. */ }
      }
      scope.set(assignment[1], values);
    }
  }
  return scope;
}

function filterParameterCompletions(body: string, position: number, source: string, filters: TemplateSuggestion[]) {
  let pipe = -1;
  let quote = '';
  for (let index = 0; index < body.length; index++) {
    const char = body[index];
    if (quote) {
      if (char === '\\') index++;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '|' && body[index - 1] !== '|' && body[index + 1] !== '|') pipe = index;
  }
  if (pipe < 0) return null;
  const argument = body.slice(pipe + 1).match(/^\s*(\w+)\s*:\s*(?:\(\s*)?["']?([\w-]*)$/);
  if (!argument) return null;
  const values = filters.find((filter) => filter.label === argument[1])?.parameterValues;
  if (!values?.length) return null;
  return {
    from: position - argument[2].length,
    to: position + (source.slice(position).match(/^[\w-]*/)?.[0].length ?? 0),
    options: values.map((label, index) => ({ label, type: 'enum', boost: values.length - index })),
  };
}

export function templateCompletions(source: string, position: number, variables: Record<string, unknown>, filters: TemplateSuggestion[]) {
  const before = source.slice(0, position);
  const tag = templateTags(before).at(-1);
  if (!tag || tag.closed) return null;
  const body = tag.body;
  const parameters = filterParameterCompletions(body, position, source, filters);
  if (parameters) return parameters;
  if (tag.quoted) return null;
  const word = body.match(/[\w$]*$/)![0];
  const from = position - word.length;
  const to = position + source.slice(position).match(/^[\w$]*/)![0].length;
  if (tag.kind === '{%' && /^\s*\w*$/.test(body)) return { from, to, options: logic };
  // A single pipe introduces a filter; || is a logical expression.
  if (/(?:^|[^|])\|\s*\w*$/.test(body)) return { from, to, options: filters };
  if (tag.kind === '{%' && /^\s*(?:for|set)\s+\w*\s*$/.test(body)) return null;

  const operatorResult = tag.kind === '{%' ? conditionOperatorRange(body, position, source) : undefined;
  if (operatorResult) return operatorResult;

  const scope = scopeAt(source.slice(0, tag.from - 2), variables);
  const path = body.match(/([\w$]+(?:\[\d+\]|\.[\w$]+)*)\.[\w$]*$/);
  let options: TemplateSuggestion[];
  if (path) {
    const keys = new Set<string>();
    for (const value of resolve(path[1], scope)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.keys(value).forEach((key) => { if (/^[a-zA-Z_$][\w$]*$/.test(key)) keys.add(key); });
      }
    }
    options = [...keys].map((label) => ({ label, type: 'property' }));
  } else {
    options = [...scope.keys()].filter((key) => /^[a-zA-Z_$][\w$]*$/.test(key))
      .map((label) => ({ label, type: 'variable' }));
    if (operatorResult === null) options.push(...conditionValues);
  }
  return { from, to, options };
}
