import Link from 'next/link';

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
          <Link className="wordmark" href="/" aria-label="Knap home">Knap<span>.md</span></Link>
          <div className="nav-links">
            <Link href="/logic">Logic</Link>
            <Link href="/filters">Filters</Link>
            <Link href="/variables">Variables</Link>
            <Link href="/api">API</Link>
            <a className="nav-github" href="https://github.com/obsidianmd/knap">GitHub ↗</a>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">A template engine for Markdown</p>
            <h1>Turn structured data into notes worth keeping.</h1>
            <p className="lede">Knap brings variables, logic, loops, and a focused filter library to Markdown—without evaluating arbitrary JavaScript.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/logic">Read the language guide</Link>
              <Link className="button button-secondary" href="/api">Add Knap to a project</Link>
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
        <Link href="/api#quick-start">Quick start →</Link>
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

      <section className="path-grid" aria-label="Documentation paths">
        <Link href="/variables"><span>Start with</span><strong>Variables</strong><small>{'{{ title }}'} →</small></Link>
        <Link href="/logic"><span>Then add</span><strong>Logic</strong><small>{'{% if author %}'} →</small></Link>
        <Link href="/filters"><span>Shape with</span><strong>Filters</strong><small>{'| trim | title'} →</small></Link>
      </section>

      <footer>
        <Link className="wordmark footer-mark" href="/">Knap<span>.md</span></Link>
        <p>Open source under the MIT license.</p>
        <a href="https://github.com/obsidianmd/knap">GitHub ↗</a>
      </footer>
    </main>
  );
}
