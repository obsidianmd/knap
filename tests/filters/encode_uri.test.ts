import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';
import { encode_uri } from '../../src/filters/encode_uri';

describe('encode_uri filter', () => {
	test('encodes text as a URI component', () => {
		expect(encode_uri('hello world/你好')).toBe('hello%20world%2F%E4%BD%A0%E5%A5%BD');
		expect(encode_uri('&=?')).toBe('%26%3D%3F');
	});

	test('preserves text that cannot be encoded', () => {
		expect(encode_uri('\uD800')).toBe('\uD800');
	});

	test('encodes string values recursively in typed collections', async () => {
		const engine = createEngine({ filters: standardFilters });
		await expect(engine.renderOrThrow('{{ value | encode_uri }}', {
			variables: { value: ['hello world', { path: 'a/b', count: 2 }] },
		})).resolves.toBe('["hello%20world",{"path":"a%2Fb","count":2}]');
	});

	test('uses the serialized string for non-plain objects', async () => {
		const engine = createEngine({ filters: standardFilters });
		await expect(engine.renderOrThrow('{{ value | encode_uri }}', {
			variables: { value: new Date('2024-01-02T03:04:05.000Z') },
		})).resolves.toBe('%222024-01-02T03%3A04%3A05.000Z%22');
	});
});
