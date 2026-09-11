import type { APIRoute } from 'astro';
import { logicDocs } from '../../../lib/logic-docs';
import { logicMarkdown } from '../../lib/logic-markdown';

export function getStaticPaths() {
  return logicDocs.map(doc => ({ params: { slug: doc.slug } }));
}

export const GET: APIRoute = ({ params }) => {
  const doc = logicDocs.find(doc => doc.slug === params.slug);
  if (!doc) return new Response('Not found\n', { status: 404 });
  return new Response(logicMarkdown(doc), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
