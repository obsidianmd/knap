import { describe, expect, test, vi } from 'vitest';
import { createEngine } from '../src/engine';
import { TemplateRenderError } from '../src/errors';
import { standardFilters } from '../src/filters';
import type { TemplateFilter } from '../src/types';

describe('createEngine', () => {
	test('renders logic with the configured standard filter registry', async () => {
		const engine = createEngine<{ source: string }>({ filters: standardFilters });
		const result = await engine.render(
			'{% set count = items|length %}{% if count > 1 %}{% for item in items %}{{item|upper}}{% endfor %}{% endif %}',
			{ variables: { items: ['logic', 'filters'] } },
		);

		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('LOGIC\nFILTERS');
	});

	test('uses the same registry for validation and rendering', async () => {
		const surround: TemplateFilter = (value, marker = '') => {
			const cleanMarker = marker.replace(/^(["'])([\s\S]*)\1$/, '$2');
			return `${cleanMarker}${value}${cleanMarker}`;
		};
		surround.metadata = {
			validateParams: param => ({ valid: Boolean(param), error: 'requires a marker' }),
		};
		const engine = createEngine({ filters: { surround } });

		expect(engine.validate('{{title|surround}}')[0]?.code).toBe('INVALID_FILTER_ARGUMENTS');
		expect(engine.validate('{{title|upper}}')[0]?.code).toBe('UNKNOWN_FILTER');

		const result = await engine.render('{{title|surround:"**"}}', {
			variables: { title: 'Knap' },
		});
		expect(result.output).toBe('**Knap**');
		expect(result.errors).toHaveLength(0);
	});

	test('resolves application variables through the generic hook', async () => {
		const engine = createEngine<{ source: string }>({ filters: standardFilters });
		const result = await engine.render('{{remote|upper}}', {
			variables: {},
			context: { source: 'test' },
			resolveVariable: async (name, context) =>
				name === 'remote' && context.context?.source === 'test' ? 'resolved' : undefined,
		});

		expect(result.output).toBe('RESOLVED');
		expect(result.errors).toHaveLength(0);
	});

	test('returns coded parse and runtime errors without logging', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const explode: TemplateFilter = () => { throw new Error('boom'); };
		const engine = createEngine({ filters: { explode } });

		const parseResult = await engine.render('{{title', { variables: {} });
		const filterResult = await engine.render('{{title|explode}}', { variables: { title: 'x' } });
		const resolverResult = await engine.render('{{remote}}', {
			variables: {},
			resolveVariable: () => { throw new Error('offline'); },
		});

		expect(parseResult.errors[0]).toMatchObject({ code: 'PARSE_ERROR', line: 1 });
		expect(filterResult.errors[0]).toMatchObject({ code: 'FILTER_ERROR', line: 1 });
		expect(resolverResult.errors[0]).toMatchObject({ code: 'RESOLVE_ERROR', line: 1 });
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	test('renderOrThrow throws the structured error collection', async () => {
		const engine = createEngine({ filters: standardFilters });

		await expect(engine.renderOrThrow('{{title|not_a_filter}}', {
			variables: { title: 'Knap' },
		})).rejects.toBeInstanceOf(TemplateRenderError);
	});
});
