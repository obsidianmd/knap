import { highlightLines, type CodeLanguage } from '../lib/highlight';
import type { PlaygroundResult } from '../lib/playground';
import { createPlaygroundInputValidator, type PlaygroundInput } from '../lib/playground-input';
import { setupPlaygroundColumns } from './playground-columns';
import { setupPlaygroundFiles } from './playground-files';
import { createTemplateEditor } from './playground-template-editor';
import { setStatus } from './playground-status';
import { setupPlaygroundCopy } from './playground-copy';

function editor(name: string, language: CodeLanguage) {
  const root = document.querySelector<HTMLElement>(`[data-editor="${name}"]`)!;
  const textarea = root.querySelector('textarea')!;
  const highlight = root.querySelector<HTMLElement>('.playground-highlight')!;
  const numbers = root.querySelector<HTMLElement>('.playground-line-numbers')!;
  const status = document.getElementById(`${name}-status`)!;
  const syncScroll = () => {
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
    numbers.scrollTop = textarea.scrollTop;
  };
  const paint = () => {
    const lines = textarea.value.split('\n');
    highlight.innerHTML = highlightLines(lines, language).join('\n') + '\n';
    numbers.textContent = lines.map((_, index) => index + 1).join('\n') + '\n';
    syncScroll();
  };
  textarea.addEventListener('input', paint);
  textarea.addEventListener('scroll', syncScroll);
  new ResizeObserver(syncScroll).observe(textarea);
  paint();
  root.classList.add('is-highlighted');
  return { textarea, status, paint };
}

const input = editor('input', 'json');
const template = createTemplateEditor(() => validatedInput?.variables ?? {});
const output = editor('output', 'md');
const initialInput = input.textarea.value;
const initialTemplate = template.value;
const inputCopy = setupPlaygroundCopy('input', () => input.textarea.value);
const templateCopy = setupPlaygroundCopy('template', () => template.value);
const outputCopy = setupPlaygroundCopy('output', () => output.textarea.value);
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
  output.textarea.removeAttribute('aria-busy');
  output.textarea.value = template.value;
  output.paint();
  outputCopy.refresh();
  setStatus(template.status, 'Validation could not finish.', 'error');
  setStatus(output.status, message, 'error');
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

  output.textarea.removeAttribute('aria-busy');
  if (output.textarea.value !== result.output) {
    const { scrollTop, scrollLeft } = output.textarea;
    output.textarea.value = result.output;
    output.textarea.scrollTop = scrollTop;
    output.textarea.scrollLeft = scrollLeft;
    output.paint();
  }
  outputCopy.refresh();
  setStatus(output.status, result.output ? `${result.output.length.toLocaleString()} characters` : 'The template rendered an empty result.');
}

function render() {
  try {
    const currentInput = validateInput(input.textarea.value);
    if (currentInput !== validatedInput) {
      validatedInput = currentInput;
      input.textarea.setAttribute('aria-invalid', String(Boolean(currentInput.error)));
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
  output.textarea.setAttribute('aria-busy', 'true');
  render();
}

input.textarea.addEventListener('input', updateOutput);
template.onChange(updateOutput);
document.getElementById('reset-example')!.addEventListener('click', () => {
  input.textarea.value = initialInput;
  for (const field of [input, output]) {
    field.textarea.scrollTop = 0;
    field.textarea.scrollLeft = 0;
    field.paint();
  }
  template.setValue(initialTemplate);
});
setupPlaygroundColumns();
setupPlaygroundFiles({
  input(text) {
    input.textarea.value = text;
    input.textarea.setSelectionRange(0, 0);
    input.textarea.scrollTop = input.textarea.scrollLeft = 0;
    input.textarea.dispatchEvent(new Event('input', { bubbles: true }));
  },
  template: (text) => template.setValue(text),
});
updateOutput();
