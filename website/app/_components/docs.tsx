/* eslint-disable @next/next/no-html-link-for-pages */
import type { ReactNode } from 'react';
import { FilterSearch } from './filter-search';

type DocRoute = 'variables' | 'logic' | 'filters' | 'api';

const guideLinks: Array<{ href: string; label: string; key: DocRoute }> = [
  { href: '/variables', label: 'Variables', key: 'variables' },
  { href: '/logic', label: 'Logic', key: 'logic' },
  { href: '/filters', label: 'Filters', key: 'filters' },
];

export function SiteHeader() {
  return (
    <nav className="site-header" aria-label="Main navigation">
      <a className="wordmark" href="/" aria-label="Knap home">Knap</a>
      <div className="site-header-links">
        <a href="/logic">Logic</a>
        <a href="/filters">Filters</a>
        <a href="/variables">Variables</a>
        <a href="/api">API</a>
        <FilterSearch />
        <a href="https://github.com/obsidianmd/knap">GitHub ↗</a>
      </div>
    </nav>
  );
}

export function DocShell({
  current,
  title,
  description,
  toc,
  children,
}: {
  current: DocRoute;
  title: string;
  description: string;
  toc: Array<{ href: string; label: string }>;
  children: ReactNode;
}) {
  return (
    <main className="docs-page">
      <SiteHeader />
      <div className="docs-layout">
        <aside className="docs-sidebar" aria-label="Documentation navigation">
          <div className="sidebar-group">
            <p>Guide</p>
            {guideLinks.map((link) => (
              <a key={link.key} href={link.href} aria-current={current === link.key ? 'page' : undefined}>{link.label}</a>
            ))}
          </div>
          <div className="sidebar-group">
            <p>Reference</p>
            <a href="/api" aria-current={current === 'api' ? 'page' : undefined}>API</a>
          </div>
          <div className="sidebar-group sidebar-external">
            <p>Project</p>
            <a href="https://github.com/obsidianmd/knap">GitHub ↗</a>
            <a href="https://www.npmjs.com/package/knap">npm ↗</a>
          </div>
        </aside>

        <article className="docs-content">
          <header className="docs-title">
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
          <footer className="docs-footer">
            <span>Knap is open source under the MIT license.</span>
            <a href="https://github.com/obsidianmd/knap">View source ↗</a>
          </footer>
        </article>

        <aside className="docs-toc" aria-label="On this page">
          <p>On this page</p>
          {toc.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </aside>
      </div>
    </main>
  );
}

function tokenClass(token: string, language: 'knap' | 'ts' | 'shell') {
  if (/^(\{\{|\}\}|\{%|%\})$/.test(token)) return 'syn-language';
  if (/^(===|!==|==|!=|=>|<=|>=|&&|\|\||\?\?|[{}()[\].,:;=+\-*/<>!?|])$/.test(token)) return 'syn-punctuation';
  if (/^['"`]/.test(token)) return 'syn-string';
  if (token === '|') return 'syn-punctuation';
  if (/^\d/.test(token)) return 'syn-number';
  if (language === 'ts' && /^(import|from)$/.test(token)) return 'syn-import';
  if (/^(true|false|null|undefined)$/.test(token)) return 'syn-constant';
  if (/^(if|elseif|else|endif|for|in|endfor|set|and|or|not|contains|true|false|null|undefined)$/.test(token)) return 'syn-keyword';
  if (language === 'ts' && /^(import|from|const|let|type|async|await|return|if|else|new|throw|export)$/.test(token)) return 'syn-keyword';
  if (language === 'shell' && /^(pnpm|npm|npx)$/.test(token)) return 'syn-filter';
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*$/.test(token)) return 'syn-variable';
  return undefined;
}

function highlightLine(line: string, language: 'knap' | 'ts' | 'shell') {
  const pattern = /(\{\{|\}\}|\{%|%\}|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|===|!==|==|!=|=>|<=|>=|&&|\|\||\?\?|[{}()[\].,:;=+\-*/<>!?|]|\b(?:if|elseif|else|endif|for|in|endfor|set|and|or|not|contains|true|false|null|undefined|import|from|const|let|type|async|await|return|new|throw|export|pnpm|npm|npx)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*)/g;
  let expectsFilter = false;
  let inKnapExpression = false;
  const tokens = line.split(pattern).filter(Boolean);

  return tokens.map((token, index) => {
    let className = tokenClass(token, language);

    if (language === 'knap') {
      if (/^(\{\{|\{%)$/.test(token)) {
        inKnapExpression = true;
      } else if (/^(\}\}|%\})$/.test(token)) {
        inKnapExpression = false;
      } else if (!inKnapExpression) {
        className = undefined;
      }
    }

    if (token === '|' && language === 'knap' && inKnapExpression) {
      expectsFilter = true;
    } else if (expectsFilter && /^\s+$/.test(token)) {
      // Keep waiting through whitespace between the pipe and filter name.
    } else if (expectsFilter) {
      className = 'syn-filter';
      expectsFilter = false;
    }

    if (language === 'ts' && className === 'syn-variable') {
      const nextToken = tokens.slice(index + 1).find((candidate) => !/^\s+$/.test(candidate));
      if (nextToken === '(') className = 'syn-function';
    }

    const quoted = className === 'syn-string' ? token.match(/^(['"`])([\s\S]*)\1$/) : null;
    if (quoted) {
      return (
        <span key={index}>
          <span className="syn-punctuation">{quoted[1]}</span>
          <span className="syn-string">{quoted[2]}</span>
          <span className="syn-punctuation">{quoted[1]}</span>
        </span>
      );
    }

    return <span className={className} key={index}>{token}</span>;
  });
}

export function HighlightedCode({ code, language = 'knap' }: { code: string; language?: 'knap' | 'ts' | 'shell' }) {
  return <code>{highlightLine(code, language)}</code>;
}

export function CodeBlock({
  code,
  language = 'knap',
  label,
}: {
  code: string;
  language?: 'knap' | 'ts' | 'shell';
  label?: string;
}) {
  const lines = code.replace(/^\n|\n$/g, '').split('\n');
  return (
    <figure className="doc-code">
      {label ? <figcaption><span>{label}</span><span>{language.toUpperCase()}</span></figcaption> : null}
      <pre><code>{lines.map((line, index) => (
        <span className="doc-code-line" key={index}>
          <span className="doc-line-number">{index + 1}</span>
          <span>{highlightLine(line, language)}</span>
        </span>
      ))}</code></pre>
    </figure>
  );
}

export function Note({ title, children }: { title: string; children: ReactNode }) {
  return <aside className="doc-note"><strong>{title}</strong><div>{children}</div></aside>;
}
