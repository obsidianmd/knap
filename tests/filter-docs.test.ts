import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { standardFilters } from '../src/filters';
import { htmlFilters } from '../src/html';
import { filterDocs, filterDocsByName } from '../website/lib/filter-docs';
import { filterMarkdown } from '../website/src/lib/filter-markdown';

describe('filter documentation catalog', () => {
  test('documents every registered filter and alias', () => {
    const registered = [...Object.keys(standardFilters), ...Object.keys(htmlFilters)].sort();
    expect(registered.filter((name) => !filterDocsByName.has(name))).toEqual([]);
  });

  test('uses unique slugs and includes an example for every filter', () => {
    expect(new Set(filterDocs.map((filter) => filter.slug)).size).toBe(filterDocs.length);
    expect(filterDocs.every((filter) => filter.examples.length > 0)).toBe(true);
  });

  test.each(
    filterDocs.flatMap((filter) => filter.examples
      .filter((example) => example.testable !== false)
      .map((example) => ({ filter: filter.name, example }))),
  )('$filter example matches the Knap renderer', async ({ example }) => {
    const engine = createEngine({ filters: standardFilters });
    const result = await engine.render(example.template, { variables: example.variables });
    expect(result.errors).toEqual([]);
    expect(result.output).toBe(example.expected);
  });

  test('uses a longer outer fence when exported examples contain code fences', () => {
    const code = filterDocsByName.get('code');
    expect(code).toBeDefined();
    expect(filterMarkdown(code!)).toContain('````md title="Output"\n```typescript\nconst answer = 42\n```\n````');
  });
});
