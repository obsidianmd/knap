import { describe, expect, test } from 'vitest';
import { highlightCode, highlightLine, highlightLines } from '../website/src/lib/highlight';
import { markdownPunctuationAt } from '../website/src/lib/markdown-punctuation';

describe('website syntax highlighting', () => {

	test('highlights list and hashtag punctuation in the docs loop example', () => {
		const template = highlightCode('{% for tag in tags %}\n- #{{ tag | kebab }}\n{% endfor %}', 'knap');
		const output = highlightCode('- #science-fiction\n- #novel', 'md');
		for (const html of [template, output]) {
			expect(html).toContain('<span class="syn-punctuation">-</span> <span class="syn-punctuation">#</span>');
		}
		expect(template).toContain('<span class="syn-variable">tag</span>');
		expect(output).toContain('science-fiction');
	});

	test.each([['- #science-fiction', 2, 1], ['- #{{ tag }}', 2, 1], ['## Heading', 0, 2], ['C#', 1, 0], ['https://example.com/#section', 20, 0], ['\\#escaped', 1, 0]] as const)('recognizes hash punctuation in %s at %i', (line, position, length) => {
		expect(markdownPunctuationAt(line, position)).toBe(length);
	});
	test('colors quoted YAML list strings without recoloring Markdown quotes outside frontmatter', () => {
		const lines = highlightLines(['---', 'genre:', '- "Action"', "- 'Sci-fi'", '- "[[Lana Wachowski]]"', '---', '- "A quotation"'], 'md');
		expect(lines[2]).toBe('<span class="syn-punctuation">-</span> <span class="syn-punctuation">&quot;</span><span class="syn-string">Action</span><span class="syn-punctuation">&quot;</span>');
		expect(lines[3]).toContain('<span class="syn-string">Sci-fi</span>');
		expect(lines[4]).toContain('<span class="syn-string">[[Lana Wachowski]]</span>');
		expect(lines[6]).not.toContain('syn-string');
	});
	test('preserves frontmatter context when rendering a complete docs code block', () => {
		const html = highlightCode('---\ndirector:\n  - "[[Lana Wachowski]]"\n---\n- "A quotation"', 'md');
		expect(html).toContain('<span class="syn-punctuation">&quot;</span><span class="syn-string">[[Lana Wachowski]]</span><span class="syn-punctuation">&quot;</span>');
		expect(html).not.toContain('<span class="syn-string">A quotation</span>');
	});
	test.each(['md', 'knap'] as const)('highlights Markdown markers in %s', (language) => {
		expect(highlightLine('---', language)).toBe('<span class="syn-punctuation">---</span>');
		expect(highlightLine('- **Cast**', language)).toBe('<span class="syn-punctuation">-</span> <span class="syn-punctuation">**</span>Cast<span class="syn-punctuation">**</span>');
		expect(highlightLine('1. _First_', language)).toContain('<span class="syn-punctuation">1.</span>');
		expect(highlightLine('movie_title and sci-fi', language)).toBe('movie_title and sci-fi');
		expect(highlightLine('\\*literal', language)).toBe('\\*literal');
		expect(highlightLine('**<script>**', language)).toContain('&lt;script&gt;');
	});

	test.each([['---', 0, 3], ['  - **Cast**', 2, 1], ['  - **Cast**', 4, 2], ['  - **Cast**', 10, 2], ['## Cast', 0, 2], ['> Quote', 0, 1], ['```md', 0, 3], ['movie_title', 5, 0], ['sci-fi', 3, 0], ['\\*literal', 1, 0]] as const)('recognizes shared editor punctuation in %s at %i', (line, position, length) => {
		expect(markdownPunctuationAt(line, position)).toBe(length);
	});

	test('highlights bare color filter arguments as literal values', () => {
		expect(highlightLine('{{ text | highlight:blue }}', 'knap'))
			.toContain('<span class="syn-string">blue</span>');
	});

	test('highlights bare horizontal-rule positions as literal values', () => {
		expect(highlightLine('{{ footer | hr:before }}', 'knap'))
			.toContain('<span class="syn-string">before</span>');
		expect(highlightLine('{{ footer | hr:after }}', 'knap'))
			.toContain('<span class="syn-string">after</span>');
		expect(highlightLine('{{ footer | hr:both }}', 'knap'))
			.toContain('<span class="syn-string">both</span>');
	});

	test('continues to highlight the same word as a variable outside filter arguments', () => {
		expect(highlightLine('{{ blue }}', 'knap'))
			.toContain('<span class="syn-variable">blue</span>');
	});

	test('highlights bare property and quoted suffix arguments as literal values', () => {
		expect(highlightLine('{{ people | sort:(details.rank, desc) }}', 'knap'))
			.toContain('<span class="syn-string">details</span><span class="syn-punctuation">.</span><span class="syn-string">rank</span>');
		expect(highlightLine('{{ text | truncatewords:(20, "…") }}', 'knap'))
			.toContain('<span class="syn-string">…</span>');
	});

	test('keeps map expression identifiers as variables', () => {
		expect(highlightLine('{{ people | map:item => item.name }}', 'knap'))
			.toContain('<span class="syn-variable">item</span>');
	});
});
