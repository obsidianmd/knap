import { CodeBlock, DocShell, Note } from '../_components/docs';
import { filterDocs, filterGroups } from '@/lib/filter-docs';
import { FilterDirectory } from './filter-directory';
import Link from 'next/link';

const toc = [
  { href: '#use', label: 'Use filters' },
  { href: '#directory', label: 'Filter directory' },
  { href: '#html-preset', label: 'HTML preset' },
  { href: '#custom', label: 'Custom filters' },
];

export default function FiltersPage() {
  return (
    <DocShell current="filters" eyebrow="Language guide · 03" title="Filters" description="Filters transform values before Knap writes them. Browse the complete library, then open any filter for tested input, template, and output examples." toc={toc}>
      <section id="use" className="doc-section">
        <h2>Use filters</h2>
        <p>Add a filter after a pipe. Parameters follow the filter name after a colon, and chains run from left to right.</p>
        <CodeBlock label="template.md" code={'{{ title | trim | upper }}\n{{ published | date:"YYYY-MM-DD" }}\n{{ tags | unique | join:", " }}'} />
        <Note title="Explicit registry"><p>Only filters registered on the engine are available. Unknown names and invalid parameters appear as structured diagnostics from <code>validate()</code> and <code>render()</code>.</p></Note>
      </section>

      <section id="directory" className="doc-section filter-section">
        <h2>Filter directory</h2>
        <p>Search by filter name, alias, category, or behavior. Every page includes at least one copyable example.</p>
        <FilterDirectory groups={filterGroups} filters={filterDocs} />
      </section>

      <section id="html-preset" className="doc-section">
        <h2>Opt into the HTML preset</h2>
        <p><Link href="/filters/html-to-json"><code>html_to_json</code></Link> and <Link href="/filters/remove-html"><code>remove_html</code></Link> require browser-compatible DOM globals, so they are exported separately from <code>knap/html</code>.</p>
        <CodeBlock language="ts" label="engine.ts" code={`import { createEngine, standardFilters } from 'knap';
import { htmlFilters } from 'knap/html';

const engine = createEngine({
  filters: { ...standardFilters, ...htmlFilters },
});`} />
      </section>

      <section id="custom" className="doc-section">
        <h2>Register a custom filter</h2>
        <p>Custom filters may be synchronous or asynchronous. Attach metadata when the editor should validate parameters before rendering.</p>
        <CodeBlock language="ts" label="filters.ts" code={`import { createEngine, standardFilters, type TemplateFilter } from 'knap';

const surround: TemplateFilter = (value, param = '') => {
  const marker = param.replace(/^(['"])(.*)\\1$/s, '$2');
  return marker + value + marker;
};

surround.metadata = { example: 'surround:"**"' };

const engine = createEngine({
  filters: { ...standardFilters, surround },
});`} />
        <p>A filter can call <code>context.reportWarning()</code> when it preserves a fallback value but wants the host to surface a non-fatal diagnostic.</p>
      </section>
    </DocShell>
  );
}
