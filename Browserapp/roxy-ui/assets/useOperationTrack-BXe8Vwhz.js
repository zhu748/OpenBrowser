function o() {
  return { saveLocalTrack: (action) => globalThis.__localActionTrack(action) };
}
export {o as t};