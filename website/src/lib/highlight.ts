export type CodeLanguage = 'knap' | 'ts' | 'shell' | 'md' | 'json';

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const span = (className: string | undefined, value: string) => className
  ? `<span class="${className}">${escapeHtml(value)}</span>`
  : escapeHtml(value);

function tokenClass(token: string, language: CodeLanguage) {
  if (/^(\{\{|\}\}|\{%|%\})$/.test(token)) return 'syn-language';
  if (/^(===|!==|==|!=|=>|<=|>=|&&|\|\||\?\?|[{}()[\].,:;=+\-*/<>!?|])$/.test(token)) return 'syn-punctuation';
  if (/^['"`]/.test(token)) return 'syn-string';
  if (/^\d/.test(token)) return 'syn-number';
  if (language === 'ts' && /^(import|from)$/.test(token)) return 'syn-import';
  if (/^(true|false|null|undefined)$/.test(token)) return 'syn-constant';
  if (/^(if|elseif|else|endif|for|in|endfor|set|and|or|not|contains)$/.test(token)) return 'syn-keyword';
  if (language === 'ts' && /^(const|let|type|async|await|return|new|throw|export)$/.test(token)) return 'syn-keyword';
  if (language === 'shell' && /^(pnpm|npm|npx|yarn|bun)$/.test(token)) return 'syn-filter';
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*$/.test(token)) return 'syn-variable';
  return undefined;
}

function highlightMarkdownInline(value: string) {
  const parts = value.split(/(\[[^\]\n]+\]\([^)\n]+\)|\[\^[^\]\n]+\])/g).filter(Boolean);
  return parts.map((part) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return `${span('syn-punctuation', '[')}${span('syn-md-link', link[1])}${span('syn-punctuation', '](')}${span('syn-md-link', link[2])}${span('syn-punctuation', ')')}`;
    if (/^\[\^[^\]]+\]$/.test(part)) return span('syn-punctuation', part);
    return escapeHtml(part);
  }).join('');
}

function highlightMarkdownLine(line: string) {
  if (/^\s*---\s*$/.test(line)) return span('syn-punctuation', line);

  const heading = line.match(/^(#{1,6})(\s+)(.*)$/);
  if (heading) return `${span('syn-punctuation', heading[1])}${escapeHtml(heading[2])}<span class="syn-md-heading">${highlightMarkdownInline(heading[3])}</span>`;

  const blockquote = line.match(/^(\s*)(>)(\s?)(.*)$/);
  if (blockquote) return `${escapeHtml(blockquote[1])}${span('syn-punctuation', blockquote[2])}${escapeHtml(blockquote[3])}${highlightMarkdownInline(blockquote[4])}`;

  const footnote = line.match(/^(\[\^[^\]]+\])(:)(\s*)(.*)$/);
  if (footnote) return `${span('syn-punctuation', footnote[1] + footnote[2])}${escapeHtml(footnote[3])}${highlightMarkdownInline(footnote[4])}`;

  const yaml = line.match(/^([A-Za-z][\w-]*)(:)(\s*)(.*)$/);
  if (yaml) {
    const quoted = yaml[4].match(/^(["'])(.*)\1$/);
    let value = span('syn-string', yaml[4]);
    if (quoted) value = `${span('syn-punctuation', quoted[1])}${span('syn-string', quoted[2])}${span('syn-punctuation', quoted[1])}`;
    else if (/^(?:true|false|null|~)$/.test(yaml[4])) value = span('syn-constant', yaml[4]);
    else if (/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(yaml[4])) value = span('syn-number', yaml[4]);
    return `${span('syn-yaml-key', yaml[1])}${span('syn-punctuation', yaml[2])}${escapeHtml(yaml[3])}${value}`;
  }

  if (/^\s*\|.*\|\s*$/.test(line)) {
    return line.split(/(\||:?-+:?)/g).filter(Boolean).map((part) => span(/^(?:\||:?-+:?)$/.test(part) ? 'syn-punctuation' : undefined, part)).join('');
  }

  return highlightMarkdownInline(line);
}

function highlightTokenLine(line: string, language: Exclude<CodeLanguage, 'md'>, constrainKnapToTags = true) {
  const pattern = /(\{\{|\}\}|\{%|%\}|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|===|!==|==|!=|=>|<=|>=|&&|\|\||\?\?|[{}()[\].,:;=+\-*/<>!?|]|\b(?:if|elseif|else|endif|for|in|endfor|set|and|or|not|contains|true|false|null|undefined|import|from|const|let|type|async|await|return|new|throw|export|pnpm|npm|npx)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*)/g;
  const tokens = line.split(pattern).filter(Boolean);
  let expectsFilter = false;
  let inKnapExpression = false;

  return tokens.map((token, index) => {
    let className = tokenClass(token, language);

    if (language === 'knap' && constrainKnapToTags) {
      if (/^(\{\{|\{%)$/.test(token)) inKnapExpression = true;
      else if (/^(\}\}|%\})$/.test(token)) inKnapExpression = false;
      else if (!inKnapExpression) className = undefined;
    }

    if (token === '|' && language === 'knap' && inKnapExpression) expectsFilter = true;
    else if (expectsFilter && /^\s+$/.test(token)) { /* keep waiting */ }
    else if (expectsFilter) {
      className = 'syn-filter';
      expectsFilter = false;
    }

    if ((language === 'ts' || language === 'json') && className === 'syn-variable') {
      const nextToken = tokens.slice(index + 1).find((candidate) => !/^\s+$/.test(candidate));
      if (nextToken === '(') className = 'syn-function';
    }

    const quoted = className === 'syn-string' ? token.match(/^(['"`])([\s\S]*)\1$/) : null;
    if (quoted) return `${span('syn-punctuation', quoted[1])}${span('syn-string', quoted[2])}${span('syn-punctuation', quoted[1])}`;
    return span(className, token);
  }).join('');
}

export function highlightInlineKnap(value: string) {
  const isKnapSyntax = /(\{\{|\}\}|\{%|%\}|\?\?|\b(?:if|elseif|else|endif|for|in|endfor|set|and|or|not|contains)\b)/.test(value)
    || /(?:==|!=|>=|<=|&&|\|\|)/.test(value)
    || /(?:^|\s)[<>!](?:\s|$)/.test(value)
    || /^loop\.(?:index|index0|first|last|length)$/.test(value)
    || value === 'item_index';
  return isKnapSyntax ? highlightTokenLine(value, 'knap', false) : undefined;
}

function highlightKnapLine(line: string) {
  return line.split(/(\{\{.*?\}\}|\{%.*?%\})/g).filter(Boolean).map((segment) =>
    /^(?:\{\{.*\}\}|\{%.*%\})$/.test(segment)
      ? highlightTokenLine(segment, 'knap')
      : highlightMarkdownLine(segment)
  ).join('');
}

export function highlightLine(line: string, language: CodeLanguage) {
  if (language === 'md') return highlightMarkdownLine(line);
  if (language === 'knap') return highlightKnapLine(line);
  return highlightTokenLine(line, language);
}

export function highlightCode(code: string, language: CodeLanguage, showLineNumbers = false) {
  const normalized = code.replace(/^\n|\n$/g, '');
  return normalized.split('\n').map((line, index) => `<span class="doc-code-line"><span class="doc-line-number"${showLineNumbers ? '' : ' hidden'}>${index + 1}</span><span class="doc-code-source">${highlightLine(line, language)}</span></span>`).join('');
}
