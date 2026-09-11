import type { FilterDoc } from '../../lib/filter-docs';

const fence = (language: string, code: string, title?: string) => {
  const longestRun = Math.max(0, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length));
  const delimiter = '`'.repeat(Math.max(3, longestRun + 1));
  return `${delimiter}${language}${title ? ` title="${title}"` : ''}\n${code}\n${delimiter}`;
};

export function filterMarkdown(filter: FilterDoc) {
  const lines = [
    '---',
    `title: ${filter.name}`,
    `description: ${JSON.stringify(filter.summary)}`,
    '---',
    '',
    `# ${filter.name}`,
    '',
    filter.summary,
    '',
  ];

  lines.push('## Syntax', '', fence('knap', filter.syntax.map((syntax) => `{{ value | ${syntax} }}`).join('\n')), '');
  const behavior = [...(filter.parameters ?? []), ...(filter.notes ?? [])];
  if (behavior.length) lines.push('## Usage', '', ...behavior.map((note) => `- ${note}`), '');

  if (filter.name === 'comment') lines.push('This filter produces Obsidian `%%` comments that remain in the generated Markdown. To leave a comment that is removed during rendering, use [template comments](/logic#comments).', '');

  lines.push(`## ${filter.examples.length === 1 ? 'Example' : 'Examples'}`, '');
  filter.examples.forEach((item) => {
    if (!(filter.examples.length === 1 && item.title === 'Basic usage')) lines.push(`### ${item.title}`, '');
    lines.push(fence('json', JSON.stringify(item.variables, null, 2), 'Data'), '', fence('knap', item.template, 'Template'), '', fence('md', item.expected, 'Output'), '');
  });

  for (const table of filter.referenceTables ?? []) {
    const row = (cells: string[]) => `| ${cells.map((cell) => cell.replaceAll('|', '\\|')).join(' | ')} |`;
    const reference = table.reference ? ` See [${table.reference.label}](${table.reference.href}).` : '';
    lines.push(`## ${table.title}`, '', table.description + reference, '', row(table.columns), row(table.columns.map(() => '---')), ...table.rows.map(row), '');
  }

  if (filter.related?.length) lines.push('## Related filters', '', ...filter.related.map((name) => `- [${name}](/filters/${name.replaceAll('_', '-')})`), '');
  return `${lines.join('\n').trim()}\n`;
}
