import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// Optional consumer integration tests. Keep sibling repositories out of the
// regular test suite and resolve Knap to source, not Clipper's installed release.
const clipper = resolve(process.env.CLIPPER_ROOT ?? '../obsidian-clipper');
export default defineConfig({
	resolve: { alias: [
		{ find: /^knap\/html$/, replacement: resolve('src/html.ts') },
		{ find: /^knap$/, replacement: resolve('src/index.ts') },
		{ find: /^clipper\//, replacement: `${clipper}/src/` },
		{ find: 'clipper-dom', replacement: `${clipper}/node_modules/linkedom/esm/index.js` },
		{ find: 'webextension-polyfill', replacement: `${clipper}/src/utils/__mocks__/webextension-polyfill.ts` },
	] },
	define: { DEBUG_MODE: false },
	test: { include: ['compat/clipper-help.integration.ts'], globals: true },
});
