import { bench, describe } from 'vitest';
import { parse, parseTokens } from '../src/parser';
import { tokenize } from '../src/tokenizer';
import { fixtures } from './fixtures';

describe('parse (tokenize + AST)', () => {
	for (const fixture of fixtures) {
		bench(fixture.name, () => {
			parse(fixture.template);
		});
	}
});

describe('parseTokens (AST only)', () => {
	for (const fixture of fixtures) {
		const { tokens } = tokenize(fixture.template);
		bench(fixture.name, () => {
			// parseTokens can merge adjacent identifiers in place.
			parseTokens([...tokens]);
		});
	}
});
