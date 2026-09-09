import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';
import { highlightCode, highlightInlineKnap } from './src/lib/highlight.ts';
import { refreshDevCss } from './lib/dev-css.mjs';

const copyIcon = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';
const copyButton = `<button type="button" class="doc-code-copy" data-copy-code title="Copy code" aria-label="Copy code">${copyIcon}</button>`;
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
const codeBlockLabel = (node) => {
  const match = typeof node.meta === 'string' ? node.meta.match(/(?:^|\s)title=(?:"([^"]+)"|'([^']+)'|([^\s]+))/) : undefined;
  return match?.[1] ?? match?.[2] ?? match?.[3];
};
const renderCodeBlock = (node, label = codeBlockLabel(node)) => {
  const languageAliases = { typescript: 'ts', markdown: 'md', bash: 'shell', sh: 'shell' };
  const language = languageAliases[node.lang] ?? node.lang ?? 'knap';
  const supportedLanguage = ['knap', 'ts', 'shell', 'md', 'json'].includes(language) ? language : 'knap';
  const caption = label
    ? `<figcaption><span>${escapeHtml(label)}</span><span class="doc-code-actions">${copyButton}</span></figcaption>`
    : copyButton;
  return `<figure class="doc-code${label ? '' : ' doc-code-unlabeled'}" data-code-block>${caption}<pre><code class="language-${supportedLanguage}" data-language="${supportedLanguage}">${highlightCode(node.value, supportedLanguage)}</code></pre></figure>`;
};
const renderExampleRow = (label, node) => `<tr><th scope="row">${label}</th><td>${renderCodeBlock(node, null)}</td></tr>`;

function staticCodeBlocks() {
  return (tree) => {
    const visit = (node, parent, index) => {
      if (node?.type === 'link' && /^https?:\/\//.test(node.url)) {
        node.data = {
          ...node.data,
          hProperties: {
            ...node.data?.hProperties,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        };
      }
      if (node?.type === 'inlineCode' && parent && typeof index === 'number') {
        const highlighted = highlightInlineKnap(node.value);
        if (highlighted) {
          parent.children[index] = {
            type: 'html',
            value: `<code class="inline-syntax language-knap">${highlighted}</code>`,
          };
        }
        return;
      }
      if (node?.type === 'code' && parent && typeof index === 'number') {
        parent.children[index] = {
          type: 'html',
          value: renderCodeBlock(node),
        };
        return;
      }
      if (Array.isArray(node?.children)) {
        for (let childIndex = 0; childIndex < node.children.length - 1; childIndex += 1) {
          const template = node.children[childIndex];
          const output = node.children[childIndex + 1];
          if (template?.type === 'code' && output?.type === 'code' && codeBlockLabel(template) === 'Template' && codeBlockLabel(output) === 'Output') {
            node.children.splice(childIndex, 2, {
              type: 'html',
              value: `<div class="filter-example-table"><table><tbody>${renderExampleRow('Template', template)}${renderExampleRow('Output', output)}</tbody></table></div>`,
            });
          }
        }
        node.children.forEach((child, childIndex) => visit(child, node, childIndex));
      }
    };
    visit(tree, undefined, undefined);
  };
}

function scrollableTables() {
  return (tree) => {
    const visit = (node) => {
      if (!Array.isArray(node?.children)) return;
      node.children = node.children.map((child) => {
        if (child?.type === 'element' && child.tagName === 'table') {
          return {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-wrap'] },
            children: [child],
          };
        }
        visit(child);
        return child;
      });
    };
    visit(tree);
  };
}

export default defineConfig({
  site: 'https://knap.md',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: { plugins: [refreshDevCss()] },
  markdown: {
    syntaxHighlight: false,
    processor: unified({
      remarkPlugins: [remarkGfm, staticCodeBlocks],
      rehypePlugins: [scrollableTables],
    }),
  },
});
