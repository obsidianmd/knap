import type { Metadata } from 'next';
import { CodeBlock, DocShell } from '../_components/docs';

export const metadata: Metadata = {
  title: 'Logic',
  description: 'Use conditions, fallbacks, assignments, and loops in Knap templates.',
};

const toc = [
  { href: '#conditionals', label: 'Conditionals' },
  { href: '#operators', label: 'Operators' },
  { href: '#truthiness', label: 'Truthiness' },
  { href: '#fallbacks', label: 'Fallbacks' },
  { href: '#loops', label: 'Loops' },
  { href: '#loop-values', label: 'Loop values' },
  { href: '#nesting', label: 'Combine logic' },
];

export default function LogicPage() {
  return (
    <DocShell current="logic" title="Logic" description="Include content conditionally, choose fallback values, and repeat Markdown over arrays—all with a deliberately small template language." toc={toc}>
      <section id="conditionals" className="doc-section">
        <h2>Conditionals</h2>
        <p>Use <code>{'{% if %}'}</code> to include content only when an expression is true. Add <code>elseif</code> and <code>else</code> for alternative branches.</p>
        <CodeBlock label="status.md" code={`{% if status == "published" %}
Published on {{ published | date:"YYYY-MM-DD" }}
{% elseif status == "draft" %}
Draft
{% else %}
Unknown status
{% endif %}`} />
      </section>

      <section id="operators" className="doc-section">
        <h2>Comparison and logical operators</h2>
        <div className="table-wrap"><table><thead><tr><th>Operator</th><th>Meaning</th><th>Example</th></tr></thead><tbody>
          <tr><td><code>==</code></td><td>Equal to</td><td><code>{'status == "draft"'}</code></td></tr>
          <tr><td><code>!=</code></td><td>Not equal to</td><td><code>{'status != "archived"'}</code></td></tr>
          <tr><td><code>{'>'} {'<'} {'>='} {'<='}</code></td><td>Ordered comparison</td><td><code>{'price >= 100'}</code></td></tr>
          <tr><td><code>contains</code></td><td>String substring or array member</td><td><code>{'tags contains "reference"'}</code></td></tr>
          <tr><td><code>and</code> / <code>&amp;&amp;</code></td><td>Both sides are true</td><td><code>{'author and published'}</code></td></tr>
          <tr><td><code>or</code> / <code>||</code></td><td>Either side is true</td><td><code>{'draft or archived'}</code></td></tr>
          <tr><td><code>not</code> / <code>!</code></td><td>Negate an expression</td><td><code>{'not hidden'}</code></td></tr>
        </tbody></table></div>
        <p>Use parentheses to make grouped expressions explicit.</p>
        <CodeBlock code={'{% if (premium or featured) and published %}\nFeatured reading\n{% endif %}'} />
      </section>

      <section id="truthiness" className="doc-section">
        <h2>Truthiness</h2>
        <p><code>false</code>, <code>null</code>, <code>undefined</code>, an empty string, <code>0</code>, and an empty array are falsy. Other values are truthy.</p>
        <CodeBlock code={'{% if content %}\n{{ content }}\n{% endif %}'} />
      </section>

      <section id="fallbacks" className="doc-section">
        <h2>Fallback values</h2>
        <p>The <code>??</code> operator returns the first truthy value and has the lowest precedence, so filters run before the fallback check.</p>
        <CodeBlock code={'{{ title ?? headline ?? "Untitled" }}\n{{ title | upper ?? "UNTITLED" }}'} />
      </section>

      <section id="loops" className="doc-section">
        <h2>Loops</h2>
        <p>Use <code>{'{% for %}'}</code> to render a block once for every value in an array.</p>
        <CodeBlock code={'{% for tag in tags %}\n- #{{ tag | kebab }}\n{% endfor %}'} />
        <p>Loops can iterate over variables supplied by the host, values created with <code>set</code>, and arrays found in nested data.</p>
      </section>

      <section id="loop-values" className="doc-section">
        <h2>Loop values</h2>
        <div className="table-wrap"><table><thead><tr><th>Value</th><th>Description</th></tr></thead><tbody>
          <tr><td><code>loop.index</code></td><td>Current iteration, starting at 1</td></tr>
          <tr><td><code>loop.index0</code></td><td>Current iteration, starting at 0</td></tr>
          <tr><td><code>loop.first</code></td><td>True on the first iteration</td></tr>
          <tr><td><code>loop.last</code></td><td>True on the last iteration</td></tr>
          <tr><td><code>loop.length</code></td><td>Total number of items</td></tr>
          <tr><td><code>{'item_index'}</code></td><td>Backwards-compatible 0-based index named after the iterator</td></tr>
        </tbody></table></div>
        <CodeBlock code={'{% for author in authors %}\n{{ loop.index }}. {{ author.name }}{% if loop.last %}.{% else %};{% endif %}\n{% endfor %}'} />
      </section>

      <section id="nesting" className="doc-section">
        <h2>Combine and nest logic</h2>
        <p>Conditions, loops, and assignments can be nested to work with structured data.</p>
        <CodeBlock code={'{% for section in sections %}\n## {{ section.title }}\n{% for item in section.items %}\n{% if item.active %}- {{ item.name }}{% endif %}\n{% endfor %}\n{% endfor %}'} />
      </section>
    </DocShell>
  );
}
