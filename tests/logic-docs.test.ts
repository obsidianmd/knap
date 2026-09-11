import { describe, expect, test } from 'vitest';
import { createEngine, standardFilters } from '../src';
import { logicDocs } from '../website/lib/logic-docs';

describe('logic reference examples', () => {
  test.each(logicDocs.flatMap(doc => doc.examples.map(example => ({ page: doc.slug, ...example }))))('$page: $title', async example => {
    const result = await createEngine({ filters: standardFilters }).render(example.template, { variables: example.variables });
    expect(result.errors).toEqual([]);
    expect(result.output).toBe(example.expected);
  });
});
