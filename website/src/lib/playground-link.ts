export interface PlaygroundExample {
  input: string;
  template: string;
}

export function playgroundHref(example: PlaygroundExample): string {
  return `/playground#example=${encodeURIComponent(JSON.stringify(example))}`;
}

export function readPlaygroundExample(hash: string): PlaygroundExample | null {
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
