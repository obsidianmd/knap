import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { standardFilters } from '../src/filters';
import type { TemplateVariables } from '../src/types';

interface CompatibilityFixture {
	name: string;
	template: string;
	variables: TemplateVariables;
	expected: string;
}

const fixtures: CompatibilityFixture[] = [
	{
		name: 'Importer note body',
		template: '# {{title|trim}}\n\n{% if tags %}{{tags|unique|join:", "}}{% endif %}',
		variables: { title: ' Imported note ', tags: ['reference', 'reading', 'reference'] },
		expected: '# Imported note\n\nreference, reading',
	},
	{
		name: 'exact and nested keys',
		template: '{{field.with.dots}} / {{author.name}} / {{items[1]}}',
		variables: {
			'field.with.dots': 'exact',
			author: { name: 'Ada' },
			items: ['First', 'Second'],
		},
		expected: 'exact / Ada / Second',
	},
	{
		name: 'human-readable field names',
		template: '{{ First name | upper }}',
		variables: { 'First name': 'Ada' },
		expected: 'ADA',
	},
	{
		name: 'Clipper wrapped variable keys',
		template: '{{title}} by {{author}}',
		variables: { '{{title}}': 'Knap', '{{author}}': 'Obsidian' },
		expected: 'Knap by Obsidian',
	},
	{
		name: 'logic, assignment, and loops',
		template: '{% set count = links|length %}{% if count > 1 %}{% for link in links %}{{loop.index}}. {{link.title}}{% endfor %}{% else %}No links{% endif %}',
		variables: { links: [{ title: 'One' }, { title: 'Two' }] },
		expected: '1. One\n2. Two',
	},
	{
		name: 'filter chains',
		template: '{{title|trim|lower|replace:" ":"-"}}',
		variables: { title: ' Shared Language ' },
		expected: 'shared-language',
	},
];

describe('consumer compatibility fixtures', () => {
	const engine = createEngine({ filters: standardFilters });

	test.each(fixtures)('$name', async ({ template, variables, expected }) => {
		const result = await engine.render(template, { variables });

		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe(expected);
	});

	test('delegates Clipper-style namespaced variables to an application adapter', async () => {
		const result = await engine.render('{{selector:h1|upper}} / {{schema:genre}}', {
			variables: {},
			resolveVariable: name => ({
				'selector:h1': 'Page title',
				'schema:genre': 'Reference',
			})[name],
		});

		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('PAGE TITLE / Reference');
	});
});
