import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { standardFilters } from '../src/filters';
import { fixtures } from '../bench/fixtures';

describe('benchmark fixtures', () => {
	const engine = createEngine({ filters: standardFilters });

	test.each(fixtures)('$name renders without errors', async ({ template, variables }) => {
		const result = await engine.render(template, { variables });

		expect(result.errors).toEqual([]);
		expect(result.output.length).toBeGreaterThan(0);
	});
});
