import type { Metadata } from 'next';
import { CodeBlock, DocShell, Note } from '../_components/docs';

export const metadata: Metadata = {
  title: 'Filters',
  description: 'Transform template values with Knap’s standard and host-defined filters.',
};

type FilterItem = { name: string; description: string; example?: string };
type FilterGroup = { id: string; label: string; intro: string; items: FilterItem[] };

const groups: FilterGroup[] = [
  {
    id: 'dates', label: 'Dates and time', intro: 'Parse, modify, and present temporal values.', items: [
      { name: 'date', description: 'Parse and format a date.', example: 'date:"YYYY-MM-DD"' },
      { name: 'date_modify', description: 'Add or subtract a date unit.', example: 'date_modify:"+1 month"' },
      { name: 'duration', description: 'Format ISO 8601 durations or seconds.', example: 'duration:"H:mm:ss"' },
    ],
  },
  {
    id: 'text', label: 'Text', intro: 'Normalize, rename, and reshape strings.', items: [
      { name: 'camel', description: 'Convert text to camelCase.' },
      { name: 'capitalize', description: 'Uppercase the first character and lowercase the rest.' },
      { name: 'decode_uri', description: 'Decode percent-encoded URI text.' },
      { name: 'kebab', description: 'Convert text to kebab-case.' },
      { name: 'lower', description: 'Convert text to lowercase.' },
      { name: 'pascal', description: 'Convert text to PascalCase.' },
      { name: 'replace', description: 'Replace text or regular-expression matches.', example: 'replace:"old":"new"' },
      { name: 'safe_name', description: 'Sanitize text for use as a file name.', example: 'safe_name:windows' },
      { name: 'snake', description: 'Convert text to snake_case.' },
      { name: 'title', description: 'Convert text to Title Case.' },
      { name: 'trim', description: 'Remove surrounding whitespace.' },
      { name: 'uncamel', description: 'Split camelCase or PascalCase into words.' },
      { name: 'unescape', description: 'Turn escaped quotes and newline sequences into literal characters.' },
      { name: 'upper', description: 'Convert text to uppercase.' },
    ],
  },
  {
    id: 'markdown', label: 'Markdown', intro: 'Create Markdown structures from application values.', items: [
      { name: 'blockquote', description: 'Prefix each line as a Markdown block quote.' },
      { name: 'callout', description: 'Format content as an Obsidian callout.', example: 'callout:("info","Note")' },
      { name: 'footnote', description: 'Format arrays or objects as Markdown footnotes.' },
      { name: 'fragment_link', description: 'Append a source text-fragment link.' },
      { name: 'image', description: 'Format URLs as Markdown images.' },
      { name: 'link', description: 'Format URLs as Markdown links.' },
      { name: 'list', description: 'Format values as bullet, task, or numbered lists.', example: 'list:numbered' },
      { name: 'table', description: 'Format arrays or objects as a Markdown table.' },
      { name: 'wikilink', description: 'Format values as Obsidian wikilinks.' },
      { name: 'yaml', description: 'Format a value as a YAML-safe scalar.' },
    ],
  },
  {
    id: 'numbers', label: 'Numbers', intro: 'Calculate and format numeric values.', items: [
      { name: 'calc', description: 'Apply +, −, ×, ÷, or exponentiation.', example: 'calc:"+10"' },
      { name: 'number_format', description: 'Format decimals and thousands separators.', example: 'number_format:2' },
      { name: 'round', description: 'Round to an integer or a number of decimal places.', example: 'round:2' },
    ],
  },
  {
    id: 'collections', label: 'Arrays and objects', intro: 'Select, combine, and reshape structured values.', items: [
      { name: 'first', description: 'Return the first array item.' },
      { name: 'join', description: 'Join array items into a string.', example: 'join:", "' },
      { name: 'last', description: 'Return the last array item.' },
      { name: 'length', description: 'Return string length, array length, or object key count.' },
      { name: 'map', description: 'Project fields from structured array data.', example: 'map:item => item.name' },
      { name: 'merge', description: 'Add values to an array.' },
      { name: 'nth', description: 'Select array items with CSS-style nth patterns.', example: 'nth:2n+1' },
      { name: 'object', description: 'Select or reshape structured object data.', example: 'object:keys' },
      { name: 'reverse', description: 'Reverse array-like data.' },
      { name: 'slice', description: 'Select a range from arrays or text.', example: 'slice:0,5' },
      { name: 'split', description: 'Split a string into an array.', example: 'split:","' },
      { name: 'template', description: 'Apply a substitution template to structured data.', example: 'template:"- ${name}"' },
      { name: 'unique', description: 'Remove duplicate values.' },
    ],
  },
  {
    id: 'html', label: 'HTML and cleanup', intro: 'Clean markup while preserving the parts a Markdown workflow needs.', items: [
      { name: 'remove_attr', description: 'Remove selected HTML attributes.' },
      { name: 'remove_tags', description: 'Remove selected tags but keep their content.' },
      { name: 'replace_tags', description: 'Rename selected HTML tags.' },
      { name: 'strip_attr', description: 'Remove all HTML attributes except an optional allowlist.' },
      { name: 'strip_md', description: 'Remove Markdown formatting. stripmd is an alias.' },
      { name: 'strip_tags', description: 'Remove all HTML tags except an optional allowlist.' },
    ],
  },
];

const toc = [
  { href: '#use', label: 'Use filters' },
  ...groups.map((group) => ({ href: `#${group.id}`, label: group.label })),
  { href: '#html-preset', label: 'HTML preset' },
  { href: '#custom', label: 'Custom filters' },
];

export default function FiltersPage() {
  return (
    <DocShell current="filters" eyebrow="Language guide · 03" title="Filters" description="Filters transform values before Knap writes them. Use the standard library, opt into DOM-dependent filters, or register functions owned by your application." toc={toc}>
      <section id="use" className="doc-section">
        <h2>Use filters</h2>
        <p>Add a filter after a pipe. Parameters follow the filter name after a colon, and chains run from left to right.</p>
        <CodeBlock label="template.md" code={'{{ title | trim | upper }}\n{{ published | date:"YYYY-MM-DD" }}\n{{ tags | unique | join:", " }}'} />
        <Note title="Explicit registry"><p>Only filters registered on the engine are available. Unknown names and invalid parameters appear as structured diagnostics from <code>validate()</code> and <code>render()</code>.</p></Note>
      </section>

      {groups.map((group) => (
        <section id={group.id} className="doc-section filter-section" key={group.id}>
          <h2>{group.label}</h2>
          <p>{group.intro}</p>
          <div className="filter-list">
            {group.items.map((filter) => (
              <article key={filter.name}>
                <div><code>{filter.name}</code>{filter.name === 'strip_md' ? <small>alias: stripmd</small> : null}</div>
                <p>{filter.description}</p>
                {filter.example ? <code className="filter-example">{filter.example}</code> : <span />}
              </article>
            ))}
          </div>
        </section>
      ))}

      <section id="html-preset" className="doc-section">
        <h2>Opt into the HTML preset</h2>
        <p><code>html_to_json</code> and <code>remove_html</code> require browser-compatible DOM globals, so they are exported separately from <code>knap/html</code>.</p>
        <div className="filter-list compact-filter-list">
          <article><div><code>html_to_json</code></div><p>Convert HTML elements into structured JSON values.</p><span /></article>
          <article><div><code>remove_html</code></div><p>Remove selected HTML elements and their contents.</p><span /></article>
        </div>
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
