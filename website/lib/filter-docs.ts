export type FilterExample = {
  title: string;
  variables: Record<string, unknown>;
  template: string;
  expected: string;
  testable?: boolean;
};

export type FilterDoc = {
  slug: string;
  name: string;
  aliases?: string[];
  category: string;
  summary: string;
  syntax: string[];
  parameters?: string[];
  notes?: string[];
  environment?: 'standard' | 'html';
  related?: string[];
  examples: FilterExample[];
};

export type FilterGroup = {
  id: string;
  label: string;
  intro: string;
  filters: string[];
};

const example = (
  variables: Record<string, unknown>,
  template: string,
  expected: string,
  title = 'Basic usage',
): FilterExample => ({ title, variables, template, expected });

const docs: FilterDoc[] = [
  { slug: 'date', name: 'date', category: 'Dates and time', summary: 'Format a date with Day.js format tokens.', syntax: ['date:"YYYY-MM-DD"', 'date:("YYYY-MM-DD", "MM/DD/YYYY")'], parameters: ['The first parameter is the output format.', 'An optional second parameter describes the input format.'], related: ['date_modify', 'duration'], examples: [example({ published: '2024-12-01' }, '{{ published | date:"MMMM D, YYYY" }}', 'December 1, 2024')] },
  { slug: 'date-modify', name: 'date_modify', category: 'Dates and time', summary: 'Add or subtract a date interval.', syntax: ['date_modify:"+1 day"'], parameters: ['Use a signed amount followed by year, month, week, day, hour, minute, or second.'], related: ['date'], examples: [example({ published: '2024-12-01' }, '{{ published | date_modify:"+5 days" }}', '2024-12-06')] },
  { slug: 'duration', name: 'duration', category: 'Dates and time', summary: 'Format seconds or an ISO 8601 duration.', syntax: ['duration', 'duration:"H:mm:ss"'], parameters: ['The optional format supports H, HH, mm, and ss tokens.'], related: ['date'], examples: [example({ seconds: 3665 }, '{{ seconds | duration:"H:mm:ss" }}', '1:01:05')] },

  { slug: 'camel', name: 'camel', category: 'Text', summary: 'Convert text to camelCase.', syntax: ['camel'], related: ['kebab', 'pascal', 'snake', 'uncamel'], examples: [example({ title: 'Hello world' }, '{{ title | camel }}', 'helloWorld')] },
  { slug: 'capitalize', name: 'capitalize', category: 'Text', summary: 'Uppercase the first character and lowercase the rest.', syntax: ['capitalize'], related: ['lower', 'title', 'upper'], examples: [example({ title: 'hELLO wORLD' }, '{{ title | capitalize }}', 'Hello world')] },
  { slug: 'decode-uri', name: 'decode_uri', category: 'Text', summary: 'Decode percent-encoded URI text.', syntax: ['decode_uri'], examples: [example({ value: 'hello%20world' }, '{{ value | decode_uri }}', 'hello world')] },
  { slug: 'kebab', name: 'kebab', category: 'Text', summary: 'Convert text to kebab-case.', syntax: ['kebab'], related: ['camel', 'pascal', 'snake'], examples: [example({ title: 'Hello World' }, '{{ title | kebab }}', 'hello-world')] },
  { slug: 'lower', name: 'lower', category: 'Text', summary: 'Convert text to lowercase.', syntax: ['lower'], related: ['capitalize', 'title', 'upper'], examples: [example({ title: 'HELLO WORLD' }, '{{ title | lower }}', 'hello world')] },
  { slug: 'pascal', name: 'pascal', category: 'Text', summary: 'Convert text to PascalCase.', syntax: ['pascal'], related: ['camel', 'kebab', 'snake'], examples: [example({ title: 'hello world' }, '{{ title | pascal }}', 'HelloWorld')] },
  { slug: 'replace', name: 'replace', category: 'Text', summary: 'Replace one or more strings or regular expressions.', syntax: ['replace:"old":"new"', 'replace:("a":"b", "c":"d")'], parameters: ['Each quoted search value is followed by a colon and its replacement.', 'Regular expressions may include flags, for example "/[aeiou]/g".'], examples: [example({ message: 'hello world' }, '{{ message | replace:"e":"a","o":"0" }}', 'hall0 w0rld')] },
  { slug: 'safe-name', name: 'safe_name', category: 'Text', summary: 'Remove characters that are unsafe in file names.', syntax: ['safe_name', 'safe_name:windows'], parameters: ['Optionally choose windows, mac, or linux rules. The default is conservative.'], examples: [example({ title: 'notes/2024: recap?' }, '{{ title | safe_name }}', 'notes2024 recap')] },
  { slug: 'snake', name: 'snake', category: 'Text', summary: 'Convert text to snake_case.', syntax: ['snake'], related: ['camel', 'kebab', 'pascal'], examples: [example({ title: 'Hello World' }, '{{ title | snake }}', 'hello_world')] },
  { slug: 'title', name: 'title', category: 'Text', summary: 'Convert text to Title Case.', syntax: ['title'], related: ['capitalize', 'lower', 'upper'], examples: [example({ title: 'hello world' }, '{{ title | title }}', 'Hello World')] },
  { slug: 'trim', name: 'trim', category: 'Text', summary: 'Remove whitespace from both ends of a value.', syntax: ['trim'], examples: [example({ title: '  hello world  ' }, '{{ title | trim }}', 'hello world')] },
  { slug: 'uncamel', name: 'uncamel', category: 'Text', summary: 'Convert camelCase or PascalCase to spaced lowercase text.', syntax: ['uncamel'], related: ['camel'], examples: [example({ name: 'myHTMLParser' }, '{{ name | uncamel }}', 'my html parser')] },
  { slug: 'unescape', name: 'unescape', category: 'Text', summary: 'Turn escaped quotes and newlines into literal characters.', syntax: ['unescape'], examples: [example({ value: 'line1\\nline2' }, '{{ value | unescape }}', 'line1\nline2')] },
  { slug: 'upper', name: 'upper', category: 'Text', summary: 'Convert text to uppercase.', syntax: ['upper'], related: ['capitalize', 'lower', 'title'], examples: [example({ title: 'Hello world' }, '{{ title | upper }}', 'HELLO WORLD')] },

  { slug: 'blockquote', name: 'blockquote', category: 'Markdown', summary: 'Prefix every line as a Markdown blockquote.', syntax: ['blockquote'], examples: [example({ quote: 'First line\nSecond line' }, '{{ quote | blockquote }}', '> First line\n> Second line')] },
  { slug: 'callout', name: 'callout', category: 'Markdown', summary: 'Create an Obsidian callout.', syntax: ['callout', 'callout:("info", "Title", false)'], parameters: ['Parameters are callout type, optional title, and optional fold state.', 'Use true for collapsed and false for expanded.'], related: ['blockquote'], examples: [example({ message: 'Remember this' }, '{{ message | callout:("tip", "Note") }}', '> [!tip] Note\n> Remember this')] },
  { slug: 'footnote', name: 'footnote', category: 'Markdown', summary: 'Convert an array or object to Markdown footnote definitions.', syntax: ['footnote'], examples: [example({ notes: ['First item', 'Second item'] }, '{{ notes | footnote }}', '[^1]: First item\n\n[^2]: Second item')] },
  { slug: 'fragment-link', name: 'fragment_link', category: 'Markdown', summary: 'Add a source URL with a text-fragment anchor to highlights.', syntax: ['fragment_link:"https://example.com"'], parameters: ['Pass the source URL as the parameter.'], related: ['link'], examples: [example({ highlights: ['Selected text', 'Another passage'] }, '{{ highlights | fragment_link:"https://example.com" }}', '["Selected text [link](https://example.com#:~:text=Selected%20text)","Another passage [link](https://example.com#:~:text=Another%20passage)"]')] },
  { slug: 'image', name: 'image', category: 'Markdown', summary: 'Create Markdown image syntax from a URL, array, or object.', syntax: ['image', 'image:"Alt text"'], parameters: ['The optional parameter is alt text for string and array inputs.'], related: ['link'], examples: [example({ url: 'cover.jpg' }, '{{ url | image:"Cover art" }}', '![Cover art](cover.jpg)')] },
  { slug: 'link', name: 'link', category: 'Markdown', summary: 'Create Markdown links from a URL, array, or object.', syntax: ['link', 'link:"Link text"'], parameters: ['The optional parameter is link text for string and array inputs.'], related: ['fragment_link', 'image', 'wikilink'], examples: [example({ url: 'https://example.com' }, '{{ url | link:"Example" }}', '[Example](https://example.com)')] },
  { slug: 'list', name: 'list', category: 'Markdown', summary: 'Convert a value or array to a Markdown list.', syntax: ['list', 'list:numbered', 'list:task', 'list:numbered-task'], parameters: ['Choose bullet (default), numbered, task, or numbered-task.'], related: ['table'], examples: [example({ items: ['Apple', 'Pear'] }, '{{ items | list }}', '- Apple\n- Pear')] },
  { slug: 'table', name: 'table', category: 'Markdown', summary: 'Convert arrays or objects to a Markdown table.', syntax: ['table', 'table:("Column 1", "Column 2")'], parameters: ['Optional parameters set column headers. Object keys are used by default.'], related: ['list'], examples: [example({ people: [{ name: 'Ada', role: 'Engineer' }, { name: 'Lin', role: 'Designer' }] }, '{{ people | table }}', '| name | role |\n| - | - |\n| Ada | Engineer |\n| Lin | Designer |')] },
  { slug: 'wikilink', name: 'wikilink', category: 'Markdown', summary: 'Create an Obsidian wikilink.', syntax: ['wikilink', 'wikilink:"Alias"'], parameters: ['The optional parameter sets an alias for string and array inputs.'], related: ['link'], examples: [example({ page: 'Project Atlas' }, '{{ page | wikilink:"Atlas" }}', '[[Project Atlas|Atlas]]')] },
  { slug: 'yaml', name: 'yaml', category: 'Markdown', summary: 'Quote a value safely for a YAML scalar.', syntax: ['yaml'], notes: ['Canonical numbers, booleans, and null are preserved. Ambiguous strings are quoted.'], examples: [example({ title: 'A: value #1' }, '{{ title | yaml }}', '"A: value #1"')] },

  { slug: 'calc', name: 'calc', category: 'Numbers', summary: 'Apply a simple arithmetic operation to a number.', syntax: ['calc:"+10"', 'calc:"*2"', 'calc:"**3"'], parameters: ['Supported operators are +, -, *, /, **, and ^.'], related: ['round', 'number_format'], examples: [example({ count: 5 }, '{{ count | calc:"+10" }}', '15')] },
  { slug: 'number-format', name: 'number_format', category: 'Numbers', summary: 'Add thousands separators and optional decimal places.', syntax: ['number_format', 'number_format:2'], parameters: ['The optional parameter sets the number of decimal places.'], related: ['calc', 'round'], examples: [example({ amount: 1234567.89 }, '{{ amount | number_format:2 }}', '1,234,567.89')] },
  { slug: 'round', name: 'round', category: 'Numbers', summary: 'Round a number to an optional number of decimal places.', syntax: ['round', 'round:2'], parameters: ['The optional non-negative parameter sets decimal places.'], related: ['calc', 'number_format'], examples: [example({ value: 3.14159 }, '{{ value | round:2 }}', '3.14')] },

  { slug: 'first', name: 'first', category: 'Collections', summary: 'Return the first item in an array.', syntax: ['first'], related: ['last', 'slice'], examples: [example({ items: ['a', 'b', 'c'] }, '{{ items | first }}', 'a')] },
  { slug: 'join', name: 'join', category: 'Collections', summary: 'Join array items with an optional separator.', syntax: ['join', 'join:", "'], parameters: ['The default separator is a comma. Escaped newlines are supported.'], related: ['split'], examples: [example({ tags: ['notes', 'ideas', 'books'] }, '{{ tags | join:", " }}', 'notes, ideas, books')] },
  { slug: 'last', name: 'last', category: 'Collections', summary: 'Return the last item in an array.', syntax: ['last'], related: ['first', 'slice'], examples: [example({ items: ['a', 'b', 'c'] }, '{{ items | last }}', 'c')] },
  { slug: 'length', name: 'length', category: 'Collections', summary: 'Count string characters, array items, or object keys.', syntax: ['length'], examples: [example({ tags: ['notes', 'ideas', 'books'] }, '{{ tags | length }}', '3')] },
  { slug: 'map', name: 'map', category: 'Collections', summary: 'Map array items with a small arrow-function expression.', syntax: ['map:item => item.name', 'map:item => ({name: item.name})'], parameters: ['The expression can select nested properties or construct a small object.'], related: ['template'], examples: [example({ people: [{ name: 'Ada' }, { name: 'Lin' }] }, '{{ people | map:person => person.name }}', '["Ada","Lin"]')] },
  { slug: 'merge', name: 'merge', category: 'Collections', summary: 'Append one or more values to an array.', syntax: ['merge:"value"', 'merge:("a", "b")'], related: ['unique'], examples: [example({ tags: ['notes', 'ideas'] }, '{{ tags | merge:"books" }}', '["notes","ideas","books"]')] },
  { slug: 'nth', name: 'nth', category: 'Collections', summary: 'Select positions from an array with nth-pattern syntax.', syntax: ['nth:3', 'nth:2n', 'nth:n+3', 'nth:2,3:4'], parameters: ['Indexes are one-based. Patterns support a single position, every nth item, an offset, or positions within repeating groups.'], related: ['first', 'last', 'slice'], examples: [example({ items: ['a', 'b', 'c', 'd', 'e', 'f'] }, '{{ items | nth:2n }}', '["b","d","f"]')] },
  { slug: 'object', name: 'object', category: 'Collections', summary: 'Convert an object to keys, values, or key-value pairs.', syntax: ['object:keys', 'object:values', 'object:array'], parameters: ['A mode parameter is required: keys, values, or array.'], examples: [example({ person: { name: 'Ada', role: 'Engineer' } }, '{{ person | object:keys }}', '["name","role"]')] },
  { slug: 'reverse', name: 'reverse', category: 'Collections', summary: 'Reverse a string or array.', syntax: ['reverse'], related: ['slice'], examples: [example({ items: ['a', 'b', 'c'] }, '{{ items | reverse }}', '["c","b","a"]')] },
  { slug: 'slice', name: 'slice', category: 'Collections', summary: 'Extract part of a string or array.', syntax: ['slice:1', 'slice:1,4'], parameters: ['The first index is inclusive and the second is exclusive. Negative indexes count from the end.'], related: ['first', 'last'], examples: [example({ word: 'hello' }, '{{ word | slice:1,4 }}', 'ell')] },
  { slug: 'split', name: 'split', category: 'Collections', summary: 'Split a string into a JSON array.', syntax: ['split', 'split:","', 'split:[0-9]'], parameters: ['Without a separator, the value is split into characters. The separator may be a regular-expression pattern.'], related: ['join'], examples: [example({ value: 'a,b,c' }, '{{ value | split:"," }}', '["a","b","c"]')] },
  { slug: 'template', name: 'template', category: 'Collections', summary: 'Render each array item with a small ${property} template.', syntax: ['template:"${name}"'], parameters: ['The template parameter can reference nested object properties. Items are separated by a blank line.'], related: ['map'], examples: [example({ people: [{ name: 'Ada', role: 'Engineer' }, { name: 'Lin', role: 'Designer' }] }, '{{ people | template:"${name} — ${role}" }}', 'Ada — Engineer\n\nLin — Designer')] },
  { slug: 'unique', name: 'unique', category: 'Collections', summary: 'Remove duplicate array items.', syntax: ['unique'], related: ['merge'], examples: [example({ tags: ['notes', 'ideas', 'notes'] }, '{{ tags | unique }}', '["notes","ideas"]')] },

  { slug: 'remove-attr', name: 'remove_attr', category: 'HTML cleanup', summary: 'Remove selected attributes from HTML tags.', syntax: ['remove_attr:"class"', 'remove_attr:("class", "style")'], related: ['strip_attr'], examples: [example({ html: '<div class="card" id="intro">Hello</div>' }, '{{ html | remove_attr:"class" }}', '<div id="intro">Hello</div>')] },
  { slug: 'remove-tags', name: 'remove_tags', category: 'HTML cleanup', summary: 'Remove selected HTML tags but keep their content.', syntax: ['remove_tags:"b"', 'remove_tags:("b", "em")'], related: ['strip_tags', 'remove_html'], examples: [example({ html: '<p>Hello <b>world</b>!</p>' }, '{{ html | remove_tags:"b" }}', '<p>Hello world!</p>')] },
  { slug: 'replace-tags', name: 'replace_tags', category: 'HTML cleanup', summary: 'Rename selected HTML tags while preserving content.', syntax: ['replace_tags:"strong":"h2"'], examples: [example({ html: '<strong>Title</strong>' }, '{{ html | replace_tags:"strong":"h2" }}', '<h2>Title</h2>')] },
  { slug: 'strip-attr', name: 'strip_attr', category: 'HTML cleanup', summary: 'Remove every HTML attribute except an optional allowlist.', syntax: ['strip_attr', 'strip_attr:"href"'], related: ['remove_attr'], examples: [example({ html: '<a href="/about" class="nav">About</a>' }, '{{ html | strip_attr:"href" }}', '<a href="/about">About</a>')] },
  { slug: 'strip-md', name: 'strip_md', aliases: ['stripmd'], category: 'HTML cleanup', summary: 'Remove Markdown formatting while keeping readable text.', syntax: ['strip_md', 'stripmd'], related: ['strip_tags'], examples: [example({ text: '**Bold** and [linked](https://example.com)' }, '{{ text | strip_md }}', 'Bold and linked')] },
  { slug: 'strip-tags', name: 'strip_tags', category: 'HTML cleanup', summary: 'Remove all HTML tags except an optional allowlist.', syntax: ['strip_tags', 'strip_tags:"b"'], related: ['remove_tags', 'strip_md'], examples: [example({ html: '<p>Hello <b>world</b>!</p>' }, '{{ html | strip_tags }}', 'Hello world!')] },

  { slug: 'html-to-json', name: 'html_to_json', category: 'HTML preset', summary: 'Convert an HTML fragment into a structured JSON tree.', syntax: ['html_to_json'], environment: 'html', notes: ['Requires browser-compatible DOM globals and the knap/html preset.'], related: ['remove_html'], examples: [{ ...example({ html: '<p>Hello</p>' }, '{{ html | html_to_json }}', '{"type":"element","tag":"p","children":[{"type":"text","content":"Hello"}]}'), testable: false }] },
  { slug: 'remove-html', name: 'remove_html', category: 'HTML preset', summary: 'Remove selected HTML elements and their contents.', syntax: ['remove_html:"script"', 'remove_html:("script", ".ad")'], environment: 'html', notes: ['Unlike remove_tags, this removes the matched element and everything inside it.', 'Requires browser-compatible DOM globals and the knap/html preset.'], related: ['html_to_json', 'remove_tags'], examples: [{ ...example({ html: '<p>Keep</p><script>remove()</script>' }, '{{ html | remove_html:"script" }}', '<p>Keep</p>'), testable: false }] },
];

export const filterDocs = docs.map((filter) => ({
  environment: 'standard' as const,
  ...filter,
}));

export const filterGroups: FilterGroup[] = [
  { id: 'dates', label: 'Dates and time', intro: 'Parse, adjust, and format dates or durations.', filters: ['date', 'date_modify', 'duration'] },
  { id: 'text', label: 'Text', intro: 'Normalize case, spacing, file names, and encoded text.', filters: ['camel', 'capitalize', 'decode_uri', 'kebab', 'lower', 'pascal', 'replace', 'safe_name', 'snake', 'title', 'trim', 'uncamel', 'unescape', 'upper'] },
  { id: 'markdown', label: 'Markdown', intro: 'Create links, callouts, lists, tables, and other Markdown structures.', filters: ['blockquote', 'callout', 'footnote', 'fragment_link', 'image', 'link', 'list', 'table', 'wikilink', 'yaml'] },
  { id: 'numbers', label: 'Numbers', intro: 'Calculate, round, and format numeric values.', filters: ['calc', 'number_format', 'round'] },
  { id: 'collections', label: 'Collections', intro: 'Select, reshape, combine, and render arrays and objects.', filters: ['first', 'join', 'last', 'length', 'map', 'merge', 'nth', 'object', 'reverse', 'slice', 'split', 'template', 'unique'] },
  { id: 'html-cleanup', label: 'HTML cleanup', intro: 'Clean markup while preserving the pieces a Markdown workflow needs.', filters: ['remove_attr', 'remove_tags', 'replace_tags', 'strip_attr', 'strip_md', 'strip_tags'] },
  { id: 'html-preset', label: 'HTML preset', intro: 'DOM-dependent filters exported separately from knap/html.', filters: ['html_to_json', 'remove_html'] },
];

export const filterDocsByName = new Map(
  filterDocs.flatMap((filter) => [filter.name, ...(filter.aliases ?? [])].map((name) => [name, filter] as const)),
);

export const filterDocsBySlug = new Map(filterDocs.map((filter) => [filter.slug, filter] as const));
export const allFilterSlugs = filterDocs.map((filter) => filter.slug);
