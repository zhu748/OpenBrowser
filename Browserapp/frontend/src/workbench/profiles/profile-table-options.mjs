import {
  d as applyFilterValues,
  h as api,
  jr as orderDirection,
  m as loadSystemOptions,
  nn as usePermissions,
  qt as BrowserType,
} from "./utils-BIWenCnY.js";
import { m as ProxyCategory } from "./proxy-D7e36h-l.js";
import { t as formatDate } from "./format-_cvrr_iF.js";

const { check } = usePermissions();
const dateSkeleton = { width: "120px", height: "24px", borderRadius: "4px" };

export function profileColumnLayout() {
  return {
    key: "browser.list",
    data: [
      {
        title: $t("编号"),
        key: "windowSortNum",
        disabledToggle: true,
        sortable: true,
        slot: "profile",
        style: { width: "0%", minWidth: "180px" },
      },
      {
        title: $t("窗口名称"),
        key: "name",
        disabledToggle: true,
        sortable: true,
        slot: "profileName",
        style: { width: "10%", minWidth: "160px" },
      },
      {
        title: $t("操作"),
        key: "open",
        disabledToggle: true,
        slot: "open",
        style: { width: "12%", minWidth: "160px" },
      },
      {
        title: $t("备注"),
        key: "note",
        headerSlot: "noteHeader",
        slot: "note",
        style: { minWidth: "75px" },
        _cache: { extend: false },
      },
      {
        title: $t("标签"),
        key: "tags",
        slot: "tags",
        style: { width: "10%", minWidth: "95px" },
      },
      {
        title: $t("项目"),
        key: "project",
        slot: "project",
        style: { width: "10%", minWidth: "95px" },
      },
      {
        title: $t("创建时间"),
        key: "createTime",
        _visible: false,
        skeleton: dateSkeleton,
        sortable: true,
        getText: (e2) =>
          e2.createTime
            ? formatDate(new Date(e2.createTime), "yyyy/MM/dd HH:mm:ss")
            : "--",
        style: { width: "13%", minWidth: "140px" },
      },
      {
        title: $t("更新时间"),
        key: "updateTime",
        _visible: false,
        skeleton: dateSkeleton,
        sortable: true,
        getText: (e2) =>
          e2.updateTime
            ? formatDate(new Date(e2.updateTime), "yyyy/MM/dd HH:mm:ss")
            : "--",
        style: { width: "13%", minWidth: "140px" },
      },
      {
        title: $t("最后打开"),
        key: "openTime",
        skeleton: dateSkeleton,
        sortable: true,
        getText: (e2) =>
          e2.openTime
            ? formatDate(new Date(e2.openTime), "yyyy/MM/dd HH:mm:ss")
            : "--",
        style: { width: "13%", minWidth: "140px" },
      },
      {
        title: $t("转移方"),
        key: "transferUserName",
        getText: (e2) => e2.transferUserName || "--",
        _visible: false,
        style: { width: "10%", minWidth: "120px" },
      },
      {
        title: $t("其他"),
        key: "actions",
        alignFrozen: "right",
        slot: "actions",
        style: { width: "0%", minWidth: "80px", maxWidth: "80px" },
      },
    ],
  };
}

export async function advancedProfileFilters(saved = {}) {
  let system = await loadSystemOptions(),
    filters = [
      {
        type: "text",
        label: $t("窗口名称"),
        placeholder: $t("请输入窗口名称"),
        name: "windowName",
        icon: "base/rx_ic_browser",
      },
      {
        type: "text",
        label: $t("编号"),
        placeholder: $t("请输入编号(多个用英文逗号分隔)"),
        name: "sortNums",
        icon: "base/rx_ic_id",
      },
      { separator: true },
      {
        type: "Checkbox",
        label: $t("操作系统"),
        name: "osList",
        icon: "base/rx_ic_laptop",
        getOptions: () =>
          (system.os || []).map((e3) => ({
            parentName: "osList",
            value: e3.value,
            label: e3.label,
          })),
        formatValue: (e3) => e3.value?.map((e4) => e4.value),
      },
      {
        type: "Checkbox",
        name: "platformUrls",
        label: $t("业务平台"),
        icon: "base/rx_ic_keys",
        search: true,
        searchPlaceholder: $t("搜索业务平台"),
        getOptions: async () => {
          let { data: e3 } =
            await api.window.userGetWindowPlatformAccountListList();
          return (e3?.rows || []).map((e4) => {
            let t3 = new URL(e4.platformUrl).hostname.replace(
              /.*\.(.*?)\..*/,
              "$1",
            );
            return { parentName: "platformUrls", label: t3, value: t3 };
          });
        },
        formatValue: (e3) => e3.value?.map((e4) => e4.value),
      },
      {
        type: "Checkbox",
        name: "coreType",
        label: $t("内核"),
        icon: "base/rx_ic_chrome",
        getOptions: async () => [
          {
            parentName: "coreType",
            label: "Chrome",
            value: BrowserType.Chrome,
          },
          {
            parentName: "coreType",
            label: "Firefox",
            value: BrowserType.Firefox,
          },
        ],
        formatValue: (e3) => e3.value?.map((e4) => e4.value),
      },
      { separator: true },
      {
        type: "Checkbox",
        name: "projectIds",
        label: $t("项目"),
        icon: "base/rx_ic_stack",
        search: true,
        searchPlaceholder: $t("搜索项目"),
        getOptions: async () => {
          let { data: e3 } = await api.limit.userGetProjectInfoByWorkspaceList({
            default: 2,
          });
          return (e3.rows || []).map((e4) => ({
            parentName: "projectIds",
            value: `${e4.project_id}`,
            label: e4.projectName,
          }));
        },
        formatValue: (e3) => e3.value?.map((e4) => e4.value),
      },
      {
        type: "Checkbox",
        name: "labelIds",
        label: $t("标签"),
        icon: "base/rx_ic_tag",
        search: true,
        searchPlaceholder: $t("搜索标签或成员"),
        getOptions: async () => {
          const { data } =
            await globalThis.__localApi.window.userGetLabelInfoList();
          return data.rows.map((row) => ({
            parentName: "labelIds",
            value: String(row.id),
            label: row.name,
          }));
        },
        formatValue: (e3) => e3.value?.map((e4) => e4.value),
      },
      { separator: true },
      {
        type: "switch",
        name: "isOften",
        label: $t("收藏"),
        icon: "base/rx_ic_bookmark",
      },
      {
        type: "textarea",
        label: $t("备注"),
        placeholder: $t("请输入备注"),
        name: "windowRemark",
        icon: "base/rx_ic_doc_article",
      },
      {
        type: "switch",
        name: "openStatus",
        label: $t("已打开"),
        icon: "base/rx_ic_browsers_line",
      },
      { separator: true },
      {
        type: "date",
        name: "createTime",
        icon: "base/rx_ic_calendar",
        label: $t("创建时间"),
        placeholder: $t("请选择时间"),
        maxDate: new Date(),
        selectionMode: "range",
        manualInput: false,
        showButtonBar: false,
        dateFormat: "yy/mm/dd",
        formatValue: (e3, t3, n3) => {
          let r2 = e3.value;
          if (r2) {
            r2[1] ??= r2[0];
            let [e4, t4] = r2.map((e5) =>
              formatDate(new Date(e5), "yyyy-MM-dd"),
            );
            Object.assign(n3, { startDate: e4, endDate: t4 });
          }
          return r2;
        },
      },
      {
        type: "date",
        name: "modfiyTime",
        icon: "base/rx_ic_calendar",
        label: $t("修改时间"),
        placeholder: $t("请选择时间"),
        maxDate: new Date(),
        selectionMode: "range",
        manualInput: false,
        showButtonBar: false,
        dateFormat: "yy/mm/dd",
        formatValue: (e3, t3, n3) => {
          let r2 = e3.value;
          if (r2) {
            r2[1] ??= r2[0];
            let [e4, t4] = r2.map((e5) =>
              formatDate(new Date(e5), "yyyy-MM-dd"),
            );
            Object.assign(n3, { startUpdateDate: e4, endUpdateDate: t4 });
          }
          return r2;
        },
      },
    ];
  return (
    applyFilterValues(filters, {
      ...saved,
      createTime: Array.isArray(saved.createTime)
        ? [new Date(saved.createTime[0]), new Date(saved.createTime[1])]
        : undefined,
      modfiyTime: Array.isArray(saved.modfiyTime)
        ? [new Date(saved.modfiyTime[0]), new Date(saved.modfiyTime[1])]
        : undefined,
    }),
    filters
  );
}

export async function profileSortOptions() {
  let columns = profileColumnLayout(),
    { data: current } = await api.window.userGetWindowTableSortOrderList();
  const field = current?.orderName === "windowName" ? "name" : current?.orderName;
  return {
    data: {
      sortField: columns.data.find(column => column.key === field && column.sortable)?.key,
      sortOrder: orderDirection(current?.orderType ?? "desc"),
    },
    onChange({ sortField, sortOrder }) {
      const preference = sortField && columns.data.some(column => column.key === sortField && column.sortable)
        ? { orderName: sortField, orderType: orderDirection(sortOrder) }
        : {};
      return api.window.userSaveWindowTableSortOrderCreate(preference);
    },
  };
}

export function profileOperations(selection = {}) {
  let rows = [].concat(selection),
    first = rows[0],
    hasProxy = rows.some((e3) => e3.proxyCategory !== "noproxy"),
    canAddProxy = rows.length === 1 && first?.proxyCategory === "noproxy",
    canEditProxy =
      rows.length === 1 &&
      first?.proxyCategory !== "noproxy" &&
      first?.buyProxyType === ProxyCategory.resource;
  return [
    {
      name: "edit",
      label: $t("编辑窗口"),
      icon: "base/rx_ic_edit",
      power: check("Profiles_edit"),
    },
    {
      name: "addProxy",
      label: $t("添加代理 IP"),
      icon: "base/rx_ic_plus",
      tooltip: $t("添加代理 IP"),
      multiple: true,
      multipleProps: { name: "G3", showLabel: true },
      power: check("Profiles_add_proxy_outside"),
    },
    {
      name: "transfer",
      label: $t("转移窗口"),
      icon: "base/rx_ic_transfer",
      tooltip: $t("转移窗口"),
      multiple: true,
      power: check("Profiles_transfer_window"),
    },
    {
      name: "moveToProject",
      label: $t("移动到项目"),
      icon: "base/rx_ic_stack_move",
      multiple: true,
      power: check("Profiles_move_project"),
    },
    {
      power: check(
        [
          "Profiles_edit",
          "Profiles_add_proxy_outside",
          "Profiles_transfer_window",
          "Profiles_move_project",
        ],
        "any",
      ),
      multiple: true,
      separator: true,
    },
    {
      name: "open",
      label: $t("打开窗口"),
      icon:
        selection.coreType === BrowserType.Firefox
          ? "base/rx_ic_firefox"
          : "base/rx_ic_chrome",
      multiple: true,
      multipleProps: {
        name: "G1",
        showLabel: true,
        iconProps: { color: "var(--pattern-actionbar-icon-open)" },
      },
    },
    {
      name: "createAutomation",
      label: $t("AI 自动化"),
      icon: "roxy-agent/rx-ic-logo",
      multiple: true,
      multipleProps: { name: "G1.5", showLabel: true },
      power: check("Roxy_AI_Agent_All"),
    },
    {
      name: "close",
      label: $t("关闭窗口"),
      icon: "base/rx_ic_shut_down",
      tooltip: $t("关闭窗口"),
      multiple: true,
      multipleProps: { name: "G2", showLabel: true },
    },
    { separator: true, multiple: true },
    {
      name: "setAsDefaultBrowser",
      label: $t("设为默认浏览器"),
      icon: "base/rx_ic_loptop_check",
    },
    {
      name: "createDesktopShortcut",
      label: $t("创建桌面快捷方式"),
      icon: "base/rx_ic_show_profile_2",
    },
    { separator: true },
    {
      name: "profileActions",
      label: $t("窗口操作"),
      icon: "base/rx_ic_browser",
      multiple: true,
      power: check(
        ["Profiles_copy_window_id", "Profiles_export_window", "Profiles_edit"],
        "any",
      ),
      items: [
        {
          name: "view",
          label: $t("查看窗口"),
          icon: "base/rx_ic_browser",
          multiple: false,
        },
        {
          name: "restart",
          label: $t("重启窗口"),
          icon: "base/rx_ic_refresh",
          tooltip: $t("重启窗口"),
        },
        {
          name: "copyId",
          label: $t("复制窗口 ID"),
          power: check("Profiles_copy_window_id"),
          icon: "base/rx_ic_copy",
          multiple: false,
        },
        {
          name: "exportProfile",
          label: $t("导出窗口"),
          icon: "base/rx_ic_export",
          power: check("Profiles_export_window"),
        },
        {
          name: "upgradeCore",
          label: $t("升级内核"),
          icon: "base/rx_ic_update",
          power: check("Profiles_edit"),
        },
      ],
    },
    {
      name: "proxyActions",
      label: $t("代理 IP 操作"),
      icon: "base/rx_ic_internet",
      multiple: true,
      power: check(
        [
          "Profiles_select_proxy",
          "Profiles_add_proxy_outside",
          "Profiles_edit_proxy_outside",
          "Profiles_delete_proxy_outside",
          "Profiles_speed_test_proxy",
        ],
        "any",
      ),
      items: [
        {
          name: "chooseProxy",
          label: $t("选择已有代理 IP"),
          icon: "base/rx_ic_exchange",
          power: check("Profiles_select_proxy"),
        },
        ...(canAddProxy
          ? [
              {
                name: "addProxy",
                label: $t("添加代理 IP"),
                icon: "base/rx_ic_plus",
                power: check("Profiles_add_proxy_outside"),
                multiple: false,
              },
            ]
          : []),
        ...(canEditProxy
          ? [
              {
                name: "editProxy",
                label: $t("编辑代理 IP"),
                icon: "base/rx_ic_edit",
                power: check("Profiles_edit_proxy_outside"),
                multiple: false,
              },
            ]
          : []),
        {
          name: "checkProxy",
          label: $t("测试代理 IP"),
          icon: "base/rx_ic_speed_test",
          tooltip: hasProxy ? $t("测试代理 IP") : $t("未绑定代理 IP"),
          power: check("Profiles_speed_test_proxy"),
          quick: true,
          disabled: !hasProxy,
        },
        {
          name: "deleteProxy",
          label: $t("删除代理 IP"),
          icon: "base/rx_ic_bin_1",
          power: check("Profiles_delete_proxy_outside"),
          disabled: !hasProxy,
        },
      ],
    },
    {
      name: "platformAccountActions",
      label: $t("平台账号操作"),
      icon: "base/rx_ic_keys",
      multiple: true,
      power: check(
        ["Profiles_add_platform_outside", "Profiles_select_platform"],
        "any",
      ),
      items: [
        {
          name: "addPlatformAccount",
          label: $t("添加平台账号"),
          icon: "base/rx_ic_plus",
          power: check("Profiles_add_platform_outside"),
        },
        {
          name: "choosePlatformAccount",
          label: $t("选择已有平台账号"),
          icon: "base/rx_ic_exchange",
          power: check("Profiles_select_platform"),
        },
      ],
    },
    {
      power: check(
        [
          "Profiles_copy_window_id",
          "Profiles_export_window",
          "Profiles_edit",
          "Profiles_select_proxy",
          "Profiles_add_proxy_outside",
          "Profiles_edit_proxy_outside",
          "Profiles_delete_proxy_outside",
          "Profiles_speed_test_proxy",
          "Profiles_add_platform_outside",
          "Profiles_select_platform",
        ],
        "any",
      ),
      separator: true,
      multiple: true,
    },
    {
      name: "addNotes",
      label: $t("添加备注"),
      icon: "base/rx_ic_doc_add",
      power: check("Profiles_edit_remark"),
      multiple: true,
    },
    {
      name: "addTag",
      label: $t("添加标签"),
      icon: "base/rx_ic_tag",
      power: check(["Profiles_Label_add", "Profiles_select_label"]),
      multiple: true,
    },
    {
      name: "fav",
      label: selection.isOften ? $t("取消收藏") : $t("收藏"),
      icon: selection.isOften
        ? "base/rx_ic_bookmark_fill"
        : "base/rx_ic_bookmark",
      iconClass: selection.isOften ? "text-orange" : "",
      tooltip: selection.isOften ? $t("取消收藏") : $t("收藏"),
    },
    { separator: true, multiple: true },
    {
      name: "editCookies",
      label: $t("编辑 Cookies"),
      icon: "base/rx_ic_cookies",
      power: check("Profiles_edit_cookies"),
      multiple: true,
    },
    {
      name: "cookieRobot",
      label: $t("Cookie 机器人"),
      icon: "base/rx_ic_cookie_bot",
      suffixIcon: "base/fire",
      menuTooltip: $t(
        "自动模拟浏览行为，生成真实 Cookie，适用于养号、账号预热，降低账号风控风险",
      ),
      multiple: true,
    },
    { power: check("Profiles_clear_cache"), separator: true },
    {
      name: "clearCache",
      label: $t("清除缓存"),
      icon: "base/rx_ic_brush",
      power: check("Profiles_clear_cache"),
      multiple: true,
    },
    { power: check("Profiles_delete"), separator: true, multiple: true },
    {
      name: "delete",
      label: $t("删除窗口"),
      icon: "base/rx_ic_bin_1",
      power: check("Profiles_delete"),
      multiple: true,
    },
  ];
}

export function profileSearchFields() {
  return [
    {
      key: "name",
      label: $t("窗口名称"),
      icon: "base/rx_ic_browser",
      syntax: "name::",
    },
    {
      key: "remark",
      label: $t("备注"),
      icon: "base/rx_ic_doc_article",
      syntax: "note::",
    },
    {
      key: "account",
      label: $t("平台账号"),
      icon: "base/rx_ic_keys",
      syntax: "account::",
    },
    {
      key: "proxy",
      label: $t("代理 IP"),
      icon: "base/rx_ic_internet",
      syntax: "proxy::",
    },
    { key: "tag", label: $t("标签"), icon: "base/rx_ic_tag", syntax: "tag::" },
    {
      key: "project_name",
      label: $t("项目"),
      icon: "base/rx_ic_stack",
      syntax: "project::",
    },
    {
      key: "sortNum",
      label: $t("编号"),
      icon: "base/rx_ic_id",
      syntax: "id::",
    },
    {
      key: "os",
      label: $t("操作系统"),
      icon: "base/rx_ic_laptop",
      syntax: "system::",
    },
    {
      key: "coreVersion",
      label: $t("内核版本"),
      icon: "base/rx_ic_chrome",
      syntax: "kernel::",
    },
  ];
}
