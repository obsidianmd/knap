import type { APIRoute } from 'astro';
import { formatPageTitle } from '../lib/page-title';
import api from '../content/docs/api.md?raw';
import cli from '../content/docs/cli.md?raw';
import filters from '../content/docs/filters.md?raw';
import logic from '../content/docs/logic.md?raw';
import variables from '../content/docs/variables.md?raw';
import { filterDocs, filterGroups } from '../../lib/filter-docs';
import { logicDocs } from '../../lib/logic-docs';

const logicDirectory = logicDocs.map(doc => `- [\`${doc.title}\`](/logic/${doc.slug}). ${doc.summary}`).join('\n');

const byName = new Map(filterDocs.map((filter) => [filter.name, filter]));
const filterDirectory = filterGroups.map((group) => [
  `### ${group.label}`,
  '',
  group.intro,
  '',
  ...group.filters.map((name) => byName.get(name)).filter(Boolean).map((filter) => `- [\`${filter!.name}\`](/filters/${filter!.slug}): ${filter!.summary}`),
].join('\n')).join('\n\n');

const install = [
  '## Install',
  '',
  '```shell',
  'npm install knap',
  '```',
  '',
  'Knap is ESM-first, also ships CommonJS entry points, and requires Node.js 20 or later.',
].join('\n');

const documents = {
  api: api.replace('<!-- INSTALL -->', install),
  cli,
  filters: filters.replace('<!-- FILTER_DIRECTORY -->', filterDirectory),
  logic: logic.replace('<!-- LOGIC_DIRECTORY -->', logicDirectory),
  variables,
} as const;

export function getStaticPaths() {
  return Object.keys(documents).map((page) => ({ params: { page } }));
}

export const GET: APIRoute = ({ params }) => new Response(documents[params.page as keyof typeof documents].replace(
  /^title: (.+)$/m, (_line, title: string) => `title: ${formatPageTitle(title)}`,
), {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
});
