export interface TemplateSuggestion {
  label: string;
  type: string;
  detail?: string;
  info?: string;
  boost?: number;
}

const logic = [
  ['if', 'Start a condition'], ['for', 'Iterate over an array'],
  ['set', 'Assign a variable'], ['elseif', 'Add another condition'],
  ['else', 'Use a fallback branch'], ['endif', 'Close a condition'],
  ['endfor', 'Close a loop'],
].map(([label, detail], index) => ({ label, detail, type: 'keyword', boost: 7 - index }));

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

export function templateCompletions(source: string, position: number, variables: Record<string, unknown>, filters: TemplateSuggestion[]) {
  const before = source.slice(0, position);
  const tag = templateTags(before).at(-1);
  if (!tag || tag.closed || tag.quoted) return null;
  const body = tag.body;
  const word = body.match(/[\w$]*$/)![0];
  const from = position - word.length;
  const to = position + source.slice(position).match(/^[\w$]*/)![0].length;
  if (tag.kind === '{%' && /^\s*\w*$/.test(body)) return { from, to, options: logic };
  // A single pipe introduces a filter; || is a logical expression.
  if (/(?:^|[^|])\|\s*\w*$/.test(body)) return { from, to, options: filters };
  if (tag.kind === '{%' && /^\s*(?:for|set)\s+\w*\s*$/.test(body)) return null;

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
  }
  return { from, to, options };
}
