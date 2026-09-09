import { expect, test } from 'vitest';
import { evaluatePlayground } from '../website/src/lib/playground';
import { parsePlaygroundInput } from '../website/src/lib/playground-input';
import { playgroundHref, readPlaygroundExample } from '../website/src/lib/playground-link';
import { editorHighlightRanges, editorLanguage } from '../website/src/lib/editor-highlighting';
import { highlightLine } from '../website/src/lib/highlight';
import { playgroundLimits, limitDiagnostics } from '../website/src/lib/playground-limits';

test('bounds amplified output before returning it to the editor', async () => {
  const source = '{% set x = x | replace:"[":"[[" %}'.repeat(17) + '{{ x }}';
  const result = await evaluatePlayground('{"x":"["}', source);
  expect(result.output).toBe('');
  expect(result.errors[0]).toMatchObject({ code: 'LIMIT_EXCEEDED' });
});

test('bounds data before JSON parsing', () => {
  const result = parsePlaygroundInput(' '.repeat(playgroundLimits.input + 1));
  expect(result.variables).toBeNull();
  expect(result.error).toContain('too large');
});

test('bounds template parsing even with invalid data', async () => {
  const result = await evaluatePlayground('', 'x'.repeat(playgroundLimits.template + 1));
  expect(result.output).toBe('');
  expect(result.errors[0].code).toBe('LIMIT_EXCEEDED');
});

test('rejects oversized examples in current and legacy links', () => {
  const example = { input: '{}', template: 'x'.repeat(playgroundLimits.template + 1) };
  expect(() => playgroundHref(example)).toThrow('too large');
  expect(readPlaygroundExample('#' + new URLSearchParams(example))).toBeNull();
  expect(readPlaygroundExample('#example=' + encodeURIComponent(JSON.stringify(example)))).toBeNull();
  expect(readPlaygroundExample('#' + 'x'.repeat(playgroundLimits.hash))).toBeNull();
});

test.each(['[', '>', '<img onerror=x>'])('renders long lines as plain text: %s', value => {
  const source = value.repeat(20_000);
  expect(editorHighlightRanges(source, 'md')).toEqual([{ from: 0, to: source.length, className: null }]);
  expect(editorLanguage('md').parser.parse(source).length).toBe(source.length);
  expect(highlightLine(source, 'md')).not.toContain('<img');
  expect(highlightLine(source, 'md')).not.toContain('<span');
});

test('keeps literal markup in shared examples as editor text', async () => {
  const input = JSON.stringify({ value: '<img src=x onerror=alert(1)>' });
  const example = readPlaygroundExample(playgroundHref({ input, template: '{{ value }}' }).slice('/playground'.length))!;
  const result = await evaluatePlayground(example.input, example.template);
  expect(result.output).toBe('<img src=x onerror=alert(1)>');
  expect(highlightLine(result.output, 'md')).toContain('&lt;img');
});

test('bounds diagnostics before showing them', () => {
  const diagnostics = limitDiagnostics(Array.from({ length: 1000 }, () => ({ message: 'x'.repeat(2000) })));
  expect(diagnostics).toHaveLength(100);
  expect(diagnostics[0].message).toHaveLength(1001);
});
