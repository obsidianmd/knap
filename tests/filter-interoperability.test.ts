import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../src/filters';

const engine = createEngine({ filters: standardFilters });
const context = { variables: {} };

const chains = [
	{
		name: 'split | sort | join',
		value: 'c,a,b',
		template: '{{ value | split:"," | sort | join:"," }}',
		filterString: 'split:"," | sort | join:","',
		expected: 'a,b,c',
	},
	{
		name: 'unique | sort',
		value: ['b', 'a', 'b'],
		template: '{{ value | unique | sort }}',
		filterString: 'unique | sort',
		expected: '["a","b"]',
	},
	{
		name: 'map | bold | join',
		value: [{ name: 'Lin' }, { name: 'Ada' }],
		template: '{{ value | map:item => item.name | bold | join:"," }}',
		filterString: 'map:item => item.name | bold | join:","',
		expected: '**Lin**,**Ada**',
	},
	{
		name: 'split | compact | join',
		value: 'a,,b',
		template: '{{ value | split:"," | compact | join:"," }}',
		filterString: 'split:"," | compact | join:","',
		expected: 'a,b',
	},
] as const;

describe('new filter interoperability with serialized collections', () => {
	test.each(chains)('$name through full rendering', async ({ value, template, expected }) => {
		await expect(engine.renderOrThrow(template, { variables: { value } })).resolves.toBe(expected);
	});

	test.each(chains)('$name through the synchronous helper', ({ value, filterString, expected }) => {
		expect(applyFiltersWithRegistry(value, filterString, standardFilters, context)).toBe(expected);
	});

	test('accepts typed collection outputs from custom filters', async () => {
		const filters = { ...standardFilters, collect: () => ['b', 'a'] };
		const customEngine = createEngine({ filters });
		await expect(customEngine.renderOrThrow('{{ value | collect | sort | join:"," }}', {
			variables: { value: 'ignored' },
		})).resolves.toBe('a,b');
		expect(applyFiltersWithRegistry(
			'ignored',
			'collect | sort | join:","',
			filters,
			context,
		)).toBe('a,b');
	});
});
