export function setupPlaygroundSettings() {
  const trigger = document.querySelector<HTMLButtonElement>('#playground-settings')!;
  const menu = document.querySelector<HTMLElement>('#playground-settings-menu')!;
  const items = [...menu.querySelectorAll<HTMLButtonElement>('button')];

  const close = (restoreFocus = false) => {
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
    if (item && !item.hasAttribute('data-menu-keep-open')) close(true);
  });
  menu.addEventListener('keydown', (event) => {
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    if (event.key === 'ArrowDown') next = (index + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (index + items.length - 1) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
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
    items[next].focus();
  });
  document.addEventListener('pointerdown', (event) => {
    if (!(event.target instanceof Node) || trigger.parentElement!.contains(event.target)) return;
    close();
  });
  document.addEventListener('focusin', (event) => {
    if (event.target instanceof Node && !trigger.parentElement!.contains(event.target)) close();
  });
}
