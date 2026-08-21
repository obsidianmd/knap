import { bench, describe } from 'vitest';
import { createEngine } from '../src/engine';
import { standardFilters } from '../src/filters';
import { fixtures } from './fixtures';

const engine = createEngine({ filters: standardFilters });

describe('engine.render', () => {
	for (const fixture of fixtures) {
		bench(fixture.name, async () => {
			await engine.render(fixture.template, { variables: fixture.variables });
		});
	}
});

describe('engine.validate (AST)', () => {
	for (const fixture of fixtures) {
		const { ast } = engine.parse(fixture.template);
		bench(fixture.name, () => {
			engine.validate(ast);
		});
	}
});
