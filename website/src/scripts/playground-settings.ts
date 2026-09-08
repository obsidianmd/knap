export function setupPlaygroundSettings() {
  const trigger = document.querySelector<HTMLButtonElement>('#playground-settings')!;
  const menu = document.querySelector<HTMLElement>('#playground-settings-menu')!;
  const items = [...menu.querySelectorAll<HTMLButtonElement>(':scope > button, :scope > .menu-submenu > button')];
  const sampleTrigger = document.querySelector<HTMLButtonElement>('#open-sample')!;
  const samples = document.querySelector<HTMLElement>('#playground-samples-menu')!;
  const sampleItems = [...samples.querySelectorAll<HTMLButtonElement>('button')];
  const closeSamples = () => {
    samples.hidden = true;
    sampleTrigger.setAttribute('aria-expanded', 'false');
  };
  const openSamples = (focus = true) => {
    samples.classList.remove('opens-left');
    samples.hidden = false;
    if (samples.getBoundingClientRect().right > window.innerWidth - 8) samples.classList.add('opens-left');
    sampleTrigger.setAttribute('aria-expanded', 'true');
    if (focus) sampleItems[0].focus();
  };

  const close = (restoreFocus = false) => {
    closeSamples();
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  };
  const open = (index = 0) => {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    items[index].focus();
  };

  trigger.addEventListener('click', () => menu.hidden ? open() : close());
  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    open(event.key === 'ArrowDown' ? 0 : items.length - 1);
  });
  menu.addEventListener('click', (event) => {
    const item = (event.target as Element).closest('button');
    if (item === sampleTrigger) {
      openSamples();
      return;
    }
    if (item && !item.hasAttribute('data-menu-keep-open')) close(true);
  });
  sampleTrigger.parentElement!.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') openSamples(false);
  });
  sampleTrigger.parentElement!.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse' && !samples.contains(document.activeElement)) closeSamples();
  });
  items.forEach((item) => {
    if (item !== sampleTrigger) item.addEventListener('pointerenter', closeSamples);
  });
  menu.addEventListener('keydown', (event) => {
    const inSamples = samples.contains(document.activeElement);
    const currentItems = inSamples ? sampleItems : items;
    const index = currentItems.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowRight' && document.activeElement === sampleTrigger) {
      event.preventDefault();
      openSamples();
      return;
    }
    if (inSamples && (event.key === 'ArrowLeft' || event.key === 'Escape')) {
      event.preventDefault();
      closeSamples();
      sampleTrigger.focus();
      return;
    }
    let next: number;
    if (event.key === 'ArrowDown') next = (index + 1) % currentItems.length;
    else if (event.key === 'ArrowUp') next = (index + currentItems.length - 1) % currentItems.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = currentItems.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    } else if (event.key === 'Tab') {
      // Resume the page's normal tab order from the settings trigger.
      close(true);
      return;
    } else return;
    event.preventDefault();
    if (!inSamples && currentItems[next] !== sampleTrigger) closeSamples();
    currentItems[next].focus();
  });
  document.addEventListener('pointerdown', (event) => {
    if (!(event.target instanceof Node) || trigger.parentElement!.contains(event.target)) return;
    close();
  });
  document.addEventListener('focusin', (event) => {
    if (event.target instanceof Node && !trigger.parentElement!.contains(event.target)) close();
  });
}
