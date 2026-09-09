import { describe, expect, test, vi } from 'vitest';
import { createEngine, standardFilters, applyFiltersWithRegistry } from '../src';
import { ownPropertyAtPath } from '../src/filters/property_utils';
import { template } from '../src/filters/template';

const engine = createEngine({ filters: standardFilters });

describe('data property access', () => {
	test.each(['{{ user.secret }}', '{{ user["secret"] }}', '{{ user.__proto__.secret }}'])('ignores inherited values in %s', async source => {
		const user = Object.create({ secret: 'hidden' });
		expect(await engine.renderOrThrow(source, { variables: { user } })).toBe('');
	});

	test('ignores inherited top-level and wrapped names', async () => {
		const variables = Object.create({ secret: 'hidden', '{{title}}': 'hidden' });
		expect(await engine.renderOrThrow('{{ secret }}{{ title }}{{ constructor.constructor }}', { variables })).toBe('');
	});

	test('does not invoke getters during traversal', async () => {
		const get = vi.fn(() => 'hidden');
		const user = Object.defineProperty({}, 'secret', { get });
		expect(await engine.renderOrThrow('{{ user.secret }}{{ user["secret"] }}', { variables: { user } })).toBe('');
		expect(ownPropertyAtPath(user, 'secret').exists).toBe(false);
		expect(get).not.toHaveBeenCalled();
	});

	test('retains own names, string indexes, arrays, and wrapped properties', async () => {
		const variables = JSON.parse('{"constructor":"own","__proto__":{"name":"data"},"user":{"{{name}}":"Ada"},"items":["first"],"text":"abc"}');
		expect(await engine.renderOrThrow('{{ constructor }} {{ __proto__.name }} {{ user.name }} {{ items[0] }} {{ text.length }} {{ text[1] }}', { variables }))
			.toBe('own data Ada first 3 b');
	});

	test('assigns names without calling prototype setters', async () => {
		const set = vi.fn();
		const variables = Object.create(Object.defineProperty({}, 'name', { set }));
		variables.payload = { admin: true };
		const prototype = Object.getPrototypeOf(variables);
		expect(await engine.renderOrThrow('{% set __proto__ = payload %}{% set name = "Ada" %}{{ name }}{{ admin }}', { variables })).toBe('Ada');
		expect(Object.getPrototypeOf(variables)).toBe(prototype);
		expect(Object.hasOwn(variables, '__proto__')).toBe(true);
		expect(set).not.toHaveBeenCalled();
	});

	test('template placeholders ignore inherited properties', () => {
		expect(template([Object.create({ secret: 'hidden' })], '${secret}')).toBe('');
	});

	test('registry lookup only calls registered filters', async () => {
		const inherited = vi.fn(() => 'hidden');
		const registry = Object.create({ inherited });
		expect(applyFiltersWithRegistry('value', 'inherited', registry, { variables: {} })).toBe('value');
		const result = await engine.render('{{ value | toString }}', { variables: { value: 'value' } });
		expect(result.output).toBe('value');
		expect(result.errors[0].code).toBe('UNKNOWN_FILTER');
		expect(inherited).not.toHaveBeenCalled();
	});
});
