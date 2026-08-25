import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';
import { highlightCode } from './src/lib/highlight.ts';

const copyIcon = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';
const copyButton = `<button type="button" class="doc-code-copy" data-copy-code title="Copy code" aria-label="Copy code">${copyIcon}</button>`;
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);

function staticCodeBlocks() {
  return (tree) => {
    const visit = (node, parent, index) => {
      if (node?.type === 'code' && parent && typeof index === 'number') {
        const match = typeof node.meta === 'string' ? node.meta.match(/(?:^|\s)title=(?:"([^"]+)"|'([^']+)'|([^\s]+))/) : undefined;
        const label = match?.[1] ?? match?.[2] ?? match?.[3];
        const languageAliases = { typescript: 'ts', markdown: 'md', bash: 'shell', sh: 'shell' };
        const language = languageAliases[node.lang] ?? node.lang ?? 'knap';
        const supportedLanguage = ['knap', 'ts', 'shell', 'md', 'json'].includes(language) ? language : 'knap';
        const caption = label
          ? `<figcaption><span>${escapeHtml(label)}</span><span class="doc-code-actions">${copyButton}</span></figcaption>`
          : copyButton;
        parent.children[index] = {
          type: 'html',
          value: `<figure class="doc-code${label ? '' : ' doc-code-unlabeled'}" data-code-block>${caption}<pre><code class="language-${supportedLanguage}" data-language="${supportedLanguage}">${highlightCode(node.value, supportedLanguage)}</code></pre></figure>`,
        };
        return;
      }
      if (Array.isArray(node?.children)) node.children.forEach((child, childIndex) => visit(child, node, childIndex));
    };
    visit(tree, undefined, undefined);
  };
}

export default defineConfig({
  site: 'https://knap.md',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: {
    syntaxHighlight: false,
    processor: unified({ remarkPlugins: [remarkGfm, staticCodeBlocks] }),
  },
});
