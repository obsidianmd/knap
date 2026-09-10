import type { FilterExample } from '../docs/filter-docs';

interface TagHelp {
	summary: string;
	syntax: string;
	notes: string[];
	example: FilterExample;
}

const conditionExample: FilterExample = {
	title: 'Choose a branch',
	variables: { published: false, draft: true },
	template: '{% if published %}Published{% elseif draft %}Draft{% else %}Archived{% endif %}',
	expected: 'Draft',
};

const loopExample: FilterExample = {
	title: 'List tags',
	variables: { tags: ['science fiction', 'novel'] },
	template: '{% for tag in tags %}- #{{ tag | kebab }}{% endfor %}',
	expected: '- #science-fiction\n- #novel',
};

export const tagHelp: Record<string, TagHelp> = {
	if: {
		summary: 'Render content when a condition is truthy.',
		syntax: '{% if condition %}...{% elseif other %}...{% else %}...{% endif %}',
		notes: [
			'elseif and else branches are optional. Conditions can nest.',
			'False, null, undefined, an empty string, zero, and an empty array are falsy.',
			'Use comparisons (==, !=, >, <, >=, <=, contains), and / &&, or / ||, and not / !. Parentheses group expressions.',
		],
		example: conditionExample,
	},
	elseif: {
		summary: 'Try another condition after an if or elseif branch.',
		syntax: '{% if condition %}...{% elseif other %}...{% endif %}',
		notes: ['Use inside an if block, before any else branch. Multiple elseif branches are allowed.'],
		example: conditionExample,
	},
	else: {
		summary: 'Render the fallback branch of an if block.',
		syntax: '{% if condition %}...{% else %}...{% endif %}',
		notes: ['Use once, after all conditional branches. Knap does not support for-else blocks.'],
		example: conditionExample,
	},
	endif: {
		summary: 'Close an if block.',
		syntax: '{% if condition %}...{% endif %}',
		notes: ['Each if block requires a matching endif, including nested blocks.'],
		example: conditionExample,
	},
	for: {
		summary: 'Repeat a block for each value in an array.',
		syntax: '{% for item in items %}...{% endfor %}',
		notes: [
			'Use item properties inside the block, for example {{ item.name }}.',
			'Loop values: loop.index (1-based), loop.index0 (0-based), loop.first, loop.last, loop.length, and item_index (0-based, named after the iterator).',
			'Iterations are separated by a line break. Extra blank lines before endfor are preserved.',
		],
		example: loopExample,
	},
	endfor: {
		summary: 'Close a for loop.',
		syntax: '{% for item in items %}...{% endfor %}',
		notes: ['Each for block requires a matching endfor, including nested loops.'],
		example: loopExample,
	},
	set: {
		summary: 'Assign a local variable for later use in the template.',
		syntax: '{% set name = expression %}',
		notes: ['Assign a literal, expression, or filtered value. Assignments are evaluated in order and produce no output.'],
		example: {
			title: 'Create a slug',
			variables: { title: 'Hello World' },
			template: '{% set slug = title | kebab %}File: {{ slug }}.md',
			expected: 'File: hello-world.md',
		},
	},
};

export const syntaxHelp = `Knap template syntax

Values and properties:
  {{ title }}                 Variable supplied by JSON data
  {{ author.name }}           Nested object property
  {{ authors[0].name }}       Array item property
  {{ metadata["a:b"] }}        Quoted property key
  {{ First name }}            Variable name containing spaces

Filters run left to right; parameters follow a colon:
  {{ title | trim | upper }}
  {{ published | date:"YYYY-MM-DD" }}
  {{ text | truncate:(100, "...") }}

Logic:
  {% if published %}Published{% else %}Draft{% endif %}
  {% for item in items %}{{ item.name }}{% endfor %}
  {% set slug = title | kebab %}{{ slug }}

Conditions accept ==, !=, >, <, >=, <=, contains, and / &&, or / ||,
not / !, and parentheses. False, null, undefined, empty strings, zero,
and empty arrays are falsy.

Fallbacks use the first truthy value (including fallback for zero or false):
  {{ title ?? headline ?? "Untitled" }}
Filters bind before ??, which has the lowest precedence.

Whitespace control trims adjacent whitespace with a dash:
  {{- title -}}
  {%- set slug = title | kebab -%}
Standalone logic tag lines are removed; loop iterations use line breaks.

The CLI supplies variables from JSON, or CSV records in batch mode.
Browser selectors, prompt execution, and other host integrations are not
available in the CLI. DOM-dependent HTML filters require the library API.

Next: knap help filters | knap help tags | knap validate --help
`;
