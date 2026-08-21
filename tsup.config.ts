import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/html.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
});
