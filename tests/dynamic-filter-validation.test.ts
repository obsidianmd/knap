import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { standardFilters } from '../src/filters';

const engine = createEngine({ filters: standardFilters });

describe('dynamic filter argument validation', () => {
	test('defers variable-dependent validation until rendering', async () => {
		expect(engine.validate('{{ value | truncate:limit }}')).toEqual([]);
		await expect(engine.renderOrThrow('{{ value | truncate:limit }}', {
			variables: { value: 'abcdef', limit: 3 },
		})).resolves.toBe('abc…');
	});

	test('validates resolved variable values', async () => {
		const result = await engine.render('{{ value | truncate:limit }}', {
			variables: { value: 'abcdef', limit: 'many' },
		});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
			message: expect.stringContaining('limit must be a non-negative integer'),
		});
	});

	test('retains bare identifier fallback semantics', async () => {
		await expect(engine.renderOrThrow('{{ value | sort:desc | join:"," }}', {
			variables: { value: ['a', 'c', 'b'] },
		})).resolves.toBe('c,b,a');

		const result = await engine.render('{{ value | sort:("name", direction) }}', {
			variables: { value: [{ name: 'a' }, { name: 'b' }], direction: 'sideways' },
		});
		expect(result.errors[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
			message: expect.stringContaining('invalid direction "sideways"'),
		});
	});

	test('still validates literal options before rendering', () => {
		expect(engine.validate('{{ value | sort:("name", "sideways") }}')[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
		});
	});
});
