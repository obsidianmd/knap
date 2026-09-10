import { describe, expect, test } from 'vitest';
import { topicHelp } from '../src/cli/help';
import { tagHelp } from '../src/cli/language-help';
import { createEngine, standardFilters, standardFilterMetadata } from '../src';
import { filterDocsByName } from '../src/docs/filter-docs';

describe('CLI reference coverage', () => {
	test('lists every CLI filter and alias, with documentation for each', () => {
		const names = Object.keys(standardFilters).sort();
		expect(Object.keys(standardFilterMetadata).sort()).toEqual(names);
		const list = topicHelp(['filters']);
		const listed = list.split('\n').filter(line => line.startsWith('  ')).map(line => line.trim().split(/\s/)[0]);
		expect(listed).toEqual(names);
		for (const name of names) {
			const doc = filterDocsByName.get(name);
			expect(doc, name).toBeDefined();
			expect(doc?.environment, name).toBe('standard');
			const detail = topicHelp(['filter', name]);
			expect(detail, name).toContain(doc!.summary);
			expect(detail, name).toContain('Output:');
		}
	});

	test.each(Object.entries(tagHelp))('%s help contains a working example', async (name, doc) => {
		const detail = topicHelp(['tag', name]);
		expect(detail).toContain(doc.syntax);
		const result = await createEngine({ filters: standardFilters }).render(doc.example.template, { variables: doc.example.variables });
		expect(result.errors).toEqual([]);
		expect(result.output).toBe(doc.example.expected);
	});
});
