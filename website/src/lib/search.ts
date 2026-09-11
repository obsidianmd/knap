export interface SearchItem {
  title: string;
  kind: 'page' | 'filter' | 'section' | 'syntax';
  category: string;
  summary: string;
  href: string;
  aliases?: string[];
  searchTerms?: string[];
  syntax?: string[];
  tone?: 'variable';
}

export function searchDocumentation(items: SearchItem[], input: string, limit = 12): SearchItem[] {
  const query = input.trim().toLowerCase();
  if (!query) return items.filter(item => (item.kind === 'syntax' && item.category === 'Logic') || item.kind === 'filter').slice(0, limit);

  const score = (item: SearchItem): number => {
    const title = item.title.toLowerCase();
    const aliases = (item.aliases ?? []).map(alias => alias.toLowerCase());
    if (title === query) return 0;
    if (aliases.includes(query)) return 1;
    if ([title, ...aliases].some(name => name.startsWith(query))) return 2;
    if ([title, ...aliases].some(name => name.includes(query))) return 3;
    const content = [item.category, item.summary, ...(item.searchTerms ?? []), ...(item.syntax ?? [])].join(' ').toLowerCase();
    return content.includes(query) ? 4 : Infinity;
  };

  return items.map((item, index) => ({ item, index, score: score(item) }))
    .filter(result => Number.isFinite(result.score))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, limit)
    .map(result => result.item);
}
