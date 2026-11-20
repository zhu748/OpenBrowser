function apiSucceeded(result) {
  if (result == null) return false;
  const { code, success } = result;
  return code == null || code === '' ? success !== false : Number(code) === 0;
}

export { apiSucceeded as i };
