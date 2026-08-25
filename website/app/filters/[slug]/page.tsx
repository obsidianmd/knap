/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CodeBlock, DocShell, Note } from '../../_components/docs';
import { allFilterSlugs, filterDocs, filterDocsByName, filterDocsBySlug } from '@/lib/filter-docs';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allFilterSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const filter = filterDocsBySlug.get((await params).slug);
  if (!filter) return {};
  return { title: `${filter.name} filter`, description: `${filter.summary} Syntax and tested examples for Knap.`, alternates: { canonical: `/filters/${filter.slug}` } };
}

export default async function FilterPage({ params }: PageProps) {
  const filter = filterDocsBySlug.get((await params).slug);
  if (!filter) notFound();
  const index = filterDocs.findIndex((item) => item.slug === filter.slug);
  const previous = filterDocs[index - 1];
  const next = filterDocs[index + 1];
  const toc = [
    { href: '#syntax', label: 'Syntax' },
    { href: '#examples', label: 'Examples' },
    ...(filter.parameters?.length || filter.notes?.length ? [{ href: '#behavior', label: 'Behavior' }] : []),
    ...(filter.related?.length ? [{ href: '#related', label: 'Related filters' }] : []),
  ];

  return (
    <DocShell current="filters" title={filter.name} description={filter.summary} toc={toc}>
      <nav className="filter-breadcrumb" aria-label="Breadcrumb"><a href="/filters">Filters</a><span>/</span><code>{filter.name}</code></nav>
      {filter.environment === 'html' ? <Note title="HTML preset"><p>This filter needs browser-compatible DOM globals. Register <code>htmlFilters</code> from <code>knap/html</code> before using it.</p></Note> : null}

      <section id="syntax" className="doc-section">
        <h2>Syntax</h2>
        <div className="syntax-stack">{filter.syntax.map((syntax) => <code key={syntax}>{`{{ value | ${syntax} }}`}</code>)}</div>
        {filter.aliases?.length ? <p className="filter-alias-note">Also available as {filter.aliases.map((alias) => <code key={alias}>{alias}</code>)}.</p> : null}
      </section>

      <section id="examples" className="doc-section">
        <h2>{filter.examples.length === 1 ? 'Example' : 'Examples'}</h2>
        <div className="filter-examples">
          {filter.examples.map((item, exampleIndex) => (
            <article className="filter-example-card" key={`${filter.slug}-${exampleIndex}`}>
              <header><span>{String(exampleIndex + 1).padStart(2, '0')}</span><h3>{item.title}</h3></header>
              <div className="example-grid">
                <CodeBlock language="ts" label="Input" code={JSON.stringify(item.variables, null, 2)} />
                <CodeBlock label="Template" code={item.template} />
                <CodeBlock label="Output" code={item.expected} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {filter.parameters?.length || filter.notes?.length ? <section id="behavior" className="doc-section"><h2>Behavior</h2><ul className="behavior-list">{[...(filter.parameters ?? []), ...(filter.notes ?? [])].map((note) => <li key={note}>{note}</li>)}</ul></section> : null}

      {filter.related?.length ? (
        <section id="related" className="doc-section">
          <h2>Related filters</h2>
          <div className="related-filters">{filter.related.map((name) => { const related = filterDocsByName.get(name); return related ? <a href={`/filters/${related.slug}`} key={name}><code>{name}</code><span>{related.summary}</span></a> : null; })}</div>
        </section>
      ) : null}

      <nav className="filter-pagination" aria-label="Filter pages">
        {previous ? <a href={`/filters/${previous.slug}`}><small>Previous</small><span>← {previous.name}</span></a> : <span />}
        {next ? <a href={`/filters/${next.slug}`}><small>Next</small><span>{next.name} →</span></a> : <span />}
      </nav>
    </DocShell>
  );
}
