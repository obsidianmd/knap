import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';
import { indent } from '../../src/filters/indent';

const engine = createEngine({ filters: standardFilters });

describe('indent filter', () => {
	test('indents the first and subsequent lines by two spaces by default', () => {
		expect(indent('first\n  nested\nlast')).toBe('  first\n    nested\n  last');
	});

	test('preserves empty lines, trailing newlines, and original line endings', () => {
		expect(indent('\r\nfirst\r\n\r\nlast\rnext\n')).toBe('\r\n  first\r\n\r\n  last\r  next\n');
		expect(indent('')).toBe('');
		expect(indent('\n\n')).toBe('\n\n');
	});

	test.each(['4', '"4"', '(4)'])('accepts a width of %s', async param => {
		await expect(engine.renderOrThrow(`{{ text | indent:${param} }}`, {
			variables: { text: 'first\nlast' },
		})).resolves.toBe('    first\n    last');
	});

	test('supports zero indentation', async () => {
		await expect(engine.renderOrThrow('{{ text | indent:0 }}', {
			variables: { text: 'first\nlast\n' },
		})).resolves.toBe('first\nlast\n');
	});

	test('supports the maximum indentation width', () => {
		expect(indent('x', '1000')).toHaveLength(1001);
	});

	test.each(['-1', '1.5', '"two"', '2,4', '""', '1001', '9007199254740991', '9007199254740992'])('rejects an invalid width: %s', param => {
		expect(engine.validate(`{{ text | indent:${param} }}`)[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
		});
	});
});
