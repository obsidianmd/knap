import { describe, expect, test, vi } from 'vitest';
import { evaluatePlayground, exampleInput, exampleTemplate } from '../website/src/lib/playground';
import { createPlaygroundInputValidator } from '../website/src/lib/playground-input';
import { homeExamples } from '../website/src/lib/home-examples';

describe('website playground', () => {
  test('validates JSON only when input changes, including invalid input', async () => {
    const validate = createPlaygroundInputValidator();
    const source = '{"title":"Original"}';
    const parse = vi.spyOn(JSON, 'parse');
    try {
      const input = validate(source);
      await evaluatePlayground(input, '{{ title }}');
      await evaluatePlayground(validate(source), 'Text: {{ title }}');
      expect(validate(source)).toBe(input);
      expect(parse.mock.calls.filter(([value]) => value === source)).toHaveLength(1);

      const invalid = validate('{');
      await evaluatePlayground(invalid, '{{ title }}');
      await evaluatePlayground(validate('{'), 'Other text');
      expect(validate('{')).toBe(invalid);
      expect(parse.mock.calls.filter(([value]) => value === '{')).toHaveLength(1);

      expect(validate('{"title":"Updated"}').variables).toEqual({ title: 'Updated' });
    } finally {
      parse.mockRestore();
    }
  });

  test('template assignments do not change cached input used by later renders', async () => {
    const input = createPlaygroundInputValidator()('{"title":"Original"}');
    await evaluatePlayground(input, '{% set title = "Changed" %}{{ title }}');
    expect((await evaluatePlayground(input, '{{ title }}')).output).toBe('Original');
  });

  test('renders the starter example using the standard filters and logic', async () => {
    const result = await evaluatePlayground(exampleInput, exampleTemplate);
    expect(result.inputError).toBeNull();
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.output).toContain('# The Matrix');
    expect(result.output).toContain('"[[Lana Wachowski]]"');
    const movie = homeExamples.find((example) => example.key === 'movie')!;
    expect(JSON.parse(exampleInput)).toEqual(movie.variables);
    expect(exampleTemplate).toBe(movie.template);
    expect(result.output).toBe(movie.markdown);
  });

  test('preserves the blank line between tables in a loop', async () => {
    const table = await evaluatePlayground(exampleInput, '{{ cast | table }}');
    const result = await evaluatePlayground(exampleInput, '{% for member in cast %}\n{{ cast | table }}\n\n{% endfor %}');
    expect(result.errors).toEqual([]);
    expect(result.output).toBe([table.output, table.output, table.output, table.output].join('\n\n') + '\n');
  });

  test.each(['{', '', 'null', '[]', '42', '"hello"', 'true'])('rejects invalid JSON object input: %s', async (input) => {
    const result = await evaluatePlayground(input, '{{ title }}');
    expect(result.inputError).toBeTruthy();
    expect(result.output).toBe('{{ title }}');
  });

  test.each([
    ['{% if title %}', 'PARSE_ERROR'],
    ['{{ title | nonexistent }}', 'UNKNOWN_FILTER'],
    ['{{ title | sort:("name", "sideways") }}', 'INVALID_FILTER_ARGUMENTS'],
  ])('validates templates independently of input: %s', async (template, code) => {
    const result = await evaluatePlayground('{', template);
    expect(result.inputError).toBeTruthy();
    expect(result.errors[0]).toMatchObject({ code, line: 1, column: expect.any(Number) });
    expect(result.output).toBe(template);
  });

  test('reports runtime filter validation errors while rendering the rest of the current template', async () => {
    const result = await evaluatePlayground('{"title":"Hello", "limit":"many"}', 'Before {{ title | truncate:limit }} after');
    expect(result.errors[0]?.code).toBe('INVALID_FILTER_ARGUMENTS');
    expect(result.output).toBe('Before  after');
  });

  test('keeps warnings non-fatal', async () => {
    const result = await evaluatePlayground('{"value":"not json"}', '{{ value | parse_json }}');
    expect(result.errors).toEqual([]);
    expect(result.warnings[0]?.code).toBe('INVALID_FILTER_INPUT');
    expect(result.output).toBe('not json');
  });

  test('supports empty templates and preserves HTML as output text', async () => {
    expect((await evaluatePlayground('{}', '')).output).toBe('');
    const result = await evaluatePlayground('{"value":"<script>alert(1)</script>"}', '{{ value }}');
    expect(result.output).toBe('<script>alert(1)</script>');
    expect(result.errors).toEqual([]);
  });

  test.each([
    ['{{ title }} {{ unfinished', 'Hello {{ unfinished'],
    ['{{ unfinished\n{{ title }}', '{{ unfinished\nHello'],
    ['{{ title }} {% unknown %}', 'Hello {% unknown %}'],
    ['{{ title }} {% endif %}', 'Hello {% endif %}'],
    ['{% if true %}Hi {{ title }}{% endif %', 'Hi Hello{% endif %'],
    ['{% if false %}Hidden{% endif %', '{% endif %'],
    ['{% for item in items %}{{ item }}{% endfor %', 'a\nb{% endfor %'],
    ['{% if %}{{ title }}{% endif %}', '{% if %}Hello{% endif %}'],
    ['{% if true %}{{ title }}', '{% if true %}Hello'],
    ['{{ "literal \\}\\}" }} {{ title }} {{ unfinished', 'literal }} Hello {{ unfinished'],
    ['{{ "literal }}" }} {{ title }} {{ unfinished', '{{ "literal }}" }} Hello {{ unfinished'],
    ['{{ title }} {{ }} end', 'Hello {{ }} end'],
  ])('renders the current template while preserving malformed syntax: %s', async (template, expected) => {
    const result = await evaluatePlayground('{"title":"Hello","items":["a","b"]}', template);
    expect(result.output).toBe(expected);
    expect(result.errors.some((error) => error.code === 'PARSE_ERROR')).toBe(true);
  });

  test('renders the movie example with its incomplete endif visible', async () => {
    const result = await evaluatePlayground(exampleInput, exampleTemplate.slice(0, -1));
    expect(result.output).toContain('# The Matrix');
    expect(result.output).toContain('| Keanu Reeves       | Neo         |');
    expect(result.output).toContain('{% endif %');
    expect(result.errors.some((error) => error.line === 15)).toBe(true);
  });

  test('retains original diagnostic positions after recovering multiline syntax', async () => {
    const result = await evaluatePlayground('{"title":"Hello","date":"invalid"}', '{{ unfinished\ntext\n{{ title | nonexistent }}\n{{ date | date:"YYYY" }}');
    expect(result.output).toContain('Hello');
    expect(result.errors.find((error) => error.code === 'UNKNOWN_FILTER')?.line).toBe(3);
    expect(result.warnings[0]?.line).toBe(4);
  });

  test('validation errors do not block the current engine result', async () => {
    const result = await evaluatePlayground('{"title":"Hello"}', '{{ title | nonexistent }} world');
    expect(result.output).toBe('Hello world');
    expect(result.errors[0]?.code).toBe('UNKNOWN_FILTER');
  });
});
