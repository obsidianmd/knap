import { version } from '../../package.json';
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
	knap_version: string;
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
];

/** Export the authored expectations, without evaluating any templates. */
export function documentedRenderCorpus(): RenderCorpus {
	return {
		format_version: 1,
		knap_version: version,
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
		],
	};
}
