export function setStatus(element: HTMLElement, text: string, state = '') {
  element.textContent = text;
  element.dataset.state = state;
  if (!['success', 'error', 'warning'].includes(state)) return;

  const message = document.createElement('span');
  message.className = 'playground-status-message';
  const label = document.createElement('span');
  label.textContent = text;

  // Lucide circle-check and triangle-alert.
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', `playground-status-icon playground-status-icon-${state}`);
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('width', '16');
  icon.setAttribute('height', '16');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = state === 'success'
    ? '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'
    : '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>';
  message.append(icon, label);
  element.replaceChildren(message);
}
