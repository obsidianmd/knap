import { describe, test, expect } from 'vitest';
import { createEngine } from '../../src/engine';
import { nth, validateNthParams } from '../../src/filters/nth';
import { standardFilterMetadata, standardFilters } from '../../src/filters';
import { parse, validateFilters, FilterExpression, LiteralExpression, VariableNode } from '../../src/parser';

const engine = createEngine({ filters: standardFilters });

describe('nth filter', () => {
	test('keeps nth element (1-based)', () => {
		expect(nth('["a","b","c","d","e"]', '3')).toEqual(['c']);
	});

	test('keeps every nth element', () => {
		expect(nth('["a","b","c","d","e","f"]', '2n')).toEqual(['b', 'd', 'f']);
	});

	test('keeps nth and following (n+offset)', () => {
		expect(nth('["a","b","c","d","e"]', 'n+3')).toEqual(['c', 'd', 'e']);
	});

	test('handles group pattern', () => {
		expect(nth('[1,2,3,4,5,6,7,8,9,10]', '1,2,3:5')).toEqual([1, 2, 3, 6, 7, 8]);
	});

	test('handles empty array', () => {
		const result = nth('[]', '3');
		expect(result).toEqual([]);
	});

	test('preserves null in its existing array return shape', () => {
		expect(nth('[null,"x"]', '1')).toEqual([null]);
	});

	test('uses raw singleton collection shape and preserves element types', () => {
		expect(nth('42', '1', { variables: {}, rawValue: [42] })).toEqual([42]);
		expect(nth('', '2', { variables: {}, rawValue: [''] })).toEqual([]);
	});

	test('preserves selected element types', () => {
		const values = ['42', 42, true, null, [1], { a: 1 }];
		expect(nth(JSON.stringify(values), '1,2,3,4,5,6:6')).toEqual(values);
	});

	test('returns original for non-JSON', () => {
		expect(nth('hello', '3')).toBe('hello');
	});
});

describe('nth param validation', () => {
	test('no param is valid (optional)', () => {
		expect(validateNthParams(undefined).valid).toBe(true);
	});

	test('valid params return valid', () => {
		expect(validateNthParams('3').valid).toBe(true);
		expect(validateNthParams('5n').valid).toBe(true);
		expect(validateNthParams('n+7').valid).toBe(true);
		expect(validateNthParams('1,2,3:5').valid).toBe(true);
	});

	test('invalid syntax returns error', () => {
		const result = validateNthParams('abc');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('invalid syntax');
	});

	test('invalid basis pattern returns error', () => {
		const result = validateNthParams('1,2:abc');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('basis');
	});

	test('parses 2n pattern as single arg', () => {
		const result = parse('{{items|nth:2n}}');
		expect(result.errors).toHaveLength(0);

		const varNode = result.ast[0] as VariableNode;
		const filterExpr = varNode.expression as FilterExpression;
		expect(filterExpr.name).toBe('nth');
		expect(filterExpr.args).toHaveLength(1);
		expect((filterExpr.args[0] as LiteralExpression).value).toBe('2n');
	});

	test('parses n+3 pattern as single arg', () => {
		const result = parse('{{items|nth:n+3}}');
		expect(result.errors).toHaveLength(0);

		const varNode = result.ast[0] as VariableNode;
		const filterExpr = varNode.expression as FilterExpression;
		expect(filterExpr.name).toBe('nth');
		expect(filterExpr.args).toHaveLength(1);
		expect((filterExpr.args[0] as LiteralExpression).value).toBe('n+3');
	});

	test('parses group pattern as two args', () => {
		const result = parse('{{items|nth:2,3:4}}');
		expect(result.errors).toHaveLength(0);

		const varNode = result.ast[0] as VariableNode;
		const filterExpr = varNode.expression as FilterExpression;
		expect(filterExpr.name).toBe('nth');
		expect(filterExpr.args).toHaveLength(2);
		expect((filterExpr.args[0] as LiteralExpression).value).toBe(2);
		expect((filterExpr.args[1] as LiteralExpression).value).toBe('3:4');
	});

	test('validates nth:2n without errors', () => {
		const result = parse('{{items|nth:2n}}');
		expect(result.errors).toHaveLength(0);
		const filterWarnings = validateFilters(result.ast, standardFilterMetadata);
		expect(filterWarnings).toHaveLength(0);
	});

	test('validates nth:n+3 without errors', () => {
		const result = parse('{{items|nth:n+3}}');
		expect(result.errors).toHaveLength(0);
		const filterWarnings = validateFilters(result.ast, standardFilterMetadata);
		expect(filterWarnings).toHaveLength(0);
	});

	test('validates nth:2,3:4 without errors', () => {
		const result = parse('{{items|nth:2,3:4}}');
		expect(result.errors).toHaveLength(0);
		const filterWarnings = validateFilters(result.ast, standardFilterMetadata);
		expect(filterWarnings).toHaveLength(0);
	});
});

describe('nth filter via renderer', () => {
	test('nth:2 gets single element through template', async () => {
		const result = await engine.render('{{msg|nth:2}}', {
			variables: { msg: '["a","b","c","d","e"]' },
		});
		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('b');
	});

	test('passes a singleton selection to downstream text filters using renderer unwrapping', async () => {
		await expect(engine.renderOrThrow('{{msg|nth:2|upper}}', {
			variables: { msg: ['a', 'b'] },
		})).resolves.toBe('B');
	});

	test('nth:2n gets every 2nd element through template', async () => {
		const result = await engine.render('{{msg|nth:2n}}', {
			variables: { msg: '["a","b","c","d","e","f"]' },
		});
		expect(result.errors).toHaveLength(0);
		const parsed = JSON.parse(result.output);
		expect(parsed).toEqual(['b', 'd', 'f']);
	});

	test('nth:n+3 gets the third and following elements through template', async () => {
		const result = await engine.render('{{msg|nth:n+3}}', {
			variables: { msg: '["a","b","c","d","e"]' },
		});
		expect(result.errors).toHaveLength(0);
		const parsed = JSON.parse(result.output);
		expect(parsed).toEqual(['c', 'd', 'e']);
	});

	test('supports an nth offset after another filter', async () => {
		const result = await engine.render('{{author|split:" "|nth:n+1}}', {
			variables: { author: 'Ada Lovelace' },
		});
		expect(result.errors).toHaveLength(0);
		expect(JSON.parse(result.output)).toEqual(['Ada', 'Lovelace']);
	});

	test('nth:2,3:4 gets positions 2,3 from each group of 4 through template', async () => {
		const result = await engine.render('{{msg|nth:2,3:4}}', {
			variables: { msg: '[1,2,3,4,5,6,7,8]' },
		});
		expect(result.errors).toHaveLength(0);
		const parsed = JSON.parse(result.output);
		expect(parsed).toEqual([2, 3, 6, 7]);
	});
});
