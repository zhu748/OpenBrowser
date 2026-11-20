function readProxyId(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return /^[1-9]\d*$/.test(text) ? text : null;
}

export { readProxyId as t };
