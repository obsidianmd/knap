import { describe, expect, test } from 'vitest';
import { createEngine, parse, standardFilters, TemplateRuntimeError } from '../src';
import { replace } from '../src/filters/replace';

describe('render limits', () => {
	test.each([
		'{{ ' + '('.repeat(5000) + 'x' + ')'.repeat(5000) + ' }}',
		'{% if ' + 'not '.repeat(5000) + 'x %}yes{% endif %}',
		'{% if x %}'.repeat(1000) + 'yes' + '{% endif %}'.repeat(1000),
		'{{ ' + Array(5000).fill('x').join(' or ') + ' }}',
	])('reports deep syntax without throwing', async source => {
		expect(parse(source).errors[0].code).toBe('LIMIT_EXCEEDED');
		const result = await createEngine().render(source, { variables: { x: true } });
		expect(result.errors[0].code).toBe('LIMIT_EXCEEDED');
		expect(result.output).toBe('');
	});

	test('bounds template size in parse, validate, and render', async () => {
		const engine = createEngine({ limits: { maxTemplateLength: 10 } });
		expect(engine.parse('x'.repeat(11)).errors[0].code).toBe('LIMIT_EXCEEDED');
		expect(engine.validate('x'.repeat(11))[0].code).toBe('LIMIT_EXCEEDED');
		expect((await engine.render('x'.repeat(11), { variables: {} })).errors[0].code).toBe('LIMIT_EXCEEDED');
	});

	test('shares the work budget across nested loops and resets it between renders', async () => {
		const engine = createEngine({ limits: { maxOperations: 500 } });
		const source = '{% for a in xs %}{% for b in xs %}x{% endfor %}{% endfor %}';
		const result = await engine.render(source, { variables: { xs: Array(100).fill(0) } });
		expect(result.errors).toEqual([expect.objectContaining({ code: 'LIMIT_EXCEEDED' })]);
		expect(result.output).toBe('');
		expect(await engine.renderOrThrow('ok', { variables: {} })).toBe('ok');
	});

	test.each(['{{ x }}{{ x }}', '{% for x in xs %}12345{% endfor %}'])('checks cumulative output: %s', async source => {
		const result = await createEngine({ limits: { maxOutputLength: 8 } }).render(source, { variables: { x: '12345', xs: [0, 1] } });
		expect(result.errors[0]).toMatchObject({ code: 'LIMIT_EXCEEDED', message: expect.stringContaining('maxOutputLength') });
		expect(result.output).toBe('');
	});

	test('bounds intermediate replacements even when the final result is small', async () => {
		const engine = createEngine({ filters: standardFilters, limits: { maxValueLength: 1000 } });
		const source = '{% set x = x | replace:"a":"aa" %}'.repeat(20) + '{{ x | length }}';
		const result = await engine.render(source, { variables: { x: 'a' } });
		expect(result.errors[0]).toMatchObject({ code: 'LIMIT_EXCEEDED', message: expect.stringContaining('maxValueLength') });
	});

	test('checks expansion of replacement tokens', () => {
		expect(() => replace('a'.repeat(100), '"/a+/":"$&$&$&"', {
			variables: {}, checkLength: length => { if (length > 200) throw new TemplateRuntimeError('too long', 'LIMIT_EXCEEDED'); },
		})).toThrow('too long');
	});

	test('handles cyclic input with a bounded error', async () => {
		const value: any = {}; value.self = value;
		const result = await createEngine().render('{{ value }}', { variables: { value } });
		expect(result.errors[0].code).toBe('LIMIT_EXCEEDED');
	});

	test('lets hosts lower per-render limits', async () => {
		const result = await createEngine().render('12345', { variables: {} }, { limits: { maxOutputLength: 4 } });
		expect(result.errors[0].code).toBe('LIMIT_EXCEEDED');
	});

	test('provides literal splitting and rejects regex replacement when disabled', async () => {
		const engine = createEngine({ filters: standardFilters, allowRegex: false });
		const variables = { value: 'a'.repeat(28) + '!' };
		expect((await engine.render('{{ value | split:"(a+)+$" }}', { variables })).errors).toEqual([]);
		const result = await engine.render('{{ value | replace:"/(a+)+$/":"x" }}', { variables });
		expect(result.errors[0].code).toBe('INVALID_FILTER_ARGUMENTS');
		expect(await engine.renderOrThrow('{{ value | replace:"a":"b" }}', { variables })).toBe('b'.repeat(28) + '!');
	});

	test('requires literal tag names', async () => {
		const engine = createEngine({ filters: standardFilters });
		const result = await engine.render('{{ html | replace_tags:"(a+)+":"img onerror=x" }}', { variables: { html: '<a>text</a>' } });
		expect(result.errors[0].code).toBe('INVALID_FILTER_ARGUMENTS');
	});
});

test.each(['$$', '$&', '$`', "$'", '$1', '$2', '$12', '$01', '$<name>', '$99'])('bounded replacement retains native substitution %s', replacement => {
	const param = `"/(?<name>a)(b)?/g":"${replacement}"`;
	const native = replace('ab ac', param);
	expect(replace('ab ac', param, { variables: {}, checkLength: () => {} })).toBe(native);
});
