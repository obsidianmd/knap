import { bench, describe } from 'vitest';
import { tokenize } from '../src/tokenizer';
import { fixtures } from './fixtures';

describe('tokenize', () => {
	for (const fixture of fixtures) {
		bench(fixture.name, () => {
			tokenize(fixture.template);
		});
	}
});
