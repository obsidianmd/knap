import { describe, test, expect } from 'vitest';
import { createEngine } from '../../src/engine';
import { replace, validateReplaceParams } from '../../src/filters/replace';
import { applyFiltersWithRegistry, standardFilterMetadata, standardFilters } from '../../src/filters';
import { parse, validateFilters } from '../../src/parser';

const engine = createEngine({ filters: standardFilters });

describe('replace filter', () => {
	test('simple replacement', () => {
		expect(replace('hello,world', '",":""')).toBe('helloworld');
	});

	test('replaces all occurrences', () => {
		expect(replace('a,b,c', '",":"-"')).toBe('a-b-c');
	});

	test('removes text with empty replacement', () => {
		expect(replace('hello!', '"!":""')).toBe('hello');
	});

	test('removes percent sign (user issue case)', () => {
		expect(replace('100%', '"%":""')).toBe('100');
	});

	test('multiple replacements applied in order', () => {
		expect(replace('hello world', '"e":"a","o":"0"')).toBe('hall0 w0rld');
	});

	test('regex global replacement', () => {
		expect(replace('hello world', '"/[aeiou]/g":"*"')).toBe('h*ll* w*rld');
	});

	test('regex case-insensitive replacement', () => {
		expect(replace('HELLO world', '"/hello/i":"hi"')).toBe('hi world');
	});

	test('preserves escapes in regular expressions', () => {
		expect(replace('a|b a b', '"/a\\|b/g":"x"')).toBe('x a b');
	});

	test('decodes replacement escapes once', () => {
		expect(replace('x', '"x":"\\\\n"')).toBe('\\n');
	});

	test('returns original if no params', () => {
		expect(replace('hello')).toBe('hello');
	});

	test('handles empty string input', () => {
		expect(replace('', '"a":"b"')).toBe('');
	});

	test('handles parenthesized params', () => {
		expect(replace('hello', '("e":"a")')).toBe('hallo');
	});

	test('handles special characters in replacement', () => {
		expect(replace('hello:world', '"\\:":"-"')).toBe('hello-world');
	});

	test('escapes pipes in literal search strings', () => {
		expect(replace('a|b', '"a|b":"c"')).toBe('c');
	});

	test('handles apostrophes and escaped commas inside double quotes', () => {
		expect(replace("don't stop", '"don\'t":"do not"')).toBe('do not stop');
		expect(replace('a,b and a,b', '"a\\,b":"x"')).toBe('x and x');
	});
});

describe('replace filter via renderer', () => {
	// These tests verify the full parser → renderer → filter pipeline
	test('applies multiple replacements through template', async () => {
		const result = await engine.render('{{msg|replace:"e":"a","o":"0"}}', {
			variables: { msg: 'hello world' },
		});
		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('hall0 w0rld');
	});

	test('applies three replacements through template', async () => {
		const result = await engine.render('{{msg|replace:"h":"H"," ":"-","d":"D"}}', {
			variables: { msg: 'hello world' },
		});
		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('Hello-worlD');
	});

	test('applies parenthesized replacements per docs example', async () => {
		const result = await engine.render('{{msg|replace:("e":"a","o":"0")}}', {
			variables: { msg: 'hello world' },
		});
		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('hall0 w0rld');
	});

	test('preserves apostrophes inside double-quoted pairs', async () => {
		const result = await engine.render('{{msg|replace:"don\'t":"do not"}}', {
			variables: { msg: "don't stop" },
		});
		expect(result).toEqual({ output: 'do not stop', errors: [], warnings: [] });
	});

	test('replaces literal pipes through both execution paths', async () => {
		await expect(engine.renderOrThrow('{{msg|replace:"a|b":"c"}}', {
			variables: { msg: 'a|b' },
		})).resolves.toBe('c');

		expect(applyFiltersWithRegistry(
			'a|b',
			'replace:"a|b":"c"',
			standardFilters,
			{ variables: {} },
		)).toBe('c');
	});

	test('preserves regex escapes through the template parser', async () => {
		const template = String.raw`{{msg|replace:"/a\\|b/g":"x"}}`;
		const result = await engine.render(template, {
			variables: { msg: 'a|b a b' },
		});
		expect(result).toEqual({ output: 'x a b', errors: [], warnings: [] });
	});

	test('decodes replacement escapes once through the template parser', async () => {
		const template = String.raw`{{msg|replace:"x":"\\\\n"}}`;
		const result = await engine.render(template, { variables: { msg: 'x' } });
		expect(result).toEqual({ output: String.raw`\n`, errors: [], warnings: [] });
	});
});

describe('replace param validation', () => {
	test('valid params return valid', () => {
		expect(validateReplaceParams('"old":"new"').valid).toBe(true);
		expect(validateReplaceParams('"a":"b","c":"d"').valid).toBe(true);
		expect(validateReplaceParams('"/regex/g":"text"').valid).toBe(true);
		expect(validateReplaceParams('"text":').valid).toBe(true);
	});

	test('missing params returns error', () => {
		const result = validateReplaceParams(undefined);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('requires');
	});

	test('unquoted params returns error', () => {
		const result = validateReplaceParams('old:new');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('quoted');
	});

	test('missing colon separator returns error', () => {
		const result = validateReplaceParams('"old""new"');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('quoted');
	});

	test('validates multiple pairs without errors via parser', () => {
		const result = parse('{{msg|replace:"h":"H","d":"D"}}');
		expect(result.errors).toHaveLength(0);
		const filterWarnings = validateFilters(result.ast, standardFilterMetadata);
		expect(filterWarnings).toHaveLength(0);
	});

	test('validates parenthesized multiple pairs via parser', () => {
		const result = parse('{{msg|replace:("prefecture":"","Prefecture":"")}}');
		expect(result.errors).toHaveLength(0);
		const filterWarnings = validateFilters(result.ast, standardFilterMetadata);
		expect(filterWarnings).toHaveLength(0);
	});
});
