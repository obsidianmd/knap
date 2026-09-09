import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { dev } from 'astro';
import { refreshDevCss } from '../lib/dev-css.mjs';

test('initial HTML uses current CSS after repeated Sass partial edits', { timeout: 30_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'knap-dev-css-'));
  let server;
  try {
    await mkdir(join(root, 'src/pages'), { recursive: true });
    await mkdir(join(root, 'src/styles'), { recursive: true });
    await writeFile(join(root, 'package.json'), '{"type":"module"}');
    await symlink(fileURLToPath(new URL('../node_modules', import.meta.url)), join(root, 'node_modules'), 'dir');
    const partial = join(root, 'src/styles/_colors.scss');
    await writeFile(partial, ':root { --cache-probe: initial; }');
    await writeFile(join(root, 'src/styles/global.scss'), '@use "./colors";');
    for (const route of ['one', 'two']) {
      await writeFile(join(root, `src/pages/${route}.astro`), '---\nimport "../styles/global.scss";\n---\n<html><head><title>CSS test</title></head><body>Test</body></html>');
    }
    server = await dev({
      root: pathToFileURL(root + '/'),
      configFile: false,
      cacheDir: join(root, '.astro-cache'),
      logLevel: 'silent',
      devToolbar: { enabled: false },
      server: { host: '127.0.0.1', port: 0 },
      vite: { cacheDir: join(root, '.vite'), plugins: [refreshDevCss()] },
    });
    const origin = `http://127.0.0.1:${server.address.port}`;
    const cssFor = async (route) => {
      const response = await fetch(origin + route);
      assert.equal(response.status, 200);
      const html = await response.text();
      return html.match(/<style data-vite-dev-id="[^"]*global\.scss">([\s\S]*?)<\/style>/)?.[1] ?? '';
    };
    // Warm both page caches and the client stylesheet module before editing.
    for (const route of ['/one', '/two']) assert.match(await cssFor(route), /--cache-probe: initial/);
    await fetch(origin + '/src/styles/global.scss');

    for (const value of ['edited', 'edited-again', 'initial']) {
      await writeFile(partial, `:root { --cache-probe: ${value}; }`);
      const deadline = Date.now() + 5_000;
      let styles;
      do {
        await new Promise(resolve => setTimeout(resolve, 100));
        // Simulate Vite's browser request for the updated CSS module.
        await fetch(origin + '/src/styles/global.scss');
        styles = await Promise.all(['/one', '/two'].map(cssFor));
      } while (styles.some(css => !css.includes(`--cache-probe: ${value};`)) && Date.now() < deadline);
      for (const css of styles) assert.ok(css.includes(`--cache-probe: ${value};`), `Initial HTML did not contain ${value}: ${css}`);
    }
  } finally {
    await server?.stop();
    await rm(root, { recursive: true, force: true });
  }
});
