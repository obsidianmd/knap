import { playgroundLimits, playgroundSizeError } from './playground-limits';

export interface PlaygroundExample {
  input: string;
  template: string;
}

export function playgroundHref(example: PlaygroundExample): string {
  if (example.input.length > playgroundLimits.input) throw new Error(playgroundSizeError('input'));
  if (example.template.length > playgroundLimits.template) throw new Error(playgroundSizeError('template'));
  const params = new URLSearchParams({ input: example.input, template: example.template });
  if (params.toString().length + 1 > playgroundLimits.hash) throw new Error('This example is too large to share.');
  return `/playground#${params}`;
}

export function readPlaygroundExample(hash: string): PlaygroundExample | null {
  if (!hash.startsWith('#') || hash.length > playgroundLimits.hash) return null;
  const params = new URLSearchParams(hash.slice(1));
  if (params.has('input') && params.has('template')) {
    const example = { input: params.get('input')!, template: params.get('template')! };
    return withinLimits(example) ? example : null;
  }
  // Continue accepting previously shared example links.
  if (!hash.startsWith('#example=')) return null;
  try {
    const value = JSON.parse(decodeURIComponent(hash.slice('#example='.length)));
    if (value && typeof value.input === 'string' && typeof value.template === 'string' && withinLimits(value)) {
      return { input: value.input, template: value.template };
    }
  } catch {
    // A malformed example link leaves the default example available.
  }
  return null;
}

function withinLimits(example: PlaygroundExample): boolean {
  return example.input.length <= playgroundLimits.input && example.template.length <= playgroundLimits.template;
}
