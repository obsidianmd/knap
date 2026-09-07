import { describe, expect, test } from 'vitest';
import { templateCompletions } from '../website/src/lib/playground-completions';
import { filterDocs } from '../website/lib/filter-docs';
import { standardFilters } from '../src/filters';

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
