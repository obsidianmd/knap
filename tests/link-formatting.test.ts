import { expect, test } from 'vitest';
import { createEngine, standardFilters } from '../src';
import { image } from '../src/filters/image';
import { link } from '../src/filters/link';

test('keeps dynamic labels inside their link', async () => {
	const engine = createEngine({ filters: standardFilters });
	expect(await engine.renderOrThrow('{{ url | link:label }}', {
		variables: { url: 'https://example.com', label: 'x](https://other.example) [y' },
	})).toBe(String.raw`[x\](https://other.example) \[y](https://example.com)`);
});

test.each([link, image])('escapes literal labels and destination delimiters', format => {
	const prefix = format === image ? '!' : '';
	expect(format('a)b\\c\n<d> [e].jpg', '<img> [label]\\\nnext'))
		.toBe(prefix + String.raw`[\<img\> \[label\]\\ next](a%29b%5Cc%0A%3Cd%3E%20%5Be%5D.jpg)`);
});

test.each(['javascript:alert(1)', 'JavaScript:alert(1)', 'java\nscript:alert(1)', 'data:text/html,test', 'vbscript:test'])('omits active destinations: %s', url => {
	expect(link(url, 'label')).toBe('[label]()');
	expect(image(url, 'label')).toBe('![label]()');
});

test.each(['obsidian://open?vault=Notes&file=test', '../note.md', 'https://example.com/?a=1&b=2'])('preserves supported URLs: %s', url => {
	expect(link(url, 'label')).toBe(`[label](${url})`);
});

test('keeps character references literal in destinations', () => {
	expect(link('javascript&colon;alert(1)', 'label')).toBe('[label](javascript%26colon;alert%281%29)');
	expect(link('&#106;avascript:alert(1)', 'label')).toBe('[label](%26#106;avascript:alert%281%29)');
});

test('applies escaping to array and object forms', () => {
	expect(link('["a)b"]', '[label]')).toBe(String.raw`[\[label\]](a%29b)`);
	expect(image('{"a)b":"[label]"}')).toEqual([String.raw`![\[label\]](a%29b)`]);
});
