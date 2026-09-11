import { describe, expect, test, vi } from 'vitest';
import { createEngine } from '../src/engine';
import { tokenize } from '../src/tokenizer';

describe('template comments', () => {
	test.each([
		['{# comment #}', ''],
		['before{##}after', 'beforeafter'],
		['{# one #}{# two #}text{# three #}', 'text'],
		['before {# comment #} after', 'before  after'],
		['before\n{# multiple\nlines #}\nafter', 'before\n\nafter'],
		['before\r\n{# multiple\r\nlines #}\r\nafter', 'before\r\n\r\nafter'],
		['{# outer {# inner #} tail #}', ' tail #}'],
		['{{ "{# literal #}" }}', '{# literal #}'],
		['{% set text = "{# literal #}" %}{{ text }}', '{# literal #}'],
		['{% if true %}A{# {% endif %} #}B{% endif %}', 'AB'],
		['{% for item in items %}{# ignored #}{{ item }}{% endfor %}', 'one\ntwo'],
		['{% for item in items %}{# ignored #}{% endfor %}', ''],
		['{% if true %}\ntext\n{# ignored #}  {% endif %}', 'text'],
		['{% set text = "value" %}  {# ignored #}\n{{ text }}', 'value'],
	])('renders %j as %j', async (template, expected) => {
		const result = await createEngine().render(template, { variables: { items: ['one', 'two'] } });
		expect(result.errors).toEqual([]);
		expect(result.output).toBe(expected);
	});

	test('does not parse, validate, resolve, or evaluate comment contents', async () => {
		const filter = vi.fn(() => 'called');
		const resolveVariable = vi.fn(() => 'resolved');
		const engine = createEngine({ filters: { side_effect: filter } });
		const template = '{# {{ remote | side_effect }} {{ missing | unknown }} {% invalid " #}visible';
		expect(engine.validate(template)).toEqual([]);
		const result = await engine.render(template, { variables: {}, resolveVariable });
		expect(result.errors).toEqual([]);
		expect(result.output).toBe('visible');
		expect(filter).not.toHaveBeenCalled();
		expect(resolveVariable).not.toHaveBeenCalled();
	});

	test('preserves token positions after multiline comments', () => {
		const result = tokenize('A{# first\nsecond #}{{ title }}');
		expect(result.errors).toEqual([]);
		expect(result.tokens.find(token => token.type === 'variable_start')).toMatchObject({ line: 2, column: 10 });
		expect(result.tokens.filter(token => token.type === 'text').map(token => token.value)).toEqual(['A']);
	});

	test('reports unclosed comments at their opening and discards the remaining content', async () => {
		const template = 'before\n  {# unclosed\n{{ hidden }}';
		const expected = [{ message: "Unclosed comment - missing '#}'", line: 2, column: 3 }];
		const tokenized = tokenize(template);
		expect(tokenized.errors).toEqual(expected);
		expect(tokenized.tokens.map(token => token.type)).toEqual(['text', 'eof']);
		const engine = createEngine();
		expect(engine.parse(template).errors).toEqual(expected);
		const normalized = expected.map(error => ({ ...error, code: 'PARSE_ERROR' }));
		expect(engine.validate(template)).toEqual(normalized);
		const result = await engine.render(template, { variables: {} });
		expect(result.errors).toEqual(normalized);
		expect(result.output).toBe('');
		await expect(engine.renderOrThrow(template, { variables: {} })).rejects.toThrow();
	});
});
