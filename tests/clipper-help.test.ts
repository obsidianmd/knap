import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../src/filters';
import { clipperHelpFilters, clipperHelpLogic } from './fixtures/clipper-help';

const engine = createEngine({ filters: standardFilters });

describe('Web Clipper English help examples', () => {
	test.each(clipperHelpFilters)('%s through the direct filter API', (_name, value, filter, expected) => {
		const output = applyFiltersWithRegistry(value, filter, standardFilters, { variables: {} });
		expect(typeof expected === 'object' ? JSON.parse(output) : output).toEqual(expected);
	});
	test.each(clipperHelpFilters)('%s', async (_name, value, filter, expected) => {
		const result = await engine.render(`{{value|${filter}}}`, { variables: { value } });
		expect(result.errors).toEqual([]);
		expect(result.warnings).toEqual([]);
		expect(typeof expected === 'object' ? JSON.parse(result.output) : result.output).toEqual(expected);
	});
	test.each(clipperHelpLogic)('%s', async (_name, template, variables, expected) => {
		const result = await engine.render(template, { variables });
		expect(result.errors).toEqual([]);
		expect(result.output).toBe(expected);
	});
	test.each(['schema:author.name', 'schema:author[0].name', 'schema:author[*].name', 'schema:@Article:author.name', 'schema:@Article:author[0].name', 'schema:@Article:author[*].name'])('passes %s intact to the host resolver', async name => {
		const names: string[] = [];
		const result = await engine.render(`{{${name}|join:", "}}`, {
			variables: {}, resolveVariable: path => { names.push(path); return ['Ada', 'Grace']; },
		});
		expect(result.errors).toEqual([]);
		expect(names).toEqual([name]);
		expect(result.output).toBe('Ada, Grace');
	});
});
