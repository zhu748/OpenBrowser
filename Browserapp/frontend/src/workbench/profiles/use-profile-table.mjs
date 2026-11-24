import { profileTableRuntime } from "./profile-table-compat.js";
import { canRestoreProjectProfileCache, detailProfileFilters, profileTableParams, projectDetailId } from "./workbench-table.js";

export function useProfileTable(props, emit) {
  const { ke, De, Le, vt, bt, me, ee, We, at, Lt, tt, he, It, Ae, pt, _e, ge, ut, Wt, xt, d, Ue, h, u, r, te, yt, jt, b, Ce, Pt, E, w, S, At, cn, Ht, Kt, _, Mt, e, Xt, En, ue, y, l, Oe, ae, x, st, dt, Te, ct, ot, lt, Be, Jt, o, Zt, f, ie, i, I, W, z, Ft, H, B, ht, Ut, ye, V, xe, Ze, Ct, St, we, qt, Gt } = profileTableRuntime;
  const g2 = ke(), v2 = De(), oe2 = Le(), T2 = vt(), { showProxyFormDrawer: fe2 } = bt(T2), { userInfo: R2, userConfig: Ee2 } = me(ee()), { handleBusinessCode: Ne2 } = We(), { updateOnboardingTaskStatus: Fe2 } = at(), { getProjects: ze2 } = Lt(), [He2] = tt(), [G2, K2] = he(), [Ge2] = It(), [Ke2] = Ae(), { showSimpleDialog: qe2 } = pt(), { buildProxyData: Xe2, confirmDeleteProxy: $e2 } = _e(), { runProxySpeedTestForRows: ft2 } = ge(), { batchTestShowToast: mt2 } = ut(), { editCookieByProfile: wt2, startCookieRobot: Vt2 } = Wt(), { saveLocalTrack: Qt2 } = xt(), { check: check } = d(), { opening: automationBusy, openRoxyAIAgent: tn } = Ue(), { getVideoSource: nn } = h(), rn = u(), an = r(), { invalidateCache: on2 } = te(), { columns: columns, updateColumns: un2, updateRemarkDisplayStatus: dn2 } = yt(jt(), props.isProjectProfile ? ["project"] : void 0);
  const localProxyEditor = {
    openProxyBuyAddDrawer: ({ onAddConfirm }) => fe2({ title: $t("添加代理 IP"), mode: "proxy", onConfirm: onAddConfirm })
  };
  b(Ce, localProxyEditor);
  let { canQuickCreate: bn2, onQuickCreateMainClick: quickCreate, onQuickCreateSettingsClick: configureQuickCreate } = Pt(), canQuickCreate = E(() => bn2() && check("Profiles_add")), tableRef = w("windowTable"), tagsRef = w("tagsIcon"), selection = E(() => tableRef.value?.selectionData ?? []), automationLabel = E(() => selection.value.length ? $t("AI 自动化 ({count})", { count: selection.value.length }) : $t("AI 自动化")), filters = S(), Vn2 = S(!1), searchOptions = At(), Un = S(!1), { driverObj: guideDriver, driverNext: advanceGuide } = cn({ tableRef: tableRef, enabled: () => R2.value.onboardingTaskStatus?.firstRegisterGuideStatus === !1 }), { openMessage: openState, workspaceName: workspaceName, listenOpenMessage: qn, listenCloseMessage: Jn, listenCloseSyncingDataMessage: Yn, listenWebWindowManager: Xn, openBrowserBefore: openProfile, getNotUsedProfiles: Qn, syncOpenedBrowserState: $n, sendFirstOpenRecord: recordFirstOpen } = Ht(), { dataList: tr, hasFiltered: filtered, hasTempProfile: showTemporaryColumn, clearPendingAutoOpen: ir, syncOpenedProxyToRow: ar, onRefreshTable: refresh, tableRequest: loadRows, syncFromCacheEntry: sr } = Kt({ tableRef: tableRef, filtersMenu: filters, getCurrentFilterParams: () => props.currentFilter?._params, openBrowserBefore: openProfile });
  function cacheScope() {
    return { projectId: props.isProjectProfile ? projectDetailId(g2) ?? "" : "" };
  }
  let profileActivation = 0;
  function lr(e2) {
    on2(_.BROWSER_LIST, { projectId: String(e2) });
  }
  function ur() {
    lr(cacheScope().projectId);
  }
  function dr() {
    on2(_.ACCOUNT_LIST);
  }
  function refreshRow(e2 = {}, t3 = !1) {
    ur(), refresh(e2, t3);
  }
  function pr() {
    let e2 = rn.currentWorkspace?.id;
    return e2 ? an.get(_.BROWSER_LIST, String(e2), cacheScope()) : null;
  }
  function restoreCache() {
    let e2 = pr();
    if (!e2) return !1;
    if (props.isProjectProfile) {
      const projectId = projectDetailId(g2);
      if (canRestoreProjectProfileCache(e2, projectId)) return true;
      if (projectId) ur();
      return false;
    }
    let t3 = e2.meta?.activeTabId, n2 = props.currentFilter?.id ?? "rx_1000";
    return !!t3 && t3 === n2;
  }
  function hr() {
    if (props.isProjectProfile) return !1;
    let e2 = pr()?.meta?.activeTabId;
    return e2 ? e2 !== (props.currentFilter?.id ?? "rx_1000") : !1;
  }
  function cacheMetadata() {
    const e2 = props.isProjectProfile
      ? { scopeProjectId: projectDetailId(g2) }
      : { activeTabId: props.currentFilter?.id ?? "rx_1000" };
    if (filters.value) e2.filtersMenu = filters.value;
    return e2;
  }
  async function vr() {
    const activation = profileActivation;
    const next = await Mt(props.currentFilter?.filter_condition || {});
    if (activation !== profileActivation) return false;
    filters.value = props.isProjectProfile ? detailProfileFilters(next) : next;
    return true;
  }
  async function $() {
    if (Vn2.value || hr()) return;
    const activation = profileActivation;
    Vn2.value = true;
    if (!await vr() || activation !== profileActivation) return;
    const saved = restoreCache() && tableRef.value?.restoreFromCache();
    if (saved) {
      sr(saved);
      return;
    }
    let t3 = e(g2.query.customFilterParams, {});
    refresh({ ...t3, ...props.currentFilter?._params ?? {} }, !1);
  }
  async function yr() {
    if (!props.currentFilter) return;
    if (!Vn2.value) return $();
    const activation = profileActivation;
    if (await vr() && activation === profileActivation) refresh(props.currentFilter._params ?? {}, !1);
  }
  let { singleModifyWindow: br2, batchModifyWindow: xr, updateProfileMeta: updateLabels } = Xt({ onlyErrorToast: K2, onRefreshTable: refresh, invalidateListCache: ur }), { onUpgradeCore: Cr } = En({ batchModifyWindow: xr, onlyErrorToast: K2, showToast: G2, getWorkspaceName: () => workspaceName.value });
  const { confirmation: deleteConfirmation, request: requestProfileDelete } = useProfileDelete({
    ref: S, watch: ue, onBeforeUnmount: x,
    scope: () => JSON.stringify([rn.currentWorkspace?.id, g2.name, projectDetailId(g2),
      props.currentFilter?.id, props.inactive, tableRef.value?.getParams()]),
    inactive: () => props.inactive,
    rows: () => tableRef.value?.getDataList() ?? [],
    selection: () => selection.value,
    checkClosed: Qn,
    read: ids => {
      const project = projectDetailId(g2);
      return o.window.userGetWindowInfoListList({
        ...profileTableParams(tableRef.value.getParams(), project),
        ...(project !== undefined && { scopeProjectId: project }),
        page_index: 1, page_size: ids.length, dirIds: ids, isDelete: 0,
      });
    },
    remove: async (ids, permanent) => {
      if (!permanent) return xr({ ids, isDelete: true, requestType: z.Delete }, true);
      const { code, msg } = await o.window.userDelWindowInfoCreate({ ids });
      K2(code, msg);
      return code === 0;
    },
    canPurge: () => check("Profiles_permanent_delete"),
    warn: message => K2(-1, message),
  });
  ue(() => props.currentFilter?.id, () => {
    yr();
  }), ue(() => g2.params.id, async () => {
    if (!props.isProjectProfile) return;
    const activation = ++profileActivation;
    Vn2.value = false;
    tr.value = [];
    filtered.value = false;
    showTemporaryColumn.value = false;
    await y();
    if (g2.params.id && activation === profileActivation) await $();
  }, { flush: "sync" });
  let wr, Tr, Er, Dr, Or = l({ intervalMs: 3e5, checkOnce: async () => !Ee2.value.autoDetectProxy || (await testAllProxies(!0), !1) });
  Oe("refreshProfileList", async (e2) => {
    e2 && v2.replace({ name: g2.name, query: { browser: JSON.stringify({ openBrowser: !0, windowId: e2 }) } }), refreshRow();
  }), ae(() => {
    Or.check(), wr = qn({ onOpenSuccess: (e2) => {
      ar(e2), advanceGuide();
    }, onOpenFailed: ir, onProxyDetectWarning: Ar }), Tr = Jn(), Er = Yn(), Dr = Xn(), un2((e2) => {
      let t3 = e2.find((e3) => e3.key === "note");
      t3 && Reflect.set(t3._cache, "extend", Ee2.value.remarkDisplayStatus);
    }), $n(), y(() => $());
  }), x(() => {
    profileActivation++;
    Or.stop(), wr?.(), Tr?.(), Er?.(), Dr?.();
  });
  async function testAllProxies(e2 = !1) {
    if (!check("Profiles_speed_test_proxy")) return;
    if (!tr.value?.length) {
      !e2 && K2(-1, $t("暂无窗口"));
      return;
    }
    if (Un.value) return;
    let t3 = jr(tr.value);
    if (!t3.length) !e2 && K2(-1, $t("当前没有已绑定代理 IP 的窗口"));
    else {
      Un.value = !0;
      try {
        await ft2(t3, { showConcurrentTaskTopBar: !e2, silent: e2 });
      } finally {
        Un.value = !1;
      }
    }
  }
  function Ar(e2, t3) {
    if (t3.some(st)) return;
    let n2 = t3.find(dt);
    if (!n2) return;
    let r2 = tr.value?.find((t4) => String(t4.dirId) === String(e2));
    if (!r2) return;
    let i2 = typeof r2.lastCountry == "string" ? r2.lastCountry.trim() : "";
    mt2({ loading: !1, checkStatus: Te.failure, proxyType: r2.buyProxyType, error: n2, ...i2 ? { lastCountry: i2 } : {} });
  }
  function jr(e2) {
    return e2.filter((e3) => e3.proxyCategory !== "noproxy" && (ct(ot(e3)) || lt(e3)));
  }
  async function Mr(e2) {
    let t3 = jr([].concat(e2));
    t3.length ? await ft2(t3) : K2(-1, $t("当前没有已绑定代理 IP 的窗口"));
  }
  async function createAutomation(e2 = selection.value) {
    let t3 = e2.flatMap((e3) => e3.dirId ? [e3.dirId] : []);
    t3.length && (globalThis.__localActionTrack("ui_action").catch(console.error), await tn(Be(t3)));
  }
  async function saveFilters(e2) {
    if (!filters.value.some((e3) => e3.value)) return;
    let { filter_name: t3, filter_rule: n2, sort: r2 } = e2, i2 = Jt(filters.value), a3 = !!r2, { code: s3, msg: c3 } = a3 ? await o.window.userUpdateWindowFilterNameCreate({ sort: r2, filter_rule: n2, filter_condition: i2, old_filter_name: t3, new_filter_name: t3 }) : await o.window.userAddWindowFilterNameCreate({ filter_name: t3, filter_condition: i2, filter_rule: columns.value.map((e3) => ({ name: e3.key, sort: e3._sort, status: +!!e3._visible })) });
    s3 === 0 && emit("updateFilterTabs", a3), K2(s3, c3);
  }
  function search(e2) {
    let { key: t3, value: n2 } = e2 || {};
    refresh({ queryKey: n2 && (t3 || "name_remark"), queryValue: n2 }, !0);
  }
  let runOperation = Zt({ saveLocalTrack: Qt2, tableRef: tableRef, filtersMenu: filters, router: v2, route: g2, getCurrentFilter: () => props.currentFilter, copyTextFn: f, showToast: G2, onTransfer: Br, onMoveToProject: Hr, openBrowserBefore: openProfile, setAsDefaultBrowser: Lr, createDesktopShortcut: Rr, multipleProxyChange: Wr, editProfileProxy: Ur, multipleProxyDelete: $r, multipleAccountChange: ti, tagsIconRef: tagsRef, addTag: Ge2, updateProfileMeta: updateLabels, singleModifyWindow: br2, onRemark: ii, onEditCookies: ni, openCookieRobot: ri, onClearCache: oi, onUpgradeCore: Cr, exportProfile: si, deleteProfile: requestProfileDelete, onTestProxy: Mr, createAutomation: createAutomation });
  async function Lr(e2) {
    let t3 = `${e2.windowSortNum}`.padStart(`${e2.maxWindowSort || 0}`.length, "0");
    const result = await globalThis.electronAPI.send("browser:setAsDefaultBrowser", { ...ie(e2), __orderName: `${workspaceName.value}-${t3}` });
    G2(result.applied ? 0 : -1, result.message);
  }
  async function Rr(e2) {
    let t3 = `${e2.windowSortNum}`.padStart(`${e2.maxWindowSort || 0}`.length, "0");
    await globalThis.electronAPI.send("browser:createDesktopShortcut", { ...ie(e2), __orderName: `${workspaceName.value}-${t3}` }), G2(0, $t("创建桌面快捷方式成功"));
  }
  function openActions(e2, t3) {
    Ke2(e2.event, { operation: e2.operation, operationHandler: async (n2) => {
      try {
        let r2 = { ...i(ie(n2)), _event: e2.event };
        await runOperation(r2, t3);
      } catch (e3) {
        console.error(e3);
      }
    } });
  }
  async function Br(e2, t3) {
    return await globalThis.electronAPI.send("browser:exportProfiles", { ids: e2.map((row) => row.id) });
  }
  function Vr(e2, t3) {
    (g2.name !== "project-item" || String(g2.params.id) !== String(e2)) && v2.push({ name: "project-item", params: { id: String(e2) }, query: t3 ? { title: t3 } : void 0 });
  }
  async function Hr(e2) {
    let t3 = await ze2(), n2 = [].concat(e2), { promise: r2, resolve: i2, reject: a3 } = Promise.withResolvers(), o2 = `[${n2.slice(0, 10).map((e3) => `${workspaceName.value}-${e3.windowSortNum}`).join(", ")}${n2.length > 10 ? "..." : ""}]`, s3 = !1;
    return qe2({ title: $t("移动项目"), content: $t("将移动 {names} 到所选项目", { names: o2 }), inputs: [{ type: "select", name: "projectId", props: { placeholder: $t("请选择项目"), options: t3, optionValue: "value", filter: !0, filterFields: ["label"] }, resolver: (e3) => e3.string({ invalid_type_error: $t("请选择项目") }).min(1, $t("请选择项目")) }], slots: { footer: ({ close: e3, loading: t4, cancelText: n3, confirmText: r3, formId: i3 }) => I("div", { class: "flex justify-end items-center self-stretch gap-3" }, [I(W, { size: "sm", text: !0, severity: "secondary", label: n3, onClick: e3 }, null), I(W, { size: "sm", severity: "secondary", outlined: !0, type: "submit", form: i3, label: $t("保存并跳转"), loading: t4, onClick: () => {
      s3 = !0;
    } }, null), I(W, { size: "sm", type: "submit", form: i3, label: r3, loading: t4, onClick: () => {
      s3 = !1;
    } }, null)]) }, onConfirm: async (e3) => {
      if (e3.projectId) {
        let r3 = t3.find((t4) => t4.value === e3.projectId)?.label, a4 = n2.filter((t4) => String(t4.projectId) !== String(e3.projectId)).map((e4) => e4.id);
        if (!a4.length) {
          if (s3) {
            Vr(e3.projectId, r3), i2();
            return;
          }
          K2(-1, $t("所选窗口 {names} 已在该项目中", { names: o2 }));
          return;
        }
        await xr({ ids: a4, projectId: e3.projectId, requestType: z.MoveProject }, !props.isProjectProfile).then(() => {
          n2.forEach((t4) => {
            t4.projectName = r3, t4.projectId = e3.projectId, t4.labelInfo = t4.labelInfo.filter((e4) => !Ft(e4.labelId)), t4.labelIds = t4.labelInfo.map((e4) => e4.labelId);
          }), lr(e3.projectId), props.isProjectProfile && ur(), s3 && Vr(e3.projectId, r3);
        });
      }
      i2();
    }, onCancel: a3 }), r2;
  }
  async function Ur(e2) {
    if (e2.proxyCategory === "noproxy") {
      G2(-1, $t("未绑定代理 IP"));
      return;
    }
    if (e2.buyProxyType !== H.resource || e2.isEncryptProxy) {
      G2(-1, $t("该代理 IP 已加密无法编辑，如需更换，请先删除此代理 IP 或选择其他代理 IP"));
      return;
    }
    let t3 = Xe2(e2);
    await fe2({ title: $t("为[{workspaceName}-{uid}]编辑代理 IP", { workspaceName: workspaceName.value, uid: e2.windowSortNum }), data: t3, mode: "proxy", onConfirm: async (t4) => {
      let { id: n2, dirId: r2 } = e2, i2 = { ...t4, id: n2, dirId: r2, moduleId: 0, proxyMethod: "custom", requestType: z.EditProxy }, { code: a3, msg: s3 } = await o.window.userMdfWindowInfoSingleV2Create(i2);
      if (K2(a3, s3), a3 !== 0) return !1;
      Reflect.deleteProperty(e2, "_checkRes"), B(e2, i2);
    } });
  }
  function Wr(e2, { proxyMethod: t3 }) {
    let n2 = [].concat(e2);
    return t3 === "choose" ? n2.length > 1 ? Kr(n2) : Gr(n2) : n2.length > 1 ? Jr(n2) : qr(n2);
  }
  function Gr(e2) {
    let { promise: t3, resolve: n2 } = Promise.withResolvers(), r2 = Xe2(e2[0]);
    T2.showDrawer({ title: $t("选择代理 IP"), pt: { root: { class: "overflow-hidden rounded-2 border-0.5 max-w-full", style: { width: "min(860px, calc(100vw - 24px))" } } }, slots: { container: () => I(ht, { windows: e2, workspaceName: workspaceName.value, data: r2, onConfirm: i2 }, null) }, onHide: n2 });
    async function i2(t4) {
      await Xr(e2, t4) && T2.hideDrawer();
    }
    return t3;
  }
  function Kr(e2) {
    let { promise: t3, resolve: n2 } = Promise.withResolvers();
    T2.showDrawer({ title: $t("批量配置代理 IP"), pt: { root: { class: "overflow-hidden rounded-2 border-0.5 max-w-full", style: { width: "min(1280px, calc(100vw - 24px))" } } }, slots: { container: () => I(ht, { windows: e2, workspaceName: workspaceName.value, onConfirm: r2 }, null) }, onHide: n2 });
    async function r2(e3) {
      await Yr(e3) && T2.hideDrawer();
    }
    return t3;
  }
  async function qr(e2) {
    await localProxyEditor.openProxyBuyAddDrawer({ onAddConfirm: proxy => Zr(e2, proxy) });
  }
  function Jr(e2) {
    let { promise: t3, resolve: n2 } = Promise.withResolvers();
    T2.showDrawer({ title: $t("添加代理 IP"), pt: { root: { class: "overflow-hidden rounded-2 border-0.5 max-w-full", style: { width: "min(1080px, calc(100vw - 24px))" } } }, slots: { container: () => I("div", { class: "h-full flex flex-col min-h-0 overflow-hidden" }, [I(Ut, { class: "h-full min-h-0 flex", onConfirm: r2 }, null)]) }, onHide: n2 });
    async function r2(t4) {
      await Qr(e2, t4) && T2.hideDrawer();
    }
    return t3;
  }
  async function Yr(e2) {
    let t3 = e2.map((e3) => {
      let t4 = { ...e3.proxy };
      return delete t4._proxyCount, delete t4.bindList, t4;
    }), n2 = ye(t3), { code: r2, msg: i2 } = await o.window.userMdfWindowDataBatchCreate({ type: V.ProxySelect, requestType: z.SelectProxy, ids: e2.map((e3) => e3.window.id), proxyList: n2 });
    return K2(r2, i2), r2 === 0 && (e2.forEach((e3, t4) => {
      let r3 = n2[t4];
      r3 && B(e3.window, { ...r3, moduleId: r3.moduleId, proxyMethod: "choose", proxyCategory: r3.proxyCategory || r3.protocol, buyProxyType: e3.proxy.proxyType ?? H.resource });
    }), !0);
  }
  async function Xr(e2, t3) {
    let { id: n2, ...r2 } = t3, { code: i2, msg: a3 } = await o.window.userMdfWindowDataBatchCreate({ type: V.ProxySelect, requestType: z.SelectProxy, ids: e2.map((e3) => e3.id), paramList: { moduleId: n2 ?? 0, proxyMethod: "choose", ...r2 } });
    if (K2(i2, a3), i2 !== 0) return !1;
    let { protocol: s3, proxyCategory: c3, proxyType: l2, isDirect: u2, ...d2 } = r2, f2 = { ...d2, moduleId: n2 ?? 0, isDirect: u2, proxyMethod: "choose", protocol: s3, proxyCategory: c3 || s3, buyProxyType: l2 ?? H.resource };
    return e2.forEach((e3) => {
      B(e3, f2);
    }), !0;
  }
  async function Zr(e2, t3) {
    let { id: n2, ...r2 } = t3, { code: i2, msg: a3 } = await o.window.userMdfWindowDataBatchCreate({ type: V.ProxyAdd, requestType: z.AddProxy, ids: e2.map((e3) => e3.id), paramList: { moduleId: n2 ?? 0, proxyMethod: "custom", ...r2 } });
    if (K2(i2, a3), i2 !== 0) return false;
    let { protocol: s3, proxyCategory: c3, proxyType: l2, isDirect: u2, ...d2 } = r2, f2 = { ...d2, moduleId: n2 ?? 0, isDirect: u2, proxyMethod: "custom", protocol: s3, proxyCategory: c3 || s3, buyProxyType: l2 ?? H.resource };
    e2.forEach((e3) => {
      B(e3, f2);
    });
    return true;
  }
  async function Qr(e2, t3) {
    let n2 = xe(t3), { code: r2, msg: i2 } = await o.window.userMdfWindowDataBatchCreate({ type: V.ProxyAdd, requestType: z.AddProxy, ids: e2.map((e3) => e3.id), proxyList: n2 });
    return K2(r2, i2), r2 === 0 && (e2.forEach((e3, t4) => {
      let r3 = n2[t4];
      r3 && B(e3, { ...r3, moduleId: 0, proxyMethod: "custom", proxyCategory: r3.proxyCategory || r3.protocol, buyProxyType: H.resource });
    }), !0);
  }
  function $r(e2) {
    let t3 = [].concat(e2);
    return $e2(t3);
  }
  function ti(e2, { operationType: t3, isChoose: n2 = !1 }) {
    let { promise: r2, resolve: i2 } = Promise.withResolvers(), a3 = [].concat(e2), s3 = t3 === "batch", c3 = n2 ? $t("选择平台账号") : $t("添加平台账号"), l2 = n2 ? () => I("div", { class: "h-full flex flex-col" }, [s3 && I("div", { class: "px-4 pt-4" }, [I(Ze, { class: "min-w-full", type: "warn", closable: !1, title: $t("此操作将清空所选窗口中的平台账号，并将新选择的平台账号绑定至窗口，请谨慎操作。") }, null)]), I(Ct, { class: "flex-1 overflow-hidden", data: s3 ? void 0 : a3[0], onConfirm: u2 }, null)]) : () => I(St, { showRemark: !1, showCreateMore: !1, onConfirm: appendAccount, onClose: () => T2.hideDrawer() }, null);
    const addIds = n2 ? null : a3.map(row => row.id);
    T2.showDrawer({ title: c3, slots: { container: l2 }, onHide: i2 });
    async function appendAccount({ platformUrl, platformUserName, platformPassword, platformEfa }) {
      // The roster is redacted. Send only the new account and let the host
      // append it to the latest stored accounts, in single and batch mode.
      const { code, data, msg } = await o.window.userMdfWindowDataBatchCreate({
        type: V.PlatformAdd, requestType: z.AddPlatform, ids: addIds,
        paramList: { windowPlatformList: [{ platformUrl, platformUserName, platformPassword, platformEfa }] },
      });
      if (code !== 0 || data !== true) {
        K2(code || -1, msg || $t("保存失败"));
        return false;
      }
      // The normal profile event refreshes the redacted roster. Never copy
      // the private editor draft into a table row.
      try { dr(); } catch (_) { /* Cache invalidation must not change a durable receipt. */ }
      return true;
    }
    async function u2(e3) {
      let { code: t4, msg: n3 } = s3 ? await d2(e3) : await f2(e3);
      T2.hideDrawer(), K2(t4, n3);
    }
    async function d2(e3) {
      let t4 = [].concat(e3).map((e4) => e4.id), c4 = a3.map((e4) => e4.id), { code: l3, msg: u3 } = await o.window.userMdfWindowDataBatchCreate({ paramList: { platformUrlIds: t4 }, type: V.PlatformSelect, requestType: z.SelectPlatform, ids: c4 });
      return l3 === 0 && (a3.forEach((t5, r4) => {
        let i4 = Array.isArray(e3) ? e3 : t5.windowPlatformList.concat({ ...e3, _tempId: (Date.now() + r4 ** 2).toString(32) });
        we(t5, i4);
      }), dr()), { code: l3, msg: u3 };
    }
    async function f2(e3) {
      let { id: t4, dirId: r3, windowPlatformList: i3 } = a3[0], s4 = { id: t4, dirId: r3, platformUrlIds: e3.filter((e4) => e4.id).map((e4) => e4.id), requestType: z.SelectPlatform };
      let { code: c4, msg: l3 } = await o.window.userMdfWindowInfoSingleV2Create(s4);
      if (c4 === 0) {
        let t5 = i3.filter((e4) => !e4.id).concat(e3);
        we(a3[0], t5), dr();
      }
      return { code: c4, msg: l3 };
    }
    return r2;
  }
  async function ni(e2) {
    let t3 = [].concat(e2);
    wt2({ data: t3, onConfirm: async (e3) => {
      let { code: n2, msg: r2 } = await o.window.userMdfWindowDataBatchCreate({ type: V.CookieEdit, requestType: z.EditCookie, ids: t3.map((e4) => e4.id), paramList: { cookie: e3 } });
      K2(n2, r2);
      if (n2 !== 0) return false;
      t3.forEach((t4) => {
        Reflect.set(t4, "cookie", e3);
      });
      return true;
    } });
  }
  async function ri(e2) {
    let t3 = [].concat(e2);
    Vt2(t3);
  }
  async function ii(e2) {
    if (!check("Profiles_edit_remark")) return;
    let { promise: t3, resolve: n2 } = Promise.withResolvers(), r2 = [].concat(e2);
    return qe2({ title: $t("为所选窗口添加备注"), inputs: [{ type: "textarea", name: "windowRemark", value: r2[0].windowRemark, props: { placeholder: $t("请输入备注"), rows: 6 } }], onConfirm: async (e3) => {
      let t4 = r2.map((e4) => e4.id);
      await xr({ ids: t4, windowRemark: e3.windowRemark, requestType: z.EditRemark }, !0), r2.forEach((t5) => {
        t5.windowRemark = e3.windowRemark;
      });
    }, onHide: n2 }), t3;
  }
  function toggleNotes(e2) {
    e2.extend = !e2.extend;
    dn2(e2.extend);
  }
  async function oi(e2) {
    oe2.open(qt, { props: { showHeader: !1, modal: !0, blockScroll: !0 }, data: { props: { title: $t("清空窗口缓存"), content: $t("常用于解决未知原因的环境打开异常或缓慢等问题。") }, onConfirm: async (t3) => {
      let r2 = e2.map((e3) => e3.dirId);
      await globalThis.electronAPI.send("browser:clearCache", { clearType: t3, dirIds: r2 });
    } } });
  }
  async function si(e2) {
    oe2.open(Gt, { props: { showHeader: !1, modal: !0, blockScroll: !0 }, data: { props: { data: e2, workspaceName: workspaceName.value } } });
  }
  async function createProfile() {
    let { code: e2, msg: t3 } = await o.window.userCheckWindowTotalCountList();
    e2 === 0 ? v2.push({ name: "browser-create", query: { projectId: g2.params.id } }) : Ne2(e2, () => {
      G2(e2, t3);
    });
  }

  return {
    tableRef,
    tagsRef,
    columns,
    cacheScope,
    cacheMetadata,
    restoreCache,
    loadRows,
    runOperation,
    canQuickCreate,
    quickCreate,
    configureQuickCreate,
    searchOptions,
    search,
    filters,
    saveFilters,
    refresh,
    check,
    selection,
    automationLabel,
    automationBusy,
    createAutomation,
    testAllProxies,
    filtered,
    createProfile,
    workspaceName,
    openState,
    refreshRow,
    guideDriver,
    advanceGuide,
    recordFirstOpen,
    openProfile,
    toggleNotes,
    updateLabels,
    openActions,
    showTemporaryColumn,
    deleteConfirmation,
    videoUrl: nn,
  };
}

function useProfileDelete({ ref, watch, onBeforeUnmount, scope, inactive, rows, selection,
  checkClosed, read, remove, canPurge, warn }) {
  let pending, generation = 0;
  const confirmation = ref(null);
  const idsKey = list => JSON.stringify(list.map(row => row.id).sort());
  const projectOf = row => String(row.projectId ?? "");

  function finish(intent, completed = false) {
    if (!intent || pending !== intent) return false;
    pending = undefined;
    confirmation.value = null;
    intent.resolve(completed);
    return completed;
  }
  function invalidate() {
    generation++;
    finish(pending);
  }
  function matchingRows(intent, source) {
    const byId = new Map(source.map(row => [row.id, row]));
    return intent.ids.map(id => byId.get(id))
      .filter((row, index) => row && projectOf(row) === intent.projects[index]);
  }
  function isCurrent(intent) {
    return pending === intent && generation === intent.generation && !inactive() &&
      matchingRows(intent, rows()).length === intent.ids.length &&
      (!intent.batch || idsKey(selection()) === intent.selectionKey);
  }
  watch(scope, invalidate, { flush: "sync" });
  watch(() => idsKey(selection()), () => {
    if (pending?.batch) invalidate();
  }, { flush: "sync" });
  watch(rows, () => {
    if (pending && !isCurrent(pending)) invalidate();
  }, { flush: "sync" });
  onBeforeUnmount(invalidate);

  async function verify(intent) {
    try {
      if (!isCurrent(intent)) return false;
      const closed = await checkClosed(matchingRows(intent, rows()));
      if (!isCurrent(intent)) return false;
      if (closed.length !== intent.ids.length) {
        warn($t("请先关闭窗口"));
        return false;
      }
      // Re-read precisely these IDs in the active server scope. A still
      // visible but stale row cannot authorize removal of a moved profile.
      const { code, data, msg } = await read(intent.ids);
      if (!isCurrent(intent)) return false;
      if (code !== 0) throw Error(msg || $t("列表读取失败"));
      const live = matchingRows(intent, data?.rows ?? []);
      if (live.length !== intent.ids.length) {
        warn($t("窗口/数据不存在，请刷新页面后重试"));
        return false;
      }
      if (live.some(row => row.openStatus)) {
        warn($t("请先关闭窗口"));
        return false;
      }
      return true;
    } catch (error) {
      if (isCurrent(intent)) warn(error?.message || String(error));
      return false;
    }
  }
  async function accept(intent) {
    const dialog = confirmation.value;
    if (dialog?.key !== intent.generation || dialog.busy) return false;
    const permanent = dialog.permanent;
    dialog.busy = true;
    if (!await verify(intent) || !isCurrent(intent) || (permanent && !canPurge())) return finish(intent);
    try {
      const completed = await remove(intent.ids, permanent);
      return finish(intent, completed !== false);
    } catch (error) {
      if (isCurrent(intent)) warn(error?.message || String(error));
      return finish(intent);
    }
  }
  function request(targets, mode) {
    invalidate();
    const ids = targets.map(row => row.id);
    if (!ids.length || ids.some(id => !id) || new Set(ids).size !== ids.length) return false;
    const { promise, resolve } = Promise.withResolvers();
    const intent = pending = { generation, ids, projects: targets.map(projectOf), batch: mode === "batch",
      selectionKey: idsKey(targets), resolve };
    void verify(intent).then(valid => {
      if (!valid || !isCurrent(intent)) return finish(intent);
      confirmation.value = { key: intent.generation, allowPermanent: canPurge(), permanent: false, busy: false,
        accept: () => accept(intent), cancel: () => finish(intent) };
    });
    return promise;
  }
  return { confirmation, request };
}
