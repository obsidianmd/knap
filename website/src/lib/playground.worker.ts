import { evaluatePlayground } from './playground';
import type { PlaygroundInput } from './playground-input';

self.addEventListener('message', async (event: MessageEvent<{ input: PlaygroundInput; template: string }>) => {
  try {
    self.postMessage({ result: await evaluatePlayground(event.data.input, event.data.template) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Unable to render this template.' });
  }
});
