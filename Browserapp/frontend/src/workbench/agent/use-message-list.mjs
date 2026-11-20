import { chatMessageRuntime } from "./hook-CnJE4hRq.js";

const selectionGap = 10;
const minHorizontalOffset = 8;
const selectionMenuWidth = 160;
const earlierMessageThreshold = 96;
const scrollTolerance = 4;
const endDistance = 48;

export function useMessageList(props, emit) {
  const { Ct, N, Fw, Aw, be, F, K, Me, He, ze } = chatMessageRuntime;
  let [, showError] = Ct(), notificationRef = N(null), listRef = N(null), innerRef = N(null), showScrollButton = N(!1), selectionMenuRef = N(null), selectionMenu = N(null), selectionFrame = 0, f2 = !0, p2 = !1, lastConversation = props.activeConversationId, h2 = 0, g2 = 0, _2 = 0, resizeObserver = null, y2 = null, scrollScheduler = new Fw(window);
  function dismissSelection(e3 = !1) {
    selectionMenu.value = null, e3 && window.getSelection()?.removeAllRanges();
  }
  function clampMenu(e3) {
    let t3 = Math.max(minHorizontalOffset, window.innerWidth - selectionMenuWidth - minHorizontalOffset);
    return { left: Math.min(Math.max(minHorizontalOffset, e3.left + e3.width / 2 - selectionMenuWidth / 2), t3), top: e3.bottom + selectionGap };
  }
  function readSelection() {
    let e3 = window.getSelection(), t3 = innerRef.value;
    if (!e3 || e3.isCollapsed || !e3.anchorNode || !e3.focusNode || !t3?.contains(e3.anchorNode) || !t3.contains(e3.focusNode)) return null;
    let n3 = e3.toString();
    return n3.trim() ? { markdownText: Aw(e3, t3), rect: e3.getRangeAt(0).getBoundingClientRect(), text: n3 } : null;
  }
  function showSelection() {
    let e3 = readSelection();
    return e3 ? (selectionMenu.value = { ...clampMenu(e3.rect), markdownText: e3.markdownText, text: e3.text }, !0) : (dismissSelection(), !1);
  }
  function onPointerUp(e3) {
    e3.button === 0 && (cancelAnimationFrame(selectionFrame), selectionFrame = requestAnimationFrame(() => {
      showSelection();
    }));
  }
  function onContextMenu(e3) {
    let t3 = e3.target, n3 = innerRef.value;
    n3 && t3 instanceof Node && n3.contains(t3) && showSelection() && e3.preventDefault();
  }
  function handleOutsidePointer(e3) {
    selectionMenuRef.value?.contains(e3.target) || dismissSelection();
  }
  function handleKey(e3) {
    e3.key === "Escape" && dismissSelection(!0);
  }
  function onResize() {
    dismissSelection();
  }
  async function copyText(e3) {
    try {
      await be(e3), notificationRef.value?.show();
    } catch (e4) {
      console.error("Failed to copy agent chat text", e4), showError(-1, $t("复制失败"));
    }
  }
  async function copySelection() {
    let e3 = selectionMenu.value?.text;
    if (e3) try {
      await copyText(e3);
    } finally {
      dismissSelection(!0);
    }
  }
  async function copyMessage(e3) {
    await copyText(e3);
  }
  function addSelectionToChat() {
    let e3 = selectionMenu.value?.markdownText;
    e3 && (dismissSelection(!0), emit("addToChat", e3));
  }
  function saveSelectionAsPrompt() {
    let e3 = selectionMenu.value?.text;
    e3 && (dismissSelection(!0), emit("saveAsPrompt", e3));
  }
  let oe2 = F(() => {
    let e3 = props.messages.at(-1);
    return [props.activeConversationId, props.messages.length, e3?.conversationId, e3?.id, e3?.content, e3?.status, e3?.process?.durationState, e3?.process?.durationStartedAt, e3?.process?.durationEndedAt, e3?.process?.revision, e3?.process?.events.length].join("|");
  });
  function se2() {
    let e3 = listRef.value;
    return e3 ? Math.max(0, e3.scrollHeight - e3.scrollTop - e3.clientHeight) : 0;
  }
  function k2() {
    showScrollButton.value = se2() > earlierMessageThreshold;
  }
  function ce2(e3 = 120) {
    g2 = Math.max(g2, Date.now() + e3);
  }
  function A2() {
    return Date.now() < g2;
  }
  function le2(e3 = "auto") {
    let t3 = listRef.value;
    t3 && (p2 = !1, ce2(e3 === "smooth" ? 480 : 120), t3.scrollTo({ top: t3.scrollHeight, behavior: e3 }), e3 === "auto" && (showScrollButton.value = !1));
  }
  function j2() {
    scrollScheduler.schedule(() => {
      f2 ? le2() : k2();
    });
  }
  function ue2() {
    let e3 = listRef.value;
    e3 && !y2 && props.hasEarlierMessages && !props.loadingEarlierMessages && (y2 = { firstMessageId: props.messages[0]?.id, scrollHeight: e3.scrollHeight, scrollTop: e3.scrollTop }, emit("loadEarlierMessages"));
  }
  function onScroll() {
    dismissSelection();
    let e3 = listRef.value;
    if (e3) {
      if (!A2()) {
        let t3 = e3.scrollTop, n3 = se2(), r3 = t3 < h2 - 1;
        r3 && (p2 = !0), n3 <= scrollTolerance ? (p2 = !1, f2 = !0) : f2 = !p2 && n3 <= earlierMessageThreshold, r3 && t3 <= endDistance && ue2();
      }
      h2 = e3.scrollTop, k2();
    }
  }
  function fe2() {
    p2 = !0, f2 = !1, scrollScheduler.cancel();
  }
  function onWheel(e3) {
    e3.deltaY < 0 && (fe2(), (listRef.value?.scrollTop ?? 0) <= endDistance && ue2());
  }
  function onTouchStart(e3) {
    _2 = e3.touches[0]?.clientY ?? 0;
  }
  function onTouchMove(e3) {
    (e3.touches[0]?.clientY ?? _2) > _2 && (fe2(), (listRef.value?.scrollTop ?? 0) <= endDistance && ue2());
  }
  function jumpToBottom() {
    p2 = !1, f2 = !0, le2("smooth"), window.setTimeout(k2, 240);
  }
  function _e2() {
    j2();
  }
  K(() => props.activeConversationId, (e3) => {
    e3 !== lastConversation && (lastConversation = e3, y2 = null, p2 = !1, f2 = !0, j2());
  }), K(() => [props.messages[0]?.id, props.loadingEarlierMessages], async ([e3, t3]) => {
    let n3 = y2;
    if (n3)
      if (e3 !== n3.firstMessageId) {
        await Me();
        let e4 = listRef.value;
        e4 && (ce2(), e4.scrollTop = n3.scrollTop + e4.scrollHeight - n3.scrollHeight, h2 = e4.scrollTop, k2()), y2 = null;
      } else t3 || (y2 = null);
  }, { flush: "post" }), K(oe2, () => {
    j2();
  }, { flush: "post" }), He(() => {
    document.addEventListener("pointerdown", handleOutsidePointer, !0), document.addEventListener("keydown", handleKey), window.addEventListener("resize", onResize), p2 = !1, f2 = !0, j2(), listRef.value && (resizeObserver = new ResizeObserver(_e2), resizeObserver.observe(listRef.value), innerRef.value && resizeObserver.observe(innerRef.value));
  }), ze(() => {
    document.removeEventListener("pointerdown", handleOutsidePointer, !0), document.removeEventListener("keydown", handleKey), window.removeEventListener("resize", onResize), scrollScheduler.cancel(), cancelAnimationFrame(selectionFrame), resizeObserver?.disconnect();
  });

  return {
    notificationRef,
    listRef,
    innerRef,
    showScrollButton,
    selectionMenuRef,
    selectionMenu,
    onPointerUp,
    onContextMenu,
    onScroll,
    onTouchMove,
    onTouchStart,
    onWheel,
    copyMessage,
    jumpToBottom,
    copySelection,
    addSelectionToChat,
    saveSelectionAsPrompt,
  };
}
