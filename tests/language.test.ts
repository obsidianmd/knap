import { describe, expect, test } from 'vitest';
import { parse, validateFilters } from '../src/parser';
import { render } from '../src/renderer';

describe('template language contract', () => {
	test('combines assignment, logic, loops, and filters', async () => {
		const result = await render(
			'{% set count = items|length %}{% if count > 1 and enabled %}{% for item in items %}{{item|upper}}{% endfor %}{% else %}empty{% endif %}',
			{ variables: { items: ['logic', 'filters'], enabled: true }, currentUrl: '' },
		);

		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('LOGIC\nFILTERS');
	});

	test('supports host filters without coupling them to the core', async () => {
		const result = await render('{{title|surround:"**"}}', {
			variables: { title: 'Knap' },
			currentUrl: '',
			filters: {
				surround: (value, marker) => `${marker}${value}${marker}`,
			},
		});

		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('**Knap**');
	});

	test('validates host filter names alongside built-ins', () => {
		const parsed = parse('{{title|surround:"**"}}');
		const errors = validateFilters(parsed.ast, { surround: {} });

		expect(parsed.errors).toHaveLength(0);
		expect(errors).toHaveLength(0);
	});
});
