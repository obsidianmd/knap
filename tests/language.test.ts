import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { standardFilterMetadata, standardFilters } from '../src/filters';
import { parse, validateFilters } from '../src/parser';

describe('template language contract', () => {
	test('combines assignment, logic, loops, and filters', async () => {
		const engine = createEngine({ filters: standardFilters });
		const result = await engine.render(
			'{% set count = items|length %}{% if count > 1 and enabled %}{% for item in items %}{{item|upper}}{% endfor %}{% else %}empty{% endif %}',
			{ variables: { items: ['logic', 'filters'], enabled: true } },
		);

		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('LOGIC\nFILTERS');
	});

	test('supports host filters without coupling them to the core', async () => {
		const engine = createEngine({
			filters: {
				...standardFilters,
				surround: (value, marker = '') => {
					const normalizedMarker = marker.replace(/^(['"])(.*)\1$/s, '$2');
					return `${normalizedMarker}${value}${normalizedMarker}`;
				},
			},
		});
		const result = await engine.render('{{title|surround:"**"}}', {
			variables: { title: 'Knap' },
		});

		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('**Knap**');
	});

	test('validates host filter names alongside built-ins', () => {
		const parsed = parse('{{title|surround:"**"}}');
		const errors = validateFilters(parsed.ast, {
			...standardFilterMetadata,
			surround: {},
		});

		expect(parsed.errors).toHaveLength(0);
		expect(errors).toHaveLength(0);
	});
});
