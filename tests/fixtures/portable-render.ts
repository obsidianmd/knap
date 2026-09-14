import { filterDocs } from '../../src/docs/filter-docs';
import { logicDocs } from '../../website/lib/logic-docs';
import { clipperHelpLogic } from './clipper-help';

export interface RenderFixture {
	id: string;
	source: string;
	template: string;
	variables: Record<string, unknown>;
	expected: {
		output: string;
		errors: string[];
		warnings: { code: string; filter: string }[];
	};
}

export interface RenderCorpus {
	format_version: number;
	preset: string;
	cases: RenderFixture[];
}

function slug(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function example(
	id: string,
	source: string,
	template: string,
	variables: Record<string, unknown>,
	output: string,
): RenderFixture {
	return { id, source, template, variables, expected: { output, errors: [], warnings: [] } };
}

// These expectations are authored from existing regression tests. Do not
// populate expected values by calling the implementation under test.
const diagnostics: RenderFixture[] = [
	{
		id: 'diagnostics/unclosed-variable',
		source: 'tests/engine.test.ts: returns coded parse and runtime errors without logging',
		template: '{{title',
		variables: {},
		expected: { output: '', errors: ['PARSE_ERROR'], warnings: [] },
	},
	{
		id: 'diagnostics/unknown-filter',
		source: 'tests/property-access.test.ts: registry lookup only calls registered filters',
		template: '{{ value | toString }}',
		variables: { value: 'value' },
		expected: { output: 'value', errors: ['UNKNOWN_FILTER'], warnings: [] },
	},
	{
		id: 'diagnostics/pass-through-warnings',
		source: 'tests/engine.test.ts: reports pass-through filter failures as non-fatal warnings',
		template: '{{ value | replace:"/[/":"x" }}\n{{ published | date:"YYYY-MM-DD" }}',
		variables: { value: 'a[b', published: 'not-a-date' },
		expected: {
			output: 'a[b\nnot-a-date',
			errors: [],
			warnings: [
				{ code: 'INVALID_FILTER_INPUT', filter: 'replace' },
				{ code: 'INVALID_FILTER_INPUT', filter: 'date' },
			],
		},
	},
	{
		id: 'diagnostics/calc-invalid-input',
		source: 'tests/filters/calc.test.ts: uses strict numeric parsing and warns while preserving invalid input',
		template: '{{ value | calc:"+1" }}',
		variables: { value: '42abc' },
		expected: { output: '42abc', errors: [], warnings: [{ code: 'INVALID_FILTER_INPUT', filter: 'calc' }] },
	},
	{
		id: 'diagnostics/round-invalid-input',
		source: 'tests/filters/round.test.ts: uses strict numeric parsing and warns while preserving invalid scalar input',
		template: '{{ value | round:1 }}',
		variables: { value: '42abc' },
		expected: { output: '42abc', errors: [], warnings: [{ code: 'INVALID_FILTER_INPUT', filter: 'round' }] },
	},
];

// Typed values that must survive a filter chain, authored from existing
// regression tests.
const typedValues: RenderFixture[] = [
	example(
		'typed-values/round-into-yaml-property',
		'tests/filters/yaml_property.test.ts: preserves the typed value returned by preceding filters',
		'{{ value | round:2 | yaml_property:"price" }}', { value: 42.567 }, 'price: 42.57',
	),
	example(
		'typed-values/first-nested-collection',
		'tests/filters/first.test.ts: preserves nested array shape',
		'{{ items | first | yaml:flow }}', { items: [[1, 2], [3]] }, '[1,2]',
	),
	example(
		'typed-values/last-nested-collection',
		'tests/filters/last.test.ts: preserves nested array shape',
		'{{ items | last | yaml:flow }}', { items: [[1, 2], [3]] }, '[3]',
	),
	example(
		'typed-values/length-singleton-array',
		'tests/filters/length.test.ts: uses raw singleton collection shape',
		'{{ tags | length | yaml }}', { tags: ['notes'] }, '1',
	),
];

/** Export the authored expectations, without evaluating any templates. */
export function documentedRenderCorpus(): RenderCorpus {
	return {
		format_version: 1,
		preset: 'standard',
		cases: [
			...filterDocs
				.filter(filter => filter.environment === 'standard')
				.flatMap(filter => filter.examples
					.filter(item => item.testable !== false)
					.map(item => example(
						`filters/${filter.slug}/${slug(item.title)}`,
						`src/docs/filter-docs.ts: ${filter.name}: ${item.title}`,
						item.template, item.variables, item.expected,
					))),
			...logicDocs.flatMap(doc => doc.examples.map(item => example(
				`logic/${doc.slug}/${slug(item.title)}`,
				`website/lib/logic-docs.ts: ${doc.slug}: ${item.title}`,
				item.template, item.variables, item.expected,
			))),
			...clipperHelpLogic.map(([name, template, variables, expected]) => example(
				`clipper-logic/${slug(name)}`,
				`tests/fixtures/clipper-help.ts: ${name}`,
				template, variables, expected,
			)),
			...diagnostics,
			...typedValues,
		],
	};
}
