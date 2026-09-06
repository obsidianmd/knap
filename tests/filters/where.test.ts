import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../../src/filters';

const engine = createEngine({ filters: standardFilters });

describe('where filter', () => {
	test('filters by nested own properties and preserves order', async () => {
		const items = [
			{ id: 1, details: { active: true } },
			{ id: 2, details: { active: false } },
			{ id: 3, details: { active: true } },
		];
		await expect(engine.renderOrThrow(
			'{{ items | where:("details.active", true) | map:"id" | join:"," }}',
			{ variables: { items } },
		)).resolves.toBe('1,3');
	});

	test('uses strict typed equality while rendering', async () => {
		const items = [{ kind: 'number', value: 1 }, { kind: 'string', value: '1' }];
		await expect(engine.renderOrThrow(
			'{{ items | where:("value", 1) | map:"kind" | join:"," }}',
			{ variables: { items } },
		)).resolves.toBe('number');
		await expect(engine.renderOrThrow(
			'{{ items | where:("value", "1") | map:"kind" | join:"," }}',
			{ variables: { items } },
		)).resolves.toBe('string');
	});

	test('preserves the type of a comparison value from a variable', async () => {
		const items = [{ kind: 'number', value: 1 }, { kind: 'string', value: '1' }];
		await expect(engine.renderOrThrow(
			'{{ items | where:("value", target) | map:"kind" | join:"," }}',
			{ variables: { items, target: '1' } },
		)).resolves.toBe('string');
	});

	test('uses strict typed equality through direct filter chains', () => {
		const items = [{ kind: 'number', value: 1 }, { kind: 'string', value: '1' }];
		expect(applyFiltersWithRegistry(
			items,
			'where:("value",1) | map:"kind" | join:","',
			standardFilters,
			{ variables: {} },
		)).toBe('number');
		expect(applyFiltersWithRegistry(
			items,
			'where:("value","1") | map:"kind" | join:","',
			standardFilters,
			{ variables: {} },
		)).toBe('string');
	});

	test('distinguishes missing properties from explicit null', async () => {
		const items = [{ id: 1, parent: null }, { id: 2 }, { id: 3, parent: 'Ada' }];
		await expect(engine.renderOrThrow(
			'{{ items | where:("parent", null) | map:"id" | join:"," }}',
			{ variables: { items } },
		)).resolves.toBe('1');
	});

	test('passes non-array inputs through unchanged', async () => {
		await expect(engine.renderOrThrow('{{ value | where:("active", true) }}', {
			variables: { value: 'plain' },
		})).resolves.toBe('plain');
	});

	test('preserves empty and single-item arrays through rawValue', async () => {
		const inspect = (_value: string, _param?: string, context?: { rawValue?: unknown }) => {
			const raw = context?.rawValue;
			return `${Array.isArray(raw)}:${Array.isArray(raw) ? raw.length : -1}`;
		};
		const customEngine = createEngine({ filters: { ...standardFilters, inspect } });
		await expect(customEngine.renderOrThrow(
			'{{ items | where:("active", true) | inspect }}',
			{ variables: { items: [{ active: false }] } },
		)).resolves.toBe('true:0');
		await expect(customEngine.renderOrThrow(
			'{{ items | where:("active", true) | inspect }}',
			{ variables: { items: [{ active: true }] } },
		)).resolves.toBe('true:1');
	});
});
