import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../../src/filters';
import { map } from '../../src/filters/map';

const engine = createEngine({ filters: standardFilters });
const expression = 'item => ({label: "Last, First", url: "https://example.com"})';
const input = [{ id: 1 }];
const expected = JSON.stringify([{ label: 'Last, First', url: 'https://example.com' }]);

describe('map filter', () => {
	test('preserves commas and colons inside quoted object values', () => {
		expect(map(JSON.stringify(input), expression)).toBe(expected);
	});

	test('preserves quoted delimiters through both execution paths', async () => {
		await expect(engine.renderOrThrow(`{{ items | map:${expression} }}`, {
			variables: { items: input },
		})).resolves.toBe(expected);

		expect(applyFiltersWithRegistry(
			input,
			`map:${expression}`,
			standardFilters,
			{ variables: {} },
		)).toBe(expected);
	});

	test('selects own properties with shorthand through both execution paths', async () => {
		const items = [
			{ author: { name: 'Ada' }, active: false },
			{ author: { name: 'Lin' }, active: true },
		];
		await expect(engine.renderOrThrow('{{ items | map:"author.name" }}', {
			variables: { items },
		})).resolves.toBe('["Ada","Lin"]');
		expect(applyFiltersWithRegistry(
			items,
			'map:"active"',
			standardFilters,
			{ variables: {} },
		)).toBe('[false,true]');
	});

	test('preserves selected types and uses null for missing properties', async () => {
		const items = [{ value: 0 }, { value: false }, { value: null }, {}];
		await expect(engine.renderOrThrow('{{ items | map:"value" }}', {
			variables: { items },
		})).resolves.toBe('[0,false,null,null]');
	});

	test('accepts a property path from a variable', async () => {
		await expect(engine.renderOrThrow('{{ items | map:path }}', {
			variables: { items: [{ author: { name: 'Ada' } }], path: 'author.name' },
		})).resolves.toBe('Ada');
	});

	test('property shorthand ignores inherited properties', async () => {
		const inherited = Object.create({ name: 'Inherited' });
		const items = [inherited, { name: 'Own' }];
		await expect(engine.renderOrThrow('{{ items | map:"name" }}', {
			variables: { items },
		})).resolves.toBe('[null,"Own"]');
	});

	test('keeps arrow-form scalar behavior while shorthand passes scalars through', async () => {
		await expect(engine.renderOrThrow('{{ value | map:item => item }}', {
			variables: { value: 'plain' },
		})).resolves.toBe('["plain"]');
		await expect(engine.renderOrThrow('{{ value | map:"name" }}', {
			variables: { value: 'plain' },
		})).resolves.toBe('plain');
	});

	test('preserves empty and single-item shorthand arrays through rawValue', async () => {
		const inspect = (_value: string, _param?: string, context?: { rawValue?: unknown }) => {
			const raw = context?.rawValue;
			return `${Array.isArray(raw)}:${Array.isArray(raw) ? raw.length : -1}`;
		};
		const filters = { ...standardFilters, inspect };
		const customEngine = createEngine({ filters });
		await expect(customEngine.renderOrThrow('{{ items | map:"name" | inspect }}', {
			variables: { items: [{ name: 'Ada' }] },
		})).resolves.toBe('true:1');
		expect(applyFiltersWithRegistry(
			[],
			'map:"name" | inspect',
			filters,
			{ variables: {} },
		)).toBe('true:0');
	});
});
