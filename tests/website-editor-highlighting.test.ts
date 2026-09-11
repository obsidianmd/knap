import { describe, expect, test } from 'vitest';
import { editorHighlightRanges, editorLanguage } from '../website/src/lib/editor-highlighting';
import { templateLanguage } from '../website/src/scripts/playground-template-editor';

const tokens = (line: string, language: 'json' | 'md', frontmatter = false) =>
  editorHighlightRanges(line, language, frontmatter).map((range) => [line.slice(range.from, range.to), range.className]);

describe('CodeMirror highlighting uses the existing website colors', () => {
  test('mutes template comments across lines, including embedded template syntax', () => {
    const source = '{#\n{{ ignored }}\n#}{{ title }}';
    const tree = templateLanguage.parser.parse(source);
    const comments: string[] = [];
    tree.iterate({ enter(node) { if (node.name === 'comment') comments.push(source.slice(node.from, node.to)); } });
    expect(comments.join('\n')).toBe('{#\n{{ ignored }}\n#}');
    expect(tree.length).toBe(source.length);
  });

  test('does not treat comment delimiters inside template strings as comments', () => {
    const source = '{{ "{# literal #}" }}';
    const comments: string[] = [];
    templateLanguage.parser.parse(source).iterate({ enter(node) {
      if (node.name === 'comment') comments.push(source.slice(node.from, node.to));
    } });
    expect(comments).toEqual([]);
  });
  test('keeps JSON keys, strings, quotes, constants, and numbers distinct', () => {
    const result = tokens('"year": 1999, "title": "The Matrix", "flag": true, "empty": null', 'json');
    expect(result).toEqual(expect.arrayContaining([
      ['year', 'syn-variable'], ['1999', 'syn-number'], ['The Matrix', 'syn-string'],
      ['"', 'syn-punctuation'], ['true', 'syn-constant'], ['null', 'syn-constant'],
    ]));
  });

  test('keeps Markdown heading text, markers, and links distinct', () => {
    expect(tokens('# **Heading** [link](https://example.com)', 'md')).toEqual(expect.arrayContaining([
      ['#', 'syn-punctuation'], ['**', 'syn-punctuation'], ['Heading', 'syn-md-heading'],
      ['link', 'syn-md-link'], ['https://example.com', 'syn-md-link'], ['[', 'syn-punctuation'],
    ]));
    expect(tokens('- #tag', 'md')).toEqual(expect.arrayContaining([['-', 'syn-punctuation'], ['#', 'syn-punctuation']]));
  });

  test('uses cyan for quoted YAML list values only inside frontmatter', () => {
    expect(tokens('- "Action"', 'md', true)).toContainEqual(['Action', 'syn-string']);
    expect(tokens('- "Action"', 'md')).not.toContainEqual(['Action', 'syn-string']);
  });

  test.each(['"<span> &amp; \\"quoted\\" 😄"', '# **<>&"😄**', 'a &lt; b', '', '\t  ', 'e\u0301', '"\\u1234"'])('retains exact source offsets for escaped HTML and Unicode: %s', (line) => {
    for (const language of ['json', 'md'] as const) {
      const ranges = editorHighlightRanges(line, language);
      expect(ranges.map((range) => line.slice(range.from, range.to)).join('')).toBe(line);
      ranges.forEach((range, index) => expect(range.from).toBe(index ? ranges[index - 1].to : 0));
      expect(ranges.at(-1)?.to ?? 0).toBe(line.length);
    }
  });

  test('the CodeMirror parser consumes multiline frontmatter and empty lines', () => {
    const source = '---\n\ngenre:\n- "Action"\n---\n\n# Heading\n- "Quotation"';
    const tree = editorLanguage('md').parser.parse(source);
    expect(tree.length).toBe(source.length);
    const styled: string[] = [];
    tree.iterate({ enter(node) { if (node.name === 'syn-string') styled.push(source.slice(node.from, node.to)); } });
    expect(styled).toContain('Action');
    expect(styled).not.toContain('Quotation');
  });
});
