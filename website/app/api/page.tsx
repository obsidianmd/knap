import type { Metadata } from 'next';
import { CodeBlock, DocShell, Note } from '../_components/docs';

export const metadata: Metadata = {
  title: 'API',
  description: 'Install, configure, validate, and render Knap templates.',
};

const toc = [
  { href: '#install', label: 'Install' },
  { href: '#quick-start', label: 'Quick start' },
  { href: '#results', label: 'Results' },
  { href: '#methods', label: 'Engine methods' },
  { href: '#tooling', label: 'Editor tooling' },
  { href: '#exports', label: 'Exports' },
];

export default function ApiPage() {
  return (
    <DocShell current="api" title="API" description="Create an immutable engine-scoped filter registry, then parse, validate, or render templates against application-owned data." toc={toc}>
      <section id="install" className="doc-section">
        <h2>Install</h2>
        <CodeBlock language="shell" label="Terminal" code="pnpm add knap" />
        <p>Knap is ESM-first, also ships CommonJS entry points, and requires Node.js 20 or later.</p>
      </section>

      <section id="quick-start" className="doc-section">
        <h2>Quick start</h2>
        <CodeBlock language="ts" label="render.ts" code={`import {
  createEngine,
  standardFilters,
  type TemplateVariables,
} from 'knap';

const engine = createEngine({ filters: standardFilters });

const variables: TemplateVariables = {
  title: '  An imported note  ',
  tags: ['reference', 'reading'],
};

const result = await engine.render(
  '# {{ title | trim }}\\n\\n{{ tags | list }}',
  { variables },
);`} />
        <p>Pass an optional generic context when custom filters or resolvers need host data that is not itself a template variable.</p>
      </section>

      <section id="results" className="doc-section">
        <h2>Render results</h2>
        <p><code>render()</code> always resolves to an output object with structured diagnostics.</p>
        <div className="table-wrap"><table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody>
          <tr><td><code>output</code></td><td><code>string</code></td><td>Rendered Markdown. Empty when parsing fails.</td></tr>
          <tr><td><code>errors</code></td><td><code>TemplateError[]</code></td><td>Fatal parser, validation, resolver, or filter errors.</td></tr>
          <tr><td><code>warnings</code></td><td><code>TemplateWarning[]</code></td><td>Non-fatal diagnostics reported by filters.</td></tr>
        </tbody></table></div>
        <p>Errors include a stable <code>code</code>, <code>message</code>, <code>line</code>, and <code>column</code>. Warnings also identify the reporting filter and are deduplicated per render.</p>
        <CodeBlock language="ts" code={`if (result.errors.length === 0) {
  console.log(result.output);
}

const output = await engine.renderOrThrow(
  '{{ title | upper }}',
  { variables },
);`} />
        <Note title="renderOrThrow"><p>Warnings never make <code>renderOrThrow()</code> throw. Use it when exceptions fit the host application better than result inspection.</p></Note>
      </section>

      <section id="methods" className="doc-section">
        <h2>Engine methods</h2>
        <div className="api-list">
          <article><code>createEngine({'{ filters }'})</code><p>Create an engine with an immutable filter registry.</p></article>
          <article><code>engine.render(template, input, options?)</code><p>Render asynchronously and return output, errors, and warnings.</p></article>
          <article><code>engine.renderOrThrow(template, input, options?)</code><p>Return the output or throw <code>TemplateRenderError</code>.</p></article>
          <article><code>engine.parse(template)</code><p>Return the AST and parser diagnostics.</p></article>
          <article><code>engine.validate(templateOrAst)</code><p>Validate syntax and filter names or parameters.</p></article>
        </div>
        <p>Set <code>{'{ trimOutput: false }'}</code> in render options to preserve surrounding template whitespace.</p>
      </section>

      <section id="tooling" className="doc-section">
        <h2>Editor tooling</h2>
        <p>The lower-level exports let editors tokenize once, inspect an AST, and validate variables or filters independently.</p>
        <CodeBlock language="ts" label="validate.ts" code={`import {
  parse,
  standardFilterMetadata,
  validateFilters,
  validateVariables,
} from 'knap';

const parsed = parse(template);
const filterErrors = validateFilters(parsed.ast, standardFilterMetadata);
const variableNames = validateVariables(parsed.ast);`} />
        <p><code>applyFiltersWithRegistry()</code> applies a synchronous filter chain when a host needs Knap filter syntax outside a full render.</p>
      </section>

      <section id="exports" className="doc-section">
        <h2>Package exports</h2>
        <div className="table-wrap"><table><thead><tr><th>Import</th><th>Includes</th></tr></thead><tbody>
          <tr><td><code>knap</code></td><td>Engine, parser, tokenizer, standard filters, diagnostics, and public types.</td></tr>
          <tr><td><code>knap/html</code></td><td>DOM-dependent <code>html_to_json</code> and <code>remove_html</code> filters.</td></tr>
        </tbody></table></div>
      </section>
    </DocShell>
  );
}
