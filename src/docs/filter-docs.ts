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
  searchTerms?: string[];
  category: string;
  summary: string;
  syntax: string[];
  parameters?: string[];
  parameterValues?: string[];
  notes?: string[];
  referenceTables?: {
    title: string;
    description: string;
    reference?: { label: string; href: string };
    columns: string[];
    rows: string[][];
  }[];
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

const recursiveMarkdownValues = 'For arrays and objects, including serialized collections from another filter, string values are formatted recursively while keys and non-string values are preserved.';
const inlineWhitespace = 'Leading and trailing whitespace stays outside inline markers.';

const docs: FilterDoc[] = [
  {
    slug: 'date', name: 'date', searchTerms: ['date format', 'format date'], category: 'Dates', summary: 'Format a date.', syntax: ['date', 'date:"YYYY-MM-DD"', 'date:("YYYY-MM-DD", "MM/DD/YYYY")'],
    parameters: ['The first parameter is the output format. It defaults to `YYYY-MM-DD`.', 'An optional second parameter describes the data format for strict parsing. The data must match it exactly, including separators and zero padding.'],
    notes: ['Format strings use Day.js tokens. Invalid dates are returned unchanged.'],
    related: ['date_modify', 'duration'],
    referenceTables: [
      {
        title: 'Date formats',
        description: 'Combine these case-sensitive tokens in the output format. Wrap literal text in square brackets, for example `[Year] YYYY`. Month and weekday names below use English.',
        reference: { label: 'Day.js date formats', href: 'https://day.js.org/docs/en/display/format' },
        columns: ['Token', 'Meaning', 'Output'],
        rows: [
          ['`YY`', 'Year, last two digits', '24'],
          ['`YYYY`', 'Year, four digits', '2024'],
          ['`M`', 'Month number', '1–12'],
          ['`MM`', 'Month number, padded', '01–12'],
          ['`MMM`', 'Month abbreviation', 'Jan–Dec'],
          ['`MMMM`', 'Month name', 'January–December'],
          ['`D`', 'Day in month', '1–31'],
          ['`DD`', 'Day in month, padded', '01–31'],
          ['`d`', 'Weekday number (Sunday is 0)', '0–6'],
          ['`dd`', 'Weekday, two letters', 'Su–Sa'],
          ['`ddd`', 'Weekday abbreviation', 'Sun–Sat'],
          ['`dddd`', 'Weekday name', 'Sunday–Saturday'],
          ['`H`', 'Hour, 24-hour clock', '0–23'],
          ['`HH`', 'Hour, 24-hour clock, padded', '00–23'],
          ['`h`', 'Hour, 12-hour clock', '1–12'],
          ['`hh`', 'Hour, 12-hour clock, padded', '01–12'],
          ['`m`', 'Minute', '0–59'],
          ['`mm`', 'Minute, padded', '00–59'],
          ['`s`', 'Second', '0–59'],
          ['`ss`', 'Second, padded', '00–59'],
          ['`SSS`', 'Milliseconds, padded', '000–999'],
          ['`Z`', 'UTC offset with colon', '+05:00'],
          ['`ZZ`', 'UTC offset without colon', '+0500'],
          ['`A`', 'Meridiem, uppercase', 'AM / PM'],
          ['`a`', 'Meridiem, lowercase', 'am / pm'],
        ],
      },
      {
        title: 'Advanced date formats',
        description: 'These additional Day.js output tokens are included in Knap. Localized presets such as `L` and `LL`, the locale week-year token `gggg`, and named time zones (`z`, `zzz`) require plugins that Knap does not enable.',
        reference: { label: 'Day.js advanced formats', href: 'https://day.js.org/docs/en/plugin/advanced-format' },
        columns: ['Token', 'Meaning', 'Output'],
        rows: [
          ['`Q`', 'Quarter number', '1–4'],
          ['`Do`', 'Ordinal day in month', '1st–31st'],
          ['`k`', 'Hour, midnight as 24', '1–24'],
          ['`kk`', 'Hour, midnight as 24, padded', '01–24'],
          ['`X`', 'Unix timestamp in seconds', '1733011200'],
          ['`x`', 'Unix timestamp in milliseconds', '1733011200000'],
          ['`w`', 'Week number, locale rules', '1–53'],
          ['`ww`', 'Week number, locale rules, padded', '01–53'],
          ['`wo`', 'Ordinal week number, locale rules', '1st–53rd'],
          ['`W`', 'ISO week number', '1–53'],
          ['`WW`', 'ISO week number, padded', '01–53'],
          ['`GGGG`', 'ISO week-numbering year', '2024'],
        ],
      },
    ],
    examples: [
      example({ published: '2024-12-01' }, '{{ published | date:"MMMM D, YYYY" }}', 'December 1, 2024', 'Format a date'),
      example({ published: '12/01/2024' }, '{{ published | date:("YYYY-MM-DD", "MM/DD/YYYY") }}', '2024-12-01', 'Specify the data format'),
      example({ published: '2024-12-01' }, '{{ published | date:"[Week] WW, GGGG" }}', 'Week 48, 2024', 'ISO week and literal text'),
    ],
  },
  {
    slug: 'date-modify', name: 'date_modify', category: 'Dates', summary: 'Add or subtract a date interval.', syntax: ['date_modify:"+1 day"'],
    parameters: ['Use a signed whole-number amount followed by `year`, `month`, `week`, `day`, `hour`, `minute`, or `second`. Singular and plural units are accepted.'],
    notes: ['The result uses `YYYY-MM-DD`. Hours, minutes, and seconds can change the date when they cross midnight, but the time is omitted.', 'Chain the `date` filter after `date_modify` to choose another output format.'],
    related: ['date'],
    referenceTables: [{
      title: 'Date modification units',
      description: 'Use `+` to add or `-` to subtract. These are the Day.js units accepted by Knap; shorthand units, quarters, milliseconds, and decimal amounts are not supported.',
      reference: { label: 'Day.js date manipulation', href: 'https://day.js.org/docs/en/manipulate/add' },
      columns: ['Unit', 'Plural', 'Example modifier'],
      rows: [
        ['`year`', '`years`', '`+1 year`'],
        ['`month`', '`months`', '`-2 months`'],
        ['`week`', '`weeks`', '`+1 week`'],
        ['`day`', '`days`', '`-3 days`'],
        ['`hour`', '`hours`', '`+4 hours`'],
        ['`minute`', '`minutes`', '`-30 minutes`'],
        ['`second`', '`seconds`', '`+90 seconds`'],
      ],
    }],
    examples: [
      example({ published: '2024-12-01' }, '{{ published | date_modify:"+1 year" }}', '2025-12-01', 'Add time'),
      example({ published: '2024-12-01' }, '{{ published | date_modify:"-2 months" }}', '2024-10-01', 'Subtract time'),
      example({ published: '2024-12-01T22:00:00' }, '{{ published | date_modify:"+4 hours" | date:"MMMM D, YYYY" }}', 'December 2, 2024', 'Cross midnight and format'),
    ],
  },
  {
    slug: 'duration', name: 'duration', category: 'Dates', summary: 'Format seconds or an ISO 8601 duration.', syntax: ['duration', 'duration:"H:mm:ss"'],
    parameters: ['The optional format supports `H` and `HH` for hours, `m` and `mm` for minutes, and `s` and `ss` for seconds.'],
    notes: ['Without a format, durations of at least one hour use `HH:mm:ss`; shorter durations use `mm:ss`.', 'Data may be an ISO 8601 duration or a number of seconds.'], related: ['date'],
    referenceTables: [{
      title: 'Duration formats',
      description: 'Knap supports the six tokens below. Hours represent the total duration and can exceed 23; minutes and seconds are the remaining components. Other Day.js duration tokens and square-bracket escaping are not supported.',
      reference: { label: 'Day.js duration formats', href: 'https://day.js.org/docs/en/durations/format' },
      columns: ['Token', 'Meaning', 'Output for 3665 seconds'],
      rows: [
        ['`H`', 'Total hours', '1'],
        ['`HH`', 'Total hours, at least two digits', '01'],
        ['`m`', 'Remaining minutes (0–59)', '1'],
        ['`mm`', 'Remaining minutes, padded (00–59)', '01'],
        ['`s`', 'Remaining seconds (0–59)', '5'],
        ['`ss`', 'Remaining seconds, padded (00–59)', '05'],
      ],
    }],
    examples: [
      example({ duration: 'PT1H30M' }, '{{ duration | duration:"HH:mm:ss" }}', '01:30:00', 'ISO 8601 duration'),
      example({ seconds: 3665 }, '{{ seconds | duration:"H:mm:ss" }}', '1:01:05', 'Seconds'),
      example({ duration: 'PT5M30S' }, '{{ duration | duration }}', '05:30', 'Default format'),
      example({ duration: 'P1DT2H' }, '{{ duration | duration:"HH:mm:ss" }}', '26:00:00', 'More than 24 hours'),
    ],
  },

  { slug: 'camel', name: 'camel', category: 'Text', summary: 'Convert text to camelCase.', syntax: ['camel'], related: ['kebab', 'pascal', 'snake', 'uncamel'], examples: [example({ title: 'Hello world' }, '{{ title | camel }}', 'helloWorld')] },
  { slug: 'capitalize', name: 'capitalize', category: 'Text', summary: 'Uppercase the first character and lowercase the rest.', syntax: ['capitalize'], related: ['lower', 'title', 'upper'], examples: [example({ title: 'hELLO wORLD' }, '{{ title | capitalize }}', 'Hello world')] },
  { slug: 'decode-uri', name: 'decode_uri', category: 'Text', summary: 'Decode percent-encoded URI text.', syntax: ['decode_uri'], notes: ['Malformed URI sequences are returned unchanged.', recursiveMarkdownValues], examples: [example({ value: '%E4%BD%A0%E5%A5%BD' }, '{{ value | decode_uri }}', '你好', 'Unicode text'), example({ value: 'hello%20world' }, '{{ value | decode_uri }}', 'hello world', 'Spaces')] },
  { slug: 'encode-uri', name: 'encode_uri', category: 'Text', summary: 'Encode text for use as a URI component.', syntax: ['encode_uri'], notes: ['Reserved characters such as `/`, `?`, and `&` are encoded.', recursiveMarkdownValues], related: ['decode_uri'], examples: [example({ value: 'hello world/你好' }, '{{ value | encode_uri }}', 'hello%20world%2F%E4%BD%A0%E5%A5%BD')] },
  { slug: 'kebab', name: 'kebab', category: 'Text', summary: 'Convert text to kebab-case.', syntax: ['kebab'], related: ['camel', 'pascal', 'snake'], examples: [example({ title: 'Hello World' }, '{{ title | kebab }}', 'hello-world')] },
  { slug: 'lower', name: 'lower', category: 'Text', summary: 'Convert text to lowercase.', syntax: ['lower'], related: ['capitalize', 'title', 'upper'], examples: [example({ title: 'HELLO WORLD' }, '{{ title | lower }}', 'hello world')] },
  { slug: 'pascal', name: 'pascal', category: 'Text', summary: 'Convert text to PascalCase.', syntax: ['pascal'], related: ['camel', 'kebab', 'snake'], examples: [example({ title: 'hello world' }, '{{ title | pascal }}', 'HelloWorld')] },
  {
    slug: 'replace', name: 'replace', category: 'Text', summary: 'Replace one or more strings or regular expressions.', syntax: ['replace:"old":"new"', 'replace:("a":"b", "c":"d")'],
    parameters: ['Each quoted search value is followed by a colon and its replacement.', 'Regular expressions may include flags, for example `"/[aeiou]/g"`.'],
    notes: ['Multiple replacements are applied from left to right.', 'Use an empty replacement to remove matching text.', 'Supported regular-expression flags are `g`, `i`, `m`, `s`, `u`, and `y`. Escape template punctuation such as colons or pipes with a backslash when matching it literally.'],
    examples: [
      example({ message: 'hello, world!' }, '{{ message | replace:",":"" }}', 'hello world!', 'Remove text'),
      example({ message: 'hello world' }, '{{ message | replace:"e":"a","o":"0" }}', 'hall0 w0rld', 'Multiple replacements'),
      example({ message: 'hello world' }, '{{ message | replace:"/[aeiou]/g":"*" }}', 'h*ll* w*rld', 'Regular expression'),
      example({ message: 'HELLO world' }, '{{ message | replace:"/hello/i":"hi" }}', 'hi world', 'Case-insensitive match'),
    ],
  },
  { slug: 'safe-name', name: 'safe_name', category: 'Text', summary: 'Remove characters that are unsafe in file names.', syntax: ['safe_name', 'safe_name:windows'], parameters: ['Optionally choose `windows`, `mac`, or `linux` rules. The default is conservative.'], examples: [example({ title: 'notes/2024: recap?' }, '{{ title | safe_name }}', 'notes2024 recap')] },
  { slug: 'snake', name: 'snake', category: 'Text', summary: 'Convert text to snake_case.', syntax: ['snake'], related: ['camel', 'kebab', 'pascal'], examples: [example({ title: 'Hello World' }, '{{ title | snake }}', 'hello_world')] },
  { slug: 'title', name: 'title', category: 'Text', summary: 'Convert text to Title Case.', syntax: ['title'], related: ['capitalize', 'lower', 'upper'], examples: [example({ title: 'hello world' }, '{{ title | title }}', 'Hello World')] },
  {
    slug: 'indent', name: 'indent', category: 'Text', summary: 'Indent each non-empty line with spaces.', syntax: ['indent', 'indent:2'],
    parameters: ['The optional width is an integer from 0 to 1000. It defaults to two spaces; zero leaves the text unchanged.'],
    notes: ['Indents the first line as well as subsequent lines. Existing indentation, empty lines, and line endings are preserved.'], related: ['yaml', 'trim'],
    examples: [example({ text: 'First\nSecond' }, '{{ text | indent }}', '  First\n  Second'), example({ text: '- One\n- Two' }, '{{ text | indent:4 }}', '    - One\n    - Two', 'Choose a width')],
  },
  { slug: 'trim', name: 'trim', category: 'Text', summary: 'Remove whitespace from both ends of a value.', syntax: ['trim'], examples: [example({ title: '  hello world  ' }, '{{ title | trim }}', 'hello world')] },
  { slug: 'truncate', name: 'truncate', category: 'Text', summary: 'Shorten text to a character limit.', syntax: ['truncate:100', 'truncate:(100, "...")'], parameters: ['The required first parameter is a non-negative character limit.', 'The suffix defaults to `…`. Pass a second parameter to replace it, or `""` to omit it.'], notes: ['The suffix counts toward the character limit and is clipped when it is longer than the limit.', 'Unicode grapheme clusters such as emoji count as one character.', recursiveMarkdownValues], related: ['truncatewords'], examples: [example({ text: 'A concise introduction to Knap' }, '{{ text | truncate:10 }}', 'A concise…', 'Default suffix'), example({ text: 'A concise introduction' }, '{{ text | truncate:(12, "...") }}', 'A concise...', 'Custom suffix'), example({ text: 'A concise introduction' }, '{{ text | truncate:(9, "") }}', 'A concise', 'No suffix')] },
  { slug: 'truncatewords', name: 'truncatewords', category: 'Text', summary: 'Shorten text to a word limit.', syntax: ['truncatewords:20', 'truncatewords:(20, "...")'], parameters: ['The required first parameter is a non-negative word limit.', 'The suffix defaults to `…`. Pass a second parameter to replace it, or `""` to omit it.'], notes: ['The suffix is appended after the requested number of words.', 'Whitespace within the retained text is preserved.', recursiveMarkdownValues], related: ['truncate'], examples: [example({ text: 'A concise introduction to Knap' }, '{{ text | truncatewords:3 }}', 'A concise introduction…', 'Default suffix'), example({ text: 'A concise introduction to Knap' }, '{{ text | truncatewords:(3, "") }}', 'A concise introduction', 'No suffix')] },
  { slug: 'uncamel', name: 'uncamel', category: 'Text', summary: 'Convert camelCase or PascalCase to spaced lowercase text.', syntax: ['uncamel'], related: ['camel'], examples: [example({ name: 'camelCase' }, '{{ name | uncamel }}', 'camel case', 'camelCase'), example({ name: 'PascalCase' }, '{{ name | uncamel }}', 'pascal case', 'PascalCase'), example({ name: 'myHTMLParser' }, '{{ name | uncamel }}', 'my html parser', 'Initialism')] },
  { slug: 'unescape', name: 'unescape', category: 'Text', summary: 'Turn escaped quotes and newlines into literal characters.', syntax: ['unescape'], examples: [example({ value: 'line1\\nline2' }, '{{ value | unescape }}', 'line1\nline2', 'Newline'), example({ value: 'He said \\"hello\\"' }, '{{ value | unescape }}', 'He said "hello"', 'Quotes')] },
  { slug: 'upper', name: 'upper', category: 'Text', summary: 'Convert text to uppercase.', syntax: ['upper'], related: ['capitalize', 'lower', 'title'], examples: [example({ title: 'Hello world' }, '{{ title | upper }}', 'HELLO WORLD')] },

  { slug: 'blockquote', name: 'blockquote', category: 'Markdown', summary: 'Prefix every line as a Markdown blockquote.', syntax: ['blockquote'], examples: [example({ quote: 'First line\nSecond line' }, '{{ quote | blockquote }}', '> First line\n> Second line')] },
  { slug: 'bold', name: 'bold', searchTerms: ['strong', 'emphasis', 'underscore'], category: 'Markdown', summary: 'Wrap text in Markdown bold markers.', syntax: ['bold', 'bold:_'], parameters: ['The default marker is `*`. Pass `_` to use the alternate underscore syntax. The marker is doubled around the value.'], notes: [inlineWhitespace, recursiveMarkdownValues], related: ['italic', 'strike'], examples: [example({ text: 'Important' }, '{{ text | bold }}', '**Important**', 'Asterisks'), example({ text: 'Important' }, '{{ text | bold:_ }}', '__Important__', 'Underscores')] },
  { slug: 'callout', name: 'callout', category: 'Markdown', summary: 'Create a callout.', syntax: ['callout', 'callout:("info", "Title", false)'], parameters: ['Parameters are callout type, optional title, and optional fold state.', 'The type defaults to `info` and the title defaults to empty.', 'Use `true` for collapsed, `false` for expanded, or omit the fold state for a non-foldable callout.'], notes: ["Output uses Obsidian's blockquote-based callout syntax. Callouts are also known as alerts or admonitions in other Markdown systems."], related: ['blockquote'], examples: [example({ message: 'Remember this' }, '{{ message | callout:("tip", "Note") }}', '> [!tip] Note\n> Remember this', 'Type and title'), example({ message: 'More details' }, '{{ message | callout:("info", "Details", true) }}', '> [!info]- Details\n> More details', 'Collapsed callout')] },
  {
    slug: 'code', name: 'code', category: 'Markdown', summary: 'Format inline code or a fenced code block.', syntax: ['code', 'code:"typescript"'],
    parameters: ['An optional language creates a fenced code block and adds the language after the opening fence.'],
    searchTerms: ['backticks', 'code fence', 'syntax highlighting'], notes: ['Multiline data automatically becomes a fenced block. Backtick delimiters grow when needed to contain backticks safely.', recursiveMarkdownValues], related: ['code_block'],
    examples: [example({ source: 'const answer = 42' }, '{{ source | code }}', '`const answer = 42`', 'Inline'), example({ source: 'const answer = 42' }, '{{ source | code:"typescript" }}', '```typescript\nconst answer = 42\n```', 'Language block')],
  },
  {
    slug: 'code-block', name: 'code_block', category: 'Markdown', summary: 'Create a fenced code block.', syntax: ['code_block', 'code_block:"typescript"'],
    searchTerms: ['fenced code', 'code fence', 'syntax highlighting'], parameters: ['Use this filter to explicitly create a code block. The `code` filter defaults to inline code using backticks, and automatically creates a fenced code block for multiline values or when a language is specified.', 'The optional language is added after the opening fence.'], notes: [recursiveMarkdownValues], related: ['code'],
    examples: [example({ source: 'const answer = 42' }, '{{ source | code_block:"typescript" }}', '```typescript\nconst answer = 42\n```')],
  },
  { slug: 'comment', name: 'comment', searchTerms: ['hidden text', 'percent'], category: 'Markdown', summary: 'Wrap text in comment markers.', syntax: ['comment'], notes: ['Multiline comments put the opening and closing `%%` markers on separate lines.', inlineWhitespace, recursiveMarkdownValues], examples: [example({ note: 'Hidden note' }, '{{ note | comment }}', '%%Hidden note%%')] },
  { slug: 'embed', name: 'embed', searchTerms: ['transclusion', 'attachment', 'wiki embed'], category: 'Markdown', summary: 'Create an embedded wiki reference.', syntax: ['embed', 'embed:"Preview"'], parameters: ['The optional parameter sets an alias for string and array values.'], notes: ['For object values, keys are targets and values are aliases.'], related: ['image', 'wikilink'], examples: [example({ target: 'diagram.png' }, '{{ target | embed }}', '![[diagram.png]]', 'File'), example({ target: 'Project Atlas' }, '{{ target | embed:"Preview" }}', '![[Project Atlas|Preview]]', 'Alias'), example({ targets: ['one.md', 'two.md'] }, '{{ targets | embed }}', '["![[one.md]]","![[two.md]]"]', 'Array data')] },
  { slug: 'escape-md', name: 'escape_md', searchTerms: ['literal markdown', 'backslash', 'special characters'], category: 'Markdown', summary: 'Escape Markdown punctuation so text renders literally.', syntax: ['escape_md'], notes: ['Every ASCII punctuation character supported by Markdown backslash escapes is prefixed with a backslash.', 'Existing backslashes are escaped so they remain visible.', recursiveMarkdownValues], related: ['code', 'strip_md'], examples: [example({ text: '# Draft *title*' }, '{{ text | escape_md }}', '\\# Draft \\*title\\*')] },
  {
    slug: 'footnote', name: 'footnote', category: 'Markdown', summary: 'Convert an array or object to Markdown footnote definitions.', syntax: ['footnote'],
    notes: ['Arrays use one-based numeric labels. Object keys are converted to kebab-case labels.'],
    examples: [
      example({ notes: ['First item', 'Second item'] }, '{{ notes | footnote }}', '[^1]: First item\n\n[^2]: Second item', 'Array footnotes'),
      example({ notes: { 'First Note': 'Content 1', 'Second Note': 'Content 2' } }, '{{ notes | footnote }}', '[^first-note]: Content 1\n\n[^second-note]: Content 2', 'Object footnotes'),
    ],
  },
  {
    slug: 'fragment-link', name: 'fragment_link', category: 'Markdown', summary: 'Add a source URL with a text-fragment anchor to highlights.', syntax: ['fragment_link:"https://example.com"', 'fragment_link:"Source:https://example.com"'],
    parameters: ['Pass a source URL. Prefix it with custom link text and a colon to replace the default `link` text.'], related: ['link'],
    examples: [
      example({ highlights: ['Selected text', 'Another passage'] }, '{{ highlights | fragment_link:"https://example.com" }}', '["Selected text [link](https://example.com#:~:text=Selected%20text)","Another passage [link](https://example.com#:~:text=Another%20passage)"]'),
      example({ highlights: ['Selected text', 'Another passage'] }, '{{ highlights | fragment_link:"Source:https://example.com" }}', '["Selected text [Source](https://example.com#:~:text=Selected%20text)","Another passage [Source](https://example.com#:~:text=Another%20passage)"]', 'Custom link text'),
    ],
  },
  { slug: 'h1', name: 'h1', searchTerms: ['heading', 'title'], category: 'Markdown', summary: 'Create a level-one heading.', syntax: ['h1'], notes: ['Each nonempty data line becomes a heading.', recursiveMarkdownValues], related: ['h2', 'h3', 'h4', 'h5', 'h6'], examples: [example({ title: 'Introduction' }, '{{ title | h1 }}', '# Introduction')] },
  { slug: 'h2', name: 'h2', searchTerms: ['heading', 'title'], category: 'Markdown', summary: 'Create a level-two heading.', syntax: ['h2'], notes: ['Each nonempty data line becomes a heading.', recursiveMarkdownValues], related: ['h1', 'h3'], examples: [example({ title: 'Introduction' }, '{{ title | h2 }}', '## Introduction')] },
  { slug: 'h3', name: 'h3', searchTerms: ['heading', 'title'], category: 'Markdown', summary: 'Create a level-three heading.', syntax: ['h3'], notes: ['Each nonempty data line becomes a heading.', recursiveMarkdownValues], related: ['h2', 'h4'], examples: [example({ title: 'Introduction' }, '{{ title | h3 }}', '### Introduction')] },
  { slug: 'h4', name: 'h4', searchTerms: ['heading', 'title'], category: 'Markdown', summary: 'Create a level-four heading.', syntax: ['h4'], notes: ['Each nonempty data line becomes a heading.', recursiveMarkdownValues], related: ['h3', 'h5'], examples: [example({ title: 'Introduction' }, '{{ title | h4 }}', '#### Introduction')] },
  { slug: 'h5', name: 'h5', searchTerms: ['heading', 'title'], category: 'Markdown', summary: 'Create a level-five heading.', syntax: ['h5'], notes: ['Each nonempty data line becomes a heading.', recursiveMarkdownValues], related: ['h4', 'h6'], examples: [example({ title: 'Introduction' }, '{{ title | h5 }}', '##### Introduction')] },
  { slug: 'h6', name: 'h6', searchTerms: ['heading', 'title'], category: 'Markdown', summary: 'Create a level-six heading.', syntax: ['h6'], notes: ['Each nonempty data line becomes a heading.', recursiveMarkdownValues], related: ['h5'], examples: [example({ title: 'Introduction' }, '{{ title | h6 }}', '###### Introduction')] },
  { slug: 'hard-break', name: 'hard_break', searchTerms: ['line break', 'newline'], category: 'Markdown', summary: 'Turn single newlines into Markdown hard line breaks.', syntax: ['hard_break'], notes: ['Two trailing spaces are added before single newlines. Blank lines between paragraphs are preserved.', recursiveMarkdownValues], examples: [example({ text: 'First line\nSecond line\n\nNew paragraph' }, '{{ text | hard_break }}', 'First line  \nSecond line\n\nNew paragraph')] },
  {
    slug: 'highlight', name: 'highlight', searchTerms: ['mark', 'color'], category: 'Markdown', summary: 'Wrap text in highlight markers.', syntax: ['highlight', 'highlight:blue'],
    parameterValues: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
    parameters: ['Optionally pass `red`, `orange`, `yellow`, `green`, `blue`, or `purple` to add a color marker.'],
    notes: [inlineWhitespace, recursiveMarkdownValues], related: ['bold', 'italic', 'strike'],
    examples: [example({ text: 'Remember this' }, '{{ text | highlight }}', '==Remember this==', 'Default'), example({ text: 'Remember this' }, '{{ text | highlight:blue }}', '==🔵Remember this==', 'Color')],
  },
  {
    slug: 'hr', name: 'hr', category: 'Markdown', summary: 'Place a horizontal rule around text.', syntax: ['hr', 'hr:before', 'hr:both'],
    parameterValues: ['after', 'before', 'both'],
    searchTerms: ['horizontal rule', 'thematic break', 'separator'], parameters: ['Use `after` (the default), `before`, or `both` to choose the rule position.'], notes: ['The filter emits `---` and separates it from content with a blank line.', recursiveMarkdownValues],
    examples: [example({ text: 'Section end' }, '{{ text | hr }}', 'Section end\n\n---', 'After'), example({ text: 'Section start' }, '{{ text | hr:before }}', '---\n\nSection start', 'Before')],
  },
  {
    slug: 'image', name: 'image', category: 'Markdown', summary: 'Create Markdown image syntax from a URL, array, or object.', syntax: ['image', 'image:"Alt text"'],
    parameters: ['The optional parameter is alt text for string and array values.'],
    notes: ['For object values, keys are image URLs and values are alt text.'], related: ['link'],
    examples: [
      example({ url: 'cover.jpg' }, '{{ url | image:"Cover art" }}', '![Cover art](cover.jpg)', 'String data'),
      example({ images: ['cover.jpg', 'diagram.png'] }, '{{ images | image:"Illustration" }}', '["![Illustration](cover.jpg)","![Illustration](diagram.png)"]', 'Array data'),
      example({ images: { 'cover.jpg': 'Cover art', 'diagram.png': 'Architecture diagram' } }, '{{ images | image }}', '["![Cover art](cover.jpg)","![Architecture diagram](diagram.png)"]', 'Object data'),
    ],
  },
  { slug: 'italic', name: 'italic', searchTerms: ['emphasis', 'underscore'], category: 'Markdown', summary: 'Wrap text in Markdown italic markers.', syntax: ['italic', 'italic:_'], parameters: ['The default marker is `*`. Pass `_` to use the alternate underscore syntax.'], notes: [inlineWhitespace, recursiveMarkdownValues], related: ['bold', 'strike'], examples: [example({ text: 'Emphasized' }, '{{ text | italic }}', '*Emphasized*', 'Asterisk'), example({ text: 'Emphasized' }, '{{ text | italic:_ }}', '_Emphasized_', 'Underscore')] },
  {
    slug: 'link', name: 'link', category: 'Markdown', summary: 'Create Markdown links from a URL, array, or object.', syntax: ['link', 'link:"Link text"'],
    parameters: ['The optional parameter is link text for string and array values.'],
    notes: ['For object values, keys are URLs and values are link text.'], related: ['fragment_link', 'image', 'wikilink'],
    examples: [
      example({ url: 'https://example.com' }, '{{ url | link:"Example" }}', '[Example](https://example.com)', 'String data'),
      example({ urls: ['https://one.example', 'https://two.example'] }, '{{ urls | link:"Source" }}', '[Source](https://one.example)\n[Source](https://two.example)', 'Array data'),
      example({ links: { 'https://one.example': 'One', 'https://two.example': 'Two' } }, '{{ links | link }}', '[One](https://one.example)\n[Two](https://two.example)', 'Object data'),
    ],
  },
  {
    slug: 'list', name: 'list', category: 'Markdown', summary: 'Convert a value or array to a Markdown list.', syntax: ['list', 'list:numbered', 'list:task', 'list:numbered-task'],
    parameterValues: ['numbered', 'task', 'numbered-task'],
    parameters: ['Choose `bullet` (default), `numbered`, `task`, or `numbered-task`.'], related: ['table'],
    examples: [
      example({ items: ['Apple', 'Pear'] }, '{{ items | list }}', '- Apple\n- Pear', 'Bullet list'),
      example({ items: ['Apple', 'Pear'] }, '{{ items | list:numbered }}', '1. Apple\n2. Pear', 'Numbered list'),
      example({ items: ['Write draft', 'Review edits'] }, '{{ items | list:task }}', '- [ ] Write draft\n- [ ] Review edits', 'Task list'),
      example({ items: ['Write draft', 'Review edits'] }, '{{ items | list:numbered-task }}', '1. [ ] Write draft\n2. [ ] Review edits', 'Numbered task list'),
    ],
  },
  { slug: 'math', name: 'math', searchTerms: ['latex', 'equation', 'formula'], category: 'Markdown', summary: 'Format inline math or a math block.', syntax: ['math'], notes: ['Multiline data automatically becomes a block delimited by `$$`.', inlineWhitespace, recursiveMarkdownValues], related: ['math_block'], examples: [example({ expression: 'x^2 + y^2' }, '{{ expression | math }}', '$x^2 + y^2$')] },
  { slug: 'math-block', name: 'math_block', searchTerms: ['latex', 'equation', 'formula'], category: 'Markdown', summary: 'Create a block math expression.', syntax: ['math_block'], notes: ['Use this filter to explicitly create a math block. The `math` filter defaults to inline math using a single `$`, and automatically uses `$$` block fences for multiline values.', recursiveMarkdownValues], related: ['math'], examples: [example({ expression: 'x^2 + y^2' }, '{{ expression | math_block }}', '$$\nx^2 + y^2\n$$')] },
  { slug: 'strike', name: 'strike', searchTerms: ['strikethrough', 'deleted'], category: 'Markdown', summary: 'Wrap text in Markdown strikethrough markers.', syntax: ['strike'], notes: [inlineWhitespace, recursiveMarkdownValues], related: ['bold', 'italic', 'highlight'], examples: [example({ text: 'Removed' }, '{{ text | strike }}', '~~Removed~~')] },
  {
    slug: 'table', name: 'table', category: 'Markdown', summary: 'Convert arrays or objects to a compact Markdown table.', syntax: ['table', 'table:("Column 1", "Column 2")'],
    parameters: ['Optional parameters set column headers.'],
    notes: ['Arrays of objects use object keys as headers. Arrays of arrays use each nested array as a row. Simple arrays use a single `Value` column unless custom headers are supplied.'], related: ['list', 'table_pretty'],
    examples: [
      example({ people: [{ name: 'Ada', role: 'Engineer' }, { name: 'Lin', role: 'Designer' }] }, '{{ people | table }}', '| name | role |\n| - | - |\n| Ada | Engineer |\n| Lin | Designer |', 'Array of objects'),
      example({ names: ['Ada', 'Lin'] }, '{{ names | table }}', '| Value |\n| - |\n| Ada |\n| Lin |', 'Simple array'),
      example({ rows: [['Ada', 'Engineer'], ['Lin', 'Designer']] }, '{{ rows | table:("Name", "Role") }}', '| Name | Role |\n| - | - |\n| Ada | Engineer |\n| Lin | Designer |', 'Array of arrays'),
      example({ values: ['Ada', 'Writer', 'Lin', 'Editor'] }, '{{ values | table:("Name", "Role") }}', '| Name | Role |\n| - | - |\n| Ada | Writer |\n| Lin | Editor |', 'Custom columns'),
    ],
  },
  {
    slug: 'table-pretty', name: 'table_pretty', category: 'Markdown', summary: 'Convert arrays or objects to a padded Markdown table.', syntax: ['table_pretty', 'table_pretty:("Column 1", "Column 2")'],
    parameters: ['Optional parameters set column headers.'],
    notes: ['Columns are padded to equal widths and the separator row expands to match.', 'Data shapes and custom headers behave the same as `table`.'], related: ['table'],
    examples: [
      example({ people: [{ name: 'Ada', role: 'Engineer' }, { name: 'Lin', role: 'Designer' }] }, '{{ people | table_pretty }}', '| name | role     |\n| ---- | -------- |\n| Ada  | Engineer |\n| Lin  | Designer |', 'Object array'),
      example({ values: ['Ada', 'Writer', 'Lin', 'Editor'] }, '{{ values | table_pretty:("Name", "Role") }}', '| Name | Role   |\n| ---- | ------ |\n| Ada  | Writer |\n| Lin  | Editor |', 'Custom columns'),
    ],
  },
  {
    slug: 'wikilink', name: 'wikilink', category: 'Markdown', summary: 'Create wikilinks from strings, arrays, or objects.', syntax: ['wikilink', 'wikilink:"Alias"'],
    parameters: ['The optional parameter sets an alias for string and array values.'],
    notes: ['Output uses Obsidian-compatible `[[target|alias]]` syntax. Wikilinks are also commonly called internal links.', 'For object values, keys are note names and values are aliases.'], related: ['link'],
    examples: [
      example({ page: 'Project Atlas' }, '{{ page | wikilink:"Atlas" }}', '[[Project Atlas|Atlas]]', 'String with alias'),
      example({ pages: ['Project Atlas', 'Daily Notes'] }, '{{ pages | wikilink }}', '["[[Project Atlas]]","[[Daily Notes]]"]', 'Array data'),
      example({ pages: { 'Project Atlas': 'Atlas', 'Daily Notes': 'Journal' } }, '{{ pages | wikilink }}', '["[[Project Atlas|Atlas]]","[[Daily Notes|Journal]]"]', 'Object data'),
    ],
  },
  {
    slug: 'yaml', name: 'yaml', searchTerms: ['frontmatter', 'properties', 'block list', 'flow'], category: 'Markdown', summary: 'Serialize a value as YAML.', syntax: ['yaml', 'yaml:flow'],
    parameterValues: ['flow'],
    parameters: ['Arrays and objects use block style with two-space nesting by default. Pass `flow` for compact inline collections.'],
    notes: ['Accepts typed arrays and objects or serialized JSON collections, including output from filters such as `wikilink`.', 'Within collections, strings stay quoted and numbers, booleans, and null retain their types. Empty arrays and objects use `[]` and `{}` in either style.', 'For standalone scalars, canonical numbers, booleans, and `null` are preserved; other text is quoted. Multiline strings use escaped newlines.', 'Output has no trailing newline or frontmatter delimiters. Place block collections on the line below a property and use `indent:2` to indent them, or use `yaml_property` to format a complete property.'], related: ['yaml_property', 'indent', 'wikilink'],
    examples: [
      example({ title: 'A: value #1' }, '{{ title | yaml }}', '"A: value #1"', 'Scalar'),
      example({ genres: ['Action', 'Sci-fi'] }, 'genre:\n{{ genres | yaml | indent:2 }}', 'genre:\n  - "Action"\n  - "Sci-fi"', 'Block list'),
      example({ genres: ['Action', 'Sci-fi'] }, 'genre: {{ genres | yaml:flow }}', 'genre: ["Action","Sci-fi"]', 'Flow list'),
      example({ metadata: { year: 1999, genre: ['Action', 'Sci-fi'] } }, '---\n{{ metadata | yaml }}\n---', '---\nyear: 1999\ngenre:\n  - "Action"\n  - "Sci-fi"\n---', 'Frontmatter from an object'),
      example({ directors: ['Lana Wachowski', 'Lilly Wachowski'] }, 'director:\n{{ directors | wikilink | yaml | indent:2 }}', 'director:\n  - "[[Lana Wachowski]]"\n  - "[[Lilly Wachowski]]"', 'Wikilink list'),
    ],
  },
  {
    slug: 'yaml-property', name: 'yaml_property', searchTerms: ['frontmatter', 'properties', 'yaml key'], category: 'Markdown', summary: 'Serialize a complete YAML property.', syntax: ['yaml_property:"name"'],
    parameters: ['One non-empty property name is required. Quote names that contain spaces or punctuation.'],
    notes: ['Scalars appear beside the key. Non-empty arrays and objects use block style beneath the key with two-space indentation; empty collections stay inline as `[]` or `{}`.', 'Uses the same value serialization as `yaml` and quotes keys when needed. Typed and serialized JSON collections are supported.', 'Apply transformations such as `wikilink` before this filter. No separate `yaml` or `indent` filter is needed.', 'Output has no trailing newline or frontmatter delimiters.'], related: ['yaml', 'wikilink', 'indent'],
    examples: [
      example({ year: 1999 }, '{{ year | yaml_property:"year" }}', 'year: 1999', 'Scalar'),
      example({ directors: ['Lana Wachowski', 'Lilly Wachowski'] }, '{{ directors | wikilink | yaml_property:"director" }}', 'director:\n  - "[[Lana Wachowski]]"\n  - "[[Lilly Wachowski]]"', 'Wikilink list'),
      example({ details: { year: 1999, genre: ['Action', 'Sci-fi'] } }, '{{ details | yaml_property:"movie" }}', 'movie:\n  year: 1999\n  genre:\n    - "Action"\n    - "Sci-fi"', 'Nested object'),
      example({ tags: [] }, '{{ tags | yaml_property:"tags" }}', 'tags: []', 'Empty list'),
    ],
  },

  { slug: 'calc', name: 'calc', category: 'Numbers', summary: 'Apply a simple arithmetic operation to a number.', syntax: ['calc:"+10"', 'calc:"*2"', 'calc:"**3"'], parameters: ['Supported operators are `+`, `-`, `*`, `/`, `**`, and `^`.'], notes: ['Non-numeric data is returned unchanged.'], related: ['round', 'number_format'], examples: [example({ count: 5 }, '{{ count | calc:"+10" }}', '15', 'Addition'), example({ count: 2 }, '{{ count | calc:"**3" }}', '8', 'Exponentiation')] },
  {
    slug: 'number-format', name: 'number_format', category: 'Numbers', summary: 'Add thousands separators and optional decimal places.', syntax: ['number_format', 'number_format:2', 'number_format:(2, ",", ".")'],
    parameters: ['Parameters set decimal places, the decimal separator, and the thousands separator, in that order.'],
    notes: ['Arrays and objects are formatted recursively. Non-numeric values are left unchanged.'], related: ['calc', 'round'],
    examples: [
      example({ amount: 1234567.89 }, '{{ amount | number_format:2 }}', '1,234,567.89', 'Decimal places'),
      example({ amount: 1234.567 }, '{{ amount | number_format:(2, ",", ".") }}', '1.234,57', 'Custom separators'),
      example({ amounts: [1200, 3500.5] }, '{{ amounts | number_format:2 }}', '["1,200.00","3,500.50"]', 'Array data'),
    ],
  },
  { slug: 'round', name: 'round', category: 'Numbers', summary: 'Round a number to an optional number of decimal places.', syntax: ['round', 'round:2'], parameters: ['The optional non-negative parameter sets decimal places.'], related: ['calc', 'number_format'], examples: [example({ value: 3.14159 }, '{{ value | round:2 }}', '3.14')] },

  { slug: 'first', name: 'first', category: 'Collections', summary: 'Return the first item in an array.', syntax: ['first'], related: ['last', 'slice'], examples: [example({ items: ['a', 'b', 'c'] }, '{{ items | first }}', 'a')] },
  { slug: 'compact', name: 'compact', category: 'Collections', summary: 'Remove null and empty-string values from a collection.', syntax: ['compact'], notes: ['Whitespace-only strings are empty. The values `0` and `false` are preserved.', 'For objects, matching properties are removed. Nested collections are preserved.', 'Serialized arrays and objects produced by another filter are recognized automatically.'], related: ['unique'], examples: [example({ items: [null, '', 'one', 0, false, 'two'] }, '{{ items | compact }}', '["one",0,false,"two"]', 'Array'), example({ values: { empty: '', missing: null, count: 0, enabled: false } }, '{{ values | compact }}', '{"count":0,"enabled":false}', 'Object')] },
  { slug: 'join', name: 'join', category: 'Collections', summary: 'Join array items with an optional separator.', syntax: ['join', 'join:", "'], parameters: ['The default separator is a comma. Escaped newlines are supported.'], related: ['split'], examples: [example({ tags: ['notes', 'ideas', 'books'] }, '{{ tags | join:", " }}', 'notes, ideas, books')] },
  { slug: 'last', name: 'last', category: 'Collections', summary: 'Return the last item in an array.', syntax: ['last'], related: ['first', 'slice'], examples: [example({ items: ['a', 'b', 'c'] }, '{{ items | last }}', 'c')] },
  { slug: 'length', name: 'length', category: 'Collections', summary: 'Count string characters, array items, or object keys.', syntax: ['length'], examples: [example({ tags: ['notes', 'ideas', 'books'] }, '{{ tags | length }}', '3', 'Array length'), example({ title: 'Knap' }, '{{ title | length }}', '4', 'String length'), example({ author: { name: 'Ada', role: 'Writer' } }, '{{ author | length }}', '2', 'Object length')] },
  { slug: 'map', name: 'map', category: 'Collections', summary: 'Select a property from each array item or map items with an expression.', syntax: ['map:"name"', 'map:"author.name"', 'map:item => item.name', 'map:item => ({name: item.name})', 'map:item => "prefix/${item}"'], parameters: ['Pass a quoted property path for simple selection. Dotted paths select nested own properties.', 'Arrow expressions can select properties, construct a small object, or interpolate an item into a string literal.'], notes: ['Property selection preserves value types and produces `null` when a path is missing.', 'Built-in filters cannot be called inside an arrow expression. Chain `template` after `map` when you need to render the mapped results.'], related: ['template', 'where'], examples: [example({ people: [{ name: 'Ada' }, { name: 'Lin' }] }, '{{ people | map:"name" }}', '["Ada","Lin"]', 'Property shorthand'), example({ people: [{ author: { name: 'Ada' } }, { author: { name: 'Lin' } }] }, '{{ people | map:"author.name" }}', '["Ada","Lin"]', 'Nested property'), example({ people: [{ name: 'Ada', role: 'Engineer' }, { name: 'Lin', role: 'Designer' }] }, '{{ people | map:person => ({name: person.name, role: person.role}) }}', '[{"name":"Ada","role":"Engineer"},{"name":"Lin","role":"Designer"}]', 'Construct objects'), example({ genres: ['rock', 'pop'] }, '{{ genres | map:item => "genres/${item}" }}', '["genres/rock","genres/pop"]', 'Build strings')] },
  { slug: 'merge', name: 'merge', category: 'Collections', summary: 'Append one or more values to an array.', syntax: ['merge:"value"', 'merge:("a", "b")'], notes: ['Quoted values may contain commas.'], related: ['unique'], examples: [example({ tags: ['notes', 'ideas'] }, '{{ tags | merge:"books" }}', '["notes","ideas","books"]', 'Append one value'), example({ tags: ['notes', 'drafts'] }, '{{ tags | merge:("ideas", "books") }}', '["notes","drafts","ideas","books"]', 'Append multiple values')] },
  { slug: 'nth', name: 'nth', category: 'Collections', summary: 'Select positions from an array with nth-pattern syntax.', syntax: ['nth:3', 'nth:2n', 'nth:n+3', 'nth:2,3:4'], parameters: ['Indexes are one-based. Patterns support a single position, every nth item, an offset, or positions within repeating groups.'], related: ['first', 'last', 'slice'], examples: [example({ items: ['a', 'b', 'c', 'd', 'e', 'f'] }, '{{ items | nth:2n }}', '["b","d","f"]', 'Every nth item'), example({ items: [1, 2, 3, 4, 5, 6, 7, 8] }, '{{ items | nth:2,3:4 }}', '[2,3,6,7]', 'Repeating groups')] },
  { slug: 'object', name: 'object', category: 'Collections', summary: 'Convert an object to keys, values, or key-value pairs.', syntax: ['object:"keys"', 'object:"values"', 'object:"array"'], parameters: ['A mode parameter is required: `keys`, `values`, or `array`. Bare and parenthesized spellings remain supported.'], examples: [example({ person: { name: 'Ada', role: 'Writer' } }, '{{ person | object:"keys" }}', '["name","role"]', 'Keys'), example({ person: { name: 'Ada', role: 'Writer' } }, '{{ person | object:"values" }}', '["Ada","Writer"]', 'Values'), example({ person: { name: 'Ada', role: 'Writer' } }, '{{ person | object:"array" }}', '[["name","Ada"],["role","Writer"]]', 'Key-value pairs')] },
  { slug: 'parse-json', name: 'parse_json', searchTerms: ['decode json', 'json array', 'json object'], category: 'Collections', summary: 'Parse JSON text into a typed template value.', syntax: ['parse_json'], notes: ['Invalid JSON is returned unchanged with a nonfatal warning.', 'Values that are already typed are returned unchanged.', 'Collection-aware filters recognize serialized arrays and objects automatically, so ordinary collection chains do not require `parse_json`.'], related: ['object'], examples: [example({ value: '["one","two"]' }, '{{ value | parse_json | join:", " }}', 'one, two')] },
  { slug: 'reverse', name: 'reverse', category: 'Collections', summary: 'Reverse a string, array, or object entry order.', syntax: ['reverse'], related: ['slice'], examples: [example({ word: 'abc' }, '{{ word | reverse }}', 'cba', 'String'), example({ items: ['a', 'b', 'c'] }, '{{ items | reverse }}', '["c","b","a"]', 'Array'), example({ values: { first: 1, second: 2 } }, '{{ values | reverse }}', '{"second":2,"first":1}', 'Object')] },
  { slug: 'slice', name: 'slice', category: 'Collections', summary: 'Extract part of a string or array.', syntax: ['slice:1', 'slice:1,4'], parameters: ['The first index is inclusive and the second is exclusive. Negative indexes count from the end.', 'With one index, the slice continues to the end. A negative second index excludes items from the end.'], related: ['first', 'last'], examples: [example({ word: 'hello' }, '{{ word | slice:1,4 }}', 'ell', 'String range'), example({ items: ['a', 'b', 'c', 'd'] }, '{{ items | slice:1,3 }}', '["b","c"]', 'Array range'), example({ word: 'hello' }, '{{ word | slice:-3 }}', 'llo', 'Negative start'), example({ word: 'hello' }, '{{ word | slice:0,-2 }}', 'hel', 'Negative end')] },
  { slug: 'sort', name: 'sort', category: 'Collections', summary: 'Sort an array by value or object property.', syntax: ['sort', 'sort:"desc"', 'sort:"name"', 'sort:("name", "desc")'], parameters: ['Arrays sort in ascending order by default. Pass `desc` to reverse the direction.', 'Pass a property name to sort objects by that property. A dotted path selects a nested property.', 'With both a property and direction, wrap the parameters in parentheses.'], notes: ['Numbers are compared numerically. Missing and `null` property values remain at the end.', 'Serialized arrays and objects produced by another filter are recognized automatically.'], related: ['reverse'], examples: [example({ values: [10, 2, 1] }, '{{ values | sort }}', '[1,2,10]', 'Numbers'), example({ values: ['a', 'c', 'b'] }, '{{ values | sort:"desc" }}', '["c","b","a"]', 'Descending'), example({ people: [{ name: 'Lin' }, { name: 'Ada' }] }, '{{ people | sort:"name" }}', '[{"name":"Ada"},{"name":"Lin"}]', 'Object property')] },
  { slug: 'split', name: 'split', category: 'Collections', summary: 'Split a string into a JSON array.', syntax: ['split', 'split:","', 'split:[0-9]'], parameters: ['Without a separator, the value is split into characters. The separator may be a regular-expression pattern.'], related: ['join'], examples: [example({ value: 'a,b,c' }, '{{ value | split:"," }}', '["a","b","c"]', 'Separator'), example({ value: 'abc' }, '{{ value | split }}', '["a","b","c"]', 'Characters'), example({ value: 'a1b2c' }, '{{ value | split:[0-9] }}', '["a","b","c"]', 'Regular expression')] },
  { slug: 'sum', name: 'sum', category: 'Collections', summary: 'Add numeric array values or numeric object properties.', syntax: ['sum', 'sum:"amount"', 'sum:"details.amount"'], parameters: ['Without a parameter, numeric array items are added.', 'Pass a quoted property path to add values from object items. Dotted paths select nested own properties.'], notes: ['Finite numbers and nonblank numeric strings are included. Missing properties, blank strings, nonnumeric values, and infinities are ignored.', 'An empty array returns `0`.'], related: ['map', 'where'], examples: [example({ values: [10, '2.5', '', 'none'] }, '{{ values | sum }}', '12.5', 'Numeric values'), example({ items: [{ amount: 10 }, { amount: '2.5' }, {}] }, '{{ items | sum:"amount" }}', '12.5', 'Object property')] },
  { slug: 'template', name: 'template', category: 'Collections', summary: 'Render an object or each array item with a small ${property} template.', syntax: ['template:"${name}"'], parameters: ['The template parameter can reference nested object properties. Array items are separated by a blank line.', 'Use `${str}` for plain strings, including strings produced by `map`.'], related: ['map'], examples: [example({ person: { name: 'Ada', role: 'Engineer' } }, '{{ person | template:"${name}: ${role}" }}', 'Ada: Engineer', 'Object'), example({ people: [{ name: 'Ada', role: 'Engineer' }, { name: 'Lin', role: 'Designer' }] }, '{{ people | template:"${name}: ${role}" }}', 'Ada: Engineer\n\nLin: Designer', 'Array of objects'), example({ values: ['rock', 'pop'] }, '{{ values | template:"- ${str}" }}', '- rock\n\n- pop', 'Strings')] },
  { slug: 'unique', name: 'unique', category: 'Collections', summary: 'Remove duplicate values from arrays or objects.', syntax: ['unique'], notes: ['Arrays of objects are compared by value. For objects, duplicate values are removed while the last matching key is retained. Strings are returned unchanged.'], related: ['merge'], examples: [example({ tags: ['notes', 'ideas', 'notes'] }, '{{ tags | unique }}', '["notes","ideas"]', 'Primitive values'), example({ items: [{ a: 1 }, { b: 2 }, { a: 1 }] }, '{{ items | unique }}', '[{"a":1},{"b":2}]', 'Objects in an array'), example({ values: { first: 'same', second: 'different', third: 'same' } }, '{{ values | unique }}', '{"second":"different","third":"same"}', 'Duplicate object values')] },
  { slug: 'where', name: 'where', category: 'Collections', summary: 'Keep array items whose property exactly matches a value.', syntax: ['where:("published", true)', 'where:("status", "draft")', 'where:("author.name", "Ada")'], parameters: ['A quoted property path and comparison value are required. Dotted paths select nested own properties.', 'Strings, numbers, booleans, and `null` are compared by type and value.'], notes: ['Missing properties never match, including when the comparison value is `null`.', 'Matching items retain their types and original order.'], related: ['map', 'sum'], examples: [example({ posts: [{ title: 'One', published: true }, { title: 'Two', published: false }] }, '{{ posts | where:("published", true) | map:"title" | join:", " }}', 'One', 'Boolean property'), example({ items: [{ value: 1 }, { value: '1' }] }, '{{ items | where:("value", "1") }}', '[{"value":"1"}]', 'Typed equality')] },

  { slug: 'remove-attr', name: 'remove_attr', category: 'HTML cleanup', summary: 'Remove selected attributes from HTML tags.', syntax: ['remove_attr:"class"', 'remove_attr:("class", "style")'], related: ['strip_attr'], examples: [example({ html: '<div class="card" id="intro">Hello</div>' }, '{{ html | remove_attr:"class" }}', '<div id="intro">Hello</div>', 'One attribute'), example({ html: '<div class="card" id="intro" style="color:red">Hello</div>' }, '{{ html | remove_attr:("class", "style") }}', '<div id="intro">Hello</div>', 'Multiple attributes')] },
  { slug: 'remove-tags', name: 'remove_tags', category: 'HTML cleanup', summary: 'Remove selected HTML tags but keep their content.', syntax: ['remove_tags:"b"', 'remove_tags:("b", "em")'], related: ['strip_tags', 'remove_html'], examples: [example({ html: '<p>Hello <b>world</b>!</p>' }, '{{ html | remove_tags:"b" }}', '<p>Hello world!</p>', 'One tag'), example({ html: '<p><strong>Hello</strong> <em>world</em></p>' }, '{{ html | remove_tags:("strong", "em") }}', '<p>Hello world</p>', 'Multiple tags')] },
  { slug: 'replace-tags', name: 'replace_tags', category: 'HTML cleanup', summary: 'Rename selected HTML tags while preserving content.', syntax: ['replace_tags:"strong":"h2"'], examples: [example({ html: '<strong>Title</strong>' }, '{{ html | replace_tags:"strong":"h2" }}', '<h2>Title</h2>')] },
  { slug: 'strip-attr', name: 'strip_attr', category: 'HTML cleanup', summary: 'Remove every HTML attribute except an optional allowlist.', syntax: ['strip_attr', 'strip_attr:"href"'], related: ['remove_attr'], examples: [example({ html: '<a href="/about" class="nav">About</a>' }, '{{ html | strip_attr:"href" }}', '<a href="/about">About</a>')] },
  { slug: 'strip-md', name: 'strip_md', aliases: ['stripmd'], category: 'HTML cleanup', summary: 'Remove Markdown formatting while keeping readable text.', syntax: ['strip_md'], notes: ['Removes formatting including emphasis, highlights, headings, code, blockquotes, lists, and wikilinks.', 'Images, tables, footnote references, fenced code blocks, URLs, and HTML tags are removed rather than converted to visible text.'], related: ['strip_tags'], examples: [example({ text: '**Bold** and [linked](https://example.com)' }, '{{ text | strip_md }}', 'Bold and linked', 'Inline formatting'), example({ text: '# Heading\n\n> Quoted text' }, '{{ text | strip_md }}', 'Heading\n\nQuoted text', 'Block formatting')] },
  { slug: 'strip-tags', name: 'strip_tags', category: 'HTML cleanup', summary: 'Remove all HTML tags except an optional allowlist.', syntax: ['strip_tags', 'strip_tags:"b"'], notes: ['Text inside removed tags is preserved. Common HTML entities are decoded.'], related: ['remove_tags', 'strip_md'], examples: [example({ html: '<p>Hello <b>world</b>!</p>' }, '{{ html | strip_tags }}', 'Hello world!', 'Remove every tag'), example({ html: '<p>Hello <b>world</b>!</p>' }, '{{ html | strip_tags:"b" }}', 'Hello <b>world</b>!', 'Keep selected tags')] },

  { slug: 'html-to-json', name: 'html_to_json', category: 'HTML parsing', summary: 'Convert an HTML fragment into a structured JSON tree.', syntax: ['html_to_json'], environment: 'html', notes: ['Requires browser-compatible DOM globals. Register `htmlFilters` from `knap/html` before using it.'], related: ['remove_html'], examples: [{ ...example({ html: '<p>Hello</p>' }, '{{ html | html_to_json }}', '{"type":"element","tag":"p","children":[{"type":"text","content":"Hello"}]}'), testable: false }] },
  { slug: 'remove-html', name: 'remove_html', category: 'HTML parsing', summary: 'Remove selected HTML elements and their contents.', syntax: ['remove_html:"script"', 'remove_html:("script", ".ad", "#promo")'], environment: 'html', parameters: ['Selectors may be tag names, classes, IDs, or other CSS selectors.'], notes: ['Unlike `remove_tags`, this removes the matched element and everything inside it.', 'Requires browser-compatible DOM globals. Register `htmlFilters` from `knap/html` before using it.'], related: ['html_to_json', 'remove_tags'], examples: [{ ...example({ html: '<p>Keep</p><script>remove()</script>' }, '{{ html | remove_html:"script" }}', '<p>Keep</p>', 'Tag selector'), testable: false }, { ...example({ html: '<main><p>Keep</p><aside class="ad">Remove</aside></main>' }, '{{ html | remove_html:".ad" }}', '<main xmlns="http://www.w3.org/1999/xhtml"><p>Keep</p></main>', 'Class selector'), testable: false }] },
];

export const filterDocs = docs.map((filter) => ({
  environment: 'standard' as const,
  ...filter,
}));

export const filterGroups: FilterGroup[] = [
  { id: 'formatting', label: 'Formatting', intro: 'Create links, callouts, lists, tables, and other Markdown structures.', filters: ['blockquote', 'bold', 'callout', 'code', 'code_block', 'comment', 'embed', 'escape_md', 'footnote', 'fragment_link', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hard_break', 'highlight', 'hr', 'image', 'italic', 'link', 'list', 'math', 'math_block', 'strike', 'table', 'table_pretty', 'wikilink', 'yaml', 'yaml_property'] },
  { id: 'text', label: 'Text', intro: 'Normalize case, spacing, file names, and encoded text.', filters: ['camel', 'capitalize', 'decode_uri', 'encode_uri', 'indent', 'kebab', 'lower', 'pascal', 'replace', 'safe_name', 'snake', 'title', 'trim', 'truncate', 'truncatewords', 'uncamel', 'unescape', 'upper'] },
  { id: 'dates', label: 'Dates', intro: 'Parse, adjust, and format dates or durations.', filters: ['date', 'date_modify', 'duration'] },
  { id: 'numbers', label: 'Numbers', intro: 'Calculate, round, and format numeric values.', filters: ['calc', 'number_format', 'round'] },
  { id: 'collections', label: 'Collections', intro: 'Select, reshape, combine, and render arrays and objects.', filters: ['compact', 'first', 'join', 'last', 'length', 'map', 'merge', 'nth', 'object', 'parse_json', 'reverse', 'slice', 'sort', 'split', 'sum', 'template', 'unique', 'where'] },
  { id: 'html-cleanup', label: 'HTML cleanup', intro: 'Clean markup while preserving the pieces a Markdown workflow needs.', filters: ['remove_attr', 'remove_tags', 'replace_tags', 'strip_attr', 'strip_md', 'strip_tags'] },
  { id: 'html-preset', label: 'HTML parsing', intro: 'DOM-dependent filters exported separately from knap/html.', filters: ['html_to_json', 'remove_html'] },
];

export const filterDocsByName = new Map(
  filterDocs.flatMap((filter) => [filter.name, ...(filter.aliases ?? [])].map((name) => [name, filter] as const)),
);

export const filterDocsBySlug = new Map(filterDocs.map((filter) => [filter.slug, filter] as const));
export const allFilterSlugs = filterDocs.map((filter) => filter.slug);
