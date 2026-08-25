'use client';

import { useMemo, useState } from 'react';
import type { FilterDoc, FilterGroup } from '@/lib/filter-docs';

export function FilterDirectory({ groups, filters }: { groups: FilterGroup[]; filters: FilterDoc[] }) {
  const [query, setQuery] = useState('');
  const byName = useMemo(() => new Map(filters.map((filter) => [filter.name, filter])), [filters]);
  const normalizedQuery = query.trim().toLowerCase();
  const matches = (filter: FilterDoc) => !normalizedQuery || [filter.name, ...(filter.aliases ?? []), filter.category, filter.summary].join(' ').toLowerCase().includes(normalizedQuery);
  const visibleCount = filters.filter(matches).length;

  return (
    <div className="filter-directory">
      <label className="filter-search">
        <span>Search filters</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try date, array, Markdown…" />
        <small>{visibleCount} {visibleCount === 1 ? 'filter' : 'filters'}</small>
      </label>

      {groups.map((group) => {
        const visible = group.filters.map((name) => byName.get(name)).filter((filter): filter is FilterDoc => Boolean(filter && matches(filter)));
        if (visible.length === 0) return null;
        return (
          <section className="filter-directory-group" key={group.id}>
            <header><h3>{group.label}</h3><p>{group.intro}</p></header>
            <div className="filter-list">
              {visible.map((filter) => (
                <a className="filter-row" href={`/filters/${filter.slug}`} key={filter.name}>
                  <div><code>{filter.name}</code>{filter.aliases?.length ? <small>alias: {filter.aliases.join(', ')}</small> : null}</div>
                  <p>{filter.summary}</p>
                  <code className="filter-example">{filter.syntax[0]}</code>
                  <span aria-hidden="true">→</span>
                </a>
              ))}
            </div>
          </section>
        );
      })}
      {visibleCount === 0 ? <p className="filter-empty">No filters match “{query}”.</p> : null}
    </div>
  );
}
