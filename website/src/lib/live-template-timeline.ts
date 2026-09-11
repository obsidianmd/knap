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

export interface TypingDemoStep extends DemoStep {
  template: string;
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

// Type a Markdown heading, then add a second expression and transform it with a filter.
export function buildMarkdownDemoTimeline(steps: DemoStep[]): DemoFrame[] {
  const frames: DemoFrame[] = [{ source: '', cursor: 0, output: '', delay: 200 }];
  let output = '';

  frames.push({ source: '#', cursor: 1, output, delay: 85 });
  frames.push({ source: '# ', cursor: 2, output, delay: 150 });
  frames.push({ source: '# {', cursor: 3, output, delay: 85 });
  frames.push({ source: '# {{  }}', cursor: 5, output, delay: 150 });

  const title = steps[0];
  for (let length = 1; length <= title.expression.length; length += 1) {
    const complete = length === title.expression.length;
    if (complete) output = title.output;
    frames.push({
      source: title.prefix + title.expression.slice(0, length) + title.suffix,
      cursor: title.prefix.length + length,
      output,
      delay: complete ? 800 : 85,
    });
  }

  const titleSource = title.prefix + title.expression + title.suffix;
  const titleCursor = title.prefix.length + title.expression.length;
  for (let offset = 1; offset <= title.suffix.length; offset += 1) {
    frames.push({ source: titleSource, cursor: titleCursor + offset, output, delay: 85 });
  }
  const plot = steps[1];
  const secondLinePrefix = plot.prefix.slice(0, -3);
  const markdownBetweenExpressions = secondLinePrefix.slice(titleSource.length);
  const boldStart = markdownBetweenExpressions.indexOf('**');
  const boldEnd = boldStart < 0 ? -1 : markdownBetweenExpressions.indexOf('**', boldStart + 2);
  for (let length = 1; length <= markdownBetweenExpressions.length; length += 1) {
    const character = markdownBetweenExpressions[length - 1];
    // Auto-pair bold markers, type inside them, then move past the existing closing pair.
    const pairedBold = boldEnd >= 0 && length >= boldStart + 2 && length < boldEnd + 2;
    const closingBold = pairedBold ? '**'.slice(Math.max(0, length - boldEnd)) : '';
    frames.push({
      source: titleSource + markdownBetweenExpressions.slice(0, length) + closingBold,
      cursor: titleSource.length + length,
      output,
      delay: character === '\n' || (pairedBold && length === boldStart + 2) ? 150 : 85,
    });
  }
  frames.push({ source: `${secondLinePrefix}{`, cursor: secondLinePrefix.length + 1, output, delay: 85 });
  frames.push({ source: plot.prefix + plot.suffix, cursor: plot.prefix.length, output, delay: 150 });

  steps.slice(1).forEach((step, index) => {
    const previous = steps[index];
    const start = index === 0 ? 0 : previous.expression.length;
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

// Type a sequence of progressively longer templates, updating output at each checkpoint.
export function buildTypingDemoTimeline(steps: TypingDemoStep[]): DemoFrame[] {
  const frames: DemoFrame[] = [{ source: '', cursor: 0, output: '', delay: 200 }];
  let source = '';
  let output = '';

  steps.forEach((step) => {
    if (!step.template.startsWith(source)) throw new Error('Typing demo steps must extend the previous template');
    for (let length = source.length + 1; length <= step.template.length; length += 1) {
      const complete = length === step.template.length;
      if (complete) output = step.output;
      const nextSource = step.template.slice(0, length);
      frames.push({
        source: nextSource,
        cursor: nextSource.length,
        output,
        delay: complete ? 500 : nextSource.endsWith('\n') ? 150 : 55,
      });
    }
    source = step.template;
  });

  return frames;
}

// Type an opening frontmatter fence, auto-pair its closing fence, then fill it in.
export function buildFrontmatterDemoTimeline(steps: TypingDemoStep[]): DemoFrame[] {
  const opening = '---\n';
  const closing = '\n---';
  const frames: DemoFrame[] = [
    { source: '', cursor: 0, output: '', delay: 200 },
    { source: '-', cursor: 1, output: '', delay: 55 },
    { source: '--', cursor: 2, output: '', delay: 55 },
  ];
  let content = '';
  let output = '';

  steps.forEach((step, index) => {
    if (!step.template.startsWith(opening) || !step.template.endsWith(closing)) {
      throw new Error('Frontmatter demo steps must include paired fences');
    }
    const nextContent = step.template.slice(opening.length, -closing.length);
    if (!nextContent.startsWith(content)) throw new Error('Frontmatter demo steps must extend the previous content');

    if (index === 0) {
      output = step.output;
      frames.push({ source: step.template, cursor: opening.length, output, delay: 500 });
    } else {
      for (let length = content.length + 1; length <= nextContent.length; length += 1) {
        const complete = length === nextContent.length;
        if (complete) output = step.output;
        const typedContent = nextContent.slice(0, length);
        frames.push({
          source: opening + typedContent + closing,
          cursor: opening.length + typedContent.length,
          output,
          delay: complete ? 500 : typedContent.endsWith('\n') ? 150 : 55,
        });
      }
    }
    content = nextContent;
  });

  return frames;
}
