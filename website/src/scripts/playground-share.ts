import { playgroundHref, type PlaygroundExample } from '../lib/playground-link';

export function setupPlaygroundShare(getExample: () => PlaygroundExample) {
  const button = document.querySelector<HTMLButtonElement>('#share-playground')!;
  const label = button.querySelector<HTMLElement>('.menu-label')!;
  const icon = button.querySelector('svg')!;
  const linkIcon = icon.innerHTML;
  const reset = () => {
    label.textContent = 'Copy share link';
    icon.innerHTML = linkIcon;
    delete button.dataset.copied;
  };
  let timer: number | undefined;
  let revision = 0;

  button.addEventListener('click', async () => {
    const current = ++revision;
    window.clearTimeout(timer);
    reset();
    const url = new URL(playgroundHref(getExample()), window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      if (current !== revision) return;
      label.textContent = 'Link copied';
      icon.innerHTML = '<path d="m20 6-11 11-5-5" />';
      button.dataset.copied = '';
    } catch {
      if (current !== revision) return;
      label.textContent = 'Copy failed. Try again';
    }
    timer = window.setTimeout(reset, 2000);
  });
}
