import type { TemplateVariables } from '../src/types';

export interface Fixture {
	name: string;
	template: string;
	variables: TemplateVariables;
}

const proseParagraph = [
	'Knap is a flexible template engine for creating Markdown. It is shared by',
	'Obsidian tools, and it uses an AST interpreter rather than `eval`.',
	'',
	'- Tokenization, parsing, logic, rendering, structured errors, and filters.',
	'- Applications supply variables and runtime integrations.',
	'',
	'> Every error contains a stable code, message, line, and column.',
	'',
].join('\n');

const prose = proseParagraph.repeat(40);

const htmlArticle = [
	'<article class="post" data-id="42">',
	'<h1 id="title">An imported note</h1>',
	'<p>Some <strong>bold</strong> and <em>italic</em> text with a ',
	'<a href="https://example.com/page?utm_source=feed">tracked link</a>.</p>',
	'<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>',
	'<pre><code>const x = 1;</code></pre>',
	'</article>',
].join('\n').repeat(20);

function makeLinks(count: number) {
	return Array.from({ length: count }, (_, i) => ({
		title: `Link number ${i}`,
		url: `https://example.com/entry/${i}`,
		tags: [`tag-${i % 7}`, `tag-${i % 3}`],
		score: i * 1.5,
	}));
}

export const fixtures: Fixture[] = [
	{
		name: 'prose (no syntax)',
		template: prose,
		variables: {},
	},
	{
		name: 'prose + variables',
		template: `# {{ title }}\n\n${proseParagraph}\n\nBy {{ author.name }} on {{ published }}.\n${proseParagraph}`,
		variables: {
			title: 'An imported note',
			author: { name: 'Ada Lovelace' },
			published: '2026-08-21',
		},
	},
	{
		name: 'filter chains',
		template: [
			'{{ title | trim | lower | replace:" ":"-" }}',
			'{{ tags | unique | join:", " }}',
			'{{ description | trim | strip_md | slice:0,120 }}',
			'{{ author.name | upper }} / {{ author.name | kebab }} / {{ author.name | snake }}',
			'{{ count | calc:"+10" | round }}',
		].join('\n'),
		variables: {
			title: '  Shared Language  ',
			tags: ['reference', 'reading', 'reference', 'markdown'],
			description: '  A **bold** description with _emphasis_ and a [link](https://example.com).  ',
			author: { name: 'Ada Lovelace' },
			count: '32.4',
		},
	},
	{
		name: 'logic',
		template: [
			'{% set count = links | length %}',
			'{% if count > 10 %}Many links ({{ count }})',
			'{% elseif count > 0 %}A few links ({{ count }})',
			'{% else %}No links{% endif %}',
			'{% if author.name and published %}Attributed{% else %}Unattributed{% endif %}',
		].join('\n'),
		variables: {
			links: makeLinks(12),
			author: { name: 'Ada Lovelace' },
			published: '2026-08-21',
		},
	},
	{
		name: 'loop x200',
		template: '{% for link in links %}- [{{ loop.index }}. {{ link.title | trim }}]({{ link.url }}) {{ link.tags | join:", " }}\n{% endfor %}',
		variables: { links: makeLinks(200) },
	},
	{
		name: 'html filters',
		template: '{{ content | strip_tags | trim }}\n\n{{ content | remove_attr:"data-id" | strip_attr }}',
		variables: { content: htmlArticle },
	},
	{
		name: 'clipper template',
		template: [
			'---',
			'title: "{{ title | trim | replace:\'"\':\'\' }}"',
			'source: {{ url }}',
			'author: "{{ author.name | trim }}"',
			'published: {{ published }}',
			'created: {{ today }}',
			'tags:',
			'{% for tag in tags | unique %}  - {{ tag | kebab }}\n{% endfor %}',
			'---',
			'',
			'# {{ title | trim }}',
			'',
			'{% if description %}> {{ description | strip_md | trim }}{% endif %}',
			'',
			'{{ content | strip_tags | trim }}',
			'',
			'{% set count = links | length %}',
			'{% if count > 0 %}## Links ({{ count }})',
			'',
			'{% for link in links %}{{ loop.index }}. [{{ link.title }}]({{ link.url }})\n{% endfor %}',
			'{% endif %}',
		].join('\n'),
		variables: {
			title: '  An imported note  ',
			url: 'https://example.com/page',
			author: { name: 'Ada Lovelace' },
			published: '2026-08-21',
			today: '2026-08-21',
			tags: ['Reference', 'reading', 'Reference', 'Markdown Notes'],
			description: '  A **bold** description with _emphasis_.  ',
			content: htmlArticle,
			links: makeLinks(25),
		},
	},
];

export const fixturesByName = Object.fromEntries(
	fixtures.map(fixture => [fixture.name, fixture]),
) as Record<string, Fixture>;
