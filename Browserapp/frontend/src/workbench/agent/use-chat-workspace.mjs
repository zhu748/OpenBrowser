import { chatWorkspaceRuntime as runtime } from "./hook-CnJE4hRq.js";

const composerGap = 39;
const templatePageSize = 200;
const homeIntroGap = 35;
const minReservedSpace = 14;
const templateHeight = 176;
const windowGuideStoragePrefix = "agent-console:recommended-template-select-window-guide:";

export function useChatWorkspace(props, emit, prompt) {
  const { jt, kt, Ct, N, Ve, x, nn, Se, cn, Ee, _t, Zn, F, ur, rr, er, $n, _r, Cr, j, nr, Or, dr, kr, vr, ce, wr, sr, Nr, Me, Gr, Yr, Kr, jr, Qn, Ar, qr, Ur, Wr, Jr, kp, Ap, Ep, jp, Dp, Yp, Kp, Xp, qp, Ay, Ly, Ry, K, He, xp, Hp, Xr, ze } = runtime;
  let a2 = jt(), o2 = kt(), [s2, c2] = Ct(), composerRef = N(null), u2 = Ve(null), d2 = N(0), f2 = N([]), cardsLoading = N(!0), m2 = Ve(/* @__PURE__ */ new Map()), openingTemplate = N(), windowGuideVisible = N(!1), windowGuideTarget = Ve(null), windowGuideLabel = N(""), windowLimitVisible = N(!1), windowLimitTarget = Ve(null), windowLimitLabel = N(""), templateGuideVisible = N(!1), templateGuideTarget = Ve(null), templateGuideLabel = N(""), promptGuideVisible = N(!1), promptGuideTarget = Ve(null), promptGuideLabel = N(""), onboardingVisible = N(!1), onboardingSessionKey = N(0), scenarioTemplates = N({}), re2 = /* @__PURE__ */ new Map(), ie2 = /* @__PURE__ */ new Map(), ae2, oe2 = x(), se2 = nn(), k2 = Se(), A2 = cn(), le2 = Ee(), { height: ue2 } = _t(u2), de2, fe2 = !1, pe2 = 0, me2 = Zn()?.templates ?? [];
  me2.length && (f2.value = me2, cardsLoading.value = !1);
  let he2 = { script: { name: "roxy-agent/rx-ic-scripts", color: "var(--color-fg-tertiary)" }, skill: { name: "roxy-agent/rx-ic-skills", color: "var(--color-fg-tertiary)" }, prompt: { name: "roxy-agent/rx-ic-prompts", color: "var(--color-fg-tertiary)" } }, home = F(() => !props.activeConversationId && props.messages.length === 0), dragging = F(() => d2.value > 0), title = F(() => props.conversationTitle?.trim() || $t("新建对话")), ye2 = F(() => Math.ceil((ue2.value || templateHeight) + composerGap)), be2 = F(() => ye2.value + homeIntroGap), xe2 = F(() => ye2.value + minReservedSpace), containerStyle = F(() => ({ "--agent-composer-reserved-bottom": `${be2.value}px`, "--agent-scroll-button-bottom": `${xe2.value}px` })), composerFocus = F(() => `${props.activeConversationId ?? "home"}:${props.composerFocusKey ?? 0}`);
  function Te2(e3) {
    let t3 = ur(e3, k2.currentLocale), n3 = A2.realTheme === "dark", r3 = rr(t3.iconInfo?.icon, n3), i3 = r3 && er(r3) ? r3 : "", a3 = !i3 && r3 ? r3 : he2[t3.kind].name, o3 = rr(t3.iconInfo?.primaryColor, n3) || he2[t3.kind].color, s3 = rr(t3.iconInfo?.bgColor, n3) || "var(--color-bg-tertiary)";
    return { id: t3.id, slug: t3.slug, title: t3.title, description: t3.description || $t("暂无描述"), iconName: a3, iconSize: r3 ? 44 : 32, imageIcon: i3, iconColor: o3, iconBackground: s3, kind: t3.kind, metadata: e3.metadata, tags: t3.labels.slice(0, 2).map((e4) => ({ id: e4.id, label: e4.label })), prompt: $n(e3, k2.currentLocale) || t3.description || t3.title };
  }
  let templateCards = F(() => f2.value.slice(0, 8).map(Te2)), recommendedTemplates = F(() => templateCards.value.map((e3) => {
    let t3 = m2.value.get(e3.id);
    return t3 ? _r(t3, k2.currentLocale) : Cr(e3);
  }));
  async function ke2() {
    let e3 = ++pe2, t3 = j("chat-workspace:loadTemplateCards");
    cardsLoading.value = f2.value.length === 0;
    try {
      let t4 = await oe2.templates.listOfficialTemplates({ limit: 8 }, { paramsSerializer: nr }), n3 = Or(t4, $t("加载官方模板失败"));
      e3 === pe2 && (f2.value = n3, dr(n3));
    } catch (e4) {
      console.error("[agent-console] Failed to load template cards:", e4);
    } finally {
      e3 === pe2 && (cardsLoading.value = !1), t3({ templateCount: f2.value.length });
    }
  }
  function reloadTemplates() {
    ke2();
  }
  async function Ae2() {
    if (!kr()) try {
      let e3 = await oe2.skillPathInfo();
      vr(e3.installedRoot);
    } catch (e3) {
      console.error("[agent-console] Failed to load Skill installed root:", e3);
    }
  }
  async function je2() {
    if (fe2) {
      ce("chat-workspace:loadRecommendedTemplates:skip-loaded");
      return;
    }
    if (de2) return ce("chat-workspace:loadRecommendedTemplates:reuse-pending"), de2;
    let e3 = j("chat-workspace:loadRecommendedTemplates"), t3 = (async () => {
      await Ae2();
      let e4 = /* @__PURE__ */ new Map(), t4 = 0, n3 = 0;
      do {
        let r3 = await oe2.userTemplates.listUserTemplates({ limit: templatePageSize, offset: t4, sortBy: "updated_at", sortOrder: "desc" }), i3 = wr(r3, $t("加载推荐模板失败"));
        if (i3.items.forEach((t5) => {
          typeof t5.officialTemplateId == "number" && !e4.has(t5.officialTemplateId) && e4.set(t5.officialTemplateId, t5);
        }), n3 = i3.total, t4 += i3.items.length, !i3.items.length) break;
      } while (t4 < n3);
      m2.value = e4;
    })();
    de2 = t3;
    try {
      await t3, fe2 = !0;
    } catch (e4) {
      throw fe2 = !1, e4;
    } finally {
      de2 === t3 && (de2 = void 0), e3({ loaded: fe2, templateCount: m2.value.size });
    }
  }
  function Ne2(e3) {
    if (typeof e3.officialTemplateId != "number") return e3;
    let t3 = new Map(m2.value);
    return t3.set(e3.officialTemplateId, e3), m2.value = t3, e3;
  }
  async function Pe2(e3) {
    try {
      let t3 = await oe2.userTemplates.createUserTemplate(e3), n3 = Ne2(sr(t3, $t("获取模板失败")));
      return Nr(n3), s2(0, $t("模板已添加，点击查看详情"), { onClick: () => {
        o2.push({ name: "agent-console-my-templates", query: { ...a2.query, editTemplateId: String(n3.id) } });
      } }), n3;
    } catch (e4) {
      console.error("Failed to acquire recommended template", e4), c2(-1, e4 instanceof Error ? e4.message : $t("获取模板失败"));
      return;
    }
  }
  function Fe2(e3) {
    prompt.value = e3, Me(() => {
      composerRef.value?.focusEditor();
    });
  }
  function addToChat(e3) {
    let t3 = prompt.value && !prompt.value.endsWith(`
`) ? `
` : "";
    Fe2(`${prompt.value}${t3}${e3}`);
  }
  function Le2() {
    let e3 = Gr(le2.userInfo);
    e3 && (Yr(e3), Kr());
  }
  function savePrompt(e3) {
    se2.open(jr, { props: { modal: !0, blockScroll: !0, dismissableMask: !1, draggable: !1, showHeader: !1, style: { width: "min(540px, calc(100vw - 32px))" }, pt: { root: "agent-console-dialog agent-console-create-template-dialog", content: "!p-0 !overflow-hidden" } }, data: { initialKind: "prompt", initialPrompt: e3, lockKind: !0, submitMode: "save", onSave: async (e4) => await Pe2(Qn(e4)) ? (Le2(), !0) : !1 } });
  }
  async function Be2(e3) {
    await Ae2(), await je2();
    let t3 = m2.value.get(e3.id), n3 = Ar(e3, t3, k2.currentLocale);
    if (!n3) throw Error($t("模板提示词为空"));
    return n3;
  }
  async function Ue2(e3) {
    if (openingTemplate.value !== void 0) return !1;
    openingTemplate.value = e3.id;
    try {
      return Fe2(await Be2(e3)), !0;
    } catch (e4) {
      return console.error("Failed to run recommended template in chat", e4), c2(-1, e4 instanceof Error ? e4.message : $t("加载推荐模板失败")), !1;
    } finally {
      openingTemplate.value = void 0;
    }
  }
  function Ge2() {
    let e3 = le2.userInfo, t3 = e3.id ?? e3.email ?? e3.phone;
    return t3 == null || t3 === "" ? "" : `${windowGuideStoragePrefix}${encodeURIComponent(String(t3))}`;
  }
  function Ke2(e3) {
    try {
      return window.localStorage.getItem(e3) === "1";
    } catch {
      return !1;
    }
  }
  function qe2(e3) {
    try {
      window.localStorage.setItem(e3, "1");
    } catch {
    }
  }
  async function Ye2(e3) {
    if (typeof window > "u" || windowGuideVisible.value || windowLimitVisible.value || templateGuideVisible.value) return;
    let t3 = Ge2();
    if (!t3 || Ke2(t3)) return;
    await Me(), await new Promise((e4) => {
      window.requestAnimationFrame(() => e4());
    });
    let n3 = e3 === "skill", r3 = n3 ? composerRef.value?.getEmptyInputTokenElement() ?? null : composerRef.value?.getEmptyProfileTokenElement() ?? null;
    r3 && (windowGuideTarget.value = r3, windowGuideLabel.value = n3 ? $t("点击填写参数") : $t("点击选择窗口"), windowGuideVisible.value = !0, qe2(t3));
  }
  async function openTemplate(e3) {
    await Ue2(e3) && await Ye2(e3.kind);
  }
  function hideWindowGuide() {
    windowGuideVisible.value = !1, windowGuideTarget.value = null, windowGuideLabel.value = "", at2(), rt2(), tt2();
  }
  function Qe2() {
    return Gr(le2.userInfo);
  }
  async function tt2() {
    if (typeof window > "u" || windowGuideVisible.value || windowLimitVisible.value || templateGuideVisible.value || promptGuideVisible.value) return;
    let e3 = Qe2();
    if (!e3 || qr(e3) || !Ur(e3) || (await Me(), await new Promise((e4) => {
      window.requestAnimationFrame(() => e4());
    }), windowGuideVisible.value || windowLimitVisible.value || templateGuideVisible.value || promptGuideVisible.value) || qr(e3) || !Ur(e3)) return;
    let t3 = composerRef.value?.getSelectTemplateButtonElement() ?? null;
    t3 && (promptGuideTarget.value = t3, promptGuideLabel.value = $t("有新模板，试试点击这里使用。"), promptGuideVisible.value = !0, Wr(e3), Jr(e3));
  }
  function hidePromptGuide() {
    promptGuideVisible.value = !1, promptGuideTarget.value = null, promptGuideLabel.value = "", at2(), rt2();
  }
  async function rt2() {
    if (typeof window > "u" || !kp() || windowGuideVisible.value || windowLimitVisible.value || templateGuideVisible.value || promptGuideVisible.value) return;
    let e3 = Qe2();
    if (!e3) return;
    let t3 = Ap();
    if (!t3 && Ep(e3)) {
      jp();
      return;
    }
    if (await Me(), await new Promise((e4) => {
      window.requestAnimationFrame(() => e4());
    }), !kp() || windowGuideVisible.value || windowLimitVisible.value || templateGuideVisible.value || promptGuideVisible.value) return;
    let n3 = composerRef.value?.getComposerElement() ?? null;
    n3 && (windowLimitTarget.value = n3, windowLimitLabel.value = $t("支持粘贴/拖入代理 IP 信息文件和账号信息文件"), windowLimitVisible.value = !0, t3 || Dp(e3), jp());
  }
  function hideWindowLimit() {
    windowLimitVisible.value = !1, windowLimitTarget.value = null, windowLimitLabel.value = "", at2(), tt2();
  }
  async function at2() {
    if (typeof window > "u" || !Yp() || windowGuideVisible.value || windowLimitVisible.value || templateGuideVisible.value || promptGuideVisible.value) return;
    let e3 = Qe2();
    if (!e3) return;
    if (Kp(e3)) {
      Xp();
      return;
    }
    if (await Me(), await new Promise((e4) => {
      window.requestAnimationFrame(() => e4());
    }), !Yp() || windowGuideVisible.value || windowLimitVisible.value || templateGuideVisible.value || promptGuideVisible.value) return;
    let t3 = composerRef.value?.getSelectTemplateButtonElement() ?? null;
    t3 && (templateGuideTarget.value = t3, templateGuideLabel.value = $t("点击选择要执行的自动化模板"), templateGuideVisible.value = !0, qp(e3), Xp());
  }
  function hideTemplateGuide() {
    templateGuideVisible.value = !1, templateGuideTarget.value = null, templateGuideLabel.value = "", rt2(), tt2();
  }
  function st2() {
    at2();
  }
  function ct2() {
    rt2();
  }
  function lt2() {
    tt2();
  }
  function ut2() {
    windowGuideVisible.value = !1, windowGuideTarget.value = null, windowGuideLabel.value = "", windowLimitVisible.value = !1, windowLimitTarget.value = null, windowLimitLabel.value = "", templateGuideVisible.value = !1, templateGuideTarget.value = null, templateGuideLabel.value = "", promptGuideVisible.value = !1, promptGuideTarget.value = null, promptGuideLabel.value = "";
  }
  function showOnboarding() {
    ut2(), emit("onboardingReset"), onboardingSessionKey.value += 1, onboardingVisible.value = !0, ht2();
  }
  function continueOnboarding() {
    emit("onboardingCompletionDismiss"), emit("onboardingComplete");
  }
  function restartOnboarding() {
    showOnboarding();
  }
  function mt2(e3) {
    if (re2.has(e3)) return Promise.resolve(re2.get(e3) ?? void 0);
    let t3 = ie2.get(e3);
    if (t3) return t3;
    let n3 = Ay[e3], r3 = (async () => {
      let t4 = await oe2.templates.listOfficialTemplates({ limit: 20, search: n3, templateType: "skill" }), r4 = Or(t4, $t("加载官方模板失败")).find((e4) => e4.slug === n3);
      return re2.set(e3, r4 ?? null), r4;
    })();
    return ie2.set(e3, r3), r3.finally(() => ie2.delete(e3)).catch(() => {
    }), r3;
  }
  async function ht2() {
    if (ae2) return ae2;
    let e3 = Object.keys(Ay);
    if (!e3.every((e4) => Object.hasOwn(scenarioTemplates.value, e4))) return ae2 = Promise.all(e3.map(async (e4) => {
      try {
        return { scenario: e4, template: await mt2(e4) ?? null };
      } catch (t3) {
        return console.warn(`[agent-console] Failed to preload onboarding metadata: ${e4}`, t3), { scenario: e4, template: null };
      }
    })).then((e4) => {
      scenarioTemplates.value = Object.fromEntries(e4.map((e5) => [e5.scenario, e5.template]));
    }).finally(() => {
      ae2 = void 0;
    }), ae2;
  }
  async function runOnboarding(e3) {
    if (onboardingVisible.value) {
      onboardingVisible.value = !1;
      try {
        let t3 = await mt2(e3);
        if (!t3) throw Error($t("官方模板不存在或已下架"));
        let n3 = Te2(t3), i3 = $n(t3, k2.currentLocale).trim();
        if (!i3) throw Error($t("模板提示词为空"));
        let a3 = Ly(await Be2(n3), i3);
        if (!a3) throw Error($t("Skill 路径加载失败"));
        let o3 = Ry(a3, e3, k2.currentLocale);
        await Me(), emit("onboardingRun", o3);
      } catch (t3) {
        console.error(`[agent-console] Failed to run onboarding scenario: ${e3}`, t3), c2(-1, t3 instanceof Error ? t3.message : $t("加载官方模板失败"));
      }
    }
  }
  function J2(e3) {
    return Array.from(e3.dataTransfer?.types ?? []).some((e4) => e4 === "Files");
  }
  function Y2(e3) {
    return e3.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || e3;
  }
  function vt2(e3) {
    return e3.replace(/\\/g, "/");
  }
  function yt2(e3) {
    if (!globalThis.isElectron) return "";
    try {
      return globalThis.electronAPI.getPathForFile(e3) || "";
    } catch (e4) {
      return console.error("[agent-console] Failed to get dropped file path:", e4), "";
    }
  }
  function bt2(e3, t3, n3) {
    let r3 = vt2(e3), i3 = vt2(t3).split("/").filter(Boolean), a3 = +(i3[0] === n3), o3 = i3.slice(a3).join("/");
    if (!o3) return e3;
    let s3 = `/${o3}`;
    return r3.endsWith(s3) ? e3.slice(0, -s3.length) : "";
  }
  function xt2(e3) {
    return e3.webkitGetAsEntry?.() ?? null;
  }
  function St2(e3, t3) {
    return new Promise((n3, r3) => {
      e3.file((e4) => {
        t3 && Object.defineProperty(e4, "webkitRelativePath", { configurable: !0, value: t3 }), n3(e4);
      }, r3);
    });
  }
  async function wt2(e3) {
    let t3 = e3.createReader(), n3 = [];
    for (; ; ) {
      let e4 = await new Promise((e5, n4) => {
        t3.readEntries(e5, n4);
      });
      if (!e4.length) break;
      n3.push(...e4);
    }
    return n3;
  }
  async function Tt2(e3, t3 = e3.name) {
    let n3 = [], r3 = await wt2(e3);
    for (let e4 of r3) {
      let r4 = `${t3}/${e4.name}`;
      e4.isFile ? n3.push(await St2(e4, r4)) : n3.push(...await Tt2(e4, r4));
    }
    return n3;
  }
  async function Et2(e3, t3 = e3.name) {
    let n3 = await wt2(e3);
    for (let e4 of n3) {
      let n4 = `${t3}/${e4.name}`;
      if (e4.isFile) return St2(e4, n4);
      let r3 = await Et2(e4, n4);
      if (r3) return r3;
    }
  }
  async function Dt2(e3) {
    if (globalThis.isElectron) {
      let t4 = await Et2(e3), n3 = t4 ? yt2(t4) : "", i3 = t4 ? t4.webkitRelativePath || `${e3.name}/${t4.name}` : "", a3 = n3 ? bt2(n3, i3, e3.name) : "";
      if (a3) {
        emit("addPathAttachment", { kind: "folder", name: e3.name || Y2(a3), path: a3 });
        return;
      }
    }
    let t3 = await Tt2(e3);
    t3.length && emit("addFolder", { name: e3.name, files: t3 });
  }
  function Ot2(e3) {
    if (!e3.length) return;
    if (!globalThis.isElectron) {
      emit("addAttachments", e3);
      return;
    }
    let t3 = [];
    for (let n3 of e3) {
      let e4 = yt2(n3);
      e4 ? emit("addPathAttachment", { kind: "file", name: n3.name || Y2(e4), path: e4 }) : t3.push(n3);
    }
    t3.length && emit("addAttachments", t3);
  }
  async function At2(e3) {
    let t3 = Array.from(e3.items ?? []).map((e4) => ({ entry: xt2(e4), item: e4 })).filter((e4) => !!e4.entry);
    if (!t3.length) {
      Ot2(Array.from(e3.files ?? []));
      return;
    }
    let n3 = [];
    for (let { entry: e4, item: i3 } of t3) {
      if (e4.isFile) {
        n3.push(await St2(e4));
        continue;
      }
      let t4 = i3.getAsFile(), a3 = t4 ? yt2(t4) : "";
      a3 ? emit("addPathAttachment", { kind: "folder", name: e4.name || Y2(a3), path: a3 }) : await Dt2(e4);
    }
    Ot2(n3);
  }
  function dragEnter(e3) {
    J2(e3) && (e3.preventDefault(), d2.value += 1);
  }
  function dragOver(e3) {
    J2(e3) && (e3.preventDefault(), e3.dataTransfer && (e3.dataTransfer.dropEffect = "copy"));
  }
  function dragLeave(e3) {
    J2(e3) && (e3.preventDefault(), d2.value = Math.max(0, d2.value - 1));
  }
  async function drop(e3) {
    if (J2(e3) && (e3.preventDefault(), d2.value = 0, e3.dataTransfer)) try {
      await At2(e3.dataTransfer);
    } catch (e4) {
      console.error("[agent-console] Failed to add dropped attachments:", e4);
    }
  }
  K(composerRef, async () => {
    await Me(), u2.value = composerRef.value?.getShellElement() ?? null, at2(), rt2(), tt2();
  }, { flush: "post", immediate: !0 }), K(() => props.activeConversationId, () => {
    at2(), rt2(), tt2();
  }), K(() => Qe2(), () => {
    at2(), rt2();
  }), He(() => {
    ce("chat-workspace:mounted"), window.addEventListener(xp, ct2), window.addEventListener(Hp, st2), window.addEventListener(Xr, lt2), ke2(), je2().catch((e3) => {
      console.error("Failed to preload recommended templates", e3);
    }), at2(), rt2(), tt2();
  }), ze(() => {
    window.removeEventListener(xp, ct2), window.removeEventListener(Hp, st2), window.removeEventListener(Xr, lt2);
  });

  return {
    composerRef,
    home,
    containerStyle,
    title,
    cardsLoading,
    templateCards,
    openingTemplate,
    openTemplate,
    composerFocus,
    recommendedTemplates,
    windowGuideLabel,
    windowGuideTarget,
    windowGuideVisible,
    hideWindowGuide,
    windowLimitLabel,
    windowLimitTarget,
    windowLimitVisible,
    hideWindowLimit,
    templateGuideLabel,
    templateGuideTarget,
    templateGuideVisible,
    hideTemplateGuide,
    promptGuideLabel,
    promptGuideTarget,
    promptGuideVisible,
    hidePromptGuide,
    scenarioTemplates,
    onboardingSessionKey,
    onboardingVisible,
    continueOnboarding,
    restartOnboarding,
    runOnboarding,
    dragging,
    dragEnter,
    dragLeave,
    dragOver,
    drop,
    showOnboarding,
    addToChat,
    savePrompt,
    reloadTemplates,
  };
}
