'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { filterDocs } from '@/lib/filter-docs';

const resultLimit = 12;

export function FilterSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => filterDocs.filter((filter) => [
    filter.name,
    ...(filter.aliases ?? []),
    filter.category,
    filter.summary,
    ...filter.syntax,
  ].join(' ').toLowerCase().includes(normalizedQuery)).slice(0, resultLimit), [normalizedQuery]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setQuery('');
        setActiveIndex(0);
        setOpen(true);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const close = () => setOpen(false);
  const openSearch = () => {
    setQuery('');
    setActiveIndex(0);
    setOpen(true);
  };
  const navigateToActive = () => {
    const result = results[activeIndex];
    if (result) window.location.assign(`/filters/${result.slug}`);
  };

  return (
    <>
      <button className="filter-search-trigger" type="button" onClick={openSearch} aria-haspopup="dialog">
        <span>Search</span><kbd>⌘K</kbd>
      </button>
      {open ? (
        <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-label="Search filters">
            <header>
              <span aria-hidden="true">⌕</span>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((current) => Math.min(current + 1, results.length - 1)); }
                  if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((current) => Math.max(current - 1, 0)); }
                  if (event.key === 'Enter') { event.preventDefault(); navigateToActive(); }
                }}
                placeholder="Search filters…"
                aria-label="Search filters"
                aria-controls="filter-search-results"
                aria-activedescendant={results[activeIndex] ? `filter-result-${results[activeIndex].slug}` : undefined}
              />
              <button type="button" onClick={close} aria-label="Close search">Esc</button>
            </header>
            <div className="command-results" id="filter-search-results" role="listbox">
              {results.map((filter, index) => (
                <a
                  id={`filter-result-${filter.slug}`}
                  className={index === activeIndex ? 'is-active' : undefined}
                  href={`/filters/${filter.slug}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  key={filter.name}
                >
                  <span><code>{filter.name}</code><small>{filter.category}</small></span>
                  <p>{filter.summary}</p>
                  <strong aria-hidden="true">↵</strong>
                </a>
              ))}
              {results.length === 0 ? <p className="command-empty">No filters match “{query}”.</p> : null}
            </div>
            <footer><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span><span>{filterDocs.length} filters</span></footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
