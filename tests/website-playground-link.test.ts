import { describe, expect, test } from 'vitest';
import { playgroundHref, readPlaygroundExample } from '../website/src/lib/playground-link';
import { homeExamples } from '../website/src/lib/home-examples';
import { evaluatePlayground } from '../website/src/lib/playground';

describe('playground example links', () => {
  test('round trips JSON and templates containing Unicode and URL delimiters', () => {
    const example = { input: '{"title":"你好 # & % ="}', template: '{{ title }}\n{{ "é" }}' };
    const url = new URL(playgroundHref(example), 'https://knap.md');
    expect(url.pathname).toBe('/playground');
    expect(url.search).toBe('');
    expect(readPlaygroundExample(url.hash)).toEqual(example);
  });
  test.each(['', '#examples', '#example=%', '#example=null', '#example={}', '#example=%7B%22input%22%3A42%7D'])('ignores malformed payload %s', hash => {
    expect(readPlaygroundExample(hash)).toBeNull();
  });
  test('allows empty editor contents', () => {
    expect(readPlaygroundExample(playgroundHref({ input: '', template: '' }).slice('/playground'.length))).toEqual({ input: '', template: '' });
  });
  test.each(homeExamples)('loads the complete $label homepage example', async example => {
    const payload = readPlaygroundExample(playgroundHref({ input: JSON.stringify(example.variables), template: example.template }).slice('/playground'.length))!;
    const result = await evaluatePlayground(payload.input, payload.template);
    expect(result.errors).toEqual([]);
    expect(result.output).toBe(example.markdown);
  });
});
