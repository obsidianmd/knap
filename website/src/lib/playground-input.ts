export type PlaygroundInput =
  | { variables: Record<string, unknown>; error: null }
  | { variables: null; error: string };

export function parsePlaygroundInput(source: string): PlaygroundInput {
  try {
    const variables: unknown = JSON.parse(source);
    if (variables === null || typeof variables !== 'object' || Array.isArray(variables)) {
      return { variables: null, error: 'Input must be a JSON object, for example { "title": "Hello" }.' };
    }
    return { variables: variables as Record<string, unknown>, error: null };
  } catch (error) {
    return { variables: null, error: error instanceof Error ? error.message : 'Invalid JSON input.' };
  }
}

export function createPlaygroundInputValidator() {
  let cached: { source: string; input: PlaygroundInput } | undefined;
  return (source: string): PlaygroundInput => {
    if (!cached || cached.source !== source) cached = { source, input: parsePlaygroundInput(source) };
    return cached.input;
  };
}
