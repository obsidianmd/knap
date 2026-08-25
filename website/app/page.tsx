/* eslint-disable @next/next/no-html-link-for-pages */
import { FilterSearch } from './_components/filter-search';

const templateLines = [
  [["# ", "plain"], ["{{", "punctuation"], [" title ", "variable"], ["|", "punctuation"], [" trim ", "filter"], ["|", "punctuation"], [" title ", "filter"], ["}}", "punctuation"]],
  [],
  [["{%", "punctuation"], [" if ", "keyword"], ["author", "variable"], [" %}", "punctuation"]],
  [["By ", "plain"], ["{{", "punctuation"], [" author.name ", "variable"], ["}}", "punctuation"]],
  [["{%", "punctuation"], [" endif ", "keyword"], ["%}", "punctuation"]],
  [],
  [["{%", "punctuation"], [" for ", "keyword"], ["tag", "variable"], [" in ", "keyword"], ["tags", "variable"], [" %}", "punctuation"]],
  [["- ", "plain"], ["{{", "punctuation"], [" tag ", "variable"], ["|", "punctuation"], [" lower ", "filter"], ["}}", "punctuation"]],
  [["{%", "punctuation"], [" endfor ", "keyword"], ["%}", "punctuation"]],
] as const;

export default function Home() {
  return (
    <main>
      <section className="hero-shell">
        <nav className="topbar" aria-label="Main navigation">
          <a className="wordmark" href="/" aria-label="Knap home">Knap<span>.md</span></a>
          <div className="nav-links">
            <a href="/logic">Logic</a>
            <a href="/filters">Filters</a>
            <a href="/variables">Variables</a>
            <a href="/api">API</a>
            <FilterSearch />
            <a className="nav-github" href="https://github.com/obsidianmd/knap">GitHub ↗</a>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">A template engine for Markdown</p>
            <h1>Turn structured data into notes worth keeping.</h1>
            <p className="lede">Knap brings variables, logic, loops, and a focused filter library to Markdown—without evaluating arbitrary JavaScript.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="/logic">Read the language guide</a>
              <a className="button button-secondary" href="/api">Add Knap to a project</a>
            </div>
          </div>

          <div className="code-window" aria-label="Knap template example">
            <div className="code-window-bar"><span>reading-note.md</span><span className="code-language">KNAP</span></div>
            <pre><code>{templateLines.map((line, lineIndex) => (
              <span className="code-line" key={lineIndex}>
                <span className="line-number">{lineIndex + 1}</span>
                <span>{line.map(([text, tone], tokenIndex) => <span className={`tok-${tone}`} key={tokenIndex}>{text}</span>)}</span>
              </span>
            ))}</code></pre>
          </div>
        </div>
      </section>

      <section className="install-strip" aria-label="Installation">
        <div><span className="install-label">Install</span><code>pnpm add knap</code></div>
        <a href="/api#quick-start">Quick start →</a>
      </section>

      <section className="feature-grid" aria-labelledby="why-knap">
        <div className="section-heading">
          <p className="eyebrow">Small language, clear contract</p>
          <h2 id="why-knap">Made for applications that create Markdown.</h2>
        </div>
        <div className="feature-cards">
          <article><span className="feature-index">01</span><h3>Safe by design</h3><p>An AST interpreter handles templates. Knap does not use eval or execute arbitrary JavaScript.</p></article>
          <article><span className="feature-index">02</span><h3>Application-owned</h3><p>Your app supplies variables, asynchronous resolvers, and custom filters. Knap stays independent of any host environment.</p></article>
          <article><span className="feature-index">03</span><h3>Useful diagnostics</h3><p>Errors and warnings include stable codes, messages, lines, and columns for editor tooling and helpful user feedback.</p></article>
        </div>
      </section>

      <section className="used-by" aria-labelledby="used-by-knap">
        <header className="used-by-heading">
          <div>
            <p className="eyebrow">Used in production</p>
            <h2 id="used-by-knap">Tools powered by Knap.</h2>
          </div>
          <p>Knap is the shared template language behind tools that turn web pages and imported data into durable Markdown.</p>
        </header>

        <div className="used-by-list">
          <a href="https://obsidian.md/clipper" className="used-by-card">
            <span className="used-by-index">01</span>
            <div className="used-by-copy">
              <p>Obsidian · Browser extension</p>
              <h3>Web Clipper</h3>
              <span>Renders page data, highlights, selectors, and custom variables through user-defined templates before saving them as Markdown.</span>
            </div>
            <div className="used-by-example">
              <small>Template → Markdown</small>
              <code>{'{{ content | markdown }}'}</code>
            </div>
            <strong aria-hidden="true">↗</strong>
          </a>

          <a href="https://community.obsidian.md/plugins/obsidian-importer" className="used-by-card">
            <span className="used-by-index">02</span>
            <div className="used-by-copy">
              <p>Obsidian · Community plugin</p>
              <h3>Importer</h3>
              <span>Applies templates and filters to imported fields so notes from other apps arrive in a consistent Markdown structure.</span>
            </div>
            <div className="used-by-example">
              <small>Fields → Notes</small>
              <code>{'{{ title | safe_name }}'}</code>
            </div>
            <strong aria-hidden="true">↗</strong>
          </a>
        </div>
      </section>

      <section className="path-grid" aria-label="Documentation paths">
        <a href="/variables"><span>Start with</span><strong>Variables</strong><small>{'{{ title }}'} →</small></a>
        <a href="/logic"><span>Then add</span><strong>Logic</strong><small>{'{% if author %}'} →</small></a>
        <a href="/filters"><span>Shape with</span><strong>Filters</strong><small>{'| trim | title'} →</small></a>
      </section>

      <footer>
        <a className="wordmark footer-mark" href="/">Knap<span>.md</span></a>
        <p>Open source under the MIT license.</p>
        <a href="https://github.com/obsidianmd/knap">GitHub ↗</a>
      </footer>
    </main>
  );
}
