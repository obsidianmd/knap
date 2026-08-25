import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';

function codeTitles() {
  return (tree) => {
    const visit = (node) => {
      if (node?.type === 'code' && typeof node.meta === 'string') {
        const match = node.meta.match(/(?:^|\s)title=(?:"([^"]+)"|'([^']+)'|([^\s]+))/);
        const label = match?.[1] ?? match?.[2] ?? match?.[3];
        if (label) {
          node.data ??= {};
          node.data.hProperties ??= {};
          node.data.hProperties['data-label'] = label;
        }
      }
      if (Array.isArray(node?.children)) node.children.forEach(visit);
    };
    visit(tree);
  };
}

export default defineConfig({
  site: 'https://knap.md',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: {
    syntaxHighlight: false,
    processor: unified({ remarkPlugins: [remarkGfm, codeTitles] }),
  },
});
