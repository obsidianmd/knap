import { describe, test, expect } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';
import { round, validateRoundParams } from '../../src/filters/round';

const engine = createEngine({ filters: standardFilters });

describe('round filter', () => {
	test('rounds to nearest integer by default', () => {
		expect(round('3.7')).toBe(4);
		expect(round('3.2')).toBe(3);
	});

	test('rounds to specified decimal places', () => {
		expect(round('3.14159', '2')).toBe(3.14);
	});

	test('rounds up at midpoint', () => {
		expect(round('3.5')).toBe(4);
	});

	test('handles negative numbers', () => {
		expect(round('-3.7')).toBe(-4);
	});

	test('handles integers', () => {
		expect(round('5')).toBe(5);
	});

	test('returns original for non-numbers', () => {
		expect(round('hello')).toBe('hello');
	});

	test('handles zero decimal places', () => {
		expect(round('3.14159', '0')).toBe(3);
	});

	test('accepts surrounding whitespace and JavaScript numeric forms', () => {
		expect(round(' 42.5 ', '1')).toBe(42.5);
		expect(round('0x1A')).toBe(26);
	});

	test('uses strict numeric parsing and warns while preserving invalid scalar input', async () => {
		for (const value of ['', '  ', '42abc', 'abc']) {
			const result = await engine.render('{{ value | round:1 }}', { variables: { value } });
			expect(result.output).toBe(value);
			expect(result.warnings).toMatchObject([{ code: 'INVALID_FILTER_INPUT', filter: 'round' }]);
		}
	});

	test('passes through missing and null values without warnings', async () => {
		for (const variables of [{}, { value: null }]) {
			const result = await engine.render('{{ value | round }}', { variables });
			expect(result.output).toBe('');
			expect(result.warnings).toEqual([]);
		}
	});

	test('rounds numeric collection members while preserving their types', () => {
		expect(round('{"price":"42.567","title":"Neo","loose":"42abc"}', '2')).toEqual({
			price: 42.57,
			title: 'Neo',
			loose: '42abc',
		});
	});

	test('recognizes serialized collections with leading whitespace', () => {
		expect(round('  [1.23,"2.34"]', '1')).toEqual([1.2, 2.3]);
	});

	test('supports precision greater than ten without adding floating artifacts', () => {
		expect(round('1.2345678901234', '12')).toBe(1.234567890123);
	});

	test('warns and preserves scalar input when rounding would overflow', async () => {
		const result = await engine.render('{{ value | round:10 | yaml_property:"v" }}', {
			variables: { value: 1e308 },
		});
		expect(result.output).toBe('v: 1e+308');
		expect(result.warnings).toMatchObject([{ code: 'INVALID_FILTER_INPUT', filter: 'round' }]);
	});

	test('preserves overflowing collection members, rounds valid members, and emits one warning', () => {
		const warnings: unknown[] = [];
		const values = [1.234567890123, '42abc', 1e308];
		expect(round(JSON.stringify(values), '10', {
			variables: {}, rawValue: values, reportWarning: warning => warnings.push(warning),
		})).toEqual([1.2345678901, '42abc', 1e308]);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toMatchObject({ code: 'INVALID_FILTER_INPUT' });
	});

	test('preserves an existing non-finite collection member in the aggregate warning', () => {
		const warnings: unknown[] = [];
		const values = [1.234, Infinity];
		expect(round('', '2', {
			variables: {}, rawValue: values, reportWarning: warning => warnings.push(warning),
		})).toEqual([1.23, Infinity]);
		expect(warnings).toHaveLength(1);
	});

	test('preserves singleton collection shape for downstream typed filters', async () => {
		await expect(engine.renderOrThrow('{{ items | round | yaml_property:"v" }}', {
			variables: { items: [42.5] },
		})).resolves.toBe('v:\n  - 43');
	});

	test('does not warn for non-numeric collection members', async () => {
		const result = await engine.render('{{ item | round:1 }}', {
			variables: { item: { name: 'Neo', note: '42abc' } },
		});
		expect(result.output).toBe('{"name":"Neo","note":"42abc"}');
		expect(result.warnings).toEqual([]);
	});
});

describe('round param validation', () => {
	test('no param is valid (optional)', () => {
		expect(validateRoundParams(undefined).valid).toBe(true);
	});

	test('valid params return valid', () => {
		expect(validateRoundParams('0').valid).toBe(true);
		expect(validateRoundParams('2').valid).toBe(true);
		expect(validateRoundParams('10').valid).toBe(true);
	});

	test('non-numeric param returns error', () => {
		const result = validateRoundParams('abc');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('must be a number');
	});

	test('negative param returns error', () => {
		const result = validateRoundParams('-2');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('non-negative');
	});
});
