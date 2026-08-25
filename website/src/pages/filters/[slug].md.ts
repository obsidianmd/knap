import type { APIRoute } from 'astro';
import { filterDocs, filterDocsBySlug } from '../../../lib/filter-docs';
import { filterMarkdown } from '../../lib/filter-markdown';

export function getStaticPaths() {
  return filterDocs.map((filter) => ({ params: { slug: filter.slug } }));
}

export const GET: APIRoute = ({ params }) => {
  const filter = filterDocsBySlug.get(params.slug ?? '');
  if (!filter) return new Response('Not found\n', { status: 404 });
  return new Response(filterMarkdown(filter), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
