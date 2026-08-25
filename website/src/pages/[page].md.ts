import type { APIRoute } from 'astro';
import api from '../content/docs/api.md?raw';
import filters from '../content/docs/filters.md?raw';
import logic from '../content/docs/logic.md?raw';
import variables from '../content/docs/variables.md?raw';
import { filterDocs, filterGroups } from '../../lib/filter-docs';

const byName = new Map(filterDocs.map((filter) => [filter.name, filter]));
const filterDirectory = filterGroups.map((group) => [
  `### ${group.label}`,
  '',
  group.intro,
  '',
  ...group.filters.map((name) => byName.get(name)).filter(Boolean).map((filter) => `- [\`${filter!.name}\`](/filters/${filter!.slug}) — ${filter!.summary}`),
].join('\n')).join('\n\n');

const documents = { api, filters: filters.replace('<!-- FILTER_DIRECTORY -->', filterDirectory), logic, variables } as const;

export function getStaticPaths() {
  return Object.keys(documents).map((page) => ({ params: { page } }));
}

export const GET: APIRoute = ({ params }) => new Response(documents[params.page as keyof typeof documents], {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
});
