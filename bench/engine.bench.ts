import { bench, describe } from 'vitest';
import { createEngine } from '../src/engine';
import { standardFilters } from '../src/filters';
import { fixtures } from './fixtures';

// End-to-end: what a host application actually calls. Includes parse,
// filter validation, and render on every invocation.
const engine = createEngine({ filters: standardFilters });

describe('engine.render', () => {
	for (const fixture of fixtures) {
		bench(fixture.name, async () => {
			await engine.render(fixture.template, { variables: fixture.variables });
		});
	}
});

// Filter validation alone. Passing an AST avoids reparsing the template, which
// is already measured by the parse benchmarks.
describe('engine.validate (AST)', () => {
	for (const fixture of fixtures) {
		const { ast } = engine.parse(fixture.template);
		bench(fixture.name, () => {
			engine.validate(ast);
		});
	}
});
