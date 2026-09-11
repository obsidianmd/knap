import { describe, expect, test } from 'vitest';
import { searchDocumentation, type SearchItem } from '../website/src/lib/search';

const entry = (title: string, options: Partial<SearchItem> = {}): SearchItem => ({
  title, kind: 'syntax', category: 'Logic', summary: '', href: `/logic/${title}`, ...options,
});

describe('documentation search ranking', () => {
  test('ranks the exact title ahead of name and description matches before limiting results', () => {
    const items = [
      entry('Filters', { kind: 'page', summary: 'Transform values before Knap writes them.' }),
      ...Array.from({ length: 12 }, (_, index) => entry(`note-${index}`, { searchTerms: ['for'] })),
      entry('endfor'), entry('format'), entry('for'),
    ];
    expect(searchDocumentation(items, ' FOR ').slice(0, 3).map(item => item.title)).toEqual(['for', 'format', 'endfor']);
    expect(items[0].title).toBe('Filters');
  });

  test('puts exact aliases ahead of partial names, while preferring an exact title', () => {
    const items = [entry('uppercase'), entry('upper', { aliases: ['up'] }), entry('up')];
    expect(searchDocumentation(items, 'up').map(item => item.title)).toEqual(['up', 'upper', 'uppercase']);
  });

  test('preserves content discovery and stable ordering for ties', () => {
    const items = [entry('if', { syntax: ['{% if condition %}'] }), entry('comments', { syntax: ['{# comment #}'] }), entry('set', { searchTerms: ['Variable scope'] })];
    expect(searchDocumentation(items, '{#')[0].title).toBe('comments');
    expect(searchDocumentation(items, 'scope')[0].title).toBe('set');
    expect(searchDocumentation(items, 'logic')).toEqual(items);
    expect(searchDocumentation(items, 'nonexistent')).toEqual([]);
  });

  test('keeps the default suggestions for an empty query', () => {
    const items = [entry('Guide', { kind: 'page' }), entry('for'), entry('upper', { kind: 'filter', category: 'Text' })];
    expect(searchDocumentation(items, '  ')).toEqual(items.slice(1));
  });
});
