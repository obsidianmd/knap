import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';

const engine = createEngine({ filters: standardFilters });

describe('truncate filter', () => {
	test('truncates by Unicode character with an ellipsis', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:6 }}', {
			variables: { value: 'Hello 🌍!' },
		})).resolves.toBe('Hello …');
		await expect(engine.renderOrThrow('{{ value | truncate:1 }}', {
			variables: { value: '👨‍👩‍👧 family' },
		})).resolves.toBe('👨‍👩‍👧…');
	});

	test('truncates scalar values through the filter string interface', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:3 }}', {
			variables: { value: 123456 },
		})).resolves.toBe('123…');
	});

	test('truncates by words', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:(2, words) }}', {
			variables: { value: 'One two three four' },
		})).resolves.toBe('One two…');
	});

	test('accepts a custom suffix', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:(5, chars, "...") }}', {
			variables: { value: 'Hello world' },
		})).resolves.toBe('Hello...');
		await expect(engine.renderOrThrow('{{ value | truncate:(5, chars, ", etc.") }}', {
			variables: { value: 'Hello world' },
		})).resolves.toBe('Hello, etc.');
	});

	test('truncates string values recursively in typed collections', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:3 }}', {
			variables: { value: ['hello', { label: 'world', count: 2 }] },
		})).resolves.toBe('["hel…",{"label":"wor…","count":2}]');
	});

	test('requires a valid limit and mode', () => {
		expect(engine.validate('{{ value | truncate }}')[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
		});
		expect(engine.validate('{{ value | truncate:(3, lines) }}')[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
			message: expect.stringContaining('invalid mode "lines"'),
		});
	});
});
