import type { FilterDoc, FilterGroup } from '@/lib/filter-docs';

export function FilterDirectory({ groups, filters }: { groups: FilterGroup[]; filters: FilterDoc[] }) {
  const byName = new Map(filters.map((filter) => [filter.name, filter]));

  return (
    <div className="filter-directory">
      {groups.map((group) => {
        const visible = group.filters.map((name) => byName.get(name)).filter((filter): filter is FilterDoc => Boolean(filter));
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
    </div>
  );
}
