import { createEngine, standardFilters, type TemplateError, type TemplateWarning } from '../../../src';
import { parsePlaygroundInput, type PlaygroundInput } from './playground-input';
import { recoverPlaygroundTemplate } from './playground-recovery';
import { homeExamples } from './home-examples';

const movieSample = homeExamples.find((example) => example.key === 'movie')!;
export const exampleInput = JSON.stringify(movieSample.variables, null, 2);
export const exampleTemplate = movieSample.template;

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
