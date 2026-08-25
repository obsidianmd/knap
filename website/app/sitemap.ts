import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/variables', '/logic', '/filters', '/api'].map((path) => ({
    url: `https://knap.md${path}`,
    changeFrequency: path ? 'monthly' : 'weekly',
    priority: path ? 0.8 : 1,
  }));
}
