import { parse } from '../../../src/parser';
import type { TemplateError, TemplateWarning } from '../../../src/errors';

interface Part {
  raw: string;
  start: number;
  tag: boolean;
  closed: boolean;
}

// Find tag boundaries without treating delimiters inside quoted strings as tags.
function splitTemplate(source: string): Part[] {
  const parts: Part[] = [];
  let position = 0;
  const isStart = (index: number) => source.startsWith('{{', index) || source.startsWith('{%', index);
  while (position < source.length) {
    const start = position;
    if (!isStart(position)) {
      while (position < source.length && !isStart(position)) position++;
      parts.push({ raw: source.slice(start, position), start, tag: false, closed: true });
      continue;
    }
    const end = source[position + 1] === '{' ? '}}' : '%}';
    position += 2;
    let quote = '';
    let closed = false;
    while (position < source.length) {
      const character = source[position];
      if (quote) {
        if (character === '\\') { position += Math.min(2, source.length - position); continue; }
        if (character === quote) quote = '';
      } else {
        if (source.startsWith(end, position)) { position += 2; closed = true; break; }
        if (isStart(position)) break;
        if (character === '"' || character === "'" || character === '`') quote = character;
      }
      position++;
    }
    parts.push({ raw: source.slice(start, position), start, tag: true, closed });
  }
  return parts;
}

// Knap treats unescaped closing delimiters inside strings as syntax errors.
const literal = (text: string) => `{{ ${JSON.stringify(text).replaceAll('}', '\\}')} }}`;

/** Build an editable preview while leaving strict Knap parsing unchanged. */
export function recoverPlaygroundTemplate(source: string) {
  const parts = splitTemplate(source);
  const rendered = parts.map((part) => part.raw);
  const blocks: { kind: string; opening: number; branches: number[]; hasElse: boolean }[] = [];
  const preserve = (index: number) => { rendered[index] = literal(parts[index].raw); };
  const preserveBlock = (block: typeof blocks[number]) => {
    preserve(block.opening);
    block.branches.forEach(preserve);
  };

  parts.forEach((part, index) => {
    if (!part.tag) return;
    const keyword = part.raw.match(/^\{%-?\s*(\w+)\b/)?.[1];
    const closing = keyword === 'endif' || keyword === 'endfor';
    // An identifiable incomplete closing tag still closes its block, then appears
    // literally outside it, so it remains visible even when the condition is false.
    const incompleteClose = !part.closed && /^\{%-?\s*(?:endif|endfor)\s*(?:-?%|\})?\s*$/.test(part.raw);
    const candidate = incompleteClose ? `{% ${keyword} %}` : part.raw;
    if (!part.closed && !incompleteClose) { preserve(index); return; }

    const validationSource = keyword === 'if' || keyword === 'for'
      ? `${candidate}{% ${keyword === 'if' ? 'endif' : 'endfor'} %}`
      : keyword === 'else' || keyword === 'elseif'
        ? `{% if true %}${candidate}{% endif %}`
        : closing
          ? `{% ${keyword === 'endif' ? 'if true' : 'for item in items'} %}${candidate}`
          : candidate;
    if (parse(validationSource).errors.length) { preserve(index); return; }

    if (keyword === 'if' || keyword === 'for') {
      blocks.push({ kind: keyword, opening: index, branches: [], hasElse: false });
    } else if (keyword === 'else' || keyword === 'elseif') {
      const block = blocks.at(-1);
      if (!block || block.kind !== 'if' || block.hasElse) { preserve(index); return; }
      block.branches.push(index);
      if (keyword === 'else') block.hasElse = true;
    } else if (closing) {
      const kind = keyword === 'endif' ? 'if' : 'for';
      const match = blocks.map((block) => block.kind).lastIndexOf(kind);
      if (match < 0) { preserve(index); return; }
      while (blocks.length - 1 > match) preserveBlock(blocks.pop()!);
      blocks.pop();
      if (incompleteClose) rendered[index] = candidate + literal(part.raw);
    }
  });
  blocks.forEach(preserveBlock);

  const template = rendered.join('');
  const originalLines = lineOffsets(source);
  const recoveredLines = lineOffsets(template);
  let length = 0;
  const offsets = rendered.map((text) => { const offset = length; length += text.length; return offset; });

  function originalPosition<T extends TemplateError | TemplateWarning>(diagnostic: T): T {
    const offset = (recoveredLines[diagnostic.line - 1] ?? template.length) + diagnostic.column - 1;
    let index = offsets.length - 1;
    while (index > 0 && offsets[index] > offset) index--;
    if (index < 0) return diagnostic;
    const original = parts[index].start + (rendered[index] === parts[index].raw ? offset - offsets[index] : 0);
    let line = originalLines.length - 1;
    while (line > 0 && originalLines[line] > original) line--;
    return { ...diagnostic, line: line + 1, column: original - originalLines[line] + 1 };
  }
  return { template, originalPosition };
}

function lineOffsets(source: string) {
  const offsets = [0];
  for (let index = 0; index < source.length; index++) if (source[index] === '\n') offsets.push(index + 1);
  return offsets;
}
