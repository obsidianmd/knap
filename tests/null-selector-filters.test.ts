import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../src/filters';

const engine = createEngine({ filters: standardFilters });

describe('null collection selections', () => {
	test.each([
		['{{ value | first }}', [null, 'x']],
		['{{ value | last }}', ['x', null]],
		['{{ value | slice:0,1 }}', [null, 'x']],
	] as const)('renders null as empty text through %s', async (template, value) => {
		await expect(engine.renderOrThrow(template, { variables: { value } })).resolves.toBe('');
	});

	test.each([
		['first', [null, 'x']],
		['last', ['x', null]],
		['slice:0,1', [null, 'x']],
	] as const)('renders null as empty text through synchronous %s', (filterString, value) => {
		expect(applyFiltersWithRegistry(
			value,
			filterString,
			standardFilters,
			{ variables: {} },
		)).toBe('');
	});
});
