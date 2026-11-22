import {
  restoreFingerprintDraft,
  refreshFingerprintDraft,
  invalidateFingerprintDraft,
} from './workbench-fingerprint-draft.js';
import {
  Dr as parseJson,
  En as isOsBlockedForKernel,
  a as findField,
  br as detectDesktopOs,
  c as equalsOrDefault,
  d as applyFields,
  en as uaMode,
  f as setFieldVisibility,
  h as api,
  i as findFields,
  l as setFieldProperty,
  ln as loadOsRestrictions,
  m as loadProfileSettings,
  mt as useWorkspaceState,
  qt as browserEngine,
  o as readFields,
  ti as supportsFirefox,
  tn as workspaceType,
  v as useUser,
  xr as isEmpty,
} from './utils-BIWenCnY.js';
import { reactive } from './workbench-vue.js';
import {
  o as formatCookies,
  r as parseCookies,
  s as validateCookies,
} from './cookie-CqdL0VrU.js';
import { ut as numberSchema } from './types-Cxql15JH.js';
import { t as getProxyLabels } from './proxy-shop-labels-nJaBS4W_.js';
import { t as getProfileLabels } from './useProfileEntityLabels-BfqbVpel.js';
import { t as readAccountProxyDraft } from './account-2bDq0W_G.js';
import {
  readProxyProperties,
  serializeProxyRows,
  toProxyFields,
} from './workbench-profile-proxy-inputs.js';

const user = useUser();
const latestKernel = '__useLatestCore__';
const previewFieldNames = [
  'os', 'osVersion', 'coreType', 'coreVersion', 'userAgent', 'fontType',
  'canvas', 'webGL', 'webGLInfo', 'webGLManufacturer', 'webGLRender', 'audioContext', 'speechVoices', 'clientRects',
  'macInfo', 'macAddr', 'hardwareConcurrent', 'deviceMemory', 'deviceName',
];

function readPreviewInputs(fields) {
  return readFields(findFields(fields, previewFieldNames), {}, { validate: false });
}

function getPlatformUrls(fields) {
  return (findField(fields, 'windowPlatformList')?.value ?? [])
    .map(account => account.platformUrl)
    .filter(Boolean);
}

async function requestFingerprintPreview(payload) {
  const result = await api.window.userGetUaWebglV2List(payload);
  if (result.code !== 0) throw Error(result.msg);
  return result.data;
}

async function refreshUserAgent(fields, { uaOnly = false } = {}) {
  const results = await refreshFingerprintDraft(fields, {
    read: readPreviewInputs,
    apply: uaOnly ? (groups, { userAgent }) => applyFields(groups, { userAgent }) : applyFields,
    find: findField,
    keepSeed: uaOnly,
    request: requestFingerprintPreview,
  });
  return results.length > 0;
}

async function refreshDeviceName(fields) {
  const { os } = readPreviewInputs(fields);
  const { code, data } = await api.window.userGetDeviceNameV2List({ os, count: 1 });
  if (code === 0 && os === readPreviewInputs(fields).os)
    applyFields(fields, { deviceName: data[0]?.deviceName });
}

async function fetchBrowserVersions(query) {
  const { data } = await api.window.userGetBrowserVersionInfoList(query);
  return data.map(({ browserVersion }) => ({
    label: `Chrome ${browserVersion}`,
    value: browserVersion,
  }));
}

function refreshProfileFingerprint(fields, { count = 1, preview = true, preserve } = {}) {
  return refreshFingerprintDraft(fields, {
    read: readPreviewInputs,
    apply: applyFields,
    find: findField,
    count,
    preview,
    preserve,
    request: payload => globalThis.electronAPI.send('util:genRandomFingerprint', payload, payload.count),
  });
}

function getResolutionOptions(os, settings) {
  const isMobile = isMobileSystem(os);
  const options = isMobile ? settings.mobileResolution : settings.resolution;
  return {
    isMobile,
    options,
    defaultValue: isMobile ? options[0] : options.find(option => option.value === '1280 x 720'),
  };
}

function isMobileSystem(os) {
  return ['ios', 'android'].includes(os?.toLowerCase());
}

function showMobileProfileFields(os, engine) {
  return isMobileSystem(os) && !isFirefox(engine);
}

function selectSavedResolution(options, width, height, fallback) {
  const w = Number(width), h = Number(height);
  if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0)
    return { options, value: fallback };
  const dimensions = `${w} x ${h}`;
  const existing = options.find(option => option.value === dimensions);
  if (existing) return { options, value: existing };
  const value = { label: dimensions, value: dimensions };
  return { options: [...options, value], value };
}

function hardwareOptions(options, savedValue) {
  const values = options.map(option => option.value === '0' ? { ...option, label: $t('跟随系统') } : option);
  const value = String(savedValue ?? '');
  // Preserve 6 GB when editing older profiles that already use this value.
  if (value === '6' && !values.some(option => option.value === value)) values.push({ label: value, value });
  return values;
}

function majorVersion(version) {
  return version.split('.')[0];
}

function isFirefox(engine) {
  return engine === browserEngine.Firefox;
}

function getOsVersions(engine, os, options) {
  if (!isFirefox(engine) || os?.toLocaleLowerCase() !== 'macos') return options;
  return options.filter(option => option.value?.toLocaleLowerCase() === 'all');
}

function updateOsVersions(field, engine, os, options) {
  field.options = getOsVersions(engine, os, options);
  if (field.options.length && !field.options.some(option => option.value === field.value?.value)) {
    field.value = field.options[0];
  }
}

function getSelectedEngine(fields) {
  return findField(fields, 'coreType')?.value?.value ?? browserEngine.Chrome;
}

function normalizeEngine(engine) {
  return isFirefox(engine) ? browserEngine.Firefox : browserEngine.Chrome;
}

function isLatestKernel(option) {
  return option?.value === latestKernel;
}

function includeLatestKernel(options, tooltip) {
  if (options.some(isLatestKernel)) return options;
  const sorted = tooltip && options[0] ? [{ ...options[0], tooltip }, ...options.slice(1)] : options;
  return [{ label: $t('保持最新'), value: latestKernel, ...(tooltip ? { tooltip } : {}) }, ...sorted];
}

function latestConcreteKernel(options) {
  return options.find(option => !isLatestKernel(option))?.value ?? '';
}

function defaultKernelOption(options) {
  return options.find(option => !isLatestKernel(option)) ?? options[0];
}

function readKernelSelection(field) {
  const useLatestCore = isLatestKernel(field.value);
  return { useLatestCore, coreVersion: useLatestCore ? latestConcreteKernel(field.options) : field.value?.value };
}

function savedKernelOption(options, profile) {
  const saved = profile.useLatestCore === true
    ? options.find(isLatestKernel)
    : profile.coreVersion && options.find(option => option.value === profile.coreVersion);
  return saved || defaultKernelOption(options);
}

async function initializeProfileInputs(profile = {}, notify = () => {}, gate) {
  let run = gate?.run ?? ((e2) => e2()),
    isECommerceWorkspace =
      useWorkspaceState().currentWorkspace?.workspaceType ===
      workspaceType.ECommerce,
    labels = getProfileLabels(isECommerceWorkspace),
    proxyLabels = getProxyLabels(isECommerceWorkspace),
    [settings, userConfig, searchResponse, kernels] = await run(() =>
      Promise.all([
        loadProfileSettings(),
        user.getUserConfig(),
        api.platform.userGetSearchEnginesList(),
        globalThis.electronAPI.send('app:getCoreList'),
      ]),
    ),
    { osVersion: osVersionRules, 'R-OS': osRules } = await run(() =>
      loadOsRestrictions(),
    ),
    installedChrome = kernels
      .filter((e2) => normalizeEngine(e2.coreType) === browserEngine.Chrome)
      .map((e2) => e2.coreVersion),
    installedFirefox = kernels
      .filter((e2) => normalizeEngine(e2.coreType) === browserEngine.Firefox)
      .map((e2) => e2.coreVersion),
    osIcons = {
      windows: 'platforms/rx_os_windows',
      linux: 'platforms/rx_os_linux',
      macos: 'platforms/rx_os_macOS',
      android: 'platforms/rx_os_android',
      ios: 'platforms/rx_os_iOS',
    },
    kernelOptionsFor = (e2, n2, r2) => {
      if (isFirefox(e2))
        return includeLatestKernel(
          (settings.firefoxCoreVersion ?? []).filter((e3) =>
            installedFirefox.includes(e3.value),
          ),
        );
      let i2 = settings.coreVersion.filter((e3) =>
          installedChrome.includes(e3.value),
        ),
        a3 =
          n2?.toLocaleLowerCase() === 'windows' &&
          ['7', '8'].includes(r2?.at(0) ?? '')
            ? i2.filter((e3) => e3.value === '109')
            : i2,
        o2 = settings.coreVersion?.[0]?.value,
        s2 = o2
          ? $t('当前支持 Chrome {version} 内核。', { version: o2 })
          : undefined,
        c2 = a3.filter(
          (n3) => !isOsBlockedForKernel(osRules, osVersionRules, e2, n3.value),
        );
      // A template can defer kernel selection even on a clean installation.
      return includeLatestKernel(c2, s2);
    },
    osOptions = settings.os.map(({ label: e2, ...t2 }) => {
      let n2 = settings[`osversion_${e2.toLocaleLowerCase()}`].map((n3) => ({
        ...n3,
        label: `${e2} ${n3.label}`,
        _osValue: t2.value,
      }));
      return (
        (e2.toLocaleLowerCase() === 'macos' ||
          e2.toLocaleLowerCase() === 'ios') &&
          (n2 = n2.filter((e3) => !e3.value?.includes('.'))),
        {
          ...t2,
          label: e2,
          tooltip: e2,
          icon: osIcons[e2.toLocaleLowerCase()],
          _versionOptions: n2,
        }
      );
    });
  const desktopOs = detectDesktopOs().toLocaleLowerCase();
  const osName = String(profile.os || desktopOs).toLocaleLowerCase();
  const selectedOs = osOptions.find(option => option.value.toLocaleLowerCase() === osName)
    ?? osOptions.find(option => option.value.toLocaleLowerCase() === desktopOs)
    ?? osOptions[0];

  let savedOsVersion = ['macos', 'ios'].includes(profile.os?.toLocaleLowerCase())
      ? majorVersion(profile.osVersion || '')
      : profile.osVersion,
    selectedEngine = profile.coreType ?? browserEngine.Chrome,
    versionOptions = getOsVersions(
      selectedEngine,
      selectedOs?.value,
      selectedOs?._versionOptions ?? [],
    ),
    selectedOsVersion =
      versionOptions.find((e2) => e2.value === savedOsVersion) ??
      versionOptions[0],
    firefoxSupported = supportsFirefox(),
    engineOptions = [
      {
        label: browserEngine.Chrome,
        value: browserEngine.Chrome,
        icon: 'base/rx_ic_chrome',
      },
      {
        label: browserEngine.Firefox,
        value: browserEngine.Firefox,
        icon: 'base/rx_ic_firefox',
      },
    ],
    kernelOptions = kernelOptionsFor(
      selectedEngine,
      selectedOs?.value,
      selectedOsVersion?.value,
    ),
    searchEngines =
      searchResponse.code === 0
        ? (searchResponse.data || []).map((e2) => ({
            label: e2.code,
            value: e2.code,
            image: e2.icon,
          }))
        : [],
    searchEngine = profile.searchEngine ?? userConfig?.searchEngine,
    browserVersions =
      userConfig?.uaModeSwitch === uaMode.close &&
      selectedOs &&
      selectedOsVersion &&
      !isFirefox(selectedEngine)
        ? await run(() =>
            fetchBrowserVersions({
              os: selectedOs.value,
              osVersion: selectedOsVersion.value,
            }),
          )
        : [],
    savedBrowserVersions =
      profile.browserVersion?.split(',').filter(Boolean) ??
      browserVersions.map((e2) => e2.value),
    privateProxyKeys = ['isEncryptProxy', 'proxyEncryptInfo'],
    proxy = readProxyProperties(profile),
    proxyRows = toProxyFields(profile),
    {
      isMobile,
      options: availableResolutions,
      defaultValue: defaultResolution,
    } = getResolutionOptions(selectedOs?.value, settings),
    { options: resolutions, value: selectedResolution } = selectSavedResolution(
      availableResolutions, profile.resolutionX, profile.resolutionY, defaultResolution,
    ),
    coreOptions = hardwareOptions(settings.hardwareConcurrent),
    memoryOptions = hardwareOptions(settings.deviceMemory, profile.deviceMemory),
    isMobileOs = showMobileProfileFields(selectedOs?.value, selectedEngine),
    fieldGroups = [],
    firefox = isFirefox(selectedEngine),
    saved = reactive({
      ...defaultProfileSettings(),
      searchEngine,
      ...Object.fromEntries(
        Object.entries(profile).filter(
          ([e2]) => !privateProxyKeys.includes(e2) && e2 !== 'proxyInfoList',
        ),
      ),
      ...proxy,
    }),
    fingerprintFields = [],
    mainFields = reactive([
      {
        type: 'text',
        label: labels.entityName,
        name: 'windowName',
        value: profile.windowName ?? '',
        dirId: profile.dirId ?? '',
        placeholder: labels.unnamedEntityPlaceholder,
        formatValue: (e2, t2, n2) => (
          Object.assign(n2, { windowNamePrefix: e2.value }),
          e2.value
        ),
        slot: 'name',
      },
      {
        label: $t('系统'),
        items: [
          {
            type: 'select',
            name: 'os',
            value: selectedOs,
            options: osOptions,
            filter: false,
            style: { width: '66px', flex: 'none' },
            overlayStyle: { width: '120px' },
            class: 'items-center',
            change: async (e2) => {
              if (e2.value) {
                updatePlatformOptions();
                let t2 = findField(mainFields, 'osVersion'),
                  r2 = getSelectedEngine(mainFields),
                  i2 = getOsVersions(
                    r2,
                    e2.value.value,
                    e2.value._versionOptions,
                  );
                ((t2.options = i2), (t2.value = i2[0]), t2.change?.(t2));
                let {
                    isMobile: a3,
                    options: o2,
                    defaultValue: s2,
                  } = getResolutionOptions(e2.value.value, settings),
                  [c2, u2] = findFields(fingerprintFields, [
                    'resolution',
                    'deviceName',
                  ]);
                (c2._isMobile !== a3 &&
                  ((c2._isMobile = a3), (c2.value = s2), (c2.options = o2)),
                  u2?.iconClick());
                updateMobileFields(fingerprintFields, showMobileProfileFields(e2.value.value, r2));
              }
            },
            preview: { label: $t('操作系统') },
            required: true,
          },
          {
            type: 'select',
            name: 'osVersion',
            value: selectedOsVersion,
            options: versionOptions,
            filter: false,
            change: async (e2) => {
              let t2 = findField(mainFields, 'coreVersion');
              if (e2.value) {
                let { _osValue: r2, value: i2 } = e2.value,
                  a3 = getSelectedEngine(mainFields),
                  s2 = kernelOptionsFor(a3, r2, i2);
                if (
                  ((t2.options = s2),
                  !s2.find((e3) => e3.value === t2.value?.value) &&
                    s2.length &&
                    (t2.value = defaultKernelOption(s2)),
                  !isFirefox(a3) && userConfig?.uaModeSwitch === uaMode.close)
                ) {
                  let e3 = await run(() =>
                      fetchBrowserVersions({ os: r2, osVersion: i2 }),
                    ),
                    t3 = findField(mainFields, 'browserVersion');
                  ((t3.options = e3), (t3.value = e3.map((e4) => e4.value)));
                }
              }
              t2.change?.(t2);
            },
            required: true,
          },
        ],
        slot: 'system',
      },
      {
        label: $t('内核'),
        items: [
          {
            type: 'select',
            name: 'coreType',
            value:
              engineOptions.find((e2) => e2.value === profile.coreType) ??
              engineOptions[0],
            options: engineOptions,
            icon: firefox ? 'base/rx_ic_firefox' : 'base/rx_ic_chrome',
            filter: false,
            iconColor: 'var(--primary-color, #12a3fc)',
            style: { width: '66px', flex: 'none' },
            overlayStyle: { width: '120px' },
            disabled: !!profile.id,
            class: 'items-center',
            change: async (e2) => {
              if (e2.value) {
                updatePlatformOptions();
                let t2 = e2.value.value,
                  [n2, r2, i2] = findFields(mainFields, [
                    'os',
                    'osVersion',
                    'coreVersion',
                  ]),
                  a3 =
                    r2?.value?._osValue ??
                    n2?.value?.value ??
                    selectedOs?.value;
                updateOsVersions(
                  r2,
                  t2,
                  a3,
                  n2?.value?._versionOptions ??
                    selectedOs?._versionOptions ??
                    [],
                );
                let o2 = r2?.value?.value ?? selectedOsVersion?.value,
                  s2 = kernelOptionsFor(t2, a3, o2);
                i2.options = s2;
                i2.value = defaultKernelOption(s2) ?? null;
                updateMobileFields(fingerprintFields, showMobileProfileFields(a3, t2));
                await run(() => updateEngineFields(t2, a3, o2));
                if (getSelectedEngine(mainFields) !== t2) return;
                let [u2, d2] = findFields(fingerprintFields, [
                  'webGL',
                  'canvas',
                ]);
                (u2.change?.(u2), d2?.change?.(d2), i2.change?.(i2));
              }
            },
            preview: { label: $t('内核类型') },
            required: true,
          },
          {
            type: 'select',
            name: 'coreVersion',
            value: savedKernelOption(kernelOptions, profile),
            options: kernelOptions,
            required: true,
            filter: false,
            formatValue: (e2, t2, n2) => {
              let { useLatestCore: r2, coreVersion: i2 } =
                readKernelSelection(e2);
              return (Reflect.set(n2, 'useLatestCore', r2), i2);
            },
            change: async (e2) => {
              if (e2.value && latestConcreteKernel(e2.options))
                await run(() => refreshUserAgent(fieldGroups));
              if (profile.dirId) {
                let { coreVersion: t2 } = readKernelSelection(e2);
                e2.help =
                  profile.coreVersion === t2
                    ? ''
                    : $t(
                        '修改内核可能导致缓存不兼容，从而使账号登录信息失效，请谨慎操作。',
                      );
              }
            },
          },
        ],
        slot: 'kernel',
      },
      {
        type: 'multiSelect',
        label: $t('浏览器版本'),
        placeholder: $t('无指定版本，默认使用严格模式'),
        name: 'browserVersion',
        value: savedBrowserVersions,
        _oldValue: savedBrowserVersions,
        options: browserVersions,
        maxSelectedLabels: 4,
        selectedItemsLabel: $t('已选择了 {count} 个浏览器版本', {
          count: '{()}',
        }),
        visible:
          !firefox &&
          equalsOrDefault(userConfig?.uaModeSwitch, uaMode.close, false),
        formatValue: (e2) => e2.value.join(','),
        onHide: () => {
          let e2 = findField(mainFields, 'browserVersion');
          e2.value.slice().sort().join(',') !==
            e2._oldValue.slice().sort().join(',') &&
            ((e2._oldValue = e2.value.slice()),
            run(() => refreshUserAgent(fieldGroups)));
        },
      },
      {
        type: 'textarea',
        label: $t('User-Agent'),
        name: 'userAgent',
        value: profile.userAgent,
        _custom_ua: profile._custom_ua === true,
        rows: 3,
        iconClick: async () => {
          (await run(() => refreshUserAgent(fieldGroups, { uaOnly: true }))) &&
            notify(0, $t('UA刷新成功'));
        },
        change: (e2) => {
          (Reflect.set(e2, '_custom_ua', true),
            invalidateFingerprintDraft(fieldGroups));
        },
        formatValue: (e2, t2, n2) => (
          Reflect.set(n2, '_custom_ua', e2._custom_ua),
          e2.value?.trim()
        ),
        slot: 'userAgent',
        preview: { label: 'User Agent' },
        randomHelp: 'Firefox 使用内核标准 UA；一键随机指纹可更新其他参数',
      },
      {
        type: 'textarea',
        label: 'Cookies',
        placeholder: $t(`选填
支持格式: JSON、Netscape、Name=Value
Name=Value 未写 domain 时，将按行从平台账号的网址自动填充`),
        name: 'cookie',
        value: isEmpty(profile?.cookie) ? '' : formatCookies(profile.cookie),
        validator(e2) {
          let t2 = validateCookies(e2.value?.trim() ?? '', {
            platformUrls: getPlatformUrls(mainFields),
          });
          return t2.valid
            ? ((e2.errorMsg = undefined), true)
            : ((e2.errorMsg = t2.message), false);
        },
        formatValue: (e2, t2) =>
          parseCookies(e2.value?.trim() ?? '', {
            platformUrls: getPlatformUrls(t2),
          }) ?? [],
        slot: 'cookies',
      },
      {
        label: $t('启动网页'),
        name: 'defaultOpenUrl',
        value: profile.defaultOpenUrl ?? [],
        tooltip: $t(
          '打开窗口时，将自动加载所填写的网址。支持多个网址分别在独立标签页中显示。',
        ),
        slot: 'urls',
      },
      { separator: true },
      {
        label: proxyLabels.entity,
        name: 'proxyInfoList',
        value: proxyRows,
        formatValue: (e2, t2, n2) => serializeProxyRows(e2, n2),
        slot: 'proxy',
      },
      {
        label: $t('平台账号'),
        name: 'windowPlatformList',
        value: profile.windowPlatformList ?? [],
        platformBindType: readAccountProxyDraft.Order,
        formatValue: (e2, t2, n2) => {
          let r2 = e2.value.map((e3) => e3.id).filter(Boolean);
          return (
            Object.assign(n2, {
              platformUrlIds: r2,
              platformBindType: e2.platformBindType,
            }),
            e2.value.filter((e3) => !e3.id)
          );
        },
        slot: 'accounts',
      },
    ]),
    basicFields = reactive([
      {
        type: 'selectButton',
        label: $t('语言'),
        name: 'isDisplayLanguageBaseIp',
        value: profile.isDisplayLanguageBaseIp ?? true,
        options: [
          { label: $t('基于 IP 匹配'), value: true },
          { label: $t('自定义'), value: false },
        ],
        tooltip: $t(
          '打开网站页面优先展示的语言，默认使用 IP 所在地区的语言，也可自定义选择',
        ),
        change(e2) {
          setFieldVisibility(
            basicFields,
            'displayLanguage',
            e2.value === false,
          );
        },
        preview: { label: $t('语言') },
      },
      {
        type: 'select',
        label: ' ',
        name: 'displayLanguage',
        value:
          settings.language.find(
            (e2) => e2.value === profile.displayLanguage,
          ) ?? settings.language[0],
        options: settings.language,
        virtualScrollerOptions: { itemSize: 38 },
        visible: equalsOrDefault(profile.isDisplayLanguageBaseIp, false, false),
      },
      {
        type: 'selectButton',
        label: $t('界面语言'),
        name: 'isLanguageBaseIp',
        value: profile.isLanguageBaseIp ?? true,
        options: [
          { label: $t('基于 IP 匹配'), value: true },
          { label: $t('自定义'), value: false },
        ],
        tooltip: $t(
          'Google 界面框架的语言，默认使用 IP 所在地区的语言，也可自定义选择',
        ),
        change(e2) {
          setFieldVisibility(basicFields, 'language', e2.value === false);
        },
      },
      {
        type: 'select',
        label: ' ',
        name: 'language',
        value:
          settings.language.find((e2) => e2.value === profile.language) ??
          settings.language[0],
        options: settings.language,
        virtualScrollerOptions: { itemSize: 38 },
        visible: equalsOrDefault(profile.isLanguageBaseIp, false, false),
      },
      {
        type: 'selectButton',
        label: $t('时区'),
        name: 'isTimeZone',
        value: profile.isTimeZone ?? true,
        options: [
          { label: $t('基于 IP 匹配'), value: true },
          { label: $t('自定义'), value: false },
        ],
        change(e2) {
          setFieldVisibility(basicFields, 'timeZone', e2.value === false);
        },
        preview: { label: $t('时区') },
      },
      {
        type: 'select',
        label: ' ',
        name: 'timeZone',
        value:
          settings.timeZone.find((e2) => e2.value === profile.timeZone) ??
          settings.timeZone[0],
        options: settings.timeZone,
        virtualScrollerOptions: { itemSize: 38 },
        visible: equalsOrDefault(profile.isTimeZone, false, false),
      },
      {
        type: 'selectButton',
        label: $t('地理位置提示'),
        name: 'position',
        value: profile.position ?? 1,
        options: [
          { label: $t('询问'), value: 0 },
          { label: $t('允许'), value: 1 },
          { label: $t('禁止'), value: 2 },
        ],
        change(e2) {
          let t2 = findField(basicFields, 'isPositionBaseIp');
          t2 && ((t2.visible = e2.value !== 2), t2.change(t2));
        },
        preview: { label: $t('地理位置提示') },
      },
      {
        type: 'selectButton',
        label: $t('地理位置'),
        name: 'isPositionBaseIp',
        value: profile.isPositionBaseIp ?? true,
        options: [
          { label: $t('基于 IP 匹配'), value: true },
          { label: $t('自定义'), value: false },
        ],
        visible: !equalsOrDefault(profile.position, 2, false),
        change(e2) {
          findFields(basicFields, [
            'longitude',
            'latitude',
            'precisionPos',
          ]).forEach((t2) => {
            ((t2.visible = e2.visible && e2.value === false),
              t2.required &&
                (t2.value == null || t2.value === '') &&
                ((t2.invalid = true),
                (t2.errorMsg = $t('"{name}" 是必填项', { name: t2.label }))));
          });
        },
        preview: { label: $t('地理位置') },
      },
      {
        type: 'text',
        label: $t('经度'),
        placeholder: $t('请填写经度，示例: -40.123'),
        name: 'longitude',
        value: profile.longitude,
        required: true,
        visible: equalsOrDefault(profile.isPositionBaseIp, false, false),
        onBlur(e2) {
          let t2 = e2.target.value;
          (numberSchema().safeParse(Number(t2)).success && t2 !== ''
            ? (t2 > 180 && (t2 = 180), t2 < -180 && (t2 = -180))
            : ((t2 = ''),
              setFieldProperty(basicFields, 'longitude', 'invalid', true)),
            setFieldProperty(basicFields, 'longitude', 'value', t2));
        },
      },
      {
        type: 'text',
        label: $t('纬度'),
        placeholder: $t('请填写纬度，示例: 30.123'),
        name: 'latitude',
        value: profile.latitude,
        required: true,
        visible: equalsOrDefault(profile.isPositionBaseIp, false, false),
        onBlur(e2) {
          let t2 = e2.target.value;
          (numberSchema().safeParse(Number(t2)).success && t2 !== ''
            ? (t2 > 90 && (t2 = 90), t2 < -90 && (t2 = -90))
            : ((t2 = ''),
              setFieldProperty(basicFields, 'latitude', 'invalid', true)),
            setFieldProperty(basicFields, 'latitude', 'value', t2));
        },
      },
      {
        type: 'text',
        label: $t('精度（米）'),
        placeholder: $t('请填写精度（米），范围: 10-5000'),
        name: 'precisionPos',
        value: profile.precisionPos || '1000',
        visible: equalsOrDefault(profile.isPositionBaseIp, false, false),
        onBlur(e2) {
          let t2 = e2.target.value;
          (numberSchema().safeParse(Number(t2)).success && t2 !== ''
            ? (t2 < 10 && (t2 = 10), t2 > 5e3 && (t2 = 5e3))
            : (t2 = ''),
            setFieldProperty(basicFields, 'precisionPos', 'value', t2));
        },
      },
      {
        type: 'selectButton',
        label: $t('声音'),
        name: 'forbidAudio',
        value: profile.forbidAudio ?? true,
        options: [
          { label: $t('开启'), value: true },
          { label: $t('关闭'), value: false },
        ],
      },
      {
        type: 'selectButton',
        label: $t('图片'),
        name: 'forbidImage',
        value: profile.forbidImage ?? true,
        options: [
          { label: $t('开启'), value: true },
          { label: $t('关闭'), value: false },
        ],
        change(e2) {
          setFieldVisibility(
            basicFields,
            'forbiddenPictureSize',
            e2.value === false,
          );
        },
      },
      {
        label: ' ',
        name: 'forbiddenPictureSize',
        value: profile.forbiddenPictureSize ?? 0,
        visible: equalsOrDefault(profile.forbidImage, false, false),
        slot: 'forbiddenPictureSize',
      },
      {
        type: 'selectButton',
        label: $t('视频'),
        name: 'forbidMedia',
        value: profile.forbidMedia ?? true,
        options: [
          { label: $t('开启'), value: true },
          { label: $t('关闭'), value: false },
        ],
      },
      {
        type: 'selectButton',
        label: $t('窗口大小'),
        name: 'positionSwitch',
        value: profile.positionSwitch ?? true,
        options: [
          { label: $t('自定义'), value: true },
          { label: $t('全屏'), value: false },
        ],
        change(e2) {
          setFieldVisibility(
            basicFields,
            ['windowOpenSize', 'windowRatioPosition'],
            e2.value === true,
          );
        },
      },
      {
        label: ' ',
        name: 'windowOpenSize',
        items: [
          {
            type: 'text',
            placeholder: $t('请输入宽度'),
            name: 'openWidth',
            value: profile.openWidth ?? '1000',
          },
          {
            type: 'text',
            placeholder: $t('请输入高度'),
            name: 'openHeight',
            value: profile.openHeight ?? '1000',
          },
        ],
        visible:
          !firefox && equalsOrDefault(profile.positionSwitch, true, true),
        slot: 'windowOpenSize',
      },
      {
        label: $t('窗口位置'),
        name: 'windowRatioPosition',
        value: profile.windowRatioPosition || '0,0',
        tooltip: $t('窗口打开时在屏幕中的初始位置'),
        visible:
          !firefox && equalsOrDefault(profile.positionSwitch, true, true),
        slot: 'windowRatioPosition',
      },
      {
        label: $t('搜索引擎'),
        name: 'searchEngine',
        type: 'select',
        value:
          searchEngines.find((e2) => e2.value === searchEngine) ??
          searchEngines[0],
        options: searchEngines,
        filter: false,
        required: true,
        visible: !firefox,
      },
    ]);
  fingerprintFields = reactive([
    {
      type: 'selectButton',
      label: $t('分辨率'),
      name: 'resolutionType',
      value: profile.resolutionType ?? false,
      options: [
        { label: $t('跟随系统'), value: false },
        { label: $t('自定义'), value: true },
      ],
      change(e2) {
        setFieldVisibility(fingerprintFields, 'resolution', e2.value === true);
      },
      preview: { label: $t('分辨率') },
    },
    {
      type: 'select',
      label: $t('分辨率值'),
      placeholder: $t('请选择分辨率'),
      name: 'resolution',
      value: selectedResolution,
      options: resolutions,
      virtualScrollerOptions: { itemSize: 38 },
      filter: false,
      _isMobile: isMobile,
      required: true,
      formatValue: (field, _fields, values) => {
        const [width, height] = field.value.value.split(' x ');
        Object.assign(values, { resolutionX: width, resolutionY: height });
      },
      visible: equalsOrDefault(profile.resolutionType, true, false),
    },
    {
      type: 'selectButton',
      label: $t('字体指纹'),
      name: 'fontType',
      value: profile.fontType ?? false,
      options: [
        { label: $t('跟随系统'), value: false },
        { label: $t('随机'), value: true },
      ],
      preview: { label: $t('字体指纹') },
      change: async (e2) => {
        if (e2.value) {
          let { getAllowFontList: e3 } = await globalThis.electronAPI.send(
              'util:callRandomFingerprintFunc',
              { getAllowFontList: [] },
            ),
            t2 = await globalThis.electronAPI.send('util:genRandomFonts');
          Object.assign(saved, { font: t2.join(';'), allowFontList: e3 });
        } else Reflect.deleteProperty(saved, 'font');
      },
    },
    {
      type: 'selectButton',
      label: 'WebRTC',
      name: 'webRTC',
      value: profile.webRTC ?? 2,
      options: [
        { label: $t('替换'), value: 0 },
        { label: $t('真实'), value: 1 },
        { label: $t('禁止'), value: 2 },
      ],
      preview: { label: 'WebRTC' },
    },
    {
      type: 'selectButton',
      label: $t('WebGL 图像'),
      name: 'webGL',
      value: profile.webGL ?? true,
      options: [
        { label: $t('随机'), value: true },
        { label: $t('真实'), value: false },
      ],
      preview: { label: $t('WebGL 图像') },
      change: async (e2) => {
        if (e2.value)
          if (findField(mainFields, 'coreType').value.value === 'Firefox')
            Object.assign(saved, { webGLValue: Math.random() });
          else {
            let { getwebGLNoiseValue: e3 } = await globalThis.electronAPI.send(
              'util:callRandomFingerprintFunc',
              { getwebGLNoiseValue: [] },
            );
            Object.assign(saved, { webGLValue: e3 });
          }
        else Reflect.deleteProperty(saved, 'webGLValue');
      },
    },
    {
      type: 'selectButton',
      label: $t('WebGL Info'),
      name: 'webGLInfo',
      value: profile.webGLInfo ?? 1,
      options: [
        { label: $t('真实'), value: 0 },
        { label: $t('随机'), value: 1 },
        { label: $t('自定义'), value: 2 },
      ],
      change(e2) {
        (e2.value === 1 && refreshWebGlFields(),
          findFields(fingerprintFields, [
            'webGLManufacturer',
            'webGLRender',
          ]).forEach((t2) => {
            ((t2.visible = e2.value !== 0), (t2.disabled = e2.value !== 2));
          }));
      },
      preview: { label: $t('WebGL Info') },
    },
    {
      type: 'text',
      label: $t('WebGL 厂商'),
      name: 'webGLManufacturer',
      value: profile.webGLManufacturer,
      icon: 'base/rx_ic_shuffle',
      disabled: profile.webGLInfo !== 2,
      visible: !equalsOrDefault(profile.webGLInfo, 0, false),
      iconClick: refreshWebGlFields,
    },
    {
      type: 'textarea',
      label: $t('WebGL 渲染'),
      name: 'webGLRender',
      value: profile.webGLRender,
      rows: 3,
      icon: 'base/rx_ic_shuffle',
      disabled: profile.webGLInfo !== 2,
      visible: !equalsOrDefault(profile.webGLInfo, 0, false),
      iconClick: refreshWebGlFields,
    },
    {
      type: 'selectButton',
      label: 'WebGpu',
      name: 'webGpu',
      value: profile.webGpu ?? 'webgl',
      options: [
        { label: $t('基于WebGL匹配'), value: 'webgl' },
        { label: $t('真实'), value: 'real' },
        { label: $t('禁止'), value: 'block' },
      ],
      visible: !firefox,
    },
    {
      type: 'selectButton',
      label: 'Canvas',
      name: 'canvas',
      value: profile.canvas ?? true,
      options: [
        { label: $t('随机'), value: true },
        { label: $t('真实'), value: false },
      ],
      preview: { label: 'Canvas' },
      change: async (e2) => {
        let t2 = getSelectedEngine(mainFields);
        if (e2.value)
          if (isFirefox(t2))
            (Object.assign(saved, { canvasValueV2: Math.random() }),
              Reflect.deleteProperty(saved, 'canvasValue'));
          else {
            let { getCanvasContextNoiseValue: e3 } =
              await globalThis.electronAPI.send(
                'util:callRandomFingerprintFunc',
                { getCanvasContextNoiseValue: [] },
              );
            (Object.assign(saved, { canvasValue: e3 }),
              Reflect.deleteProperty(saved, 'canvasValueV2'));
          }
        else
          (Reflect.deleteProperty(saved, 'canvasValue'),
            Reflect.deleteProperty(saved, 'canvasValueV2'));
      },
    },
    {
      type: 'selectButton',
      label: 'AudioContext',
      name: 'audioContext',
      value: profile.audioContext ?? true,
      options: [
        { label: $t('随机'), value: true },
        { label: $t('真实'), value: false },
      ],
      preview: { label: 'AudioContext' },
      change: async (e2) => {
        e2.value
          ? Object.assign(saved, { audioContextValue: Math.random() })
          : Reflect.deleteProperty(saved, 'audioContextValue');
      },
    },
    {
      type: 'selectButton',
      label: 'Speech Voices',
      name: 'speechVoices',
      value: profile.speechVoices ?? true,
      options: [
        { label: $t('随机'), value: true },
        { label: $t('真实'), value: false },
      ],
      preview: { label: 'Speech Voices' },
      change: async (e2) => {
        if (e2.value) {
          let e3 = findField(mainFields, 'os'),
            { getSpeechSynthesis: t2 } = await globalThis.electronAPI.send(
              'util:callRandomFingerprintFunc',
              {
                getSpeechSynthesis: [
                  saved.os || e3?.value?.value,
                  getSelectedEngine(mainFields),
                ],
              },
            );
          if (e2.value) saved.speechVoicesValue = { enable: true, voices: t2 };
        } else delete saved.speechVoicesValue;
      },
    },
    {
      type: 'selectButton',
      label: 'Do Not Track',
      name: 'doNotTrack',
      value: profile.doNotTrack ?? true,
      options: [
        { label: $t('开启'), value: true },
        { label: $t('关闭'), value: false },
      ],
      preview: { label: 'Do Not Track' },
    },
    {
      type: 'selectButton',
      label: 'Client Rects',
      name: 'clientRects',
      value: profile.clientRects ?? true,
      options: [
        { label: $t('随机'), value: true },
        { label: $t('真实'), value: false },
      ],
      preview: { label: 'Client Rects' },
      change: async (e2) => {
        if (e2.value) {
          let { getClientRectsValue: e3 } = await globalThis.electronAPI.send(
            'util:callRandomFingerprintFunc',
            { getClientRectsValue: [] },
          );
          Object.assign(saved, { clientRectsValue: { enable: true, ...e3 } });
        } else Reflect.deleteProperty(saved, 'clientRectsValue');
      },
    },
    {
      type: 'selectButton',
      label: $t('媒体设备'),
      name: 'deviceInfo',
      value: profile.deviceInfo ?? true,
      options: [
        { label: $t('随机'), value: true },
        { label: $t('真实'), value: false },
      ],
      preview: { label: $t('媒体设备') },
      visible: !firefox,
    },
    {
      type: 'selectButton',
      label: $t('设备名称'),
      name: 'deviceNameSwitch',
      value: profile.deviceNameSwitch ?? true,
      options: [
        { label: $t('随机'), value: true },
        { label: $t('真实'), value: false },
      ],
      change(e2) {
        setFieldVisibility(fingerprintFields, 'deviceName', e2.value === true);
      },
      preview: { label: $t('设备名称') },
      visible: !firefox,
    },
    {
      type: 'text',
      label: ' ',
      name: 'deviceName',
      value: profile.deviceName,
      icon: 'base/rx_ic_shuffle',
      visible:
        !firefox && equalsOrDefault(profile.deviceNameSwitch, true, true),
      iconClick: () => {
        refreshDeviceName(fieldGroups);
      },
    },
    {
      type: 'selectButton',
      label: $t('MAC地址'),
      name: 'macInfo',
      value: profile.macInfo ?? true,
      options: [
        { label: $t('真实'), value: false },
        { label: $t('自定义'), value: true },
      ],
      visible: !firefox,
      change(field) {
        const address = findField(fingerprintFields, 'macAddr');
        address.visible = field.value === true;
        if (address.visible && !address.value) refreshMacAddress(address);
      },
      preview: { label: $t('MAC地址') },
    },
    {
      type: 'text',
      label: ' ',
      name: 'macAddr',
      value: profile.macAddr,
      icon: 'base/rx_ic_shuffle',
      placeholder: '02:00:00:00:00:01',
      errorMsg: $t('请输入有效的 MAC 地址，例如 {address}', { address: '02:00:00:00:00:01' }),
      validator(field) {
        const address = String(field.value ?? '').trim().replace(/-/g, ':');
        return !address || /^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/i.test(address);
      },
      visible: !firefox && equalsOrDefault(profile.macInfo, true, true),
      iconClick: refreshMacAddress,
    },
    {
      type: 'select',
      label: $t('硬件并发数'),
      name: 'hardwareConcurrent',
      value: coreOptions.find(option => option.value === String(profile.hardwareConcurrent ?? 12)),
      options: coreOptions,
      filter: false,
      preview: { label: $t('硬件并发数') },
    },
    {
      type: 'select',
      label: $t('设备内存'),
      name: 'deviceMemory',
      value: memoryOptions.find(option => option.value === String(profile.deviceMemory ?? 8)),
      options: memoryOptions,
      filter: false,
      preview: { label: $t('设备内存') },
      visible: !firefox,
    },
    {
      type: 'selectButton',
      label: $t('SSL指纹设置'),
      name: 'disableSsl',
      value: profile.disableSsl ?? false,
      options: [
        { label: $t('开启'), value: true },
        { label: $t('关闭'), value: false },
      ],
      change(e2) {
        setFieldVisibility(
          fingerprintFields,
          'disableSslList',
          e2.value === true,
        );
      },
      preview: { label: $t('SSL指纹设置') },
      visible: !firefox,
    },
    {
      type: 'multiSelect',
      label: ' ',
      placeholder: $t('请选择需要禁用的SSL特性'),
      name: 'disableSslList',
      value: profile.disableSslList ?? [],
      options: settings.disableSslList,
      display: 'chip',
      optionLabel: 'label',
      optionValue: 'value',
      filter: true,
      maxSelectedLabels: 1,
      visible: !firefox && equalsOrDefault(profile.disableSsl, true, false),
    },
    {
      type: 'selectButton',
      label: $t('端口扫描保护'),
      name: 'portScanProtect',
      value: profile.portScanProtect ?? true,
      options: [
        { label: $t('开启'), value: true },
        { label: $t('关闭'), value: false },
      ],
      change(e2) {
        setFieldVisibility(
          fingerprintFields,
          'portScanList',
          e2.value === true,
        );
      },
      preview: { label: $t('端口扫描保护') },
    },
    {
      type: 'text',
      label: $t('扫描白名单'),
      name: 'portScanList',
      value: profile.portScanList,
      placeholder: $t('允许被网站扫描的端口，多个用英文逗号隔开'),
      visible: equalsOrDefault(profile.portScanProtect, true, true),
    },
    {
      type: 'selectButton',
      label: $t('硬件加速模式'),
      name: 'useGpu',
      value: profile.useGpu ?? true,
      options: [
        { label: $t('开启'), value: true },
        { label: $t('关闭'), value: false },
      ],
      preview: { label: $t('硬件加速模式') },
      visible: true,
    },
    {
      type: 'selectButton',
      label: $t('禁用沙盒'),
      name: 'sandboxPermission',
      value: profile.sandboxPermission ?? false,
      visible: !firefox,
      options: [
        { label: $t('开启'), value: true },
        { label: $t('关闭'), value: false },
      ],
    },
    {
      type: 'text',
      label: $t('启动参数'),
      name: 'startupParam',
      value: profile.startupParam,
      placeholder: $t('浏览器启动参数,如 --mute 多个参数以英文分号分隔'),
    },
    {
      name: 'BatterySeparator',
      separatorTitle: $t('电池'),
      separatorIcon: {
        name: 'base/rx_ic_battery',
        color: 'var(--colors-icon-icon-warning)',
      },
      separator: true,
      visible: isMobileOs,
    },
    {
      type: 'selectButton',
      label: $t('电池模拟'),
      name: 'openBattery',
      value: profile.openBattery ?? false,
      options: toggleOptions(),
      visible: isMobileOs,
      change(e2) {
        findFields(fingerprintFields, [
          'openCharging',
          'chargingTime',
          'dischargingTime',
          'level',
        ]).forEach((t2) => {
          t2.visible = e2.visible && e2.value === true;
        });
      },
    },
    {
      type: 'selectButton',
      label: $t('充电状态'),
      name: 'openCharging',
      value: profile.openCharging ?? false,
      options: toggleOptions(),
      visible: isMobileOs && equalsOrDefault(profile.openBattery, true, false),
    },
    {
      type: 'text',
      label: $t('充电时长（秒）'),
      placeholder: $t('请填写充电时长，示例: {value}', { value: 100 }),
      name: 'chargingTime',
      value: profile.chargingTime,
      visible: isMobileOs && equalsOrDefault(profile.openBattery, true, false),
    },
    {
      type: 'text',
      label: $t('放电时长（秒）'),
      placeholder: $t('请填写放电时长，示例: {value}', { value: 100 }),
      name: 'dischargingTime',
      value: profile.dischargingTime,
      visible: isMobileOs && equalsOrDefault(profile.openBattery, true, false),
    },
    {
      type: 'text',
      label: $t('电量'),
      placeholder: $t('请填写电池电量(0-1)，示例: {value}', { value: 0.75 }),
      name: 'level',
      value: profile.level,
      visible: isMobileOs && equalsOrDefault(profile.openBattery, true, false),
      onBlur(e2) {
        let t2 = e2.target.value;
        (numberSchema().safeParse(Number(t2)).success && t2 !== ''
          ? (t2 > 1 && (t2 = 1), t2 < 0 && (t2 = 0))
          : ((t2 = ''),
            setFieldProperty(fingerprintFields, 'level', 'invalid', true)),
          setFieldProperty(fingerprintFields, 'level', 'value', t2));
      },
    },
    {
      name: 'NetworkSeparator',
      separatorTitle: $t('网络'),
      separatorIcon: {
        name: 'base/rx_ic_network_m',
        color: 'var(--colors-icon-icon-success)',
      },
      separator: true,
      visible: isMobileOs,
    },
    {
      type: 'selectButton',
      label: $t('网络模拟'),
      name: 'openNetwork',
      value: profile.openNetwork ?? false,
      options: toggleOptions(),
      visible: isMobileOs,
      change(e2) {
        findFields(fingerprintFields, [
          'networkType',
          'networkSpeed',
          'downloadSpeed',
          'maxDownloadSpeed',
          'latency',
          'saveFlowMode',
        ]).forEach((t2) => {
          t2.visible = e2.visible && e2.value === true;
        });
      },
    },
    {
      type: 'select',
      label: $t('网络类型'),
      name: 'networkType',
      value:
        settings.nettype.find((e2) => e2.value === profile.networkType) ??
        settings.nettype[0],
      options: settings.nettype,
      filter: false,
      visible: isMobileOs && equalsOrDefault(profile.openNetwork, true, false),
    },
    {
      type: 'select',
      label: $t('网络速度'),
      name: 'networkSpeed',
      value:
        settings.effectiveType.find(
          (e2) => e2.value === profile.networkSpeed,
        ) ?? settings.effectiveType[0],
      options: settings.effectiveType,
      filter: false,
      visible: isMobileOs && equalsOrDefault(profile.openNetwork, true, false),
    },
    {
      type: 'text',
      label: $t('下载速度（Mbps）'),
      placeholder: $t('请填写下载速度，示例: {value}', { value: 3e3 }),
      name: 'downloadSpeed',
      value: profile.downloadSpeed,
      visible: isMobileOs && equalsOrDefault(profile.openNetwork, true, false),
    },
    {
      type: 'text',
      label: $t('最大下载速度（Mbps）'),
      placeholder: $t('请填写最大下载速度，示例: {value}', { value: 3e3 }),
      name: 'maxDownloadSpeed',
      value: profile.maxDownloadSpeed,
      visible: isMobileOs && equalsOrDefault(profile.openNetwork, true, false),
    },
    {
      type: 'text',
      label: $t('延迟（ms）'),
      placeholder: $t('请填写延迟，示例: {value}', { value: 200 }),
      name: 'latency',
      value: profile.latency,
      visible: isMobileOs && equalsOrDefault(profile.openNetwork, true, false),
    },
    {
      type: 'selectButton',
      label: $t('省流模式'),
      name: 'saveFlowMode',
      value: profile.saveFlowMode ?? false,
      options: toggleOptions(),
      visible: isMobileOs && equalsOrDefault(profile.openNetwork, true, false),
    },
    {
      name: 'bluetoothSeparator',
      separatorTitle: $t('蓝牙'),
      separatorIcon: {
        name: 'base/rx_ic_bluetooth',
        color: 'var(--colors-icon-icon-brand)',
      },
      separator: true,
      visible: isMobileOs,
    },
    {
      type: 'selectButton',
      label: $t('蓝牙模拟'),
      name: 'openBluetooth',
      value: profile.openBluetooth === true && profile.bluetoothAdapter !== true,
      options: [
        { label: $t('跟随系统'), value: false },
        { label: $t('模拟不可用'), value: true },
      ],
      visible: isMobileOs,
      formatValue(field, _fields, values) {
        values.bluetoothAdapter = !field.value;
        return field.value;
      },
    },
  ]);
  let preferenceFields = reactive([
    {
      type: 'selectButton',
      label: $t('自定义书签'),
      name: 'openBookmarks',
      value: profile.openBookmarks ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('同步书签'),
      name: 'syncBookmark',
      value: profile.syncBookmark ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('同步历史记录'),
      name: 'syncHistory',
      value: profile.syncHistory ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('同步标签页'),
      name: 'syncTab',
      value: profile.syncTab ?? true,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('同步Cookie'),
      name: 'syncCookie',
      value: profile.syncCookie ?? true,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: labels.syncExtensionApps,
      name: 'syncExtensions',
      value: profile.syncExtensions ?? false,
      options: toggleOptions(),
      visible: !firefox,
    },
    {
      type: 'selectButton',
      label: $t('同步已保存的用户名密码'),
      name: 'syncPassword',
      value: profile.syncPassword ?? true,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('同步IndexedDB'),
      name: 'syncIndexedDb',
      value: profile.syncIndexedDb ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('同步Local Storage'),
      name: 'syncLocalStorage',
      value: profile.syncLocalStorage ?? true,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('同步Session Storage'),
      name: 'syncSessionStorage',
      value: profile.syncSessionStorage ?? false,
      options: toggleOptions(),
      change(e2) {
        setFieldVisibility(
          preferenceFields,
          'sessionStorages',
          e2.value === true,
        );
      },
    },
    {
      type: 'textarea',
      label: ' ',
      name: 'sessionStorages',
      placeholder: $t(
        `请务必按以下格式填写，不输入则全部开启
{example}`,
        {
          example: `[
	{"domain": "www.example1.com", "key": ["key1", "key2"]}
	{"domain": "www.example2.com", "key": ["key1", "key2"]}
]`,
        },
      ),
      value: isEmpty(profile?.sessionStorages)
        ? ''
        : JSON.stringify(profile.sessionStorages, null, 2),
      rows: 5,
      formatValue: (t2) => parseJson(t2.value, []),
      help: $t('开启同步 Session Storage 可能存在风险，请谨慎操作!'),
      visible: equalsOrDefault(profile.syncSessionStorage, true, false),
    },
    {
      type: 'selectButton',
      label: $t('启动浏览器前删除缓存文件'),
      name: 'clearCacheFile',
      value: profile.clearCacheFile ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('启动浏览器前删除Cookie'),
      name: 'clearCookie',
      value: profile.clearCookie ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('启动浏览器前删除Local Storage'),
      name: 'clearLocalStorage',
      value: profile.clearLocalStorage ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('启动浏览器时随机指纹'),
      name: 'randomFingerprint',
      value: profile.randomFingerprint ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('弹出保存密码提示'),
      name: 'forbidSavePassword',
      value: profile.forbidSavePassword ?? true,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('网络不通停止打开'),
      name: 'stopOpenNet',
      value: profile.stopOpenNet ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('IP发生变化停止打开'),
      name: 'stopOpenIP',
      value: profile.stopOpenIP ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('IP对应国家/地区发生改变停止打开'),
      name: 'stopOpenPosition',
      value: profile.stopOpenPosition ?? false,
      options: toggleOptions(),
    },
    {
      type: 'selectButton',
      label: $t('打开工作台'),
      name: 'openWorkbench',
      value: profile.openWorkbench ?? 1,
      options: [
        { label: $t('开启'), value: 1 },
        { label: $t('关闭'), value: 0 },
        { label: $t('跟随软件设置'), value: 2 },
      ],
    },
    {
      type: 'selectButton',
      label: $t('IP 变化提醒'),
      name: 'ipChangeRemind',
      value: profile.ipChangeRemind ?? 2,
      options: [
        { label: $t('开启'), value: 1 },
        { label: $t('关闭'), value: 0 },
        { label: $t('跟随软件设置'), value: 2 },
      ],
    },
    {
      type: 'selectButton',
      label: $t('是否开启谷歌登录'),
      name: 'enableGoogleLogin',
      value: profile.enableGoogleLogin ?? 2,
      visible: !firefox,
      options: [
        { label: $t('开启'), value: 1 },
        { label: $t('关闭'), value: 0 },
        { label: $t('跟随软件设置'), value: 2 },
      ],
    },
    {
      type: 'textarea',
      label: $t('网址访问黑名单'),
      name: 'blockDomainList',
      value: profile.blockDomainList,
      placeholder: $t('每行一个 URL，换行以添加多个'),
      tooltip: $t('阻止访问列表中指定的网站或网络服务。'),
    },
    {
      type: 'textarea',
      label: $t('网址访问白名单'),
      name: 'allowDomainList',
      value: profile.allowDomainList,
      placeholder: $t('每行一个 URL，换行以添加多个'),
      tooltip: $t('仅允许访问列表中指定的网站或网络服务。'),
    },
  ]);
  function updatePlatformOptions() {
    const [os, kernel] = findFields(mainFields, ['os', 'coreType']);
    const mobile = isMobileSystem(os.value?.value);
    const firefox = isFirefox(kernel.value?.value);
    const desktopOnly = $t('Firefox 当前支持桌面设备配置，请选择 Windows、macOS 或 Linux');
    for (const option of os.options) {
      option.disabled = firefox && isMobileSystem(option.value);
      option.disabledTooltip = desktopOnly;
    }
    const firefoxOption = kernel.options.find(option => isFirefox(option.value));
    firefoxOption.disabled = !firefoxSupported || mobile;
    firefoxOption.disabledTooltip = firefoxSupported ? desktopOnly
      : $t('该功能需要升级到 v{version} 及以上版本', { version: '3.8.8' });
    kernel.help = mobile || firefox ? desktopOnly : '';
  }

  let macRequest = 0;
  async function refreshMacAddress(field) {
    const request = ++macRequest;
    const previous = field.value;
    try {
      const { code, data, msg } = await run(() => api.window.userGetMacAddrV2List({ count: 1 }));
      if (code !== 0) throw Error(msg);
      if (request === macRequest && field.visible && field.value === previous && data[0]?.macAddr) {
        field.value = data[0].macAddr;
        field.invalid = false;
      }
    } catch (error) {
      notify(-1, error.message);
    }
  }

  let webGlRequest = 0;
  async function refreshWebGlFields() {
    const request = ++webGlRequest;
    const before = readPreviewInputs(fieldGroups);
    const vendor = findField(fingerprintFields, 'webGLManufacturer');
    const renderer = findField(fingerprintFields, 'webGLRender');
    const previousVendor = vendor.value;
    const previousRenderer = renderer.value;
    try {
      const [sample] = await run(() => refreshFingerprintDraft(fieldGroups, {
        read: readPreviewInputs, find: findField, preview: false,
        request: payload => requestFingerprintPreview({ ...payload, webGLInfo: 1 }),
      }));
      const after = readPreviewInputs(fieldGroups);
      if (request !== webGlRequest || after.webGLInfo === 0 ||
          ['os', 'osVersion', 'coreType', 'coreVersion'].some(key => before[key] !== after[key])) return;
      if (vendor.value === previousVendor && sample?.webGLManufacturer) vendor.value = sample.webGLManufacturer;
      if (renderer.value === previousRenderer && sample?.webGLRender) renderer.value = sample.webGLRender;
    } catch (error) {
      notify(-1, error.message);
    }
  }

  async function updateEngineFields(e2, t2, r2) {
    let i2 = isFirefox(e2),
      a3 = findField(mainFields, 'browserVersion');
    findFields(fingerprintFields, [
      'webGpu',
      'deviceInfo',
      'deviceNameSwitch',
      'macInfo',
      'deviceMemory',
    ]).forEach((e3) => {
      e3.visible = !i2;
    });
    let s2 = findField(fingerprintFields, 'deviceName');
    if (s2) {
      let e3 = findField(fingerprintFields, 'deviceNameSwitch');
      s2.visible = !i2 && e3?.value === true;
    }
    let c2 = findField(fingerprintFields, 'macAddr');
    if (c2) {
      let e3 = findField(fingerprintFields, 'macInfo');
      c2.visible = !i2 && e3?.value === true;
    }
    let u2 = findField(basicFields, 'searchEngine');
    u2 && (u2.visible = !i2);
    let d2 = findField(fingerprintFields, 'sandboxPermission');
    d2 && (d2.visible = !i2);
    let f2 = findField(preferenceFields, 'enableGoogleLogin');
    f2 && (f2.visible = !i2);
    let p2 = findField(basicFields, 'windowOpenSize');
    if (p2) {
      let e3 = findField(basicFields, 'positionSwitch');
      p2.visible = !i2 && e3?.value === true;
    }
    let m2 = findField(basicFields, 'windowRatioPosition');
    if (m2) {
      let e3 = findField(basicFields, 'positionSwitch');
      m2.visible = !i2 && e3?.value === true;
    }
    let h3 = findField(fingerprintFields, 'disableSsl');
    h3 && (h3.visible = !i2);
    let g2 = findField(fingerprintFields, 'disableSslList');
    g2 && (g2.visible = !i2 && h3?.value === true);
    let _2 = findField(preferenceFields, 'syncExtensions');
    if ((_2 && (_2.visible = !i2), a3)) {
      let e3 = !i2 && userConfig?.uaModeSwitch === uaMode.close;
      if (((a3.visible = e3), i2))
        ((a3.value = []), (a3._oldValue = []), (a3.options = []));
      else if (e3 && t2 && r2) {
        let e4 = await fetchBrowserVersions({ os: t2, osVersion: r2 });
        ((a3.options = e4),
          (a3.value = e4.map((e5) => e5.value)),
          (a3._oldValue = a3.value.slice()));
      }
    }
    if (findField(fingerprintFields, 'speechVoices')?.value === true) {
      let t3 = findField(mainFields, 'os'),
        r3 = saved.os || t3?.value?.value,
        { getSpeechSynthesis: i3 } = await globalThis.electronAPI.send(
          'util:callRandomFingerprintFunc',
          { getSpeechSynthesis: [r3, e2] },
        );
      Object.assign(saved, { speechVoicesValue: { enable: true, voices: i3 } });
    }
  }
  return (
    fieldGroups.push(
      mainFields,
      basicFields,
      fingerprintFields,
      preferenceFields,
    ),
    updatePlatformOptions(),
    restoreFingerprintDraft(fieldGroups, profile),
    await run(() =>
      updateEngineFields(
        selectedEngine,
        selectedOs?.value,
        selectedOsVersion?.value,
      ),
    ),
    [fieldGroups, saved]
  );
}
function updateMobileFields(e2, t2) {
  let n2 = findFields(e2, [
    'BatterySeparator',
    'NetworkSeparator',
    'bluetoothSeparator',
    'openBattery',
    'openNetwork',
    'openBluetooth',
  ]);
  isEmpty(n2) ||
    n2.forEach((e3) => {
      (Reflect.set(e3, 'visible', t2), e3.change?.(e3));
    });
}
function toggleOptions(e2) {
  let {
    trueText: t2,
    falseText: n2,
    trueValue: r2,
    falseValue: i2,
  } = {
    trueText: $t('开启'),
    falseText: $t('关闭'),
    trueValue: true,
    falseValue: false,
    ...e2,
  };
  return [
    { label: t2, value: r2 },
    { label: n2, value: i2 },
  ];
}
function defaultProfileSettings() {
  return {
    openMult: true,
    clearHistory: false,
    allowRunApplication: true,
    ignoreHttpsError: false,
    webGLMeta: true,
    enablePlugin: false,
    enablePluginList: [],
    mediaDevice: false,
    disableSsl: false,
    disableSslList: [],
    isPositionBaseIp: true,
    webGpu: 'webgl',
    deviceInfo: true,
    deviceNameSwitch: true,
    macInfo: true,
    syncExtensions: false,
    enableGoogleLogin: 2,
  };
}

export {
  initializeProfileInputs,
  refreshProfileFingerprint,
  showMobileProfileFields,
  updateMobileFields,
};
export {
  initializeProfileInputs as r,
  refreshProfileFingerprint as t,
  updateMobileFields as i,
};
export {
  toProxyFields,
  toProxyFields as a,
  serializeProfileInput,
  serializeProfileInput as o,
} from './workbench-profile-proxy-inputs.js';
