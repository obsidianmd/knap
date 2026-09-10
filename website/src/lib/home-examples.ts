export const homeExamples: { key: string; label: string; variables: Record<string, unknown>; template: string; markdown: string }[] = [
  {
    key: 'movie',
    variables: { title: 'The Matrix', year: 1999, directors: ['Lana Wachowski', 'Lilly Wachowski'], genres: ['Action', 'Sci-fi'], plot: 'A hacker discovers that reality is a simulation and joins a rebellion against its machines.', cast: [{ Actor: 'Keanu Reeves', Role: 'Neo' }, { Actor: 'Laurence Fishburne', Role: 'Morpheus' }, { Actor: 'Carrie-Anne Moss', Role: 'Trinity' }, { Actor: 'Hugo Weaving', Role: 'Agent Smith' }] },
    label: 'Movie',
    template: `---
year: {{ year }}
{{ directors | wikilink | yaml_property:"directors" }}
---

{{ title | h1 }}

**Plot:**
{{ plot | blockquote }}

{% if cast %}
## Cast

{{ cast | sort:"Actor" | table }}
{% endif %}`,
    markdown: `---
year: 1999
directors:
  - "[[Lana Wachowski]]"
  - "[[Lilly Wachowski]]"
---

# The Matrix

**Plot:**
> A hacker discovers that reality is a simulation and joins a rebellion against its machines.

## Cast

| Actor | Role |
| - | - |
| Carrie-Anne Moss | Trinity |
| Hugo Weaving | Agent Smith |
| Keanu Reeves | Neo |
| Laurence Fishburne | Morpheus |`,
  },
  {
    key: 'book',
    label: 'Book',
    variables: {
      title: 'The Machine Stops',
      author: 'E. M. Forster',
      year: 1909,
      isbn: '9781409903291',
      genres: ['Sci-fi'],
      url: 'https://stephango.com/the-machine-stops',
      summary: 'Humanity lives underground, dependent on a vast Machine for every need. A mother and son confront the limits of a life mediated by technology.',
      chapters: ['The Air Ship', 'The Mending Apparatus', 'The Homeless'],
    },
    template: `---
{{ author | wikilink | yaml_property:"author" }}
{{ year | yaml_property:"year" }}
{{ isbn | yaml_property:"isbn" }}
{{ genres | yaml_property:"genres" }}
{{ url | yaml_property:"source" }}
---

{{ title | h1 }}

{{ summary | blockquote }}

{% if chapters %}
## Contents

{{ chapters | list:numbered }}
{% endif %}`,
    markdown: `---
author: "[[E. M. Forster]]"
year: 1909
isbn: 9781409903291
genres:
  - "Sci-fi"
source: "https://stephango.com/the-machine-stops"
---

# The Machine Stops

> Humanity lives underground, dependent on a vast Machine for every need. A mother and son confront the limits of a life mediated by technology.

## Contents

1. The Air Ship
2. The Mending Apparatus
3. The Homeless`,
  },
  {
    key: 'recipe',
    variables: { author: 'Eric Kim', servings: 8, url: 'https://example.com/gochujang-cookies', title: 'Gochujang caramel cookies', description: 'Chewy sugar cookies with a ribbon of spicy caramel.', ingredients: [['Unsalted butter', '1/2 cup'], ['Dark brown sugar', '1/4 cup'], ['Gochujang', '1 tablespoon'], ['All-purpose flour', '1 1/2 cups']], instructions: ['Mix the caramel ingredients until smooth.', 'Make and chill the cookie dough.', 'Swirl in the caramel, shape, and bake.'] },
    label: 'Recipe',
    template: `---
{{ author | wikilink | yaml_property:"author" }}
{{ servings | yaml_property:"servings" }}
{{ url | yaml_property:"source" }}
---

{{ title | h1 }}

{{ description | blockquote }}

## Ingredients

{{ ingredients | table:("Ingredient", "Quantity") }}

## Instructions

{{ instructions | list:numbered }}`,
    markdown: `---
author: "[[Eric Kim]]"
servings: 8
source: "https://example.com/gochujang-cookies"
---

# Gochujang caramel cookies

> Chewy sugar cookies with a ribbon of spicy caramel.

## Ingredients

| Ingredient | Quantity |
| - | - |
| Unsalted butter | 1/2 cup |
| Dark brown sugar | 1/4 cup |
| Gochujang | 1 tablespoon |
| All-purpose flour | 1 1/2 cups |

## Instructions

1. Mix the caramel ingredients until smooth.
2. Make and chill the cookie dough.
3. Swirl in the caramel, shape, and bake.`,
  },
  {
    key: 'article',
    variables: { author: 'Steph Ango', published: '2023-06-30', url: 'https://stephango.com/file-over-app', tags: ['clippings', 'articles'], title: 'File over app', description: 'If you want to create digital artifacts that last, they must be files you can control.', content: 'In the fullness of time, the files you create are more important than the tools you use to create them.' },
    label: 'Article',
    template: `---
{{ author | wikilink | yaml_property:"author" }}
published: {{ published | date:"YYYY-MM-DD" }}
{{ url | yaml_property:"source" }}
{{ tags | yaml_property:"tags" }}
---

{% set heading = title ?? "Untitled" %}
{{ heading | h1 }}

{{ description | blockquote }}

{{ content }}`,
    markdown: `---
author: "[[Steph Ango]]"
published: 2023-06-30
source: "https://stephango.com/file-over-app"
tags:
  - "clippings"
  - "articles"
---

# File over app

> If you want to create digital artifacts that last, they must be files you can control.

In the fullness of time, the files you create are more important than the tools you use to create them.`,
  },
  {
    key: 'research',
    variables: { metadata: { authors: ['[[Ashish Vaswani]]', '[[Noam Shazeer]]', '[[Niki Parmar]]'], published: '2017-06-12', doi: '10.48550/arXiv.1706.03762', source: 'https://arxiv.org/abs/1706.03762' }, title: 'Attention Is All You Need', abstract: 'The Transformer is a network architecture based solely on attention mechanisms.', highlights: ['Replaces recurrence with self-attention', 'Enables more parallel training', 'Improves machine translation results'] },
    label: 'Research',
    template: `---
{{ metadata | yaml }}
---

{{ title | h1 }}

## Abstract

{{ abstract }}

{% if highlights %}
## Highlights

{{ highlights | list }}
{% endif %}`,
    markdown: `---
authors:
  - "[[Ashish Vaswani]]"
  - "[[Noam Shazeer]]"
  - "[[Niki Parmar]]"
published: "2017-06-12"
doi: "10.48550/arXiv.1706.03762"
source: "https://arxiv.org/abs/1706.03762"
---

# Attention Is All You Need

## Abstract

The Transformer is a network architecture based solely on attention mechanisms.

## Highlights

- Replaces recurrence with self-attention
- Enables more parallel training
- Improves machine translation results`,
  },
];
