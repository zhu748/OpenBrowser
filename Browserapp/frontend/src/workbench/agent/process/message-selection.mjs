function linkMarkdown(link) {
  if (link.dataset.markdownSource) {
    try { return decodeURIComponent(link.dataset.markdownSource); }
    catch { /* Fall back to the anchor text and URL. */ }
  }
  const url = link.getAttribute('href') || '';
  const label = link.textContent || url;
  return url ? `[${label.replace(/[\\[\]]/g, '\\$&')}](${url.replace(/[\\()]/g, '\\$&')})` : label;
}

function selectedLink(selection, link) {
  if (!selection.intersectsNode(link)) return;
  const linkRange = link.ownerDocument.createRange();
  linkRange.selectNodeContents(link);
  const overlap = selection.cloneRange();
  if (overlap.compareBoundaryPoints(Range.START_TO_START, linkRange) < 0) overlap.setStart(linkRange.startContainer, linkRange.startOffset);
  if (overlap.compareBoundaryPoints(Range.END_TO_END, linkRange) > 0) overlap.setEnd(linkRange.endContainer, linkRange.endOffset);
  const length = overlap.toString().length;
  if (!length) return;
  const leadingText = selection.cloneRange();
  leadingText.setEnd(overlap.startContainer, overlap.startOffset);
  const start = leadingText.toString().length;
  return { start, end: start + length, markdown: linkMarkdown(link) };
}

export function copySelectionAsMarkdown(selection, body) {
  const text = selection.toString();
  if (!text || !selection.rangeCount) return text;
  const range = selection.getRangeAt(0);
  const links = [...body.querySelectorAll('a[href]')].map(link => selectedLink(range, link)).filter(Boolean).sort((a, b) => a.start - b.start);
  const fragments = [];
  let offset = 0;
  for (const link of links) {
    const start = Math.max(0, link.start);
    const end = Math.min(text.length, link.end);
    if (!link.markdown || start < offset || end <= start) continue;
    fragments.push(text.slice(offset, start), link.markdown);
    offset = end;
  }
  fragments.push(text.slice(offset));
  return fragments.join('');
}

export class AnimationFrameQueue {
  #host;
  #frame;
  #task;

  constructor(host) { this.#host = host; }

  schedule(task) {
    this.#task = task;
    if (this.#frame !== undefined) return;
    this.#frame = this.#host.requestAnimationFrame(() => {
      this.#frame = undefined;
      const pending = this.#task;
      this.#task = undefined;
      pending?.();
    });
  }

  cancel() {
    if (this.#frame !== undefined) this.#host.cancelAnimationFrame(this.#frame);
    this.#frame = undefined;
    this.#task = undefined;
  }
}
