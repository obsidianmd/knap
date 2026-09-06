import type { FilterDoc } from '../../lib/filter-docs';

const fence = (language: string, code: string, title?: string) => `\`\`\`${language}${title ? ` title="${title}"` : ''}\n${code}\n\`\`\``;

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

  if (filter.environment === 'html') lines.push('> **HTML preset**  ', '> This filter needs browser-compatible DOM globals and the `knap/html` preset.', '');

  lines.push('## Syntax', '', fence('knap', filter.syntax.map((syntax) => `{{ value | ${syntax} }}`).join('\n')), '');
  const behavior = [...(filter.parameters ?? []), ...(filter.notes ?? [])];
  const references = (filter.references ?? []).map((reference) => `[${reference.label}](${reference.href})`);
  if (behavior.length || references.length) lines.push('## Behavior', '', ...behavior.map((note) => `- ${note}`), ...references.map((reference) => `- ${reference}`), '');

  lines.push(`## ${filter.examples.length === 1 ? 'Example' : 'Examples'}`, '');
  filter.examples.forEach((item) => {
    if (!(filter.examples.length === 1 && item.title === 'Basic usage')) lines.push(`### ${item.title}`, '');
    lines.push(fence('json', JSON.stringify(item.variables, null, 2), 'Input'), '', fence('knap', item.template, 'Template'), '', fence('md', item.expected, 'Output'), '');
  });

  if (filter.related?.length) lines.push('## Related filters', '', ...filter.related.map((name) => `- [${name}](/filters/${name.replaceAll('_', '-')})`), '');
  return `${lines.join('\n').trim()}\n`;
}
