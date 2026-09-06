import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';

const engine = createEngine({ filters: standardFilters });

describe('sort filter', () => {
	test('sorts values ascending or descending', async () => {
		await expect(engine.renderOrThrow('{{ value | sort }}', {
			variables: { value: [10, 2, 1] },
		})).resolves.toBe('[1,2,10]');
		await expect(engine.renderOrThrow('{{ value | sort:desc }}', {
			variables: { value: ['a', 'c', 'b'] },
		})).resolves.toBe('["c","b","a"]');
	});

	test('sorts objects by a nested property and keeps missing values last', async () => {
		const value = [
			{ name: 'Ada', details: { rank: 2 } },
			{ name: 'Lin', details: { rank: 1 } },
			{ name: 'Unknown' },
		];
		await expect(engine.renderOrThrow('{{ value | sort:(details.rank, desc) }}', {
			variables: { value },
		})).resolves.toBe(JSON.stringify([value[0], value[1], value[2]]));
	});

	test('sorts serialized arrays while leaving scalars unchanged', async () => {
		await expect(engine.renderOrThrow('{{ value | sort }}', {
			variables: { value: '[3,1,2]' },
		})).resolves.toBe('[1,2,3]');
		await expect(engine.renderOrThrow('{{ value | sort }}', {
			variables: { value: '3' },
		})).resolves.toBe('3');
	});

	test('validates sort direction', () => {
		expect(engine.validate('{{ value | sort:("name", "sideways") }}')[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
			message: expect.stringContaining('invalid direction "sideways"'),
		});
	});
});
