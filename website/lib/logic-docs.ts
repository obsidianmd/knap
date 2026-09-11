import { tagHelp } from '../../src/cli/language-help';
import type { FilterExample } from '../../src/docs/filter-docs';

export interface LogicDoc {
  slug: string;
  title: string;
  summary: string;
  syntax: string;
  sections: { id: string; title: string; notes: string[] }[];
  examples: FilterExample[];
  links: { href: string; label: string; summary: string }[];
}

export const logicDocs: LogicDoc[] = [
  {
    slug: 'if', title: 'if', summary: tagHelp.if.summary, syntax: tagHelp.if.syntax,
    sections: [
      { id: 'branches', title: 'Usage', notes: [
        'The first condition that is true decides which content is shown.',
        'Add `elseif` to check another condition, or `else` for content to show when all conditions are false. Both are optional.',
        'Close the block with `endif`.',
      ] },
      { id: 'conditions', title: 'True and false', notes: [
        'Conditions treat `false`, `null`, `undefined`, an empty string, `0`, and an empty array as false. Other values are treated as true.',
      ] },
    ],
    examples: [tagHelp.if.example],
    links: [{ href: '/logic/for', label: '`for`', summary: tagHelp.for.summary }],
  },
  {
    slug: 'for', title: 'for', summary: tagHelp.for.summary, syntax: tagHelp.for.syntax,
    sections: [
      { id: 'usage', title: 'Usage', notes: [
        'Use the name after `for` to access the current item. Close the block with `endfor`.',
        'An empty or missing array produces no output.',
        'Each item is separated by a line break. Leave an extra blank line before `endfor` to separate paragraphs or tables.',
      ] },
      { id: 'loop-values', title: 'Loop values', notes: [
        '`loop.index` is the current item number, starting at 1. `loop.index0` starts at 0.',
        '`loop.first` and `loop.last` are true for the first and last items.',
        '`loop.length` is the total number of items.',
      ] },
    ],
    examples: [tagHelp.for.example],
    links: [{ href: '/logic/if', label: '`if`', summary: tagHelp.if.summary }, { href: '/logic/set', label: '`set`', summary: tagHelp.set.summary }],
  },
  {
    slug: 'set', title: 'set', summary: tagHelp.set.summary, syntax: tagHelp.set.syntax,
    sections: [
      { id: 'usage', title: 'Usage', notes: [
        'Give a value a name, then use `{{ name }}` later in the template. Filters can be applied.',
        'Using the same name again replaces its value.',
        'Values set inside a loop only last for the current item.',
        'The `set` tag produces no output and needs no closing tag.',
      ] },
    ],
    examples: [tagHelp.set.example],
    links: [{ href: '/logic/for', label: '`for`', summary: tagHelp.for.summary }],
  },
];
