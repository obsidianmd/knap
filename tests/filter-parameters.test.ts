import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../src/filters';
import type { FilterRegistry } from '../src/types';

const engine = createEngine({ filters: standardFilters });

describe('built-in filter parameter spellings', () => {
	test.each([
		'{{ value | object:keys | join:"," }}',
		'{{ value | object:"keys" | join:"," }}',
		'{{ value | object:("keys") | join:"," }}',
	])('accepts object keys as %s', async template => {
		await expect(engine.renderOrThrow(template, { variables: { value: { a: 1, b: 2 } } }))
			.resolves.toBe('a,b');
	});

	test.each(['object:keys', 'object:"keys"', 'object:("keys")'])
		('accepts object keys as %s through the synchronous helper', filterString => {
			expect(applyFiltersWithRegistry(
				{ a: 1, b: 2 },
				`${filterString} | join:","`,
				standardFilters,
				{ variables: {} },
			)).toBe('a,b');
		});

	test('accepts quoted scalar options', async () => {
		await expect(engine.renderOrThrow('{{ value | sort:"desc" | join:"," }}', {
			variables: { value: ['a', 'c', 'b'] },
		})).resolves.toBe('c,b,a');
		await expect(engine.renderOrThrow('{{ value | list:("numbered") }}', {
			variables: { value: ['a', 'b'] },
		})).resolves.toBe('1. a\n2. b');
		await expect(engine.renderOrThrow('{{ value | hr:"before" }}', {
			variables: { value: 'hello' },
		})).resolves.toBe('---\n\nhello');
	});

	test('accepts quoted comma-separated options', async () => {
		await expect(engine.renderOrThrow('{{ value | truncatewords:(2,"...") }}', {
			variables: { value: 'one two three' },
		})).resolves.toBe('one two...');
		await expect(engine.renderOrThrow('{{ value | table:("Last, first", "Role") }}', {
			variables: { value: [["Lovelace, Ada", 'Writer']] },
		})).resolves.toContain('| Last, first | Role |');
	});

	test.each([
		'{{ value | remove_attr:class,style }}',
		'{{ value | remove_attr:"class,style" }}',
		'{{ value | remove_attr:"class","style" }}',
		'{{ value | remove_attr:("class","style") }}',
	])('normalizes HTML argument lists as %s', async template => {
		await expect(engine.renderOrThrow(template, {
			variables: { value: '<p class="x" style="y" id="z">text</p>' },
		})).resolves.toBe('<p id="z">text</p>');
	});

	test.each([
		'remove_attr:class,style',
		'remove_attr:"class,style"',
		'remove_attr:"class","style"',
		'remove_attr:("class","style")',
	])('normalizes HTML argument lists as %s through the synchronous helper', filterString => {
		expect(applyFiltersWithRegistry(
			'<p class="x" style="y" id="z">text</p>',
			filterString,
			standardFilters,
			{ variables: {} },
		)).toBe('<p id="z">text</p>');
	});

	test.each([
		'{{ value | replace_tags:"strong":"h2" }}',
		'{{ value | replace_tags:strong:h2 }}',
		'{{ value | replace_tags:("strong":"h2") }}',
	])('normalizes HTML transformation arguments as %s', async template => {
		await expect(engine.renderOrThrow(template, {
			variables: { value: '<strong>text</strong>' },
		})).resolves.toBe('<h2>text</h2>');
	});

	test.each([
		'replace_tags:"strong":"h2"',
		'replace_tags:strong:h2',
		'replace_tags:("strong":"h2")',
	])('normalizes HTML transformations as %s through the synchronous helper', filterString => {
		expect(applyFiltersWithRegistry(
			'<strong>text</strong>',
			filterString,
			standardFilters,
			{ variables: {} },
		)).toBe('<h2>text</h2>');
	});

	test('keeps comma-separated HTML transformations independent in both execution paths', async () => {
		const html = '<b>bold</b><em>emphasis</em>';
		await expect(engine.renderOrThrow('{{ value | replace_tags:b,em }}', {
			variables: { value: html },
		})).resolves.toBe('boldemphasis');
		expect(applyFiltersWithRegistry(
			html,
			'replace_tags:b,em',
			standardFilters,
			{ variables: {} },
		)).toBe('boldemphasis');

		await expect(engine.renderOrThrow('{{ value | replace_tags:b,"em":"i" }}', {
			variables: { value: html },
		})).resolves.toBe('bold<i>emphasis</i>');
		expect(applyFiltersWithRegistry(
			html,
			'replace_tags:b,"em":"i"',
			standardFilters,
			{ variables: {} },
		)).toBe('bold<i>emphasis</i>');
	});

	test.each([
		'{{ value | strip_tags:b,em }}',
		'{{ value | strip_tags:"b,em" }}',
		'{{ value | strip_tags:"b","em" }}',
		'{{ value | strip_tags:("b","em") }}',
	])('normalizes strip_tags arguments as %s', async template => {
		await expect(engine.renderOrThrow(template, {
			variables: { value: '<p><b>bold</b><em>emphasis</em></p>' },
		})).resolves.toBe('<b>bold</b><em>emphasis</em>');
	});

	test.each([
		'strip_tags:b,em',
		'strip_tags:"b,em"',
		'strip_tags:"b","em"',
		'strip_tags:("b","em")',
	])('normalizes strip_tags as %s through the synchronous helper', filterString => {
		expect(applyFiltersWithRegistry(
			'<p><b>bold</b><em>emphasis</em></p>',
			filterString,
			standardFilters,
			{ variables: {} },
		)).toBe('<b>bold</b><em>emphasis</em>');
	});

	test('preserves apostrophes inside double-quoted arguments', async () => {
		await expect(engine.renderOrThrow('{{ value | callout:("info", "Don\'t panic") }}', {
			variables: { value: 'Read this' },
		})).resolves.toBe("> [!info] Don't panic\n> Read this");
	});

	test('accepts escaped pipe delimiters in both execution paths', async () => {
		const template = '{{ value | split:"\\|" | sort | join:"," }}';
		await expect(engine.renderOrThrow(template, { variables: { value: 'b|a' } }))
			.resolves.toBe('a,b');
		expect(applyFiltersWithRegistry(
			'b|a',
			'split:\\| | sort | join:","',
			standardFilters,
			{ variables: {} },
		)).toBe('a,b');
	});
});

describe('custom filter parameter compatibility', () => {
	const filters: FilterRegistry = {
		inspect: (_value, param) => param ?? '',
	};

	test('does not normalize custom filter parameter strings', async () => {
		const customEngine = createEngine({ filters });
		await expect(customEngine.renderOrThrow('{{ value | inspect:"Don\'t | normalize" }}', {
			variables: { value: 'x' },
		})).resolves.toBe('"Don\'t | normalize"');

		expect(applyFiltersWithRegistry(
			'x',
			'inspect:"Don\'t | normalize"',
			filters,
			{ variables: {} },
		)).toBe('"Don\'t | normalize"');
		expect(applyFiltersWithRegistry(
			'x',
			'inspect:a\\|b',
			filters,
			{ variables: {} },
		)).toBe('a\\|b');
	});
});
