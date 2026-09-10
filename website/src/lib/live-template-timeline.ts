export interface DemoStep {
  expression: string;
  prefix: string;
  suffix: string;
  output: string;
}

export interface DemoFrame {
  source: string;
  cursor: number;
  output: string;
  delay: number;
}

// Store each typing position with its caret and output for playback.
export function buildDemoTimeline(steps: DemoStep[]): DemoFrame[] {
  const frames: DemoFrame[] = [{ source: '', cursor: 0, output: '', delay: 200 }];
  frames.push({ source: '{', cursor: 1, output: '', delay: 85 });
  // Completing the opening delimiter inserts a spaced closing pair with the caret inside.
  frames.push({ source: '{%  %}', cursor: 3, output: '', delay: 150 });
  for (let length = 1; length <= 2; length += 1) {
    const source = `{% ${'if'.slice(0, length)} %}`;
    frames.push({ source, cursor: 3 + length, output: '', delay: 85 });
  }
  const logic = steps[0];
  frames.push({ source: logic.prefix + 'if' + logic.suffix, cursor: logic.prefix.length + 2, output: '', delay: 200 });

  let output = '';
  steps.forEach((step, index) => {
    const previous = steps[index - 1];
    const start = index === 0 ? 2 : previous.prefix === step.prefix ? previous.expression.length : 0;
    if (index > 0 && start === 0) {
      if (index === 1) {
        const previousSource = previous.prefix + previous.expression + previous.suffix;
        const previousCursor = previous.prefix.length + previous.expression.length;
        // Move through the rest of the if tag and its newline one character at a time.
        for (let offset = 1; offset <= 4; offset += 1) {
          frames.push({ source: previousSource, cursor: previousCursor + offset, output, delay: offset === 4 ? 150 : 85 });
        }
        const linePrefix = step.prefix.slice(0, -3);
        const closingBlock = step.suffix.slice(3);
        frames.push({ source: linePrefix + '{' + closingBlock, cursor: linePrefix.length + 1, output, delay: 85 });
        // Completing `{{` inserts the spaced closing pair with the caret still inside.
        frames.push({ source: linePrefix + '{{  }}' + closingBlock, cursor: linePrefix.length + 3, output, delay: 150 });
      } else {
        frames.push({ source: step.prefix + step.suffix, cursor: step.prefix.length, output, delay: 85 });
      }
    }
    for (let length = start + 1; length <= step.expression.length; length += 1) {
      const complete = length === step.expression.length;
      if (complete) output = step.output;
      frames.push({
        source: step.prefix + step.expression.slice(0, length) + step.suffix,
        cursor: step.prefix.length + length,
        output,
        delay: complete ? 800 : 85,
      });
    }
  });
  return frames;
}
