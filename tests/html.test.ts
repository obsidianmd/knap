import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { standardFilters } from '../src/filters';
import { htmlFilters } from '../src/html';

describe('HTML filter preset', () => {
	test('is opt-in and participates in engine validation', () => {
		const standardEngine = createEngine({ filters: standardFilters });
		const htmlEngine = createEngine({ filters: { ...standardFilters, ...htmlFilters } });

		expect(standardEngine.validate('{{content|remove_html:"script"}}')[0]?.code).toBe('UNKNOWN_FILTER');
		expect(htmlEngine.validate('{{content|remove_html:"script"}}')).toHaveLength(0);
	});
});
