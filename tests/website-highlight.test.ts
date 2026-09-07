import { describe, expect, test } from 'vitest';
import { highlightLine } from '../website/src/lib/highlight';

describe('website syntax highlighting', () => {
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
