function permittedActions(operations) {
  return (operations ?? []).filter(item => item.power !== false).map(item => (
    Array.isArray(item.items) ? { ...item, items: permittedActions(item.items) } : item
  ));
}

function setRowLoading(row, action, busy) {
  (row.loadingOperationMap ??= {})[action] = busy;
}

async function runWithRowLoading(row, action, operation) {
  setRowLoading(row, action, true);
  try {
    return await operation(row);
  } finally {
    setRowLoading(row, action, false);
  }
}

export { permittedActions, setRowLoading, runWithRowLoading };
