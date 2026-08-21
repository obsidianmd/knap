import { bench, describe } from 'vitest';
import { parse } from '../src/parser';
import { renderAST } from '../src/renderer';
import { standardFilters } from '../src/filters';
import { fixtures } from './fixtures';

function contextFor(variables: Record<string, unknown>) {
	return {
		variables,
		applyFilter: async (value: string, filterName: string, param: string | undefined) => {
			const filter = (standardFilters as Record<string, any>)[filterName];
			if (!filter) return value;
			return filter(value, param, { variables, context: undefined, reportWarning: () => {} });
		},
	};
}

describe('renderAST', () => {
	for (const fixture of fixtures) {
		const { ast } = parse(fixture.template);
		const context = contextFor(fixture.variables as Record<string, unknown>);
		bench(fixture.name, async () => {
			await renderAST(ast, context);
		});
	}
});
