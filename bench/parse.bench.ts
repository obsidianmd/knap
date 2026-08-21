import { bench, describe } from 'vitest';
import { parse, parseTokens } from '../src/parser';
import { tokenize } from '../src/tokenizer';
import { fixtures } from './fixtures';

// Full parse: tokenize + build AST. This is what engine.render() pays on
// every call, since the engine does not cache parsed templates.
describe('parse (tokenize + AST)', () => {
	for (const fixture of fixtures) {
		bench(fixture.name, () => {
			parse(fixture.template);
		});
	}
});

// AST construction alone, so tokenizer cost can be subtracted out.
describe('parseTokens (AST only)', () => {
	for (const fixture of fixtures) {
		const { tokens } = tokenize(fixture.template);
		bench(fixture.name, () => {
			// parseTokens may coalesce adjacent identifiers in place, so give each
			// sample a fresh token array instead of benchmarking mutated state.
			parseTokens([...tokens]);
		});
	}
});
