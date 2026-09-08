import { editorHighlighting } from '../lib/editor-highlighting';
import { createPlaygroundEditor } from './playground-editor';
import type { PlaygroundResult } from '../lib/playground';
import { createPlaygroundInputValidator, type PlaygroundInput } from '../lib/playground-input';
import { setupPlaygroundColumns } from './playground-columns';
import { setupPlaygroundFiles } from './playground-files';
import { createTemplateEditor } from './playground-template-editor';
import { setStatus } from './playground-status';
import { setupPlaygroundCopy } from './playground-copy';
import { readPlaygroundExample } from '../lib/playground-link';
import { setupPlaygroundTabs } from './playground-tabs';
import { setupPlaygroundSettings } from './playground-settings';

const wrapStorageKey = 'knap:playground:wrap';
let initialWrap = window.matchMedia('(max-width: 760px)').matches;
try {
  const savedWrap = localStorage.getItem(wrapStorageKey);
  if (savedWrap === 'true' || savedWrap === 'false') initialWrap = savedWrap === 'true';
} catch {
  // Use the screen-size default when storage is unavailable.
}
let resolveInitialRender: () => void;
const initialRender = new Promise<void>((resolve) => { resolveInitialRender = resolve; });

const linkedExample = readPlaygroundExample(window.location.hash);
if (linkedExample) {
  document.querySelector<HTMLTextAreaElement>('#playground-input')!.value = linkedExample.input;
  document.querySelector<HTMLTextAreaElement>('#playground-template')!.value = linkedExample.template;
}

const input = createPlaygroundEditor('input', editorHighlighting('json'), initialWrap);
const template = createTemplateEditor(() => validatedInput?.variables ?? {}, initialWrap);
const output = createPlaygroundEditor('output', editorHighlighting('md'), initialWrap);
let initialInput = input.value;
let initialTemplate = template.value;
const inputCopy = setupPlaygroundCopy('input', () => input.value);
const templateCopy = setupPlaygroundCopy('template', () => template.value);
const outputCopy = setupPlaygroundCopy('output', () => output.value);
const validateInput = createPlaygroundInputValidator();
let validatedInput: PlaygroundInput | undefined;
let worker: Worker | undefined;
let deadline: number | undefined;

function stopWorker() {
  worker?.terminate();
  worker = undefined;
  window.clearTimeout(deadline);
}

function showFailure(message: string) {
  stopWorker();
  output.element.removeAttribute('aria-busy');
  output.setValue(template.value, { reset: false, notify: false });
  outputCopy.refresh();
  setStatus(template.status, 'Validation could not finish.', 'error');
  setStatus(output.status, message, 'error');
  resolveInitialRender();
}

function showResult(result: PlaygroundResult) {
  template.element.setAttribute('aria-invalid', String(result.errors.length > 0));

  template.status.replaceChildren();
  template.status.dataset.state = result.errors.length ? 'error' : result.warnings.length ? 'warning' : 'success';
  const diagnostics = [...result.errors, ...result.warnings];
  if (diagnostics.length) {
    for (const diagnostic of diagnostics) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'playground-diagnostic';
      setStatus(button, `${'filter' in diagnostic ? 'Warning · ' : ''}Line ${diagnostic.line}, column ${diagnostic.column}: ${diagnostic.message}`, 'filter' in diagnostic ? 'warning' : 'error');
      button.addEventListener('click', () => {
        template.selectDiagnostic(diagnostic.line, diagnostic.column);
      });
      template.status.append(button);
    }
  } else {
    setStatus(template.status, 'Valid template', 'success');
  }

  output.element.removeAttribute('aria-busy');
  output.setValue(result.output, { reset: false, notify: false });
  outputCopy.refresh();
  setStatus(output.status, result.output ? `${result.output.length.toLocaleString()} characters` : 'The template rendered an empty result.');
  resolveInitialRender();
}

function render() {
  try {
    const currentInput = validateInput(input.value);
    if (currentInput !== validatedInput) {
      validatedInput = currentInput;
      input.element.setAttribute('aria-invalid', String(Boolean(currentInput.error)));
      setStatus(input.status, currentInput.error ?? 'Valid JSON', currentInput.error ? 'error' : 'success');
    }
    const current = new Worker(new URL('../lib/playground.worker.ts', import.meta.url), { type: 'module' });
    worker = current;
    current.addEventListener('message', (event: MessageEvent<{ result?: PlaygroundResult; error?: string }>) => {
      if (worker !== current) return;
      stopWorker();
      if (event.data.result) showResult(event.data.result);
      else showFailure(event.data.error ?? 'Unable to render this template.');
    });
    current.addEventListener('error', () => {
      if (worker === current) showFailure('Unable to render. Edit the template or reset the example to try again.');
    });
    deadline = window.setTimeout(() => showFailure('Rendering took too long. Try a smaller input or a simpler template.'), 3000);
    current.postMessage({ input: currentInput, template: template.value });
  } catch {
    showFailure('Unable to start the playground. Try reloading this page.');
  }
}

function updateOutput() {
  inputCopy.refresh();
  templateCopy.refresh();
  stopWorker();
  output.element.setAttribute('aria-busy', 'true');
  render();
}

input.onChange(updateOutput);
template.onChange(updateOutput);
const wrapButton = document.querySelector<HTMLButtonElement>('#wrap-lines')!;
wrapButton.setAttribute('aria-checked', String(initialWrap));
function setWrap(enabled: boolean) {
  wrapButton.setAttribute('aria-checked', String(enabled));
  input.setWrap(enabled);
  template.setWrap(enabled);
  output.setWrap(enabled);
}
wrapButton.addEventListener('click', () => {
  const enabled = wrapButton.getAttribute('aria-checked') !== 'true';
  setWrap(enabled);
  try {
    localStorage.setItem(wrapStorageKey, String(enabled));
  } catch {
    // Wrapping still works when the preference cannot be saved.
  }
});
window.addEventListener('hashchange', () => {
  const example = readPlaygroundExample(window.location.hash);
  if (!example) return;
  initialInput = example.input;
  initialTemplate = example.template;
  input.setValue(example.input, { notify: false });
  template.setValue(example.template, { notify: false });
  updateOutput();
});
document.getElementById('reset-example')!.addEventListener('click', () => {
  input.setValue(initialInput, { notify: false });
  template.setValue(initialTemplate, { notify: false });
  output.setValue(output.value, { notify: false });
  updateOutput();
});
setupPlaygroundColumns();
document.getElementById('clear-playground')!.addEventListener('click', () => {
  stopWorker();
  validatedInput = undefined;
  for (const editor of [input, template, output]) {
    editor.setValue('', { notify: false });
    editor.element.removeAttribute('aria-invalid');
    editor.element.removeAttribute('aria-busy');
    setStatus(editor.status, '');
  }
  setStatus(output.status, '0 characters');
  inputCopy.refresh();
  templateCopy.refresh();
  outputCopy.refresh();
  resolveInitialRender();
});
setupPlaygroundTabs();
setupPlaygroundSettings();
setupPlaygroundFiles({
  input: (text) => input.setValue(text),
  template: (text) => template.setValue(text),
});
updateOutput();
void Promise.all([initialRender, document.fonts.ready]).then(async () => {
  await Promise.all([input.measure(), template.measure(), output.measure()]);
  requestAnimationFrame(() => {
    document.querySelector('.playground')!.dispatchEvent(new Event('playground-ready'));
  });
});
