import type { Metadata } from 'next';
import { CodeBlock, DocShell, Note } from '../_components/docs';

export const metadata: Metadata = {
  title: 'Variables',
  description: 'Supply, resolve, access, and assign values in Knap templates.',
};

const toc = [
  { href: '#output', label: 'Output a value' },
  { href: '#values', label: 'Value types' },
  { href: '#access', label: 'Nested values' },
  { href: '#names', label: 'Human-readable names' },
  { href: '#resolvers', label: 'Async resolvers' },
  { href: '#assignment', label: 'Local assignment' },
];

export default function VariablesPage() {
  return (
    <DocShell current="variables" title="Variables" description="Variables are the bridge between your application data and a Knap template. The host supplies the values; the template decides how to present them." toc={toc}>
      <section id="output" className="doc-section">
        <h2>Output a value</h2>
        <p>Wrap a variable name in double braces. Whitespace inside the braces is optional.</p>
        <CodeBlock label="template.md" code={'# {{ title }}\n\nBy {{author}}'} />
        <p>Filters can transform a value before it is written. They run from left to right.</p>
        <CodeBlock code={'{{ title | trim | title }}\n{{ tags | join:", " }}'} />
      </section>

      <section id="values" className="doc-section">
        <h2>Value types</h2>
        <p>Knap accepts unknown application values rather than imposing a schema. Templates commonly work with strings, numbers, booleans, arrays, objects, and nullish values.</p>
        <div className="type-grid">
          <div><code>string</code><span>Titles, content, URLs</span></div>
          <div><code>number</code><span>Counts and measurements</span></div>
          <div><code>boolean</code><span>Feature and state flags</span></div>
          <div><code>array</code><span>Tags, authors, sections</span></div>
          <div><code>object</code><span>Nested structured data</span></div>
          <div><code>null</code><span>Missing or empty values</span></div>
        </div>
        <Note title="Host-owned data"><p>Knap does not know what a browser tab, vault, selector, or model is. Applications can expose those concepts as ordinary values or resolve them on demand.</p></Note>
      </section>

      <section id="access" className="doc-section">
        <h2>Access nested values</h2>
        <p>Use dot notation for nested object properties and bracket notation for array items or keys that are easier to express as strings.</p>
        <CodeBlock code={'{{ author.name }}\n{{ authors[0].name }}\n{{ metadata["article:section"] }}'} />
        <p>Bracket expressions can also use another variable, which is useful when two arrays need to be read in parallel.</p>
        <CodeBlock code={'{% for line in transcript %}\n{{ timestamps[loop.index0] }} — {{ line }}\n{% endfor %}'} />
      </section>

      <section id="names" className="doc-section">
        <h2>Use human-readable names</h2>
        <p>Variable output supports names with spaces, so imported column headings can remain readable without preprocessing.</p>
        <CodeBlock code={'{{ First name | trim }}\n{{ Publication date | date:"YYYY-MM-DD" }}'} />
      </section>

      <section id="resolvers" className="doc-section">
        <h2>Resolve values asynchronously</h2>
        <p>If a value is not present in the variables object, the host can load it with <code>resolveVariable</code>. Local values always take precedence.</p>
        <CodeBlock language="ts" label="render.ts" code={`const result = await engine.render('{{ remoteValue | upper }}', {
  variables: {},
  context: { documentId: 'example' },
  resolveVariable: async (name, { context }) => {
    if (name === 'remoteValue') {
      return loadValue(context.documentId);
    }
    return undefined;
  },
});`} />
      </section>

      <section id="assignment" className="doc-section">
        <h2>Assign a local variable</h2>
        <p>Use <code>{'{% set %}'}</code> to name a literal, expression, or filtered value for the rest of the template.</p>
        <CodeBlock code={'{% set slug = title | lower | replace:" ":"-" %}\nFile: {{ slug }}.md'} />
        <p>Assignments are evaluated in order and can be used by later output, conditions, and loops.</p>
      </section>
    </DocShell>
  );
}
