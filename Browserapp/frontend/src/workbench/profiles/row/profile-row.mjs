import {
  Ar as joinText,
  fr as formatDate,
  h as api,
  qt as engine,
  vt as cacheKeys,
  yt as useListCache,
  Cr as isFunction,
} from './utils-BIWenCnY.js';
import {
  D as h,
  d as computed,
  jt as unref,
  Et as toRaw,
} from './runtime-core.esm-bundler-CBj16o9G.js';
import { n as requestType } from './permission-DOhNJfB3.js';
import {
  f as editKind,
  u as updateAccountRow,
  a as useProxySpeedTest,
  d as updateProxyRow,
} from './useProfileProxy-Cbqapbxb.js';
import { o as proxyResult, m as proxyType } from './proxy-D7e36h-l.js';
import { t as NewAccount } from './quick-kroUOSn_.js';
import { t as AccountPicker } from './quick-CZrtqSCy.js';
import BatchAccountEditor from './workbench-profile-account-editor.js';
import { t as useProxyForm } from './useProxyFormDrawer-r-7UykRS.js';
import ProfileProxyPicker from './workbench-profile-proxy-picker.js';

function useAccountMenu(e2) {
  let {
      data: t2,
      workspaceName: n2,
      drawerInstance: r2,
      onlyErrorToast: i2,
      check: o2,
      updateProfile: s2,
      saveLocalTrack: c2,
    } = e2,
    { invalidateCache: l2 } = useListCache();
  function u2() {
    l2(cacheKeys.ACCOUNT_LIST);
  }
  function p2() {
    let e3 = unref(t2),
      l3 = unref(n2);
    return [
      {
        name: 'editPlatformAccount',
        label: $t('编辑账号'),
        icon: 'base/rx_ic_edit',
        visible:
          o2('Profiles_edit_platform_outside') &&
          (e3.windowPlatformList?.length ?? 0) > 0,
        command: async () => {
          ((e3.windowPlatformList = (
            await globalThis.__localRequest('profiles:read', { id: e3.id })
          ).windowPlatformList),
            await r2.showDrawer({
              title: $t('为[{workspaceName}-{uid}]编辑平台账号', {
                workspaceName: l3,
                uid: e3.windowSortNum,
              }),
              dismissable: false,
              slots: {
                container: () =>
                  h(BatchAccountEditor, {
                    datas: e3.windowPlatformList,
                    onConfirm: async ({
                      platformUrlIds: t3,
                      windowPlatformList: n3,
                    }) => {
                      let { code: o3, msg: s3 } =
                        await api.window.userMdfWindowDataBatchCreate({
                          type: editKind.PlatformEdit,
                          requestType: requestType.EditPlatform,
                          ids: [e3.id],
                          paramList: {
                            platformUrlIds: t3,
                            windowPlatformList: n3,
                          },
                        });
                      (r2.hideDrawer(),
                        i2(o3, s3),
                        o3 === 0 && (updateAccountRow(e3, n3), u2()));
                    },
                  }),
              },
            }));
        },
      },
      {
        separator: true,
        visible:
          o2('Profiles_add_platform_outside') &&
          e3.windowPlatformList.length > 0,
      },
      {
        name: 'addPlatformAccount',
        label: $t('添加账号'),
        icon: 'base/rx_ic_plus',
        visible: o2('Profiles_add_platform_outside'),
        command: async () => {
          await r2.showDrawer({
            title: $t('为[{workspaceName}-{uid}]添加平台账号', {
              workspaceName: l3,
              uid: e3.windowSortNum,
            }),
            dismissable: false,
            slots: {
              container: () =>
                h(NewAccount, {
                  showRemark: false,
                  showCreateMore: false,
                  onClose: () => {
                    r2.hideDrawer();
                  },
                  onConfirm: async ({ platformUrl, platformUserName, platformPassword, platformEfa }) => {
                    // The shared row is redacted. Let the host append only the new
                    // inline entry to its authoritative account list.
                    const { code, data, msg } = await api.window.userMdfWindowDataBatchCreate({
                      type: editKind.PlatformAdd,
                      requestType: requestType.AddPlatform,
                      ids: [e3.id],
                      paramList: { windowPlatformList: [{ platformUrl, platformUserName, platformPassword, platformEfa }] },
                    });
                    if (code !== 0 || data !== true) {
                      i2(code || -1, msg || $t('保存失败'));
                      return false;
                    }
                    // The ordinary profile update event refreshes the table from
                    // its redacted query; do not copy form fields into the shared row.
                    u2();
                    return true;
                  },
                }),
            },
          });
        },
      },
      {
        name: 'choosePlatformAccount',
        label: $t('选择账号'),
        icon: 'base/rx_ic_exchange',
        visible: o2('Profiles_select_platform'),
        command: async () => {
          await r2.showDrawer({
            title: $t('为[{workspaceName}-{uid}]选择平台账号', {
              workspaceName: l3,
              uid: e3.windowSortNum,
            }),
            slots: {
              container: () =>
                h(AccountPicker, {
                  data: e3,
                  onConfirm: async (t3) => {
                    r2.hideDrawer();
                    let { id: n3, dirId: i3, windowPlatformList: a2 } = e3,
                      o3 = t3.filter((e4) => e4.id).map((e4) => e4.id);
                    await s2(
                      {
                        id: n3,
                        dirId: i3,
                        platformUrlIds: o3,
                        requestType: requestType.SelectPlatform,
                      },
                      {
                        success: () => {
                          let n4 = a2.filter((e4) => !e4.id).concat(t3);
                          (updateAccountRow(e3, n4), u2());
                        },
                      },
                    );
                  },
                }),
            },
          });
        },
      },
    ].map((e4) => {
      if (typeof e4.command == 'function') {
        let t3 = e4.command;
        e4.command = async () => (c2(e4.name), await t3());
      }
      return e4;
    });
  }
  return { getAccountModel: p2 };
}
var osIcons = {
  windows: 'platforms/rx_os_windows',
  linux: 'platforms/rx_os_linux',
  macos: 'platforms/rx_os_macOS',
  ios: 'platforms/rx_os_iOS',
  android: 'platforms/rx_os_android',
};
var proxyResultColors = {
  [proxyResult.success]: 'var(--colors-text-text-success)',
  [proxyResult.failure]: 'var(--colors-text-text-error)',
};
function useProfileStatus(t2, n2, r2) {
  let a2 = computed(() => unref(t2).proxyCategory !== 'noproxy'),
    o2 = computed(() => {
      let e2 = unref(t2);
      return unref(n2)?.[e2.dirId]?.data?.percent === 100;
    });
  function s2(e2, t3) {
    return ['macos', 'ios'].includes(e2?.toLocaleLowerCase())
      ? t3?.split('.')[0]
      : t3;
  }
  function c2(e2) {
    return typeof e2 == 'string' ? e2.trim() : '';
  }
  function u2(t3) {
    let n3 = t3.beforeProxyInfo,
      r3 = c2(t3.lastIp),
      o3 = c2(t3.lastCountry),
      s3 = c2(n3?.beforeCountry),
      l2 = c2(n3?.beforeIp),
      u3 = a2.value && !r3 && !o3 && (!!s3 || !!l2),
      d2 = u3 ? s3 || '--' : t3.lastCountry || '--',
      f2 = u3 ? n3?.beforeCity : t3.lastCity,
      p2 = (u3 ? n3?.beforeIp : t3.lastIp) || '--',
      m2 = u3 ? n3?.beforeTime : t3.checkTime;
    return {
      tooltip: {
        hasProxy: a2.value,
        lastCountry: d2,
        lastCity: joinText('/', f2) || '',
        lastIp: p2,
        checkTime: m2 ? formatDate(m2) : '--',
        beforeCountry: u3 ? '--' : n3?.beforeCountry || '--',
        beforeCity: u3 ? '' : joinText('/', n3?.beforeCity) || '',
        beforeIp: u3 ? '--' : n3?.beforeIp || '--',
        beforeTime: !u3 && n3?.beforeTime ? formatDate(n3.beforeTime) : '--',
      },
      showTooltip: a2.value ? p2 !== '--' || (!!d2 && d2 !== '--') : !!r3,
    };
  }
  return {
    hasProxy: a2,
    isOpenBrowser: o2,
    list: computed(() => {
      let e2 = unref(t2),
        n3 = unref(r2),
        i2 = a2.value ? '' : e2.lastIp ? 'direct-info' : 'direct',
        o3 = e2.windowPlatformList || [],
        c3 = u2(e2);
      return [
        {
          key: 'os',
          svg: osIcons[e2.os?.toLocaleLowerCase()],
          tooltip: $t(
            `系统: {os} {osVersion}
内核: {coreType} {coreVersion}`,
            {
              os: e2.os === 'IOS' ? 'iOS' : e2.os,
              osVersion: s2(e2.os, e2.osVersion),
              coreVersion: e2.coreVersion,
              coreType: e2.coreType || engine.Chrome,
            },
          ),
        },
        {
          key: 'proxy',
          classes: i2,
          svg: a2.value
            ? `country-code/${e2.lastCountry}`
            : e2.lastIp
              ? 'base/rx_ic_route2'
              : 'base/rx_ic_plus',
          svgColor: 'var(--colors-icon-icon-tertiary)',
          data: c3.tooltip,
          showTooltip: c3.showTooltip,
          checkedColor:
            e2._checkRes && proxyResultColors[e2._checkRes.checkStatus],
        },
        {
          key: 'account',
          svg: o3[0] ? 'base/rx_ic_user_key' : 'base/rx_ic_plus',
          svgColor: o3[0]
            ? 'var(--colors-icon-icon-tertiary)'
            : 'var(--colors-icon-icon-secondary)',
          showSub: o3.length > 1,
          platformAccount: o3[0],
          subPlatformAccount: o3.length > 2 ? undefined : o3[1],
          data: o3,
        },
      ].filter((e3) => n3.includes(e3.key));
    }),
  };
}

function useProfileProxyOperations(e2) {
  let {
      data: n2,
      workspaceName: r2,
      drawerInstance: i2,
      emit: o2,
      onlyErrorToast: s2,
    } = e2,
    { showProxyFormDrawer: c2 } = useProxyForm(i2);
  async function l2(e3, n3) {
    let {
        isRefresh: r3,
        fallback: i3,
        success: c3,
      } = { isRefresh: false, success: () => {}, fallback: () => {}, ...n3 },
      { code: l3, msg: u3 } =
        await api.window.userMdfWindowInfoSingleV2Create(e3);
    return (
      s2(l3, u3),
      l3 === 0
        ? (isFunction(c3) && c3(), r3 && o2('refresh'), true)
        : (isFunction(i3) && i3(), false)
    );
  }
  function u2(e3) {
    let {
        id: t2,
        proxyCategory: r3,
        protocol: i3,
        proxyType: a2,
        isDirect: o3,
        _checkRes: s3,
        ...c3
      } = e3,
      u3 = unref(n2),
      { id: d3, dirId: f3 } = u3;
    return l2(
      {
        id: d3,
        dirId: f3,
        moduleId: t2,
        proxyMethod: 'choose',
        requestType: requestType.SelectProxy,
      },
      {
        success: () => {
          (Reflect.deleteProperty(u3, '_checkRes'),
            s3 && Reflect.set(u3, '_checkRes', toRaw(s3)),
            updateProxyRow(u3, {
              ...c3,
              moduleId: t2,
              isDirect: o3,
              protocol: i3,
              proxyCategory: r3 || i3,
              proxyMethod: 'choose',
              buyProxyType: a2 ?? proxyType.resource,
            }));
        },
      },
    );
  }
  function d2(e3) {
    let t2 = unref(n2),
      { id: r3, dirId: i3 } = t2,
      a2 = {
        ...e3,
        id: r3,
        dirId: i3,
        moduleId: 0,
        proxyMethod: 'custom',
        requestType: requestType.AddProxy,
      };
    return l2(a2, {
      success: () => {
        (Reflect.deleteProperty(t2, '_checkRes'), updateProxyRow(t2, a2));
      },
    });
  }
  async function f2(e3) {
    let t2 = unref(n2),
      i3 = unref(r2);
    await c2({
      title: $t('为[{workspaceName}-{uid}]编辑代理 IP', {
        workspaceName: i3,
        uid: t2.windowSortNum,
      }),
      data: e3,
      mode: 'proxy',
      onConfirm: async (e4) => {
        let { id: n3, dirId: r3 } = t2,
          i4 = {
            ...e4,
            id: n3,
            dirId: r3,
            moduleId: 0,
            proxyMethod: 'custom',
            requestType: requestType.EditProxy,
          };
        if (
          !(await l2(i4, {
            success: () => {
              (Reflect.deleteProperty(t2, '_checkRes'), updateProxyRow(t2, i4));
            },
          }))
        )
          return false;
      },
    });
  }
  async function p2(e3) {
    let t2 = unref(n2),
      a2 = unref(r2);
    await i2.showDrawer({
      title: $t('为[{workspaceName}-{uid}]选择代理 IP', {
        workspaceName: a2,
        uid: t2.windowSortNum,
      }),
      closeOnEscape: false,
      pt: {
        root: {
          class: 'overflow-hidden rounded-2 border-0.5 max-w-full',
          style: { width: 'min(860px, calc(100vw - 24px))' },
        },
      },
      slots: {
        container: () =>
          h(ProfileProxyPicker, {
            windows: [t2],
            workspaceName: a2,
            data: e3,
            onConfirm: async (e4) => {
              (await u2(e4)) && i2.hideDrawer();
            },
          }),
      },
    });
  }
  return {
    updateProfile: l2,
    setChooseProxy: u2,
    addCustomProxy: d2,
    editProxy: f2,
    openProxyDrawer: p2,
  };
}
function useProxyMenu(e2) {
  let {
      data: t2,
      hasProxy: n2,
      buildProxyData: r2,
      confirmDeleteProxy: i2,
      check: a2,
      showToast: o2,
      openAddProxy: s2,
      editProxy: c2,
      openProxyDrawer: l2,
      saveLocalTrack: d2,
    } = e2,
    { runProxySpeedTestForRows: m2 } = useProxySpeedTest();
  function h2() {
    let e3 = unref(t2),
      h3 = r2(e3);
    return [
      {
        name: 'addProxy',
        label: $t('添加代理 IP'),
        icon: 'base/rx_ic_plus',
        visible: !n2.value && a2('Profiles_add_proxy_outside'),
        command: async () => {
          await s2();
        },
      },
      {
        name: 'chooseProxy',
        label: $t('选择已有代理 IP'),
        icon: 'base/rx_ic_exchange',
        visible: !n2.value && a2('Profiles_select_proxy'),
        command: async () => {
          await l2(h3);
        },
      },
      {
        name: 'checkProxy',
        label: $t('测试代理 IP'),
        icon: 'base/rx_ic_speed_test',
        visible: n2.value && a2('Profiles_speed_test_proxy'),
        command: async () => {
          await m2([e3]);
        },
      },
      {
        name: 'refreshProxy',
        label: $t('刷新代理 IP'),
        icon: 'base/rx_ic_refresh',
        visible: n2.value && a2('Profiles_refresh_url'),
        disabled: !e3.refreshUrl,
        command: async () => {
          let t3 = await globalThis.electronAPI.send(
            'proxy:refreshUrl',
            e3.refreshUrl,
          );
          o2(t3 ? 0 : -1, e3.refreshUrl);
        },
      },
      {
        visible: n2.value && a2('Profiles_edit_proxy_outside'),
        separator: true,
      },
      {
        name: 'editProxy',
        label: $t('编辑代理 IP'),
        icon: 'base/rx_ic_edit',
        visible:
          e3.buyProxyType === proxyType.resource &&
          n2.value &&
          a2('Profiles_edit_proxy_outside'),
        command: async () => {
          e3.isEncryptProxy
            ? o2(
                -1,
                $t(
                  '该代理 IP 已加密无法编辑，如需更换，请先删除此代理 IP 或选择其他代理 IP',
                ),
              )
            : await c2(h3);
        },
      },
      {
        name: 'chooseProxy',
        label: $t('选择已有代理 IP'),
        icon: 'base/rx_ic_exchange',
        visible: n2.value && a2('Profiles_select_proxy'),
        command: async () => {
          await l2(h3);
        },
      },
      {
        visible: n2.value && a2('Profiles_delete_proxy_outside'),
        separator: true,
      },
      {
        name: 'deleteProxy',
        label: $t('删除代理 IP'),
        icon: 'base/rx_ic_bin_1',
        visible: n2.value && a2('Profiles_delete_proxy_outside'),
        command: () => {
          i2(e3);
        },
      },
    ].map((e4) => {
      if (typeof e4.command == 'function') {
        let t3 = e4.command;
        e4.command = async () => (d2(e4.name), await t3());
      }
      return e4;
    });
  }
  return { getProxyModel: h2 };
}

export {
  useProfileProxyOperations,
  useProfileProxyOperations as n,
  useAccountMenu,
  useProxyMenu,
  useProfileStatus,
};
export { default as r } from './workbench-profile-proxy-picker.js';
export { default as t } from './workbench-profile-info.js';
