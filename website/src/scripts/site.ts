const copyIcon = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';
const checkIcon = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';

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
    button.innerHTML = `${checkIcon}<span>Copy Markdown</span>`;
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
  searchTerms?: string[];
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
  const clearButton = document.querySelector<HTMLButtonElement>('[data-search-clear]');
  const resultsElement = document.querySelector<HTMLElement>('[data-search-results]');
  const data = document.querySelector<HTMLScriptElement>('#search-index')?.textContent;
  if (!trigger || !backdrop || !input || !clearButton || !resultsElement || !data) return;

  const items = JSON.parse(data) as SearchItem[];
  const mobileSearch = window.matchMedia('(max-width: 760px)');
  let results = items.filter((item) => item.kind === 'filter').slice(0, 12);
  let activeIndex = 0;

  const syncClearButton = () => {
    clearButton.hidden = !mobileSearch.matches && input.value.length === 0;
    clearButton.setAttribute('aria-label', mobileSearch.matches ? 'Close search' : 'Clear search');
  };

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

  const setActiveIndex = (index: number) => {
    activeIndex = index;
    resultsElement.querySelectorAll<HTMLElement>('[data-result-index]').forEach((result) => {
      const active = Number(result.dataset.resultIndex) === activeIndex;
      result.classList.toggle('is-active', active);
      result.setAttribute('aria-selected', String(active));
    });
  };

  const update = () => {
    const query = input.value.trim().toLowerCase();
    results = items
      .filter((item) => query
        ? [item.title, item.category, item.summary, ...(item.aliases ?? []), ...(item.searchTerms ?? []), ...(item.syntax ?? [])].join(' ').toLowerCase().includes(query)
        : item.kind === 'filter')
      .slice(0, 12);
    activeIndex = 0;
    render();
  };

  const open = () => {
    input.readOnly = false;
    input.value = '';
    update();
    backdrop.hidden = false;
    syncClearButton();
    document.documentElement.classList.add('search-open');
    input.focus({ preventScroll: true });
  };
  const close = () => {
    if (backdrop.hidden) return;
    input.readOnly = true;
    input.blur();
    backdrop.hidden = true;
    syncClearButton();
    document.documentElement.classList.remove('search-open');
  };

  trigger.addEventListener('click', open);
  backdrop.addEventListener('mousedown', (event) => { if (event.target === backdrop) close(); });
  input.addEventListener('input', () => {
    syncClearButton();
    update();
  });
  clearButton.addEventListener('click', () => {
    if (mobileSearch.matches) {
      close();
      return;
    }
    input.value = '';
    syncClearButton();
    update();
    input.focus();
  });
  mobileSearch.addEventListener('change', syncClearButton);
  resultsElement.addEventListener('mousemove', (event) => {
    const result = (event.target as Element).closest<HTMLElement>('[data-result-index]');
    if (!result) return;
    setActiveIndex(Number(result.dataset.resultIndex));
  });
  resultsElement.addEventListener('click', (event) => {
    const result = (event.target as Element).closest<HTMLAnchorElement>('a[data-result-index]');
    if (!result) return;
    event.preventDefault();
    close();
    requestAnimationFrame(() => window.location.assign(result.href));
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(Math.min(activeIndex + 1, results.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(Math.max(activeIndex - 1, 0)); }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      const href = results[activeIndex].href;
      close();
      requestAnimationFrame(() => window.location.assign(href));
    }
  });
  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); open(); }
    if (event.key === 'Escape') close();
  });
}

import { setupOutline } from './outline';

setupOutline();
setupSearch();
