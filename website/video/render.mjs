import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Run against the local website. All animation keyframes, demo steps, syntax
// highlighting, fonts, and colors come from the current homepage.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const output = path.resolve(process.env.OUTPUT_DIR || fileURLToPath(new URL('../outputs/intro', import.meta.url)));
const fps = 60;
const width = 3840;
const height = 2160;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

try {
  const page = await browser.newPage({ viewport: { width: width / 2, height: height / 2 }, deviceScaleFactor: 2 });
  await page.addInitScript(() => {
    // Freeze the real Web Animations API animations before their first frame.
    // Rendering later seeks these exact animations; no reconstructed easing.
    window.videoAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      animation.pause();
      animation.currentTime = 0;
      window.videoAnimations.push(animation);
      return animation;
    };
  });
  await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4321', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const timing = await page.evaluate(async () => {
    const { buildDemoTimeline, buildMarkdownDemoTimeline, buildFrontmatterDemoTimeline } = await import('/src/lib/live-template-timeline.ts');
    const { highlightLines } = await import('/src/lib/highlight.ts');
    const example = document.querySelector('#live-template-title');
    const firstExample = document.querySelector('#markdown-template-example');
    const firstSteps = JSON.parse(firstExample.dataset.steps);
    const secondSteps = JSON.parse(example.dataset.steps);
    const thirdSteps = JSON.parse(document.querySelector('#frontmatter-template-example').dataset.steps);
    const makeTimeline = (frames, start) => {
      let elapsed = 0;
      const ends = frames.map(frame => (elapsed += frame.delay));
      return { frames, ends, start, end: start + ends.at(-2) };
    };
    const first = makeTimeline(buildMarkdownDemoTimeline(firstSteps), 1300);
    const clearStart = first.end + 2200;
    const second = makeTimeline(buildDemoTimeline(secondSteps), clearStart + 600);
    const secondClearStart = second.end + 2200;
    const third = makeTimeline(buildFrontmatterDemoTimeline(thirdSteps), secondClearStart + 600);
    const sequences = [
      { ...first, name: 'Markdown', steps: firstSteps, templateHeight: 458, panelHeight: 984 },
      { ...second, name: 'Cast', steps: secondSteps, templateHeight: 386, panelHeight: 984 },
      { ...third, name: 'Frontmatter', steps: thirdSteps, templateHeight: 440, panelHeight: 1032 },
    ];
    const transitions = sequences.slice(1).map((sequence, index) => ({
      start: sequence.start - 600, end: sequence.start,
      from: sequences[index], to: sequence,
    }));
    const cairn = document.querySelector('cairn-headline').cloneNode(true);
    const panel = example.querySelector('.template-output-panel').cloneNode(true);
    panel.querySelectorAll('.doc-code-actions, .live-template-final').forEach(node => node.remove());
    // Keep the homepage mounted, but place the film on an opaque stage above it.
    const stage = document.createElement('div');
    stage.id = 'video-stage';
    stage.innerHTML = '<div id="video-title"><div id="video-wordmark">Knap</div></div><div id="video-demo"></div>';
    document.body.append(stage);
    document.querySelector('#video-title').append(cairn);
    document.querySelector('#video-demo').append(panel);
    const style = document.createElement('style');
    style.textContent = `
      html, body { overflow: hidden !important; scroll-behavior: auto !important; }
      #video-stage { position: fixed; inset: 0; z-index: 999999; background: var(--ink); }
      #video-title, #video-demo { position: absolute; inset: 0; }
      #video-title { display: flex; align-items: center; padding: 0 64px; font-family: "Inter Variable", sans-serif; background: var(--ink); z-index: 1; }
      #video-wordmark { color: #e6e4d9; font-size: 500px; font-weight: 850; line-height: 1; letter-spacing: -0.035em; flex: none; }
      #video-title cairn-headline { position: absolute; right: -64px; margin: 0; }
      #video-title cairn-headline h1 { font-size: 128px; }
      #video-demo { display: grid; place-items: center; }
      #video-demo .template-output-panel { position: absolute; top: 48px; width: 100%; height: var(--panel-height, 984px); margin: 0; border-radius: 0; background: var(--ink); }
      #video-demo .template-output-block { padding: 32px 80px; }
      #video-demo .template-output-template { height: var(--template-height, 458px); }
      #video-demo .template-output-result { height: calc(var(--panel-height, 984px) - var(--template-height, 458px)); border-top: 2px solid var(--line); }
      #video-demo .doc-code { background: var(--ink); }
      #video-demo .template-output-label { font-size: 44px; line-height: 1.4; margin: 0 0 30px; }
      #video-demo pre { font-size: 44px; line-height: 1.62; margin: 0; padding: 0; letter-spacing: 0; }
      #video-demo pre, #video-demo code { font-family: var(--font-mono); }
      #video-demo .live-template-content { display: block; }
      #video-demo .live-template-current { position: static; }
      #video-demo .doc-code-line { min-height: 1.62em; }
      #video-demo .live-template-cursor::after { width: 3px; }
    `;
    document.head.append(style);
    const title = document.querySelector('#video-title');
    const template = panel.querySelector('[data-demo-template]');
    const result = panel.querySelector('[data-demo-output]');
    const duration = Math.ceil((third.end + 3200) / 1000 * 60) / 60;
    let previousKey;
    window.renderVideoFrame = (time) => {
      // The opaque title card swipes down to reveal the code beneath it.
      const swipe = Math.max(0, Math.min(1, (time - 1100) / 200));
      const eased = swipe * swipe;
      title.style.transform = `translateY(${eased * 100}%)`;
      const animations = window.videoAnimations.filter(animation => title.contains(animation.effect.target));
      animations.forEach(animation => { animation.currentTime = Math.max(0, time - 150); });
      // Clear both code areas together. Keep the labels and divider on screen,
      // then slide the divider and Output label to fit the next template.
      const transition = transitions.findLast(item => time >= item.start);
      const clearing = transition && time < transition.end;
      const sequence = transition?.to ?? sequences[0];
      const reposition = transition ? Math.max(0, Math.min(1, (time - transition.start - 150) / 300)) : 0;
      const positionEase = reposition * reposition * (3 - 2 * reposition);
      const interpolate = property => transition
        ? transition.from[property] + (transition.to[property] - transition.from[property]) * positionEase
        : sequence[property];
      panel.style.setProperty('--template-height', `${interpolate('templateHeight')}px`);
      panel.style.setProperty('--panel-height', `${interpolate('panelHeight')}px`);
      const { frames, ends } = sequence;
      const local = Math.max(0, time - sequence.start);
      let index = ends.findIndex(end => local < end);
      if (index < 0) index = frames.length - 1;
      const contentKey = clearing ? `clear-${sequence.start}` : `${sequence.start}-${index}`;
      if (contentKey !== previousKey) {
        const frame = frames[index];
        template.innerHTML = clearing ? '' : highlightLines(frame.source.split('\n'), 'knap').join('\n');
        result.innerHTML = clearing ? '' : frame.output;
        if (!clearing && index < frames.length - 1) {
          const cursor = document.createElement('span');
          cursor.className = 'live-template-cursor';
          const walker = document.createTreeWalker(template, NodeFilter.SHOW_TEXT);
          let offset = frame.cursor;
          if (!frame.source) template.append(cursor);
          while (walker.nextNode()) {
            const text = walker.currentNode;
            if (offset <= text.length) { text.parentNode.insertBefore(cursor, text.splitText(offset)); break; }
            offset -= text.length;
          }
        }
        previousKey = contentKey;
      }
      // Identical held frames can reuse a lossless screenshot.
      const activeAnimation = time >= 150 && time <= 917;
      const activeSwipe = swipe > 0 && swipe < 1;
      const activeReposition = reposition > 0 && reposition < 1;
      return activeAnimation || activeSwipe || activeReposition ? time : swipe === 0 ? 'title' : `${contentKey}-${positionEase}`;
    };
    return {
      duration, transitions: transitions.map(({ start, end }) => ({ start, end })),
      examples: sequences.map(sequence => ({
        name: sequence.name,
        start: sequence.start, end: sequence.end, frameCount: sequence.frames.length,
        finalTemplate: sequence.frames.at(-1).source,
        finalOutput: sequence.steps.at(-1).rawOutput,
      })),
    };
  });
  await page.waitForFunction(() => window.videoAnimations.filter(animation => document.querySelector('#video-title').contains(animation.effect.target)).length === 8);
  console.log(JSON.stringify(timing, null, 2));

  // Preview mode gives full-resolution stills before committing to an encode.
  for (const [name, time] of [
    ['title', 1000],
    ['first-result', timing.examples[0].end + 1000],
    ['clear', timing.transitions[0].start + 100],
    ['clear-repositioned', timing.transitions[0].end - 50],
    ['typing', timing.examples[1].start + 2800],
    ['second-result', timing.examples[1].end + 1000],
    ['second-clear', timing.transitions[1].start + 100],
    ['second-clear-repositioned', timing.transitions[1].end - 50],
    ['result', timing.examples[2].end + 1000],
  ]) {
    await page.evaluate(time => window.renderVideoFrame(time), time);
    await page.screenshot({ path: path.join(output, `${name}.png`) });
  }
  const layout = await page.evaluate(() => {
    const panel = document.querySelector('#video-demo .template-output-panel').getBoundingClientRect();
    const output = document.querySelector('#video-demo [data-demo-output]').getBoundingClientRect();
    const title = document.querySelector('#video-wordmark').getBoundingClientRect();
    const cairn = document.querySelector('#video-title cairn-headline').getBoundingClientRect();
    return { panel: panel.toJSON(), output: output.toJSON(), title: title.toJSON(), cairn: cairn.toJSON(), animations: window.videoAnimations.filter(a => document.querySelector('#video-title').contains(a.effect.target)).map(a => a.effect.getTiming()) };
  });
  await writeFile(path.join(output, 'render-info.json'), JSON.stringify({ width, height, fps, ...timing, layout }, null, 2));
  if (process.argv.includes('--preview')) process.exitCode = 0;
  else {
    const file = path.join(output, 'knap-intro-4k.mp4');
    const encoder = spawn('ffmpeg', ['-y', '-loglevel', 'warning', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'png', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
    const finished = once(encoder, 'close');
    let previousKey;
    let screenshot;
    const count = Math.round(timing.duration * fps);
    for (let frame = 0; frame < count; frame++) {
      const key = await page.evaluate(time => window.renderVideoFrame(time), frame / fps * 1000);
      if (key !== previousKey) screenshot = await page.screenshot({ type: 'png' });
      previousKey = key;
      if (!encoder.stdin.write(screenshot)) await once(encoder.stdin, 'drain');
      if (frame % 120 === 0) console.log(`Rendered ${frame}/${count} frames`);
    }
    encoder.stdin.end();
    const [code] = await finished;
    if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
    console.log(`Saved ${file}`);
  }
} finally {
  await browser.close();
}
