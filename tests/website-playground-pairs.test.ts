import { expect, test } from 'vitest';
import { emptyTemplatePair, pairTemplateInput } from '../website/src/lib/playground-pairs';

test.each([
  ['{', 1, '{', '{{}}', 2],
  ['{', 1, '%', '{%%}', 2],
  ['', 0, '{{', '{{}}', 2],
  ['', 0, '{%', '{%%}', 2],
  ['Hello { world', 7, '{', 'Hello {{}} world', 8],
  ['{}}', 1, '{', '{{}}', 2],
  ['{{ title }}', 9, '}', '{{ title }}', 10],
  ['{{ title }}', 10, '}', '{{ title }}', 11],
  ['{% if cast %}', 11, '%', '{% if cast %}', 12],
  ['{% if cast %}', 12, '}', '{% if cast %}', 13],
])('pairs or skips delimiters in %j at %i with %j', (source, position, text, expected, anchor) => {
  const edit = pairTemplateInput(source, position, position, text)!;
  expect(edit).not.toBeNull();
  expect(source.slice(0, edit.from) + edit.insert + source.slice(edit.to)).toBe(expected);
  expect(edit.anchor).toBe(anchor);
});

test.each([
  ['plain text', 'x'], ['{', 'x'], ['{{ ', '{'], ['{{ "', '{{'], ['{% set value = "', '{%'],
])('leaves ordinary typing and tag contents unchanged: %j + %j', (source, text) => {
  expect(pairTemplateInput(source, source.length, source.length, text)).toBeNull();
});

test('does not replace pasted templates or selected text with pairs', () => {
  expect(pairTemplateInput('', 0, 0, '{{ title }}')).toBeNull();
  expect(pairTemplateInput('title', 0, 5, '{{')).toBeNull();
});

test('backspace removes empty pairs without affecting literals', () => {
  expect(emptyTemplatePair('{{}}', 2)).toEqual({ from: 0, to: 4 });
  expect(emptyTemplatePair('{%%}', 2)).toEqual({ from: 0, to: 4 });
  expect(emptyTemplatePair('{{ title }}', 2)).toBeNull();
  expect(emptyTemplatePair('{{ "{{}}" }}', 6)).toBeNull();
});
