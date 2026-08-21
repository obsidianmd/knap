import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { standardFilters } from '../src/filters';
import { fixtures } from '../bench/fixtures';

// A benchmark that measures the error path measures nothing useful, so keep
// the bench fixtures honest: every one must render cleanly.
describe('benchmark fixtures', () => {
	const engine = createEngine({ filters: standardFilters });

	test.each(fixtures)('$name renders without errors', async ({ template, variables }) => {
		const result = await engine.render(template, { variables });

		expect(result.errors).toEqual([]);
		expect(result.output.length).toBeGreaterThan(0);
	});
});
