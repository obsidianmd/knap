export function setupPlaygroundFiles(editors: Record<string, (text: string) => void>) {
  const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files');

  document.querySelectorAll<HTMLElement>('.playground-panel').forEach((panel) => {
    const picker = panel.querySelector<HTMLInputElement>('[data-file-input]');
    if (!picker) return;
    const button = panel.querySelector<HTMLButtonElement>('[data-open-file]')!;
    const setValue = editors[panel.id.replace('-panel', '')];
    const status = panel.querySelector<HTMLElement>('.playground-file-status')!;
    const hint = panel.querySelector<HTMLElement>('.playground-drop-hint')!;
    const extensions = picker.accept.split(',');
    const fileTypes = extensions.join(' or ');
    let revision = 0;
    let dragDepth = 0;

    const clear = () => {
      revision++;
      status.hidden = true;
      status.textContent = '';
    };
    const showMessage = (message: string, state = '') => {
      status.textContent = message;
      status.dataset.state = state;
      status.hidden = false;
    };
    const clearDrop = () => {
      dragDepth = 0;
      hint.hidden = true;
    };

    async function openFiles(files: FileList | null) {
      if (!files?.length) return;
      clear();
      if (files.length !== 1) {
        showMessage(`Open one ${fileTypes} file at a time.`, 'error');
        return;
      }
      const file = files[0];
      if (!extensions.some((extension) => file.name.toLowerCase().endsWith(extension))) {
        showMessage(`Choose a ${fileTypes} file for this column.`, 'error');
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

    button.addEventListener('click', () => picker.click());
    picker.addEventListener('change', () => {
      void openFiles(picker.files);
      // Allow selecting the same file again after changing it on disk.
      picker.value = '';
    });
    panel.addEventListener('input', clear);
    panel.addEventListener('playground-change', clear);
    document.getElementById('reset-example')!.addEventListener('click', clear);

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

  // File drops outside an editor should not navigate away from the playground.
  for (const type of ['dragover', 'drop'] as const) {
    window.addEventListener(type, (event) => {
      if (!hasFiles(event)) return;
      if (!event.defaultPrevented && event.dataTransfer) event.dataTransfer.dropEffect = 'none';
      event.preventDefault();
    });
  }
}
