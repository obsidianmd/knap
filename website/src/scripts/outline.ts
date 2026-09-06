// Match Reader mode: brighten the current section and fade those above it.
export function setupOutline() {
  const links = document.querySelectorAll<HTMLAnchorElement>('.docs-toc a[href^="#"]');
  const sections = [...links].flatMap((link) => {
    const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    return heading ? [{ link, heading }] : [];
  });
  if (!sections.length) return;

  let activeIndex = -2;
  let frame = 0;

  const update = () => {
    frame = 0;
    // Reader mode's activation zone ends one fifth of the way down the viewport.
    const readingLine = window.innerHeight * 0.2;
    let nextIndex = -1;
    sections.forEach(({ heading }, index) => {
      if (heading.getBoundingClientRect().top <= readingLine) nextIndex = index;
    });

    // Short final sections cannot always reach the activation zone.
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      nextIndex = sections.length - 1;
    }
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;
    sections.forEach(({ link }, index) => {
      link.classList.toggle('is-read', index < activeIndex);
      if (index === activeIndex) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const scheduleUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate, { once: true });
  update();
}
