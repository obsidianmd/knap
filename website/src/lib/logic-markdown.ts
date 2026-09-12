import type { LogicDoc } from '../../lib/logic-docs';
import { formatPageTitle } from './page-title';

export function logicMarkdown(doc: LogicDoc): string {
  const fence = (language: string, content: string) => `\`\`\`${language}\n${content}\n\`\`\``;
  const lines = ['---', `title: ${formatPageTitle(doc.title)}`, `description: ${JSON.stringify(doc.summary)}`, `url: https://knap.md/logic/${doc.slug}`, '---', '', `# ${doc.title}`, '', doc.summary, '', '## Syntax', '', fence('knap', doc.syntax), ''];
  for (const section of doc.sections) lines.push(`## ${section.title}`, '', ...section.notes.map(note => `- ${note}`), '');
  lines.push(doc.examples.length === 1 ? '## Example' : '## Examples', '');
  for (const example of doc.examples) {
    if (doc.examples.length > 1) lines.push(`### ${example.title}`, '');
    lines.push(fence('json title="Data"', JSON.stringify(example.variables, null, 2)), '', fence('knap title="Template"', example.template), '', fence('md title="Output"', example.expected), '');
  }
  lines.push('## Related', '', ...doc.links.map(link => `- [${link.label}](${link.href}). ${link.summary}`), '');
  return lines.join('\n');
}
