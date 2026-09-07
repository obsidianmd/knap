import { afterEach, describe, expect, test, vi } from 'vitest';
import { remove_html } from '../../src/filters/remove_html';

afterEach(() => vi.unstubAllGlobals());

describe('remove_html filter', () => {
	test.each(['script, style', '"script, style"', '"script", "style"', '("script", "style")'])
		('accepts equivalent argument spelling %s', params => {
			const selectors: string[] = [];
			vi.stubGlobal('DOMParser', class {
				parseFromString() {
					return {
						querySelectorAll(selector: string) {
							selectors.push(selector);
							return [];
						},
						body: { childNodes: [] },
					};
				}
			});
			vi.stubGlobal('XMLSerializer', class {});

			expect(remove_html('<script></script><style></style>', params)).toBe('');
			expect(selectors).toEqual(['script', 'style']);
		});
});
