import { describe, expect, test } from 'vitest';
import { template } from '../../src/filters/template';

describe('template filter', () => {
	test('preserves backslashes in the template string', () => {
		expect(template('[{"name":"Ada"}]', '"C:\\\\path ${name}"'))
			.toBe('C:\\\\path Ada');
	});
});
