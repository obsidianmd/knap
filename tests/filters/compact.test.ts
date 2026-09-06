import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';

const engine = createEngine({ filters: standardFilters });

describe('compact filter', () => {
	test('removes null and empty strings from arrays while preserving false and zero', async () => {
		await expect(engine.renderOrThrow('{{ value | compact }}', {
			variables: { value: [null, '', '  ', 0, false, 'value'] },
		})).resolves.toBe('[0,false,"value"]');
	});

	test('removes null and empty-string properties from objects', async () => {
		await expect(engine.renderOrThrow('{{ value | compact }}', {
			variables: { value: { empty: '', missing: null, count: 0, enabled: false } },
		})).resolves.toBe('{"count":0,"enabled":false}');
	});

	test('leaves scalar values unchanged', async () => {
		await expect(engine.renderOrThrow('{{ value | compact }}', {
			variables: { value: 'text' },
		})).resolves.toBe('text');
	});
});
