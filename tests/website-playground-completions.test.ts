import { describe, expect, test } from 'vitest';
import { templateCompletions } from '../website/src/lib/playground-completions';
import { filterDocs } from '../website/lib/filter-docs';
import { standardFilters } from '../src/filters';
import { createEngine } from '../src/engine';
import { filterParameters, playgroundFilterSuggestions } from '../website/lib/filter-completions';

const input = { title: 'Example', author: { name: 'Sam', address: { city: 'Paris' } }, cast: [{ actor: 'A' }, { role: 'B' }] };
const filters = [{ label: 'upper', type: 'function', info: 'Uppercase text' }];
const complete = (source: string, variables: Record<string, unknown> = input) => templateCompletions(source, source.length, variables, filters);
const labels = (source: string) => complete(source)?.options.map((option) => option.label);

describe('playground template completion', () => {
  test('suggests input variables and replaces only the typed prefix', () => {
    expect(labels('{{ ti')).toContain('title');
    expect(complete('{{ ti')?.from).toBe(3);
    expect(complete('{{ ', { fresh: true })?.options.map((option) => option.label)).toEqual(['fresh']);
  });

  test('resolves nested properties and numeric array access', () => {
    expect(labels('{{ author.')).toEqual(['name', 'address']);
    expect(labels('{{ author.address.c')).toEqual(['city']);
    expect(labels('{{ cast[0].')).toEqual(['actor']);
    expect(labels('{{ unknown.')).toEqual([]);
    expect(labels('{{ author.__proto__.')).toEqual([]);
    expect(labels('{% if author.na')).toEqual(['name', 'address']);
    expect(labels('{% if author.address.')).toEqual(['city']);
  });

  test('suggests filters after a single pipe and variables in arguments', () => {
    expect(complete('{{ title | up')?.options).toBe(filters);
    expect(labels('{{ title | replace:')).toContain('author');
    expect(labels('{% if title || ')).toContain('title');
    expect(labels('{{ title | replace:"|":')).toContain('title');
  });

  test.each(['{{ cast | list:', '{{ cast | wikilink | list:n', '{{ cast | list:numbered-', '{{ cast | list:"n', "{{ cast | list:'n", '{{ cast | list:(n', '{% set items = cast | list:'])('suggests list parameters in %s', (source) => {
    const result = templateCompletions(source, source.length, input, [{ label: 'list', type: 'function', parameterValues: ['numbered', 'task', 'numbered-task'] }]);
    expect(result?.options.map((option) => option.label)).toEqual(['numbered', 'task', 'numbered-task']);
    expect(source.slice(result?.from)).toBe(source.match(/[\w-]*$/)![0]);
  });

  test('keeps parameter replacement within existing quotes and handles hyphenated values', () => {
    const source = '{{ cast | list:"numbered-task" }}';
    const position = source.indexOf('numbered') + 3;
    const result = templateCompletions(source, position, input, [{ label: 'list', type: 'function', parameterValues: ['numbered-task'] }])!;
    expect(source.slice(0, result.from) + 'numbered-task' + source.slice(result.to)).toBe(source);
    expect(templateCompletions('{{ title | replace:"text | list:n', 32, input, [{ label: 'list', type: 'function', parameterValues: ['numbered'] }])).toBeNull();
  });

  test('documented parameter suggestions pass the actual filter validators', () => {
    for (const filter of filterDocs) {
      for (const value of filter.parameterValues ?? []) {
        expect(standardFilters[filter.name].metadata?.validateParams?.(value).valid, `${filter.name}:${value}`).toBe(true);
      }
    }
  });

  test('suggests logic tags and their expression variables', () => {
    expect(labels('{% en')).toEqual(expect.arrayContaining(['endif', 'endfor']));
    expect(labels('{% if au')).toContain('author');
    expect(labels('{% for member in ')).toContain('cast');
    expect(complete('{% for mem')).toBeNull();
    expect(complete('{% set new')).toBeNull();
  });

  test('infers loop properties across array members and restores nested scopes', () => {
    const loop = '{% for member in cast %}';
    expect(labels(loop + '{{ member.')).toEqual(['actor', 'role']);
    expect(labels(loop + '{{ loop.')).toEqual(['index', 'index0', 'first', 'last', 'length']);
    expect(labels(loop + '{{ ')).toContain('member_index');
    expect(labels(loop + '{% for member in cast %}{% endfor %}{{ member.')).toEqual(['actor', 'role']);
    expect(labels(loop + '{% endfor %}{{ ')).not.toContain('member');
    expect(labels(loop + '{% endfor %}{{ ')).not.toContain('loop');
  });

  test.each(['{% if cast ', '{% elseif cast ', '{% if author.name ', '{% if cast[0] ', '{% if (cast or title) ', '{% if title == "a b" ', '{% if cast | length '])('suggests operators after an expression: %s', (source) => {
    expect(labels(source)).toEqual(expect.arrayContaining(['==', '!=', '>', '<', '>=', '<=', 'contains', 'and', 'or', '&&', '||']));
    expect(labels(source)).not.toContain('cast');
    expect(labels(source)).not.toContain('not');
  });

  test.each(['{% if ', '{% if cast == ', '{% if cast contains ', '{% if cast and ', '{% if cast || ', '{% if not ', '{% if ('])('suggests operands where the expression needs a value: %s', (source) => {
    expect(labels(source)).toEqual(expect.arrayContaining(['cast', 'title', 'true', 'false', 'null', 'not', '!']));
    expect(labels(source)).not.toContain('==');
  });

  test('replaces only the typed operator prefix', () => {
    expect(complete('{% if cast co')).toMatchObject({ from: 11, to: 13 });
    expect(complete('{% if cast >')).toMatchObject({ from: 11, to: 12 });
    expect(templateCompletions('{% if cast >= %}', 12, input, filters)).toMatchObject({ from: 11, to: 13 });
  });

  test('includes assigned variables and infers their properties', () => {
    expect(labels('{% set person = author %}{{ person.')).toEqual(['name', 'address']);
    expect(labels('{% set heading = title | upper %}{{ ')).toContain('heading');
  });

  test.each(['ordinary text', '{{ title }} text', '{% endif %}', '{{ "unfinished', "{{ 'unfinished", '{{ title | replace:"escaped\\\"quote', '{{ title | replace:"}}" }} text'])('does not suggest inside text or strings: %s', (source) => {
    expect(complete(source)).toBeNull();
  });

  test('handles delimiters in quoted values and a cursor before an existing closing tag', () => {
    expect(labels('{{ title | replace:"}}":author.')).toEqual(['name', 'address']);
    expect(templateCompletions('{{ ti }}', 5, input, filters)?.from).toBe(3);
    expect(templateCompletions('{{ title }}', 5, input, filters)).toMatchObject({ from: 3, to: 8 });
  });
});

describe('filter argument completion catalog', () => {
  const suggest = (source: string, position = source.length, variables = input) => templateCompletions(source, position, variables, playgroundFilterSuggestions)!;
  const names = (source: string) => suggest(source)?.options.map((option) => option.label);
  const apply = (source: string, label: string, position = source.length) => {
    const result = suggest(source, position);
    const option = result.options.find((option) => option.label === label)!;
    expect(option, label).toBeDefined();
    return source.slice(0, result.from) + (option.apply ?? option.label) + source.slice(result.to);
  };

  test('covers every documented filter with parameters, including optional ones', () => {
    for (const doc of filterDocs.filter((doc) => doc.syntax.some((syntax) => syntax.startsWith(doc.name + ':')))) {
      expect(filterParameters[doc.name]?.length, doc.name).toBeGreaterThan(0);
      if (doc.environment === 'html') continue;
      for (const name of [doc.name, ...(doc.aliases ?? [])]) {
        expect(names(`{{ value | ${name}:`)?.length, name).toBeGreaterThan(0);
      }
    }
  });

  test.each(['{{ cast | sort:', '{{ cast | sort: ', '{{ cast | sort:d', '{{ cast | sort:"d', "{{ cast | sort:'d", '{{ cast | sort:( ', '{{ cast | slice:0,4 | sort:', '{% set ordered = cast | sort:'])('suggests sort directions and input properties in %s', (source) => {
    expect(names(source)).toEqual(expect.arrayContaining(['asc', 'desc', 'actor', 'role']));
    expect(names(source)).not.toContain('cast');
  });

  test.each(['{{ cast | sort:("actor", ', "{{ cast | sort:('actor', '", '{{ cast | sort:"actor", d'])('suggests only directions in the second sort argument: %s', (source) => {
    expect(names(source)).toEqual(['asc', 'desc']);
  });

  test('completes later and repeated arguments without splitting quoted punctuation', () => {
    expect(names('{{ cast | callout:("note", "A, B: C", ')).toEqual(['true', 'false']);
    expect(names('{{ title | number_format:(2, ".", ')).toContain(',');
    expect(names('{{ title | replace:("a,b|c":"new", "d":')).toContain('new');
    expect(names('{{ title | remove_attr:("class", "style", ')).toContain('href');
    expect(names('{{ cast | table:("First", "Second", ')).toContain('Column 1');
    expect(names('{{ cast | slice:0,')).toContain('4');
    expect(names('{{ title | bold:')).toEqual(['*', '_']);
    expect(names('{{ title | safe_name:')).toEqual(['windows', 'mac', 'linux']);
    expect(names('{{ cast | object:')).toEqual(['keys', 'values', 'array']);
  });

  test('infers nested and loop-local property paths', () => {
    const data = { ...input, cast: [{ actor: 'A', author: { name: 'Sam' } }] };
    for (const filter of ['sort', 'map', 'sum', 'where']) {
      const source = `{{ cast | ${filter}:"author.`;
      expect(suggest(source, source.length, data).options.map((option) => option.label)).toContain('author.name');
    }
    const source = '{% for group in groups %}{{ group.cast | sort:';
    expect(suggest(source, source.length, { ...input, groups: [data] } as typeof input).options.map((option) => option.label)).toContain('actor');
  });

  test('accepting a suggestion keeps existing quotes, following filters, and text intact', async () => {
    const engine = createEngine({ filters: standardFilters });
    for (const source of ['{{ cast | sort: | slice:0,4 }}', '{{ cast | sort:d | slice:0,4 }}', '{{ cast | sort:"de" | slice:0,4 }}', "{{ cast | sort:'de' | slice:0,4 }}"]) {
      const position = source.indexOf('sort:') + 5 + (source.includes('"de"') || source.includes("'de'") ? 2 : source.includes('sort:d') ? 1 : 0);
      const completed = apply(source, 'desc', position);
      expect(completed).toMatch(/sort:(?:"desc"|'desc') \| slice:0,4/);
      expect((await engine.render(completed, { variables: input })).errors).toEqual([]);
    }
    expect(apply('{{ cast | sort:"d', 'desc')).toBe('{{ cast | sort:"desc"');
    expect(apply('{{ title | replace:("old":', 'new')).toBe('{{ title | replace:("old":"new"');
  });

  test('does not treat strings or nested expressions as new filter arguments', () => {
    expect(names('{{ title | replace:"text | sort:')).toEqual(['old', '/[aeiou]/g']);
    expect(suggest('{{ cast | map:item => ({name: ')).not.toMatchObject({ options: expect.arrayContaining([expect.objectContaining({ label: 'asc' })]) });
  });

  test('all suggested argument values form valid filter syntax in their respective slots', async () => {
    const engine = createEngine({ filters: standardFilters });
    for (const [name, slots] of Object.entries(filterParameters)) {
      if (!standardFilters[name]) continue;
      for (const [index, slot] of slots.entries()) {
        const separator = name === 'replace' || name === 'replace_tags' ? ':' : ', ';
        const prefix = slots.slice(0, index).map((other) => other.values[0]).join(separator);
        const source = `{{ value | ${name}:${slots.length > 1 ? '(' : ''}${prefix}${index ? separator : ''}`;
        expect(suggest(source).options.length, `${name}, argument ${index + 1}`).toBeGreaterThan(0);
        for (const value of slot.values) {
          const args = slots.map((other, otherIndex) => otherIndex === index ? value : other.values[0]);
          const params = name === 'replace' || name === 'replace_tags' ? args.join(':') : args.length === 1 ? args[0] : `(${args.join(', ')})`;
          const validation = standardFilters[name].metadata?.validateParams?.(params);
          expect(validation?.valid ?? true, `${name}:${params}`).toBe(true);
          const result = engine.validate(`{{ value | ${name}:${params} }}`);
          expect(result, `${name}:${params}`).toEqual([]);
        }
      }
    }
  });
});
