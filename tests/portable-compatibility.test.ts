import { describe, expect, test } from 'vitest';
import corpusJson from '../compat/fixtures/render.json';
import { createEngine, standardFilters } from '../src';
import { documentedRenderCorpus, type RenderCorpus } from './fixtures/portable-render';

const corpus: RenderCorpus = corpusJson;

describe('portable rendering fixtures', () => {
	test('uses a supported format and filter preset', () => {
		expect(corpus.format_version).toBe(1);
		expect(corpus.preset).toBe('standard');
	});

	test('matches the authored examples', async () => {
		const authored = documentedRenderCorpus();
		const serialized = JSON.stringify(authored, null, 2) + '\n';

		// Fail if a future example cannot be represented losslessly as JSON.
		expect(JSON.parse(serialized)).toStrictEqual(authored);
		expect(authored.cases.length).toBeGreaterThan(0);
		expect(new Set(authored.cases.map(item => item.id)).size).toBe(authored.cases.length);

		// --update exports the hand-authored expectations, never renderer output.
		await expect(serialized).toMatchFileSnapshot('../compat/fixtures/render.json');
	});

	test.each(corpus.cases)('$id', async fixture => {
		const result = await createEngine({ filters: standardFilters }).render(
			fixture.template,
			{ variables: structuredClone(fixture.variables) },
		);
		expect({
			output: result.output,
			errors: result.errors.map(error => error.code),
			warnings: result.warnings.map(({ code, filter }) => ({ code, filter })),
		}).toStrictEqual(fixture.expected);
	});
});
