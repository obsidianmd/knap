import { highlightLines } from '../lib/highlight';
import { buildDemoTimeline, buildFrontmatterDemoTimeline, buildMarkdownDemoTimeline, buildTypingDemoTimeline, type TypingDemoStep } from '../lib/live-template-timeline';

document.querySelectorAll<HTMLElement>('[data-live-template]').forEach((demo) => {
  const steps: TypingDemoStep[] = JSON.parse(demo.dataset.steps!);
  const frames = demo.dataset.demoTimeline === 'markdown'
    ? buildMarkdownDemoTimeline(steps)
    : demo.dataset.demoTimeline === 'frontmatter'
      ? buildFrontmatterDemoTimeline(steps)
    : demo.dataset.demoTimeline === 'typing'
      ? buildTypingDemoTimeline(steps)
      : buildDemoTimeline(steps);
  const template = demo.querySelector<HTMLElement>('[data-demo-template]')!;
  const output = demo.querySelector<HTMLElement>('[data-demo-output]')!;
  const rewind = demo.querySelector<HTMLButtonElement>('[data-demo-rewind]')!;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let playing = false;
  let inView = false;
  let position = reducedMotion.matches ? frames.length - 1 : 0;

  const draw = () => {
    const frame = frames[position];
    template.innerHTML = highlightLines(frame.source.split('\n'), 'knap').join('\n');
    output.innerHTML = frame.output;
    if (playing) {
      const cursor = document.createElement('span');
      cursor.className = 'live-template-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      const walker = document.createTreeWalker(template, NodeFilter.SHOW_TEXT);
      let offset = frame.cursor;
      if (!frame.source) template.append(cursor);
      while (walker.nextNode()) {
        const text = walker.currentNode as Text;
        if (offset <= text.length) {
          text.parentNode!.insertBefore(cursor, text.splitText(offset));
          break;
        }
        offset -= text.length;
      }
    }
  };
  const pause = () => {
    clearTimeout(timer);
    playing = false;
    draw();
  };
  const tick = () => {
    if (!playing) return;
    if (position === frames.length - 1) {
      playing = false;
      draw();
      return;
    }
    position += 1;
    if (position === frames.length - 1) playing = false;
    draw();
    if (playing) timer = setTimeout(tick, frames[position].delay);
  };
  const play = (delay = frames[position].delay) => {
    if (playing || position === frames.length - 1 || !inView || document.hidden || reducedMotion.matches) return;
    playing = true;
    draw();
    timer = setTimeout(tick, delay);
  };

  rewind.addEventListener('click', () => {
    pause();
    if (reducedMotion.matches) {
      position = frames.length - 1;
      draw();
      return;
    }
    position = 0;
    draw();
    play(200);
  });
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : play());
  const applyMotionPreference = () => {
    if (reducedMotion.matches) {
      position = frames.length - 1;
      pause();
    } else {
      play();
    }
  };
  reducedMotion.addEventListener('change', applyMotionPreference);

  draw();
  applyMotionPreference();
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) play();
    else pause();
  }, { threshold: 0.5 });
  observer.observe(demo);
});
