import type { MetadataRoute } from 'next';
import { allFilterSlugs } from '@/lib/filter-docs';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/variables', '/logic', '/filters', '/api', ...allFilterSlugs.map((slug) => `/filters/${slug}`)];
  return paths.map((path) => ({
    url: `https://knap.md${path}`,
    changeFrequency: path ? 'monthly' : 'weekly',
    priority: path.startsWith('/filters/') ? 0.7 : path ? 0.8 : 1,
  }));
}
