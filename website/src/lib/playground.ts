import { createEngine, standardFilters, type TemplateError, type TemplateWarning } from '../../../src';
import { parsePlaygroundInput, type PlaygroundInput } from './playground-input';
import { recoverPlaygroundTemplate } from './playground-recovery';

export const exampleInput = JSON.stringify({
  title: 'The Matrix',
  year: 1999,
  directors: ['Lana Wachowski', 'Lilly Wachowski'],
  genres: ['Action', 'Sci-fi'],
  plot: 'A hacker discovers that reality is a simulation and joins a rebellion against its machines.',
  cast: [
    { actor: 'Keanu Reeves', role: 'Neo' },
    { actor: 'Laurence Fishburne', role: 'Morpheus' },
    { actor: 'Carrie-Anne Moss', role: 'Trinity' },
  ],
}, null, 2);

export const exampleTemplate = `---
{{ year | yaml_property:"year" }}
{{ directors | wikilink | yaml_property:"director" }}
{{ genres | yaml_property:"genre" }}
---

{{ title | h1 }}

{{ plot | blockquote }}

{% if cast %}
## Cast

{% for member in cast %}
- **{{ member.actor }}** as {{ member.role }}
{% endfor %}
{% endif %}`;

export interface PlaygroundResult {
  inputError: string | null;
  errors: TemplateError[];
  warnings: TemplateWarning[];
  output: string;
}

const engine = createEngine({ filters: standardFilters });

export async function evaluatePlayground(input: string | PlaygroundInput, template: string): Promise<PlaygroundResult> {
  const parsed = typeof input === 'string' ? parsePlaygroundInput(input) : input;
  const result: PlaygroundResult = {
    inputError: parsed.error,
    errors: engine.validate(template),
    warnings: [],
    output: template,
  };
  if (!parsed.variables) return result;

  const recovery = result.errors.some((error) => error.code === 'PARSE_ERROR')
    ? recoverPlaygroundTemplate(template)
    : undefined;
  const rendered = await engine.render(recovery?.template ?? template, { variables: { ...parsed.variables } });
  if (!recovery) return { ...result, ...rendered };
  return {
    ...result,
    output: rendered.errors.some((error) => error.code === 'PARSE_ERROR') ? template : rendered.output,
    errors: [...result.errors, ...rendered.errors.map(recovery.originalPosition)],
    warnings: rendered.warnings.map(recovery.originalPosition),
  };
}
