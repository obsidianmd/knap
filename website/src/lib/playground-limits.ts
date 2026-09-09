export const playgroundLimits = Object.freeze({
  input: 1_000_000,
  template: 100_000,
  output: 100_000,
  hash: 2_000_000,
});

export const maxHighlightLineLength = 2_000;

export function playgroundSizeError(name: 'input' | 'template' | 'output'): string {
  const label = name === 'input' ? 'Data' : name === 'template' ? 'Template' : 'Output';
  return `${label} is too large. The limit is ${playgroundLimits[name].toLocaleString()} characters.`;
}

export function limitDiagnostics<T extends { message: string }>(diagnostics: T[]): T[] {
  return diagnostics.slice(0, 100).map(diagnostic => ({
    ...diagnostic,
    message: diagnostic.message.length > 1000 ? diagnostic.message.slice(0, 1000) + '…' : diagnostic.message,
  }));
}
