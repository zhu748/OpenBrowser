function useOperationTrack() {
  return { saveLocalTrack: action => globalThis.__localActionTrack(action) };
}

export { useOperationTrack as t };
