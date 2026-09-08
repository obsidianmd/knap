import { setStatus } from './playground-status';

export function setupPlaygroundFiles(editors: Record<string, (text: string) => void>) {
  const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files');
  const openers: Record<string, (files: FileList, extensions?: string[]) => Promise<void>> = {};
  const picker = document.querySelector<HTMLInputElement>('[data-file-input]')!;
  document.querySelector<HTMLButtonElement>('[data-open-file]')!.addEventListener('click', () => picker.click());

  document.querySelectorAll<HTMLElement>('.playground-panel').forEach((panel) => {
    const name = panel.id.replace('-panel', '');
    const setValue = editors[name];
    if (!setValue) return;
    const status = panel.querySelector<HTMLElement>('.playground-file-status')!;
    const hint = panel.querySelector<HTMLElement>('.playground-drop-hint')!;
    const extensions = name === 'input' ? ['.json'] : ['.md', '.txt'];
    let revision = 0;
    let dragDepth = 0;

    const clear = () => {
      revision++;
      status.hidden = true;
      status.textContent = '';
    };
    const showMessage = (message: string, state = '') => {
      setStatus(status, message, state);
      status.hidden = false;
    };
    const clearDrop = () => {
      dragDepth = 0;
      hint.hidden = true;
    };

    async function openFiles(files: FileList | null, accepted = extensions) {
      if (!files?.length) return;
      const fileTypes = accepted.join(' or ');
      clear();
      if (files.length !== 1) {
        showMessage(`Open one ${fileTypes} file at a time.`, 'error');
        return;
      }
      const file = files[0];
      if (!accepted.some((extension) => file.name.toLowerCase().endsWith(extension))) {
        showMessage(`Choose a ${fileTypes} file.`, 'error');
        return;
      }
      const current = revision;
      showMessage(`Opening ${file.name}…`);
      try {
        const text = await file.text();
        // A newer import, edit, or reset takes precedence over this read.
        if (current !== revision) return;
        setValue(text.replace(/^\uFEFF/, ''));
        clear();
      } catch {
        if (current === revision) showMessage(`Could not read ${file.name}. Try opening it again.`, 'error');
      }
    }

    openers[name] = openFiles;
    panel.addEventListener('input', clear);
    panel.addEventListener('playground-change', clear);
    document.getElementById('reset-example')!.addEventListener('click', clear);
    document.getElementById('clear-playground')!.addEventListener('click', clear);

    panel.addEventListener('dragenter', (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth++;
      hint.hidden = false;
    });
    panel.addEventListener('dragover', (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';
    });
    panel.addEventListener('dragleave', () => {
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) hint.hidden = true;
    });
    panel.addEventListener('drop', (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.stopPropagation();
      clearDrop();
      void openFiles(event.dataTransfer!.files);
    }, true);
    window.addEventListener('drop', clearDrop);
    window.addEventListener('dragend', clearDrop);
    window.addEventListener('blur', clearDrop);
  });

  picker.addEventListener('change', () => {
    const files = picker.files;
    if (files?.length) {
      const name = files[0].name.toLowerCase().endsWith('.json') ? 'input' : 'template';
      // Reveal the destination on mobile, including any file-read errors.
      document.querySelector<HTMLButtonElement>(`[data-playground-tab="${name}"]`)!.click();
      void openers[name](files, picker.accept.split(','));
    }
    // Allow selecting the same file again after changing it on disk.
    picker.value = '';
  });

  // File drops outside an editor should not navigate away from the playground.
  for (const type of ['dragover', 'drop'] as const) {
    window.addEventListener(type, (event) => {
      if (!hasFiles(event)) return;
      if (!event.defaultPrevented && event.dataTransfer) event.dataTransfer.dropEffect = 'none';
      event.preventDefault();
    });
  }
}
