import { playgroundLimits, playgroundSizeError, limitDiagnostics } from './playground-limits';
import { evaluatePlayground } from './playground';
import type { PlaygroundInput } from './playground-input';

self.addEventListener('message', async (event: MessageEvent<{ input: PlaygroundInput; template: string }>) => {
  try {
    const result = await evaluatePlayground(event.data.input, event.data.template);
    if (result.output.length > playgroundLimits.output) throw new Error(playgroundSizeError('output'));
    self.postMessage({ result: { ...result, errors: limitDiagnostics(result.errors), warnings: limitDiagnostics(result.warnings) } });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Unable to render this template.' });
  }
});
