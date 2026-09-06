import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';

const engine = createEngine({ filters: standardFilters });

async function render(template: string, variables: Record<string, unknown>): Promise<string> {
	return engine.renderOrThrow(template, { variables });
}

describe('Markdown formatting filters', () => {
	test('creates all six heading levels and formats each nonempty line', async () => {
		for (let level = 1; level <= 6; level++) {
			await expect(render(`{{ value | h${level} }}`, { value: 'One\n\nTwo' }))
				.resolves.toBe(`${'#'.repeat(level)} One\n\n${'#'.repeat(level)} Two`);
		}
	});

	test('escapes Markdown punctuation so text renders literally', async () => {
		await expect(render('{{ value | escape_md }}', { value: '# Draft *title* [link](url) | `code`' }))
			.resolves.toBe('\\# Draft \\*title\\* \\[link\\]\\(url\\) \\| \\`code\\`');
		await expect(render('{{ value | escape_md }}', {
			value: '_under_ ~~strike~~ ==highlight==\n1. item\n- item\n> quote',
		})).resolves.toBe('\\_under\\_ \\~\\~strike\\~\\~ \\=\\=highlight\\=\\=\n1\\. item\n\\- item\n\\> quote');
		await expect(render('{{ value | escape_md }}', { value: String.raw`\*literal*` }))
			.resolves.toBe(String.raw`\\\*literal\*`);
	});

	test('escapes string values recursively without changing object keys or non-string values', async () => {
		await expect(render('{{ value | escape_md }}', {
			value: { '# key': '*value*', nested: ['[item]', 2] },
		})).resolves.toBe('{"# key":"\\\\*value\\\\*","nested":["\\\\[item\\\\]",2]}');
	});

	test('creates hard line breaks without changing paragraph breaks', async () => {
		await expect(render('{{ value | hard_break }}', { value: 'One\nTwo\n\nThree' }))
			.resolves.toBe('One  \nTwo\n\nThree');
		await expect(render('{{ value | hard_break }}', { value: 'One  \nTwo' }))
			.resolves.toBe('One  \nTwo');
		await expect(render('{{ value | hard_break }}', { value: ['One\nTwo', 2] }))
			.resolves.toBe('["One  \\nTwo",2]');
	});

	test('creates inline emphasis and preserves outer whitespace', async () => {
		await expect(render('{{ value | bold }}', { value: '  hello  ' })).resolves.toBe('  **hello**  ');
		await expect(render('{{ value | italic }}', { value: 'hello' })).resolves.toBe('*hello*');
		await expect(render('{{ value | strike }}', { value: 'hello' })).resolves.toBe('~~hello~~');
		await expect(render('{{ value | highlight }}', { value: 'hello' })).resolves.toBe('==hello==');
	});

	test('supports alternate bold and italic markers', async () => {
		await expect(render('{{ value | bold:_ }}', { value: 'hello' })).resolves.toBe('__hello__');
		await expect(render('{{ value | bold:"*" }}', { value: 'hello' })).resolves.toBe('**hello**');
		await expect(render('{{ value | italic:_ }}', { value: 'hello' })).resolves.toBe('_hello_');
		await expect(render('{{ value | italic:"*" }}', { value: 'hello' })).resolves.toBe('*hello*');
	});

	test('rejects unsupported emphasis markers during validation', () => {
		expect(engine.validate('{{ value | bold:"__" }}')[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
			message: expect.stringContaining('invalid marker "__"'),
		});
		expect(engine.validate('{{ value | italic:"__" }}')[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
			message: expect.stringContaining('invalid marker "__"'),
		});
	});

	test.each([
		['red', '🔴'],
		['orange', '🟠'],
		['yellow', '🟡'],
		['green', '🟢'],
		['blue', '🔵'],
		['purple', '🟣'],
	])('creates a %s highlight with its color marker', async (color, marker) => {
		await expect(render(`{{ value | highlight:${color} }}`, { value: 'hello' }))
			.resolves.toBe(`==${marker}hello==`);
	});

	test('accepts bare and quoted color markers', async () => {
		await expect(render('{{ value | highlight:🔴 }}', { value: 'hello' }))
			.resolves.toBe('==🔴hello==');
		await expect(render('{{ value | highlight:"🟣" }}', { value: 'hello' }))
			.resolves.toBe('==🟣hello==');
	});

	test('applies a highlight color recursively to collections', async () => {
		await expect(render('{{ values | highlight:blue }}', { values: ['one', { label: 'two' }] }))
			.resolves.toBe('["==🔵one==",{"label":"==🔵two=="}]');
	});

	test('rejects unknown highlight colors during validation', () => {
		expect(engine.validate('{{ value | highlight:"pink" }}')[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
			message: expect.stringContaining('invalid color "pink"'),
		});
	});

	test('places horizontal rules before, after, or on both sides', async () => {
		await expect(render('{{ value | hr }}', { value: 'hello' })).resolves.toBe('hello\n\n---');
		await expect(render('{{ value | hr:before }}', { value: 'hello' })).resolves.toBe('---\n\nhello');
		await expect(render('{{ value | hr:both }}', { value: 'hello' })).resolves.toBe('---\n\nhello\n\n---');
		await expect(render('{{ value | hr }}', { value: '' })).resolves.toBe('---');
	});

	test('chooses inline or fenced code and accepts an optional language', async () => {
		await expect(render('{{ value | code }}', { value: 'const x = 1' }))
			.resolves.toBe('`const x = 1`');
		await expect(render('{{ value | code }}', { value: 'const x = 1;\nreturn x;' }))
			.resolves.toBe('```\nconst x = 1;\nreturn x;\n```');
		await expect(render('{{ value | code:typescript }}', { value: 'const x = 1' }))
			.resolves.toBe('```typescript\nconst x = 1\n```');
		await expect(render('{{ value | code_block:"c++" }}', { value: 'int main() {}' }))
			.resolves.toBe('```c++\nint main() {}\n```');
	});

	test('uses longer code delimiters when content contains backticks', async () => {
		await expect(render('{{ value | code }}', { value: '`value`' }))
			.resolves.toBe('`` `value` ``');
		await expect(render('{{ value | code_block }}', { value: '```nested```' }))
			.resolves.toBe('````\n```nested```\n````');
	});

	test('chooses inline or block math and supports an explicit block', async () => {
		await expect(render('{{ value | math }}', { value: 'x^2' })).resolves.toBe('$x^2$');
		await expect(render('{{ value | math }}', { value: 'x^2\n+ y^2' }))
			.resolves.toBe('$$\nx^2\n+ y^2\n$$');
		await expect(render('{{ value | math_block }}', { value: 'x^2' }))
			.resolves.toBe('$$\nx^2\n$$');
	});

	test('creates inline and multiline comments', async () => {
		await expect(render('{{ value | comment }}', { value: 'hidden' })).resolves.toBe('%%hidden%%');
		await expect(render('{{ value | comment }}', { value: 'first\nsecond' }))
			.resolves.toBe('%%\nfirst\nsecond\n%%');
	});

	test('formats collection string values recursively without changing keys or other values', async () => {
		const value = {
			label: 'hello',
			nested: ['world', { text: 'again', count: 2, enabled: true, empty: null }],
		};
		await expect(render('{{ value | bold }}', { value })).resolves.toBe(JSON.stringify({
			label: '**hello**',
			nested: ['**world**', { text: '**again**', count: 2, enabled: true, empty: null }],
		}));
	});

	test('formats scalar values through the filter string interface', async () => {
		await expect(render('{{ value | bold }}', { value: 5 })).resolves.toBe('**5**');
		await expect(render('{{ value | h1 }}', { value: true })).resolves.toBe('# true');
	});

	test('does not treat non-plain objects as recursive records', async () => {
		const created = new Date('2020-01-02T00:00:00.000Z');
		await expect(render('{{ value | bold }}', { value: created }))
			.resolves.toBe('**"2020-01-02T00:00:00.000Z"**');
		await expect(render('{{ value | bold }}', { value: { label: 'dated', created } }))
			.resolves.toBe('{"label":"**dated**","created":"2020-01-02T00:00:00.000Z"}');
	});

	test('selects inline or block formatting separately for collection values', async () => {
		await expect(render('{{ values | code }}', { values: ['one', 'two\nthree'] }))
			.resolves.toBe('["`one`","```\\ntwo\\nthree\\n```"]');
	});

	test('uses block formatting when code has a trailing newline', async () => {
		await expect(render('{{ value | code }}', { value: 'one line\n' }))
			.resolves.toBe('```\none line\n```\n');
	});
});

describe('parse_json filter', () => {
	test('accepts serialized collections without requiring explicit parsing', async () => {
		await expect(render('{{ value | bold }}', { value: '["one","two"]' }))
			.resolves.toBe('["**one**","**two**"]');
		await expect(render('{{ value | parse_json | bold | join:", " }}', { value: '["one","two"]' }))
			.resolves.toBe('**one**, **two**');
	});

	test('passes typed input through unchanged', async () => {
		await expect(render('{{ value | parse_json | join:"," }}', { value: ['one', 'two'] }))
			.resolves.toBe('one,two');
	});

	test('preserves invalid JSON and reports a warning', async () => {
		const result = await engine.render('{{ value | parse_json }}', {
			variables: { value: '[invalid' },
		});
		expect(result.output).toBe('[invalid');
		expect(result.errors).toEqual([]);
		expect(result.warnings).toMatchObject([{
			code: 'INVALID_FILTER_INPUT',
			filter: 'parse_json',
		}]);
	});
});
