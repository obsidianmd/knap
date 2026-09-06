import type { APIRoute } from 'astro';
import content from '../content/pages/index.md?raw';

export const GET: APIRoute = () => new Response(content, {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
});
