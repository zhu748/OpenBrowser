/**
 * Themed select / multi-select widget — second renderer.js split.
 *
 * Extracted verbatim from renderer.js (zero behaviour change): the custom
 * dropdown that replaces native <select> (button + listbox menu, keyboard
 * navigation, viewport-aware positioning, dialog top-layer support) and the
 * multi-select checklist variant. Classic script loaded by index.html BEFORE
 * renderer.js; the declarations stay top-level script globals because
 * renderer.js's event wiring and the ui/ modules call them directly.
 */
let openSelectMenu = null;
let themedSelectId = 0;

function closeSelectMenu({ restoreFocus = false } = {}) {
  if (!openSelectMenu) return;
  const { button, menu, settleTimer } = openSelectMenu;
  if (settleTimer) clearTimeout(settleTimer);
  menu.remove();
  button.classList.remove('open');
  button.setAttribute('aria-expanded', 'false');
  openSelectMenu = null;
  if (restoreFocus) button.focus();
}

function selectLabel(select) {
  const option = select.selectedOptions?.[0] || select.options[select.selectedIndex];
  return option?.textContent?.trim() || t('common.select');
}

function moveSelectMenuFocus(menu, key, fallbackIndex = null) {
  const enabled = [...menu.querySelectorAll('.themed-select-option:not(:disabled)')];
  if (!enabled.length) return;
  const focused = enabled.indexOf(document.activeElement);
  const fallback = Number.isInteger(fallbackIndex)
    ? enabled.findIndex((item) => Number(item.dataset.optionIndex) === fallbackIndex)
    : -1;
  const current = focused >= 0 ? focused : Math.max(0, fallback);
  let next = current;
  if (key === 'ArrowDown') next = (current + 1) % enabled.length;
  else if (key === 'ArrowUp') next = (current - 1 + enabled.length) % enabled.length;
  else if (key === 'Home') next = 0;
  else if (key === 'End') next = enabled.length - 1;
  enabled[next]?.focus({ preventScroll: true });
  enabled[next]?.scrollIntoView({ block: 'nearest' });
}

function syncThemedSelect(select) {
  const wrap = select.closest('.themed-select');
  if (!wrap) return;
  const button = wrap.querySelector('.themed-select-button');
  if (!button) return;
  button.querySelector('.themed-select-value').textContent = selectLabel(select);
  button.disabled = select.disabled;
  button.setAttribute('aria-label', select.getAttribute('aria-label') || select.labels?.[0]?.textContent?.trim() || selectLabel(select));
  if (openSelectMenu?.select === select) {
    const focusedIndex = Number(openSelectMenu.menu.querySelector(':focus')?.dataset.optionIndex);
    openThemedSelect(select, button, Number.isInteger(focusedIndex) ? focusedIndex : null);
  }
}

function positionSelectMenu(menu, button) {
  const rect = button.getBoundingClientRect();
  const gap = 4;
  const viewportPadding = 8;
  const menuWidth = Math.min(
    Math.max(rect.width, 160),
    window.innerWidth - viewportPadding * 2
  );
  const menuLeft = Math.min(
    Math.max(rect.left, viewportPadding),
    window.innerWidth - menuWidth - viewportPadding
  );
  const availableBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
  const availableAbove = rect.top - gap - viewportPadding;
  // Prefer below; flip only when below is clearly too tight and above is better
  const openAbove = availableBelow < 160 && availableAbove > availableBelow;
  const space = Math.max(0, openAbove ? availableAbove : availableBelow);
  // Long option lists need real height — allow up to ~half viewport
  const maxHeight = Math.max(120, Math.min(Math.floor(window.innerHeight * 0.5), Math.max(space, 160), 420));
  menu.style.position = 'fixed';
  menu.style.zIndex = '2147483000';
  menu.style.width = `${menuWidth}px`;
  menu.style.maxHeight = `${maxHeight}px`;
  menu.style.overflowY = 'auto';
  menu.style.overflowX = 'hidden';

  const parent = menu.offsetParent;
  const parentRect = parent && parent !== document.body && parent !== document.documentElement
    ? parent.getBoundingClientRect()
    : null;

  const adjustedLeft = parentRect ? menuLeft - parentRect.left : menuLeft;
  menu.style.left = `${adjustedLeft}px`;

  if (openAbove) {
    const menuHeight = Math.min(menu.scrollHeight || maxHeight, maxHeight);
    const targetTop = Math.max(viewportPadding, rect.top - gap - menuHeight);
    const adjustedTop = parentRect ? targetTop - parentRect.top : targetTop;
    menu.style.top = `${adjustedTop}px`;
    menu.style.bottom = 'auto';
  } else {
    const targetTop = rect.bottom + gap;
    const adjustedTop = parentRect ? targetTop - parentRect.top : targetTop;
    menu.style.top = `${adjustedTop}px`;
    menu.style.bottom = 'auto';
  }
}

function openThemedSelect(select, button, focusIndex = null) {
  closeSelectMenu();
  if (select.disabled) return;
  const menu = element('div', 'themed-select-menu');
  menu.id = button.getAttribute('aria-controls');
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', select.getAttribute('aria-label') || tx('选择选项'));
  menu.tabIndex = -1;
  menu.dataset.themedSelectMenu = '1';
  [...select.options].forEach((option, index) => {
    const item = element('button', 'themed-select-option', option.textContent.trim());
    item.id = `${menu.id}-option-${index}`;
    item.type = 'button';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(option.selected));
    item.disabled = option.disabled;
    item.dataset.optionIndex = String(index);
    if (option.selected) item.classList.add('selected');
    menu.append(item);
  });
  menu.addEventListener('keydown', (event) => {
    const item = event.target.closest('.themed-select-option');
    if (!item) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSelectMenu({ restoreFocus: true });
      return;
    }
    if (event.key === 'Tab') {
      closeSelectMenu();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      item.click();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    moveSelectMenuFocus(menu, event.key, select.selectedIndex);
  });
  // A modal dialog is in the browser top layer. No body z-index can rise above it,
  // so dialog-owned menus must join that same top-layer subtree.
  const owner = select.closest('dialog[open]') || document.body;
  owner.append(menu);
  button.classList.add('open');
  button.setAttribute('aria-expanded', 'true');
  const settleTimer = setTimeout(() => {
    if (openSelectMenu?.menu === menu) openSelectMenu.settling = false;
  }, 350);
  openSelectMenu = { select, button, menu, settling: true, settleTimer };
  positionSelectMenu(menu, button);
  // scrollIntoView can fire capture scroll and would close the menu — settle first
  requestAnimationFrame(() => {
    try {
      const requested = Number.isInteger(focusIndex)
        ? menu.querySelector(`[data-option-index="${focusIndex}"]:not(:disabled)`)
        : null;
      const active = requested || menu.querySelector('.selected:not(:disabled)') || menu.querySelector('.themed-select-option:not(:disabled)');
      active?.scrollIntoView({ block: 'nearest' });
      active?.focus({ preventScroll: true });
    } catch (_) {}
    positionSelectMenu(menu, button);
  });
}

function enhanceSelect(select) {
  if (!(select instanceof HTMLSelectElement) || select.closest('.themed-select, .themed-multiselect')) return;
  if (select.multiple) return enhanceMultiSelect(select);
  themedSelectId += 1;
  const controlId = select.id || `themed-select-${themedSelectId}`;
  const wrap = element('span', 'themed-select');
  const button = element('button', 'themed-select-button');
  button.type = 'button';
  button.id = `${controlId}-button`;
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', `${controlId}-menu`);
  const arrow = element('span', 'themed-select-arrow');
  arrow.setAttribute('aria-hidden', 'true');
  const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrowSvg.setAttribute('viewBox', '0 0 16 16');
  arrowSvg.setAttribute('width', '12');
  arrowSvg.setAttribute('height', '12');
  arrowSvg.setAttribute('fill', 'none');
  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('d', 'M4 6l4 4 4-4');
  arrowPath.setAttribute('stroke', 'currentColor');
  arrowPath.setAttribute('stroke-width', '1.75');
  arrowPath.setAttribute('stroke-linecap', 'round');
  arrowPath.setAttribute('stroke-linejoin', 'round');
  arrowSvg.append(arrowPath);
  arrow.append(arrowSvg);
  button.append(element('span', 'themed-select-value'), arrow);
  select.before(wrap);
  wrap.append(select, button);
  select.classList.add('themed-select-native');
  syncThemedSelect(select);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (openSelectMenu?.select === select) closeSelectMenu();
    else openThemedSelect(select, button);
  });
  button.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') return closeSelectMenu({ restoreFocus: true });
    if (openSelectMenu?.select === select) {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        moveSelectMenuFocus(openSelectMenu.menu, event.key, select.selectedIndex);
      }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') return openThemedSelect(select, button);
    const enabled = [...select.options]
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => !option.disabled);
    if (!enabled.length) return openThemedSelect(select, button);
    const current = enabled.findIndex(({ index }) => index === select.selectedIndex);
    let target = 0;
    if (event.key === 'End') target = enabled.length - 1;
    else if (event.key === 'ArrowUp') target = current < 0 ? enabled.length - 1 : (current - 1 + enabled.length) % enabled.length;
    else if (event.key === 'ArrowDown') target = current < 0 ? 0 : (current + 1) % enabled.length;
    openThemedSelect(select, button, enabled[target].index);
  });
  select.addEventListener('change', () => syncThemedSelect(select));
  new MutationObserver((mutations) => {
    const needsSync = mutations.some((mutation) =>
      mutation.type === 'childList'
      || mutation.type === 'characterData'
      || mutation.target === select
      || mutation.target instanceof HTMLOptionElement
    );
    if (needsSync) syncThemedSelect(select);
  }).observe(select, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['disabled', 'label', 'selected'],
  });
}

function syncThemedMultiSelect(select, { rebuild = false } = {}) {
  const wrap = select.closest('.themed-multiselect');
  const list = wrap?.querySelector('.themed-multiselect-list');
  if (!list) return;
  const focusedIndex = Number(list.querySelector(':focus')?.dataset.optionIndex);
  if (rebuild || list.children.length !== select.options.length) {
    list.replaceChildren();
    [...select.options].forEach((option, index) => {
      const item = element('button', 'themed-multiselect-option');
      item.type = 'button';
      item.dataset.optionIndex = String(index);
      item.setAttribute('role', 'option');
      item.append(element('span', 'themed-multiselect-check', '✓'), element('span', 'themed-multiselect-label', option.textContent.trim()));
      list.append(item);
    });
  }
  [...list.children].forEach((item, index) => {
    const option = select.options[index];
    if (!option) return;
    item.classList.toggle('selected', option.selected);
    item.disabled = select.disabled || option.disabled;
    item.setAttribute('aria-selected', String(option.selected));
    item.querySelector('.themed-multiselect-label').textContent = option.textContent.trim();
  });
  list.setAttribute('aria-disabled', String(select.disabled));
  const enabledItems = [...list.querySelectorAll('.themed-multiselect-option:not(:disabled)')];
  const focusedItem = Number.isInteger(focusedIndex)
    ? list.querySelector(`[data-option-index="${focusedIndex}"]:not(:disabled)`)
    : null;
  const tabStop = focusedItem || enabledItems.find((item) => item.classList.contains('selected')) || enabledItems[0];
  [...list.children].forEach((item) => { item.tabIndex = item === tabStop ? 0 : -1; });
  if (focusedItem) focusedItem.focus({ preventScroll: true });
}

function enhanceMultiSelect(select) {
  themedSelectId += 1;
  const controlId = select.id || `themed-multiselect-${themedSelectId}`;
  const wrap = element('div', 'themed-multiselect');
  const list = element('div', 'themed-multiselect-list');
  list.id = `${controlId}-list`;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-multiselectable', 'true');
  list.setAttribute('aria-label', select.getAttribute('aria-label') || select.labels?.[0]?.textContent?.trim() || tx('选择多个选项'));
  select.before(wrap);
  wrap.append(select, list);
  select.classList.add('themed-select-native');
  let anchorIndex = -1;
  const commit = (index, { range = false, toggle = true } = {}) => {
    const option = select.options[index];
    if (!option || option.disabled || select.disabled) return;
    if (range && anchorIndex >= 0) {
      const [start, end] = [anchorIndex, index].sort((a, b) => a - b);
      [...select.options].forEach((entry, optionIndex) => {
        if (!entry.disabled) entry.selected = optionIndex >= start && optionIndex <= end;
      });
    } else {
      option.selected = toggle ? !option.selected : true;
      anchorIndex = index;
    }
    select.dispatchEvent(new Event('change', { bubbles: true }));
    syncThemedMultiSelect(select);
  };
  list.addEventListener('click', (event) => {
    const item = event.target.closest('.themed-multiselect-option');
    if (!item) return;
    commit(Number(item.dataset.optionIndex), { range: event.shiftKey });
  });
  list.addEventListener('keydown', (event) => {
    const item = event.target.closest('.themed-multiselect-option');
    if (!item) return;
    const enabled = [...list.querySelectorAll('.themed-multiselect-option:not(:disabled)')];
    const current = enabled.indexOf(item);
    let next = current;
    if (event.key === 'ArrowDown') next = Math.min(enabled.length - 1, current + 1);
    else if (event.key === 'ArrowUp') next = Math.max(0, current - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = enabled.length - 1;
    else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      commit(Number(item.dataset.optionIndex), { range: event.shiftKey });
      return;
    } else return;
    event.preventDefault();
    enabled.forEach((entry) => { entry.tabIndex = entry === enabled[next] ? 0 : -1; });
    enabled[next]?.focus({ preventScroll: true });
    enabled[next]?.scrollIntoView({ block: 'nearest' });
  });
  select.addEventListener('change', () => syncThemedMultiSelect(select));
  new MutationObserver((mutations) => {
    const rebuild = mutations.some((mutation) => mutation.type === 'childList' || mutation.target instanceof HTMLOptionElement);
    syncThemedMultiSelect(select, { rebuild });
  }).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'label', 'selected'] });
  syncThemedMultiSelect(select, { rebuild: true });
}

function enhanceSelects(root = document) {
  if (root instanceof HTMLSelectElement) enhanceSelect(root);
  root.querySelectorAll?.('select').forEach(enhanceSelect);
}

function syncThemedSelects(root = document) {
  if (root instanceof HTMLSelectElement) syncThemedSelect(root);
  root.querySelectorAll?.('.themed-select > select').forEach(syncThemedSelect);
  root.querySelectorAll?.('.themed-multiselect > select').forEach((select) => syncThemedMultiSelect(select));
}
