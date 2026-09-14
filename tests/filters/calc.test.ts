import { describe, test, expect } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';
import { calc, validateCalcParams } from '../../src/filters/calc';

const engine = createEngine({ filters: standardFilters });

describe('calc filter', () => {
	test('addition', () => {
		expect(calc('5', '+10')).toBe(15);
	});

	test('subtraction', () => {
		expect(calc('10', '-3')).toBe(7);
	});

	test('multiplication', () => {
		expect(calc('5', '*3')).toBe(15);
	});

	test('division', () => {
		expect(calc('10', '/2')).toBe(5);
	});

	test('exponentiation with **', () => {
		expect(calc('2', '**3')).toBe(8);
	});

	test('exponentiation with ^', () => {
		expect(calc('2', '^3')).toBe(8);
	});

	test('returns original for non-numbers', () => {
		expect(calc('hello', '+10')).toBe('hello');
	});

	test('handles decimal numbers', () => {
		expect(calc('5.5', '+2.5')).toBe(8);
	});

	test('handles negative numbers', () => {
		expect(calc('-5', '+10')).toBe(5);
	});

	test('trims spaces inside quoted operations', async () => {
		expect(calc('5', '" +1 "')).toBe(6);
		await expect(engine.renderOrThrow('{{ value | calc:" +1 " }}', {
			variables: { value: 5 },
		})).resolves.toBe('6');
	});

	test('returns original without params', () => {
		expect(calc('5')).toBe('5');
	});

	test('uses strict numeric parsing and warns while preserving invalid input', async () => {
		for (const value of ['', '  ', '42abc', 'abc']) {
			const result = await engine.render('{{ value | calc:"+10" }}', { variables: { value } });
			expect(result.output).toBe(value);
			expect(result.warnings).toMatchObject([{ code: 'INVALID_FILTER_INPUT', filter: 'calc' }]);
		}
	});

	test('passes through missing and null values without warnings', async () => {
		for (const variables of [{}, { value: null }]) {
			const result = await engine.render('{{ value | calc:"+10" }}', { variables });
			expect(result.output).toBe('');
			expect(result.warnings).toEqual([]);
		}
	});

	test('accepts numeric text using the shared full-string parser', () => {
		expect(calc('0x1A', '+1')).toBe(27);
	});

	test('keeps ten-decimal floating-point cleanup on numeric results', () => {
		expect(calc('0.1', '+0.2')).toBe(0.3);
	});

	test('retains singleton primitive unwrapping for scalar arithmetic', async () => {
		await expect(engine.renderOrThrow('{{ values | calc:"+1" }}', {
			variables: { values: [42] },
		})).resolves.toBe('43');
	});

	test('warns and preserves the original typed value for non-finite results', async () => {
		const result = await engine.render('{{ value | calc:"/0" | yaml_property:"v" }}', {
			variables: { value: 42.567 },
		});
		expect(result.output).toBe('v: 42.567');
		expect(result.warnings).toMatchObject([{ code: 'INVALID_FILTER_INPUT', filter: 'calc' }]);
	});
});

describe('calc param validation', () => {
	test('valid params return valid', () => {
		expect(validateCalcParams('+10').valid).toBe(true);
		expect(validateCalcParams('-5').valid).toBe(true);
		expect(validateCalcParams('*2').valid).toBe(true);
		expect(validateCalcParams('/3').valid).toBe(true);
		expect(validateCalcParams('**2').valid).toBe(true);
		expect(validateCalcParams('^3').valid).toBe(true);
		expect(validateCalcParams('"+10"').valid).toBe(true);
		expect(validateCalcParams('" +1 "').valid).toBe(true);
	});

	test('missing params returns error', () => {
		const result = validateCalcParams(undefined);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('requires');
	});

	test('invalid operator returns error', () => {
		const result = validateCalcParams('%5');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('invalid operator');
	});

	test('missing number returns error', () => {
		const result = validateCalcParams('+');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('number');
	});

	test('non-numeric value returns error', () => {
		const result = validateCalcParams('+abc');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('number');
	});
});
