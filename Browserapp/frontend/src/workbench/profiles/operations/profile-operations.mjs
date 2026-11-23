import {
  d as computed,
  jt as unref,
  Et as toRaw,
  St as ref,
  st as watch,
  x as h,
} from './runtime-core.esm-bundler-CBj16o9G.js';
import { s as proxyExpiry } from './proxy-D7e36h-l.js';
import { n as useRouteContext } from './useRouteContext-Cfh7KChG.js';
import {
  t as getLabels,
  n as useLabels,
} from './useProfileEntityLabels-BfqbVpel.js';
import ClearCache from './workbench-clear-profile-cache.js';
import ExportProfiles from './workbench-export-profiles.js';
import CookieEditor from './workbench-profile-cookie-editor.js';
import CookieRobot from './workbench-profile-cookie-robot.js';
import {
  h as api,
  mt as useWorkspace,
  o as readFilters,
  r as filterParams,
  v as useUser,
  xr as isEmpty,
} from './utils-BIWenCnY.js';
import { a as useWorkspaceStore } from './agent-BmSFI9WH.js';
import { n as requestType } from './permission-DOhNJfB3.js';
import {
  c as proxyUpdateDefaults,
  d as updateProxyRow,
} from './useProfileProxy-Cbqapbxb.js';
import {
  b as useRouter,
  r as events,
  y as useRoute,
} from './rich-html-link-VdBpR3Cm.js';
import { n as workspaceCode } from './workspace-CNvgSgaH.js';
import { t as Alert } from './rx-alert-A_y5uvgP.js';
import { t as useDialog } from './useDialog-BC-nc8J-.js';
import { o as useDrawer } from './useProxyFormDrawer-r-7UykRS.js';
import { a as readTags } from './use-tag-menu-DZnIrtE9.js';
import { canRestoreProjectProfileCache, profileRowsInProject, profileTableParams, projectDetailId } from './workbench-table.js';

function useOpenButton(e2) {
  let { isEcommerce: c2 } = useRouteContext(),
    l2 = computed(() => getLabels(c2.value)),
    u2 = computed(() => {
      let t2 = unref(e2.data);
      return `${t2.coreType} ${t2.coreVersion}`;
    }),
    d2 = computed(() => !!unref(e2.data).trashed),
    p2 = computed(() => false),
    h2 = computed(() => ''),
    g2 = computed(() => ''),
    v2 = computed(() => {
      let t2 = unref(e2.data),
        n2 = unref(e2.openMessage),
        r2 = unref(e2.text) ?? l2.value.open,
        i2 = n2[t2.dirId];
      if (!i2)
        return {
          msg: r2,
          classes: 'cursor-pointer',
          error:
            t2.proxyExpireStatus === proxyExpiry.expired
              ? l2.value.proxyExpiredBeforeOpen
              : undefined,
        };
      let { uploading: a2, pending: o2, code: s2, data: c3, error: u3 } = i2,
        d3 = s2 === 1 || !!u3,
        f2 = c3?.percent === 100,
        p3 = !(d3 || f2);
      return {
        code: s2,
        pending: o2,
        msg: d3 ? r2 : (c3?.message ?? r2),
        percent: c3?.percent || 0,
        error: d3 ? i2.message || u3?.message : undefined,
        warning: c3?.warningMessages?.join(`
`),
        opening: p3,
        uploading: a2,
        completed: f2,
        classes: p3 || a2 ? 'cursor-not-allowed' : 'cursor-pointer',
      };
    }),
    y2 = computed(() => {
      let e3 = v2.value;
      return d2.value || !!(e3.pending || e3.opening || e3.uploading);
    }),
    b2 = computed(() => !!(v2.value.error || v2.value.warning));
  async function w2() {
    y2.value ||
      (unref(e2.driverObj) && e2.driverNext?.(),
      await e2.onOpen(unref(e2.data)));
  }
  return {
    browser: v2,
    coreInfo: u2,
    isOpenLimitReached: d2,
    isCrossModeExpired: p2,
    crossModeExpiredTip: h2,
    isButtonDisabled: y2,
    usePeoples: g2,
    showErrorTooltip: b2,
    openBrowser: w2,
  };
}

function useProfileCookieActions() {
  let { currentWorkspace: e2 } = useWorkspaceStore(useWorkspace()),
    { mixpanelTrack: t2 } = useUser(),
    { showDrawer: n2, hideDrawer: r2 } = useDrawer(),
    [i2] = useDialog(),
    a2 = useLabels();
  function o2(t3) {
    let { data: i3, onConfirm: o3 } = t3,
      s3 = `[${i3
        .slice(0, 3)
        .map(
          (t4) =>
            `${workspaceCode(e2.value?.workspaceName)}-${t4.windowSortNum}`,
        )
        .join(', ')}${i3.length > 3 ? '...' : ''}]`;
    n2({
      title: $t('为 {names} 编辑 Cookies', { names: s3 }),
      dismissable: false,
      slots: {
        container: () =>
          h('div', { class: 'h-full flex flex-col' }, [
            i3.length > 1 &&
              h('div', { class: 'px-4 pt-4' }, [
                h(
                  Alert,
                  {
                    class: 'min-w-full',
                    type: 'warn',
                    closable: false,
                    title: a2.value.selectedCookiesWarning,
                  },
                  null,
                ),
              ]),
            h(
              CookieEditor,
              {
                class: 'flex-1',
                data: i3.length > 1 ? undefined : i3[0],
                saveCookies: async (e3) => {
                  if ((await o3(e3)) !== false) r2();
                },
              },
              null,
            ),
          ]),
      },
    });
  }
  function s2(e3) {
    (t2('click_enter_cookie_bot'),
      i2({
        showHeader: false,
        modal: true,
        blockScroll: true,
        slots: {
          container: ({ hideModal: n3 }) =>
            h(
              CookieRobot,
              {
                data: e3,
                onConfirm: async (r3) => {
                  try {
                    t2('click_run_cookie_bot');
                    let i3 = e3.map((e4) => e4.dirId);
                    (await globalThis.electronAPI.send(
                      'browser:startCookieRobot',
                      { dirIds: i3, ...r3 },
                    ),
                      n3());
                  } catch (error) {
                    error.localUiNotified ||
                      globalThis.__localUiError(error.message);
                  }
                },
                onClose: n3,
              },
              null,
            ),
        },
      }));
  }
  return { editCookieByProfile: o2, startCookieRobot: s2 };
}
function parseAutoOpen(e2) {
  if (e2 == null || e2 === '') return null;
  let t2 = typeof e2 == 'string' ? e2 : String(e2);
  try {
    return JSON.parse(t2);
  } catch {
    return null;
  }
}
function useAutoOpen(e2) {
  let t2 = new Set();
  function n2(e3) {
    t2.add(String(e3));
  }
  function r2(e3) {
    t2.delete(String(e3));
  }
  async function i2(n3) {
    let r3 = String(n3);
    if (!t2.delete(r3)) return;
    let i3 = await globalThis.electronAPI.send('browser:getOpenedBrowser'),
      a2 = proxyUpdateDefaults(
        i3.find((e3) => String(e3.dirId) === r3)?.$proxyInfo,
      );
    if (!a2) return;
    let o2 = e2.value.find((e3) => String(e3.dirId) === r3);
    o2 && updateProxyRow(o2, a2, { replaceProxy: false });
  }
  return {
    markRouteAutoOpen: n2,
    clearPendingAutoOpen: r2,
    syncOpenedProxyToRow: i2,
  };
}
function useProfileTableRows(e2) {
  let t2 = useRoute(),
    n2 = useRouter(),
    r2 = useWorkspace(),
    i2 = ref(false),
    o2 = ref(false),
    s2 = ref([]),
    {
      markRouteAutoOpen: u2,
      clearPendingAutoOpen: f2,
      syncOpenedProxyToRow: p2,
    } = useAutoOpen(s2);
  watch(
    () => r2.currentWorkspace,
    (e3, t3) => {
      e3?.workspaceName !== t3?.workspaceName && m2();
    },
  );
  function m2(t3 = {}, n3 = false) {
    const r3 = profileTableParams({
      ...e2.getCurrentFilterParams(),
      ...t3,
      ...filterParams(readFilters(e2.filtersMenu.value)),
    }, projectDetailId(t2));
    ((i2.value = !isEmpty(r3)), e2.tableRef.value?.refresh(r3, n3));
  }
  function g2() {
    let r3 = parseAutoOpen(t2.query.browser);
    if (!r3?.openBrowser) return;
    let i3 = s2.value.find((e3) => e3.id === r3.windowId);
    (n2.replace({ name: t2.name }),
      i3 && (u2(i3.dirId), e2.openBrowserBefore(i3)));
  }
  async function _2(e3, current = () => true) {
    const projectId = projectDetailId(t2);
    if (projectId === '') throw Error($t('项目不存在'));
    const n3 = await api.window.userGetWindowInfoListList({
      ...profileTableParams(e3, projectId),
      ...(projectId === undefined ? {} : { scopeProjectId: projectId }),
      isDelete: 0,
    });
    // This adapter also publishes profile state, before the table applies rows.
    if (!current() || projectId !== projectDetailId(t2) || n3.code !== 0) return n3;
    if (projectId !== undefined && !profileRowsInProject(n3.data?.rows, projectId)) throw Error($t('列表读取失败'));
    const rows = n3.data.rows.map(row => ({
      ...row, projectName: row.projectName === '无项目' ? $t('默认项目') : row.projectName,
    }));
    s2.value = n3.data.rows = rows;
    o2.value = rows.some(row => row.isTemporary);
    if (rows.length) g2();
    events.emit('updateProfileList', rows);
    return n3;
  }
  function v2(t3) {
    const projectId = projectDetailId(t2);
    if (projectId !== undefined && !canRestoreProjectProfileCache(t3, projectId)) return;
    let n3 = t3.rows;
    ((s2.value = n3),
      (o2.value = n3.some((e3) => e3.isTemporary)),
      t3.meta?.filtersMenu && (e2.filtersMenu.value = t3.meta.filtersMenu));
    let r3 = {
      ...t3.outerParams,
      ...filterParams(readFilters(e2.filtersMenu.value)),
    };
    ((i2.value = !isEmpty(r3)), events.emit('updateProfileList', n3));
  }
  return {
    dataList: s2,
    hasFiltered: i2,
    hasTempProfile: o2,
    clearPendingAutoOpen: f2,
    syncOpenedProxyToRow: p2,
    onRefreshTable: m2,
    tableRequest: _2,
    syncFromCacheEntry: v2,
  };
}
function useProfileUpdates(e2) {
  let { onlyErrorToast: t2 } = e2;
  function n2(t3, n3) {
    (e2.invalidateListCache?.(), e2.onRefreshTable(t3, n3));
  }
  async function r2(e3, r3 = false) {
    let { code: i3, msg: o3 } =
      await api.window.userMdfWindowInfoSingleV2Create(e3);
    return (
      t2(i3, o3),
      i3 === 0 ? (r3 || n2(), Promise.resolve()) : Promise.reject(o3)
    );
  }
  async function i2(e3, r3 = false) {
    let { code: i3, msg: o3 } =
      await api.window.userMdfWindowInfoBatchV2Create(e3);
    return (
      t2(i3, o3),
      i3 === 0 ? (r3 || n2(), Promise.resolve()) : Promise.reject(o3)
    );
  }
  async function o2(e3, t3, n3) {
    let { projectId: a2, labelIds: o3, requestType: s2 } = e3,
      c2 = [].concat(t3),
      l2 = c2.map((e4) => e4.id);
    (n3 === 'single'
      ? r2({ id: l2[0], projectId: a2, labelIds: o3, requestType: s2 }, true)
      : i2({ ids: l2, projectId: a2, labelIds: o3, requestType: s2 }, true)
    ).then(() => {
      let t4 = Object.entries(e3).filter(([e4, t5]) => !!t5);
      c2.forEach((e4) => {
        t4.forEach(([t5, n4]) => {
          e4[t5] = n4;
        });
      });
    });
  }
  return {
    singleModifyWindow: r2,
    batchModifyWindow: i2,
    updateProfileMeta: o2,
  };
}
function serializeFilterItems(e2) {
  return e2?.length
    ? e2.reduce(
        (e3, t2) => (t2.value && (e3[t2.name] = toRaw(t2.value)), e3),
        {},
      )
    : {};
}
async function editProfile(e2) {
  let { page_index: t2 } = e2.tableRef.value.getParams(),
    n2 = serializeFilterItems(e2.filtersMenu.value);
  e2.router.push({
    name: 'browser-edit',
    query: {
      ...e2.route.query,
      id: e2.data.id,
      page_index: t2,
      activeTabId: e2.getCurrentFilter()?.id,
      customFilterParams: JSON.stringify(n2),
    },
  });
}
function copyProfileId(e2) {
  (e2.copyTextFn(e2.data.dirId), e2.showToast(0, $t('复制成功')));
}
async function restartProfiles(e2) {
  let t2 = e2.datas
    .filter((e3) => e3.openLimitStatus)
    .toSorted((e3, t3) => e3.windowSortNum - t3.windowSortNum)
    .map((e3) => e3.dirId);
  t2.length && globalThis.electronAPI.send('browser:batchRelaunch', t2);
}
function closeProfiles(e2) {
  globalThis.electronAPI.send(
    'browser:batchClose',
    e2.datas.map((e3) => e3.dirId),
  );
}
async function applyProfileTag(e2) {
  e2.operationType === 'batch'
    ? e2.tagsIconRef.value?.openMenu(e2.operate._event)
    : e2.addTag({
        confirmNext: ({ params: t2, res: n2 }) => {
          let r2 = readTags(n2.data.id);
          e2.updateProfileMeta(
            {
              labelInfo: [
                ...e2.data.labelInfo,
                { labelColor: t2.color, labelName: t2.name, labelId: r2 },
              ],
              labelIds: [
                ...(e2.data.labelIds || []).map((e3) => readTags(e3)),
                r2,
              ],
              requestType: requestType.SelectLabel,
            },
            e2.data,
          );
        },
      });
}
function toggleFavorite(e2) {
  e2.singleModifyWindow(
    { id: e2.data.id, isOften: !e2.data.isOften },
    true,
  ).then(() => {
    e2.data.isOften = !e2.data.isOften;
  });
}
var handlers = {
  edit: editProfile,
  copyId: copyProfileId,
  transfer: async (e2) => e2.onTransfer(e2.datas, e2.operate),
  moveToProject: async (e2) => e2.onMoveToProject(e2.data),
  open: async (e2) => e2.openBrowserBefore(e2.data),
  createAutomation: async (e2) => e2.createAutomation(e2.datas),
  view: async (e2) => e2.openBrowserBefore(e2.data),
  setAsDefaultBrowser: async (e2) => e2.setAsDefaultBrowser(e2.data),
  createDesktopShortcut: async (e2) => e2.createDesktopShortcut(e2.data),
  addProxy: async (e2) =>
    e2.multipleProxyChange(e2.data, {
      operationType: e2.operationType,
      proxyMethod: 'custom',
    }),
  chooseProxy: async (e2) =>
    e2.multipleProxyChange(e2.data, {
      operationType: e2.operationType,
      proxyMethod: 'choose',
    }),
  editProxy: async (e2) => e2.editProfileProxy?.(e2.data),
  deleteProxy: async (e2) => e2.multipleProxyDelete(e2.data),
  checkProxy: async (e2) => e2.onTestProxy(e2.data),
  addPlatformAccount: async (e2) =>
    e2.multipleAccountChange(e2.data, {
      operationType: e2.operationType,
      isChoose: false,
    }),
  choosePlatformAccount: async (e2) =>
    e2.multipleAccountChange(e2.data, {
      operationType: e2.operationType,
      isChoose: true,
    }),
  restart: restartProfiles,
  close: closeProfiles,
  addTag: applyProfileTag,
  fav: toggleFavorite,
  addNotes: async (e2) => e2.onRemark(e2.data),
  editCookies: async (e2) => e2.onEditCookies(e2.data),
  cookieRobot: async (e2) => e2.openCookieRobot(e2.data),
  clearCache: async (e2) => e2.onClearCache(e2.datas),
  upgradeCore: async (e2) => e2.onUpgradeCore?.(e2.datas),
  exportProfile: async (e2) => e2.exportProfile(e2.datas),
  delete: async (e2) => e2.deleteProfile(e2.datas, e2.ids),
};
function useProfileOperations(e2) {
  return async function (t2, n2, r2 = 'single') {
    let i2 = [].concat(n2).map((e3) => toRaw(e3)),
      a2 = i2.map((e3) => e3.id);
    e2.saveLocalTrack(t2.name);
    let o2 = handlers[t2.name];
    o2 &&
      (await o2({
        ...e2,
        operate: t2,
        datas: i2,
        ids: a2,
        data: n2,
        operationType: r2,
      }));
  };
}

export {
  useProfileCookieActions as a,
  ExportProfiles as c,
  useProfileTableRows as i,
  ClearCache as l,
  serializeFilterItems as n,
  useProfileUpdates as r,
  useProfileOperations as t,
  useOpenButton as u,
};
