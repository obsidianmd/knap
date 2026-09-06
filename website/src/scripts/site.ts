const copyIcon = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';
const checkIcon = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';

const copyTimers = new WeakMap<HTMLButtonElement, number>();

function codeText(button: HTMLButtonElement) {
  const block = button.closest('[data-code-block], .code-window');
  if (!block) return '';
  const sourceLines = block.querySelectorAll<HTMLElement>('.doc-code-source, .code-source');
  if (sourceLines.length) return [...sourceLines].map((line) => line.textContent ?? '').join('\n');
  return block.querySelector('code')?.textContent ?? '';
}

document.addEventListener('click', async (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-copy-code]');
  if (!button) return;
  try {
    await navigator.clipboard.writeText(codeText(button));
    button.dataset.copied = '';
    button.title = 'Copied';
    button.setAttribute('aria-label', 'Copied');
    button.innerHTML = checkIcon;
    const previous = copyTimers.get(button);
    if (previous) window.clearTimeout(previous);
    copyTimers.set(button, window.setTimeout(() => {
      delete button.dataset.copied;
      button.title = 'Copy code';
      button.setAttribute('aria-label', 'Copy code');
      button.innerHTML = copyIcon;
    }, 2000));
  } catch {
    delete button.dataset.copied;
  }
});

document.addEventListener('click', async (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-copy-markdown]');
  const markdownPath = button?.dataset.copyMarkdown;
  if (!button || !markdownPath) return;

  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try {
    const markdown = fetch(markdownPath, { headers: { Accept: 'text/markdown' } }).then(async (response) => {
      if (!response.ok) throw new Error(`Unable to fetch ${markdownPath}`);
      return response.text();
    });
    if ('ClipboardItem' in window && navigator.clipboard.write) {
      const item = new ClipboardItem({ 'text/plain': markdown.then((value) => new Blob([value], { type: 'text/plain' })) });
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(await markdown);
    }
    button.dataset.copied = '';
    button.innerHTML = `${checkIcon}<span>Copied</span>`;
    const previous = copyTimers.get(button);
    if (previous) window.clearTimeout(previous);
    copyTimers.set(button, window.setTimeout(() => {
      delete button.dataset.copied;
      button.innerHTML = `${copyIcon}<span>Copy Markdown</span>`;
    }, 2000));
  } catch {
    button.dataset.copyError = '';
    button.innerHTML = `${copyIcon}<span>Copy failed</span>`;
    const previous = copyTimers.get(button);
    if (previous) window.clearTimeout(previous);
    copyTimers.set(button, window.setTimeout(() => {
      delete button.dataset.copyError;
      button.innerHTML = `${copyIcon}<span>Copy Markdown</span>`;
    }, 2000));
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
});

type SearchItem = {
  title: string;
  kind: 'page' | 'filter' | 'section' | 'syntax';
  category: string;
  summary: string;
  href: string;
  aliases?: string[];
  syntax?: string[];
  tone?: 'variable';
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] ?? character));

function setupSearch() {
  const trigger = document.querySelector<HTMLButtonElement>('[data-search-trigger]');
  const backdrop = document.querySelector<HTMLElement>('[data-search-backdrop]');
  const input = document.querySelector<HTMLInputElement>('[data-search-input]');
  const resultsElement = document.querySelector<HTMLElement>('[data-search-results]');
  const data = document.querySelector<HTMLScriptElement>('#search-index')?.textContent;
  if (!trigger || !backdrop || !input || !resultsElement || !data) return;

  const items = JSON.parse(data) as SearchItem[];
  let results = items.filter((item) => item.kind !== 'syntax' && item.kind !== 'section').slice(0, 12);
  let activeIndex = 0;

  const render = () => {
    if (!results.length) {
      resultsElement.innerHTML = `<p class="command-empty">No documentation matches “${escapeHtml(input.value)}”.</p>`;
      return;
    }
    resultsElement.innerHTML = results.map((item, index) => {
      const title = escapeHtml(item.title);
      const syntaxClass = item.kind === 'syntax'
        ? ` class="command-result-syntax${item.tone === 'variable' ? ' is-variable' : ''}"`
        : '';
      const titleElement = item.kind === 'filter' || item.kind === 'syntax'
        ? `<code${syntaxClass}>${title}</code>`
        : `<span class="command-result-title">${title}</span>`;

      return `
        <a class="${index === activeIndex ? 'is-active' : ''}" href="${escapeHtml(item.href)}" role="option" aria-selected="${index === activeIndex}" data-result-index="${index}">
          ${titleElement}
          <p>${escapeHtml(item.summary)}</p>
          <span class="command-result-open" aria-hidden="true">↵</span>
        </a>
      `;
    }).join('');
  };

  const update = () => {
    const query = input.value.trim().toLowerCase();
    results = items
      .filter((item) => query
        ? [item.title, item.category, item.summary, ...(item.aliases ?? []), ...(item.syntax ?? [])].join(' ').toLowerCase().includes(query)
        : item.kind !== 'syntax' && item.kind !== 'section')
      .slice(0, 12);
    activeIndex = 0;
    render();
  };

  const open = () => {
    input.value = '';
    update();
    backdrop.hidden = false;
    input.focus({ preventScroll: true });
  };
  const close = () => { backdrop.hidden = true; };

  trigger.addEventListener('click', open);
  backdrop.addEventListener('mousedown', (event) => { if (event.target === backdrop) close(); });
  input.addEventListener('input', update);
  resultsElement.addEventListener('mousemove', (event) => {
    const result = (event.target as Element).closest<HTMLElement>('[data-result-index]');
    if (!result) return;
    activeIndex = Number(result.dataset.resultIndex);
    render();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); activeIndex = Math.min(activeIndex + 1, results.length - 1); render(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); render(); }
    if (event.key === 'Enter' && results[activeIndex]) { event.preventDefault(); window.location.assign(results[activeIndex].href); }
  });
  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); open(); }
    if (event.key === 'Escape') close();
  });
}

function setupFilterDirectoryView() {
  const controls = [...document.querySelectorAll<HTMLButtonElement>('[data-filter-view-control]')];
  const panels = [...document.querySelectorAll<HTMLElement>('[data-filter-view-panel]')];
  if (!controls.length || !panels.length) return;

  type FilterView = 'grouped' | 'alphabetical';
  const viewFromUrl = (): FilterView => new URLSearchParams(window.location.search).get('view') === 'alphabetical' ? 'alphabetical' : 'grouped';
  const show = (view: FilterView, updateUrl = false) => {
    controls.forEach((control) => control.setAttribute('aria-pressed', String(control.dataset.filterViewControl === view)));
    panels.forEach((panel) => { panel.hidden = panel.dataset.filterViewPanel !== view; });

    if (updateUrl) {
      const url = new URL(window.location.href);
      if (view === 'alphabetical') url.searchParams.set('view', 'alphabetical');
      else url.searchParams.delete('view');
      window.history.pushState({}, '', url);
    }
  };

  controls.forEach((control) => control.addEventListener('click', () => show(control.dataset.filterViewControl as FilterView, true)));
  window.addEventListener('popstate', () => show(viewFromUrl()));
  show(viewFromUrl());
}

import { setupOutline } from './outline';

setupOutline();
setupSearch();
setupFilterDirectoryView();
