export function setupPlaygroundCopy(name: string, getValue: () => string) {
  const button = document.querySelector<HTMLButtonElement>(`#copy-${name}`)!;
  const copyIcon = button.innerHTML;
  const label = `Copy ${name === 'input' ? 'data' : name}`;
  let timer: number | undefined;
  let revision = 0;
  let previous: string | undefined;
  const reset = () => {
    window.clearTimeout(timer);
    delete button.dataset.copied;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.innerHTML = copyIcon;
  };
  const refresh = () => {
    const value = getValue();
    button.disabled = !value;
    if (previous !== value) {
      previous = value;
      revision++;
      reset();
    }
  };
  button.addEventListener('click', async () => {
    const value = getValue();
    const current = ++revision;
    reset();
    try {
      await navigator.clipboard.writeText(value);
      if (current !== revision || getValue() !== value) return;
      button.dataset.copied = '';
      button.title = 'Copied';
      button.setAttribute('aria-label', 'Copied');
      button.innerHTML = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    } catch {
      if (current !== revision) return;
      button.title = 'Copy failed';
      button.setAttribute('aria-label', 'Copy failed');
    }
    timer = window.setTimeout(reset, 2000);
  });
  refresh();
  return { refresh };
}
