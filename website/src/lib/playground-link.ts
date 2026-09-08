export interface PlaygroundExample {
  input: string;
  template: string;
}

export function playgroundHref(example: PlaygroundExample): string {
  const params = new URLSearchParams({ input: example.input, template: example.template });
  return `/playground#${params}`;
}

export function readPlaygroundExample(hash: string): PlaygroundExample | null {
  if (!hash.startsWith('#')) return null;
  const params = new URLSearchParams(hash.slice(1));
  if (params.has('input') && params.has('template')) {
    return { input: params.get('input')!, template: params.get('template')! };
  }
  // Continue accepting previously shared example links.
  if (!hash.startsWith('#example=')) return null;
  try {
    const value = JSON.parse(decodeURIComponent(hash.slice('#example='.length)));
    if (value && typeof value.input === 'string' && typeof value.template === 'string') {
      return { input: value.input, template: value.template };
    }
  } catch {
    // A malformed example link leaves the default example available.
  }
  return null;
}
