import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../../src/filters';

const engine = createEngine({ filters: standardFilters });

describe('truncate filter', () => {
	test('counts the suffix within the character limit', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:6 }}', {
			variables: { value: 'abcdefghi' },
		})).resolves.toBe('abcde…');
	});

	test('counts Unicode graphemes in text and suffixes', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:2 }}', {
			variables: { value: '👨‍👩‍👧 family' },
		})).resolves.toBe('👨‍👩‍👧…');
		await expect(engine.renderOrThrow('{{ value | truncate:(2, "...") }}', {
			variables: { value: 'abcdef' },
		})).resolves.toBe('..');
	});

	test('supports custom and empty suffixes', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:(5, "...") }}', {
			variables: { value: 'abcdefgh' },
		})).resolves.toBe('ab...');
		await expect(engine.renderOrThrow('{{ value | truncate:(5, "") }}', {
			variables: { value: 'abcdefgh' },
		})).resolves.toBe('abcde');
		expect(applyFiltersWithRegistry(
			'abcdefgh',
			'truncate:(5,"...")',
			standardFilters,
			{ variables: {} },
		)).toBe('ab...');
	});

	test('returns unchanged text when truncation is unnecessary and empty text at zero', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:5 }}', {
			variables: { value: 'abc' },
		})).resolves.toBe('abc');
		await expect(engine.renderOrThrow('{{ value | truncate:0 }}', {
			variables: { value: 'abc' },
		})).resolves.toBe('');
	});

	test('truncates scalar values after string conversion', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:3 }}', {
			variables: { value: 123456 },
		})).resolves.toBe('12…');
	});

	test('truncates string values recursively in typed collections', async () => {
		await expect(engine.renderOrThrow('{{ value | truncate:3 }}', {
			variables: { value: ['hello', { label: 'world', count: 2 }] },
		})).resolves.toBe('["he…",{"label":"wo…","count":2}]');
	});

	test('validates the limit and optional suffix', () => {
		expect(engine.validate('{{ value | truncate }}')[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
		});
		expect(engine.validate('{{ value | truncate:(5, "…", "extra") }}')[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
		});
	});
});

describe('truncatewords filter', () => {
	test('limits words and appends the suffix outside the word count', async () => {
		await expect(engine.renderOrThrow('{{ value | truncatewords:2 }}', {
			variables: { value: 'one two three' },
		})).resolves.toBe('one two…');
		expect(applyFiltersWithRegistry(
			'one two three',
			'truncatewords:(2,"...")',
			standardFilters,
			{ variables: {} },
		)).toBe('one two...');
	});

	test('preserves whitespace within the retained prefix', async () => {
		await expect(engine.renderOrThrow('{{ value | truncatewords:(2, "...") }}', {
			variables: { value: '  one \n\t two   three' },
		})).resolves.toBe('  one \n\t two...');
	});

	test('supports empty suffixes, unchanged text, and a zero limit', async () => {
		await expect(engine.renderOrThrow('{{ value | truncatewords:(2, "") }}', {
			variables: { value: 'one two three' },
		})).resolves.toBe('one two');
		await expect(engine.renderOrThrow('{{ value | truncatewords:3 }}', {
			variables: { value: 'one two' },
		})).resolves.toBe('one two');
		await expect(engine.renderOrThrow('{{ value | truncatewords:0 }}', {
			variables: { value: 'one two' },
		})).resolves.toBe('');
	});
});
