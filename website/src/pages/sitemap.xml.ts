import type { APIRoute } from 'astro';
import { filterDocs } from '../../lib/filter-docs';

const routes = ['', 'logic', 'filters', 'variables', 'api', 'playground', ...filterDocs.map((filter) => `filters/${filter.slug}`)];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>https://knap.md/${route}</loc></url>`).join('')}</urlset>\n`;
export const GET: APIRoute = () => new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
