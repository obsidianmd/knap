import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { renderBatch } from '../src/cli/batch';
import { createEngine } from '../src';

test.skipIf(process.platform === 'win32')('rejects an output replaced by a symlink during rendering', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'knap-batch-files-'));
	try {
		const output = join(directory, '1.md');
		const target = join(directory, 'target.md');
		await writeFile(output, 'Original');
		await writeFile(target, 'Keep');
		const engine = createEngine();
		await expect(renderBatch({
			dataJson: '[{}]', outputDir: directory, overwrite: true,
			template: 'Changed', templateLabel: '<template>', overrides: {}, readStdin: async () => '',
			engine: {
				...engine,
				async render(source, input, options) {
					await rm(output);
					await symlink(target, output);
					return engine.render(source, input, options);
				},
			},
		})).rejects.toThrow('Batch stopped after writing 0');
		expect(await readFile(target, 'utf8')).toBe('Keep');
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
