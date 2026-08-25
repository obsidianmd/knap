/* eslint-disable @next/next/no-html-link-for-pages */
import type { ReactNode } from 'react';
import { CodeCopyButton } from './code-copy-button';
import { FilterSearch } from './filter-search';

type DocRoute = 'variables' | 'logic' | 'filters' | 'api';
type CodeLanguage = 'knap' | 'ts' | 'shell' | 'md';

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

function tokenClass(token: string, language: CodeLanguage) {
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

function highlightMarkdownInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\[[^\]\n]+\]\([^)\n]+\)|\[\^[^\]\n]+\])/g).filter(Boolean);

  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <span key={`${keyPrefix}-${index}`}>
          <span className="syn-punctuation">[</span>
          <span className="syn-md-link">{link[1]}</span>
          <span className="syn-punctuation">](</span>
          <span className="syn-md-link">{link[2]}</span>
          <span className="syn-punctuation">)</span>
        </span>
      );
    }

    if (/^\[\^[^\]]+\]$/.test(part)) return <span className="syn-punctuation" key={`${keyPrefix}-${index}`}>{part}</span>;
    return <span key={`${keyPrefix}-${index}`}>{part}</span>;
  });
}

function highlightMarkdownLine(line: string) {
  if (/^\s*---\s*$/.test(line)) return <span className="syn-punctuation">{line}</span>;

  const heading = line.match(/^(#{1,6})(\s+)(.*)$/);
  if (heading) {
    return <><span className="syn-punctuation">{heading[1]}</span>{heading[2]}<span className="syn-md-heading">{highlightMarkdownInline(heading[3], 'heading')}</span></>;
  }

  const blockquote = line.match(/^(\s*)(>)(\s?)(.*)$/);
  if (blockquote) {
    return <>{blockquote[1]}<span className="syn-punctuation">{blockquote[2]}</span>{blockquote[3]}{highlightMarkdownInline(blockquote[4], 'blockquote')}</>;
  }

  const footnote = line.match(/^(\[\^[^\]]+\])(:)(\s*)(.*)$/);
  if (footnote) {
    return <><span className="syn-punctuation">{footnote[1]}{footnote[2]}</span>{footnote[3]}{highlightMarkdownInline(footnote[4], 'footnote')}</>;
  }

  const yaml = line.match(/^([A-Za-z][\w-]*)(:)(\s*)(.*)$/);
  if (yaml) {
    const quoted = yaml[4].match(/^(["'])(.*)\1$/);
    return <><span className="syn-md-key">{yaml[1]}</span><span className="syn-punctuation">{yaml[2]}</span>{yaml[3]}{quoted ? <><span className="syn-punctuation">{quoted[1]}</span>{quoted[2]}<span className="syn-punctuation">{quoted[1]}</span></> : highlightMarkdownInline(yaml[4], 'yaml')}</>;
  }

  if (/^\s*\|.*\|\s*$/.test(line)) {
    return line.split(/(\||:?-+:?)/g).filter(Boolean).map((part, index) => <span className={/^(?:\||:?-+:?)$/.test(part) ? 'syn-punctuation' : undefined} key={`table-${index}`}>{part}</span>);
  }

  return highlightMarkdownInline(line, 'markdown');
}

function highlightTokenLine(line: string, language: Exclude<CodeLanguage, 'md'>) {
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

function highlightKnapLine(line: string) {
  const segments = line.split(/(\{\{.*?\}\}|\{%.*?%\})/g).filter(Boolean);

  return segments.map((segment, index) => {
    const isKnapExpression = /^(?:\{\{.*\}\}|\{%.*%\})$/.test(segment);
    return <span key={index}>{isKnapExpression ? highlightTokenLine(segment, 'knap') : highlightMarkdownLine(segment)}</span>;
  });
}

function highlightLine(line: string, language: CodeLanguage) {
  if (language === 'md') return highlightMarkdownLine(line);
  if (language === 'knap') return highlightKnapLine(line);
  return highlightTokenLine(line, language);
}

export function CodeBlock({
  code,
  language = 'knap',
  label,
}: {
  code: string;
  language?: CodeLanguage;
  label?: string;
}) {
  const normalizedCode = code.replace(/^\n|\n$/g, '');
  const lines = normalizedCode.split('\n');
  return (
    <figure className={`doc-code${label ? '' : ' doc-code-unlabeled'}`}>
      {label ? (
        <figcaption>
          <span>{label}</span>
          <span className="doc-code-actions"><CodeCopyButton code={normalizedCode} /></span>
        </figcaption>
      ) : <CodeCopyButton code={normalizedCode} />}
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
