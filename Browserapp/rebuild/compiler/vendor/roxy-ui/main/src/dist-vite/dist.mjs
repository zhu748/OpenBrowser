import { b as e, d as t, i as n, o as r, p as i, s as a, x as o, y as s } from "./schemas.mjs";
import c from "axios";
// ../../packages/backend-api/dist/index.mjs
var l = /* @__PURE__ */ function(e) {
	return e.Json = "application/json", e.JsonApi = "application/vnd.api+json", e.FormData = "multipart/form-data", e.UrlEncoded = "application/x-www-form-urlencoded", e.Text = "text/plain", e;
}({}), u = class {
	instance;
	securityData = null;
	securityWorker;
	secure;
	format;
	constructor({ securityWorker: e, secure: t, format: n, ...r } = {}) {
		this.instance = c.create({
			...r,
			baseURL: r.baseURL || ""
		}), this.secure = t, this.format = n, this.securityWorker = e;
	}
	setSecurityData = (e) => {
		this.securityData = e;
	};
	mergeRequestParams(e, t) {
		let n = e.method || t && t.method;
		return {
			...this.instance.defaults,
			...e,
			...t || {},
			headers: {
				...n && this.instance.defaults.headers[n.toLowerCase()] || {},
				...e.headers || {},
				...t && t.headers || {}
			}
		};
	}
	stringifyFormItem(e) {
		return typeof e == "object" && e ? JSON.stringify(e) : `${e}`;
	}
	createFormData(e) {
		return e instanceof FormData ? e : Object.keys(e || {}).reduce((t, n) => {
			let r = e[n], i = r instanceof Array ? r : [r];
			for (let e of i) {
				let r = e instanceof Blob || e instanceof File;
				t.append(n, r ? e : this.stringifyFormItem(e));
			}
			return t;
		}, new FormData());
	}
	request = async ({ secure: e, path: t, type: n, query: r, format: i, body: a, ...o }) => {
		let s = (typeof e == "boolean" ? e : this.secure) && this.securityWorker && await this.securityWorker(this.securityData) || {}, c = this.mergeRequestParams(o, s), l = i || this.format || void 0;
		return n === "multipart/form-data" && a && typeof a == "object" && a && (a = this.createFormData(a)), n === "text/plain" && a && a !== null && typeof a != "string" && (a = JSON.stringify(a)), this.instance.request({
			...c,
			headers: {
				...c.headers || {},
				...n ? { "Content-Type": n } : {}
			},
			params: r,
			responseType: l,
			data: a,
			url: t
		}).then((e) => e.data);
	};
}, d = class {
	http;
	constructor(e) {
		this.http = e;
	}
	userGetWorkspaceListApiList = (e, t = {}) => this.http.request({
		path: "/user_get_workspace_list_api",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userDelWindowInfoApiV2Create = (e, t = {}) => this.http.request({
		path: "/user_del_window_info_api_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfWindowInfoRandomV2Create = (e, t = {}) => this.http.request({
		path: "/user_mdf_window_info_random_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userClearWindowCacheApiV2Create = (e, t = {}) => this.http.request({
		path: "/user_clear_window_cache_api_v2",
		method: "POST",
		body: e,
		format: "json",
		...t
	});
	userGetLabelInfoApiList = (e, t = {}) => this.http.request({
		path: "/user_get_label_info_api",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
}, f = class {
	http;
	constructor(e) {
		this.http = e;
	}
	userGetPlatformInfoV2List = (e, t = {}) => this.http.request({
		path: "/user_get_platform_info_v2",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetSearchEnginesList = (e = {}) => this.http.request({
		path: "/user_get_search_engines",
		method: "GET",
		format: "json",
		...e
	});
	userGetPlatformInfoList = (e, t = {}) => this.http.request({
		path: "/user_get_platform_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetPlatformTableSortOrderList = (e = {}) => this.http.request({
		path: "/user_get_platform_table_sort_order",
		method: "GET",
		format: "json",
		...e
	});
	userSavePlatformTableSortOrderCreate = (e, t = {}) => this.http.request({
		path: "/user_save_platform_table_sort_order",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetPlatformTableRowsList = (e = {}) => this.http.request({
		path: "/user_get_platform_table_rows",
		method: "GET",
		format: "json",
		...e
	});
	userUpdatePlatformTableRowsCreate = (e, t = {}) => this.http.request({
		path: "/user_update_platform_table_rows",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userAddPlatformInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_add_platform_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfPlatformInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_platform_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDelPlatformInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_del_platform_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userAddPlatformInfoBatchCreate = (e, t = {}) => this.http.request({
		path: "/user_add_platform_info_batch",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetPlatformUrlTreeList = (e = {}) => this.http.request({
		path: "/user_get_platform_url_tree",
		method: "GET",
		format: "json",
		...e
	});
}, p = class {
	http;
	constructor(e) {
		this.http = e;
	}
	userGetWindowInfoV2List = (e, t = {}) => this.http.request({
		path: "/user_get_window_info_v2",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userAddWindowInfoV2Create = (e, t = {}) => this.http.request({
		path: "/user_add_window_info_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfWindowInfoSingleV2Create = (e, t = {}) => this.http.request({
		path: "/user_mdf_window_info_single_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetWindowInfoListList = (e, t = {}) => this.http.request({
		path: "/user_get_window_info_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetWindowStatusInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_get_window_status_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userBatchWindowInfoV2Create = (e, t = {}) => this.http.request({
		path: "/user_batch_window_info_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userImportWindowInfoV2Create = (e, t = {}) => this.http.request({
		path: "/user_import_window_info_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userAnalysisWindowInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_analysis_window_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfWindowInfoBatchV2Create = (e, t = {}) => this.http.request({
		path: "/user_mdf_window_info_batch_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfWindowDataBatchCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_window_data_batch",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userModifyWindowReportTimeCreate = (e, t = {}) => this.http.request({
		path: "/user_modify_window_report_time",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userClearWindowCacheCreate = (e, t = {}) => this.http.request({
		path: "/user_clear_window_cache",
		method: "POST",
		body: e,
		format: "json",
		...t
	});
	userDelWindowInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_del_window_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfWindowSyncV2Create = (e, t = {}) => this.http.request({
		path: "/user_mdf_window_sync_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetUaWebglV2List = (e, t = {}) => this.http.request({
		path: "/user_get_ua_webgl_v2",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetBrowserVersionInfoList = (e, t = {}) => this.http.request({
		path: "/user_get_browserVersion_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetDeviceNameV2List = (e, t = {}) => this.http.request({
		path: "/user_get_device_name_v2",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetMacAddrV2List = (e, t = {}) => this.http.request({
		path: "/user_get_mac_addr_v2",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetLabelInfoList = (e, t = {}) => this.http.request({
		path: "/user_get_label_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userAddLabelInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_add_label_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfLabelInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_label_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDelLabelInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_del_label_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userUpdateWindowFilterNameCreate = (e, t = {}) => this.http.request({
		path: "/user_update_window_filter_name",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDeleteWindowFilterNameCreate = (e, t = {}) => this.http.request({
		path: "/user_delete_window_filter_name",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userAddWindowFilterNameCreate = (e, t = {}) => this.http.request({
		path: "/user_add_window_filter_name",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetWindowFilterNameListList = (e = {}) => this.http.request({
		path: "/user_get_window_filter_name_list",
		method: "GET",
		format: "json",
		...e
	});
	userUpdateWindowFilterSortCreate = (e, t = {}) => this.http.request({
		path: "/user_update_window_filter_sort",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSaveWindowTableSortOrderCreate = (e, t = {}) => this.http.request({
		path: "/user_save_window_table_sort_order",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetWindowTableSortOrderList = (e = {}) => this.http.request({
		path: "/user_get_window_table_sort_order",
		method: "GET",
		format: "json",
		...e
	});
	userGetWindowRowsSortList = (e = {}) => this.http.request({
		path: "/user_get_window_rows_sort",
		method: "GET",
		format: "json",
		...e
	});
	userSaveWindowRowsSortCreate = (e, t = {}) => this.http.request({
		path: "/user_save_window_rows_sort",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetWindowTemplateListList = (e = {}) => this.http.request({
		path: "/user_get_window_template_list",
		method: "GET",
		format: "json",
		...e
	});
	userAddWindowTemplateInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_add_window_template_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfWindowTemplateInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_window_template_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDeleteWindowTemplateInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_delete_window_template_info",
		method: "POST",
		body: e,
		format: "json",
		...t
	});
	userCreateWindowInspectList = (e = {}) => this.http.request({
		path: "/user_create_window_inspect",
		method: "GET",
		format: "json",
		...e
	});
	userCheckWindowTotalCountList = (e = {}) => this.http.request({
		path: "/user_check_window_total_count",
		method: "GET",
		format: "json",
		...e
	});
	userDelWindowInfoRecycleCreate = (e, t = {}) => this.http.request({
		path: "/user_del_window_info_recycle",
		method: "POST",
		body: e,
		format: "json",
		...t
	});
	userTransferWindowVerifyCodeList = (e, t = {}) => this.http.request({
		path: "/user_transfer_window_verify_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userTransferWindowCreate = (e, t = {}) => this.http.request({
		path: "/user_transfer_window",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetTransferWorkspaceListList = (e, t = {}) => this.http.request({
		path: "/user_get_transfer_workspace_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetTransferReceiveWindowListList = (e, t = {}) => this.http.request({
		path: "/user_get_transfer_receive_window_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userClearTransferWorkspaceCreate = (e, t = {}) => this.http.request({
		path: "/user_clear_transfer_workspace",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userAgreeTransferWindowCreate = (e, t = {}) => this.http.request({
		path: "/user_agree_transfer_window",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userRejectTransferWindowCreate = (e, t = {}) => this.http.request({
		path: "/user_reject_transfer_window",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userTransferWindowByWorkspaceIdCreate = (e, t = {}) => this.http.request({
		path: "/user_transfer_window_by_workspace_id",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetWindowPlatformAccountListList = (e = {}) => this.http.request({
		path: "/user_get_window_platform_account_list",
		method: "GET",
		format: "json",
		...e
	});
	userAgentTransferWindowCreate = (e, t = {}) => this.http.request({
		path: "/user_agent_transfer_window",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetAgentTransferWindowStatusList = (e = {}) => this.http.request({
		path: "/user_get_agent_transfer_window_status",
		method: "GET",
		format: "json",
		...e
	});
	userGetTransferRecordListList = (e, t = {}) => this.http.request({
		path: "/user_get_transfer_record_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetTransferTaskDetailsList = (e, t = {}) => this.http.request({
		path: "/user_get_transfer_task_details",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetAgentDeliveryDurationListList = (e = {}) => this.http.request({
		path: "/user_get_agent_delivery_duration_list",
		method: "GET",
		format: "json",
		...e
	});
	userActivateCloudBrowserCreate = (e, t = {}) => this.http.request({
		path: "/user_activate_cloud_browser",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetCloudBrowserInfoList = (e, t = {}) => this.http.request({
		path: "/user_get_cloud_browser_info",
		method: "GET",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfCloudBrowserActivateInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_cloud_browser_activate_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetCloudBrowserExperienceProxyList = (e, t = {}) => this.http.request({
		path: "/user_get_cloud_browser_experience_proxy",
		method: "GET",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfWindowProxyCheckBatchCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_window_proxy_check_batch",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetWindowOneClickConfigListList = (e = {}) => this.http.request({
		path: "/user_get_window_one_click_config_list",
		method: "GET",
		format: "json",
		...e
	});
	userGetWindowOneClickProxyInfoListList = (e, t = {}) => this.http.request({
		path: "/user_get_window_one_click_proxy_info_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userAddProxyTemplateCreate = (e, t = {}) => this.http.request({
		path: "/user_add_proxy_template",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyTemplateList = (e = {}) => this.http.request({
		path: "/user_get_proxy_template",
		method: "GET",
		format: "json",
		...e
	});
	userMdfProxyTemplateCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_proxy_template",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDeleteProxyTemplateCreate = (e, t = {}) => this.http.request({
		path: "/user_delete_proxy_template",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfPlatformBindWindowCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_platform_bind_window",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetWindowInfoDetailList = (e, t = {}) => this.http.request({
		path: "/user_get_window_info_detail",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetQuickCreateTemplateList = (e = {}) => this.http.request({
		path: "/user_get_quick_create_template",
		method: "GET",
		format: "json",
		...e
	});
	userAddQuickCreateTemplateCreate = (e, t = {}) => this.http.request({
		path: "/user_add_quick_create_template",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfQuickCreateTemplateCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_quick_create_template",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDeleteQuickCreateTemplateCreate = (e, t = {}) => this.http.request({
		path: "/user_delete_quick_create_template",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetWindowSortNumList = (e = {}) => this.http.request({
		path: "/user_get_window_sort_num",
		method: "GET",
		format: "json",
		...e
	});
}, m = class {
	http;
	constructor(e) {
		this.http = e;
	}
	loginCreate = (e, t = {}) => this.http.request({
		path: "/login",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userLogoutList = (e = {}) => this.http.request({
		path: "/user_logout",
		method: "GET",
		format: "json",
		...e
	});
	loginGoogleV2Create = (e, t = {}) => this.http.request({
		path: "/login_google_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	loginGithubCreate = (e, t = {}) => this.http.request({
		path: "/login_github",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	loginFacebookCreate = (e, t = {}) => this.http.request({
		path: "/login_facebook",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	loginVkCreate = (e, t = {}) => this.http.request({
		path: "/login_vk",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	loginLinuxDoCreate = (e, t = {}) => this.http.request({
		path: "/login_linux_do",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	postBase = (e, t = {}) => this.http.request({
		path: "/reg",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	sendEmailRegisterVerifyCodeList = (e, t = {}) => this.http.request({
		path: "/send_email_register_verify_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	sendEmailForgetVerifyCodeList = (e, t = {}) => this.http.request({
		path: "/send_email_forget_verify_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	forgetPasswordCreate = (e, t = {}) => this.http.request({
		path: "/forget_password",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userChangeAccountCreate = (e, t = {}) => this.http.request({
		path: "/user_change_account",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userChangeUsernameCreate = (e, t = {}) => this.http.request({
		path: "/user_change_username",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userChangePwdCreate = (e, t = {}) => this.http.request({
		path: "/user_change_pwd",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSettingPasswordCreate = (e, t = {}) => this.http.request({
		path: "/user_setting_password",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSettingPasswordVerifyCodeList = (e, t = {}) => this.http.request({
		path: "/user_setting_password_verify_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	getCheckBindEmailVerCodeList = (e, t = {}) => this.http.request({
		path: "/get_check_bind_email_ver_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userSendEmailVerifyCodeList = (e, t = {}) => this.http.request({
		path: "/user_send_email_verify_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userVerifyEmailCreate = (e, t = {}) => this.http.request({
		path: "/user_verify_email",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetCheckOldEmailVerCodeList = (e, t = {}) => this.http.request({
		path: "/user_get_check_old_email_ver_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userChangeEmailCreate = (e, t = {}) => this.http.request({
		path: "/user_change_email",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetUserInfoList = (e = {}) => this.http.request({
		path: "/user_get_user_info",
		method: "GET",
		format: "json",
		...e
	});
	userGetAppUpgradeCreate = (e, t = {}) => this.http.request({
		path: "/user_get_app_upgrade",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	getAppUpgradeCreate = (e, t = {}) => this.http.request({
		path: "/get_app_upgrade",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetCoreUpgradeCreate = (e, t = {}) => this.http.request({
		path: "/user_get_core_upgrade",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	getCoreUpgradeCreate = (e, t = {}) => this.http.request({
		path: "/get_core_upgrade",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetUserConfigList = (e = {}) => this.http.request({
		path: "/user_get_user_config",
		method: "GET",
		format: "json",
		...e
	});
	userGetDefConfigList = (e = {}) => this.http.request({
		path: "/user_get_def_config",
		method: "GET",
		format: "json",
		...e
	});
	userSetUserConfigCreate = (e, t = {}) => this.http.request({
		path: "/user_set_user_config",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetUserApiList = (e = {}) => this.http.request({
		path: "/user_get_user_api",
		method: "GET",
		format: "json",
		...e
	});
	userSetUserApiCreate = (e, t = {}) => this.http.request({
		path: "/user_set_user_api",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetDictVersionList = (e = {}) => this.http.request({
		path: "/user_get_dict_version",
		method: "GET",
		format: "json",
		...e
	});
	userGetSystemDictV2Create = (e, t = {}) => this.http.request({
		path: "/user_get_system_dict_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetAnntListList = (e = {}) => this.http.request({
		path: "/user_get_annt_list",
		method: "GET",
		format: "json",
		...e
	});
	userGetNotifyList = (e, t = {}) => this.http.request({
		path: "/user_get_notify",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userReadNotifyCreate = (e, t = {}) => this.http.request({
		path: "/user_read_notify",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetOssCredentialV2List = (e = {}) => this.http.request({
		path: "/user_get_oss_credential_v2",
		method: "GET",
		format: "json",
		...e
	});
	userUploadAvatarCreate = (e, t = {}) => this.http.request({
		path: "/user_upload_avatar",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMigrateDataList = (e = {}) => this.http.request({
		path: "/user_migrate_data",
		method: "GET",
		format: "json",
		...e
	});
	saveChannelSourcesPeopleList = (e, t = {}) => this.http.request({
		path: "/save_channel_sources_people",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	savePromotionLinkClickCountList = (e, t = {}) => this.http.request({
		path: "/save_promotion_link_click_count",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetInviteCodeList = (e = {}) => this.http.request({
		path: "/user_get_invite_code",
		method: "GET",
		format: "json",
		...e
	});
	userGetInviteLinkList = (e = {}) => this.http.request({
		path: "/user_get_invite_link",
		method: "GET",
		format: "json",
		...e
	});
	userWriteInviteCodeCreate = (e, t = {}) => this.http.request({
		path: "/user_write_invite_code",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetBannerPictureListList = (e, t = {}) => this.http.request({
		path: "/user_get_banner_picture_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	checkOtherDeviceLoginList = (e, t = {}) => this.http.request({
		path: "/check_other_device_login",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	checkEmailRegisteredList = (e, t = {}) => this.http.request({
		path: "/check_email_registered",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetLoginInfoList = (e = {}) => this.http.request({
		path: "/user_get_login_info",
		method: "GET",
		format: "json",
		...e
	});
	userGetInviteUserListV2List = (e, t = {}) => this.http.request({
		path: "/user_get_invite_user_list_v2",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetRewardRecordListList = (e, t = {}) => this.http.request({
		path: "/user_get_reward_record_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetWithdrawRecordListList = (e, t = {}) => this.http.request({
		path: "/user_get_withdraw_record_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetPromotionInfoList = (e = {}) => this.http.request({
		path: "/user_get_promotion_info",
		method: "GET",
		format: "json",
		...e
	});
	userWithdrawCreate = (e, t = {}) => this.http.request({
		path: "/user_withdraw",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userWithdrawVerifyCodeList = (e, t = {}) => this.http.request({
		path: "/user_withdraw_verify_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetBannerPictureListV2List = (e, t = {}) => this.http.request({
		path: "/user_get_banner_picture_list_v2",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userBindEmailListList = (e = {}) => this.http.request({
		path: "/user_bind_email_list",
		method: "GET",
		format: "json",
		...e
	});
	userBindEmailCreate = (e, t = {}) => this.http.request({
		path: "/user_bind_email",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userUnbindEmailCreate = (e, t = {}) => this.http.request({
		path: "/user_unbind_email",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userBindEmailVerifyCodeList = (e, t = {}) => this.http.request({
		path: "/user_bind_email_verify_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userSettingAccountPasswordCreate = (e, t = {}) => this.http.request({
		path: "/user_setting_account_password",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSendAccountPasswordVerifyCodeList = (e, t = {}) => this.http.request({
		path: "/user_send_account_password_verify_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userModifyRemarkDisplayStatusCreate = (e, t = {}) => this.http.request({
		path: "/user_modify_remark_display_status",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSendValidatorVerifyCodeList = (e = {}) => this.http.request({
		path: "/user_send_validator_verify_code",
		method: "GET",
		format: "json",
		...e
	});
	userVerifyValidatorVerifyCodeList = (e, t = {}) => this.http.request({
		path: "/user_verify_validator_verify_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	getValidatorTokenInfoList = (e, t = {}) => this.http.request({
		path: "/get_validator_token_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	getPersonalVerifyValidatorCodeList = (e, t = {}) => this.http.request({
		path: "/get_personal_verify_validator_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	sendValidatorEmailVerifyCodeList = (e, t = {}) => this.http.request({
		path: "/send_validator_email_verify_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	generateValidatorRecoverCodeList = (e, t = {}) => this.http.request({
		path: "/generate_validator_recover_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	validatorBindCreate = (e, t = {}) => this.http.request({
		path: "/validator_bind",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userCloseValidatorCreate = (e, t = {}) => this.http.request({
		path: "/user_close_validator",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetValidatorBindInfoList = (e = {}) => this.http.request({
		path: "/user_get_validator_bind_info",
		method: "GET",
		format: "json",
		...e
	});
	userGetValidatorInfoList = (e, t = {}) => this.http.request({
		path: "/user_get_validator_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userUpdateValidatorTokenCreate = (e, t = {}) => this.http.request({
		path: "/user_update_validator_token",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	checkRecoverCodeCreate = (e, t = {}) => this.http.request({
		path: "/check_recover_code",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	checkEmailPasswordCreate = (e, t = {}) => this.http.request({
		path: "/check_email_password",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	verifyValidatorEmailVerifyCodeCreate = (e, t = {}) => this.http.request({
		path: "/verify_validator_email_verify_code",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	get2FaLoginInfoList = (e, t = {}) => this.http.request({
		path: "/get_2fa_login_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	checkEmailOr2FaVerifyList = (e, t = {}) => this.http.request({
		path: "/check_email_or_2fa_verify",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetPromotionInfoByTypeList = (e, t = {}) => this.http.request({
		path: "/user_get_promotion_info_by_type",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetGuideVideosByTypeList = (e, t = {}) => this.http.request({
		path: "/user_get_guide_videos_by_type",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userUpdateDeviceNameCreate = (e, t = {}) => this.http.request({
		path: "/user_update_device_name",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userUpdateOnboardingTaskStatusCreate = (e, t = {}) => this.http.request({
		path: "/user_update_onboarding_task_status",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	getFaqHelpList = (e = {}) => this.http.request({
		path: "/get_faq_help",
		method: "GET",
		format: "json",
		...e
	});
	userIsNaifeiUserList = (e = {}) => this.http.request({
		path: "/user_is_naifei_user",
		method: "GET",
		format: "json",
		...e
	});
	getBlackFridayTimeList = (e = {}) => this.http.request({
		path: "/get_black_friday_time",
		method: "GET",
		format: "json",
		...e
	});
	userSubmitSurveyAnswerCreate = (e, t = {}) => this.http.request({
		path: "/user_submit_survey_answer",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	sendPhoneVerCodeCreate = (e, t = {}) => this.http.request({
		path: "/send_phone_ver_code",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	loginPhoneCreate = (e, t = {}) => this.http.request({
		path: "/login_phone",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userBindPhoneCreate = (e, t = {}) => this.http.request({
		path: "/user_bind_phone",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSetPromotionLinkShowCreate = (e, t = {}) => this.http.request({
		path: "/user_set_promotion_link_show",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	getPromotionLinkDiscountAndUsernameList = (e = {}) => this.http.request({
		path: "/get_promotion_link_discount_and_username",
		method: "GET",
		format: "json",
		...e
	});
	userGetLlmInfoList = (e = {}) => this.http.request({
		path: "/user_get_llm_info",
		method: "GET",
		format: "json",
		...e
	});
	userGetPromptTemplateListList = (e = {}) => this.http.request({
		path: "/user_get_prompt_template_list",
		method: "GET",
		format: "json",
		...e
	});
	userSaveLlmDataCreate = (e, t = {}) => this.http.request({
		path: "/user_save_llm_data",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetUninstallReasonQuestionListList = (e = {}) => this.http.request({
		path: "/user_get_uninstall_reason_question_list",
		method: "GET",
		format: "json",
		...e
	});
	userRegisterGiftConfigList = (e = {}) => this.http.request({
		path: "/user_register_gift_config",
		method: "GET",
		format: "json",
		...e
	});
	userRegGiftCreate = (e, t = {}) => this.http.request({
		path: "/user_reg_gift",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	getSpringFestivalTimeList = (e = {}) => this.http.request({
		path: "/get_spring_festival_time",
		method: "GET",
		format: "json",
		...e
	});
	userGetCheckPhoneVerCodeCreate = (e, t = {}) => this.http.request({
		path: "/user_get_check_phone_ver_code",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	getActivityDiscountList = (e = {}) => this.http.request({
		path: "/get_activity_discount",
		method: "GET",
		format: "json",
		...e
	});
	userCalcLlmTokenCostCreate = (e, t = {}) => this.http.request({
		path: "/user_calc_llm_token_cost",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetInviteNotifyList = (e = {}) => this.http.request({
		path: "/user_get_invite_notify",
		method: "GET",
		format: "json",
		...e
	});
	userAppRating = (e, t = {}) => this.http.request({
		path: "/user_app_rating",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSentryClientCreate = (e, t = {}) => this.http.request({
		path: "/user_sentry_client",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetPhoneList = (e = {}) => this.http.request({
		path: "/user_get_phone",
		method: "GET",
		format: "json",
		...e
	});
	getEasterPromoTimeList = (e = {}) => this.http.request({
		path: "/get_easter_promo_time",
		method: "GET",
		format: "json",
		...e
	});
	userSetRoxyClawCreate = (e, t = {}) => this.http.request({
		path: "/user_set_roxy_claw",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	getMayFreedomSeasonPromoTimeList = (e = {}) => this.http.request({
		path: "/get_may_freedom_season_promo_time",
		method: "GET",
		format: "json",
		...e
	});
	userMayFreedomResultList = (e = {}) => this.http.request({
		path: "/user_may_freedom_result",
		method: "GET",
		format: "json",
		...e
	});
	getEcommerceWhitelistDomainsList = (e = {}) => this.http.request({
		path: "/get_ecommerce_whitelist_domains",
		method: "GET",
		format: "json",
		...e
	});
	userGetRpaScriptLibraryListList = (e = {}) => this.http.request({
		path: "/user_get_rpa_script_library_list",
		method: "GET",
		format: "json",
		...e
	});
	uninstallReasonReportCreate = (e, t = {}) => this.http.request({
		path: "/uninstall_reason_report",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetInfluencerRankingList = (e = {}) => this.http.request({
		path: "/user_get_influencer_ranking",
		method: "GET",
		format: "json",
		...e
	});
	userGetPromotionLinkListList = (e = {}) => this.http.request({
		path: "/user_get_promotion_link_list",
		method: "GET",
		format: "json",
		...e
	});
	userReportAppEventCreate = (e, t = {}) => this.http.request({
		path: "/user_report_app_event",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	checkPhoneRegisteredList = (e, t, n = {}) => this.http.request({
		path: "/check_phone_registered",
		method: "GET",
		query: e,
		body: t,
		type: l.Json,
		format: "json",
		...n
	});
	getJuneRechargePromoTimeList = (e = {}) => this.http.request({
		path: "/get_june_recharge_promo_time",
		method: "GET",
		format: "json",
		...e
	});
	userModifyPromotionLinkCreate = (e, t = {}) => this.http.request({
		path: "/user_modify_promotion_link",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	appUpdateDetail = ({ ymlFile: e, ...t }, n = {}) => this.http.request({
		path: `/app_update/${e}`,
		method: "GET",
		query: t,
		...n
	});
	getCoreDownloadUrlsCreate = (e, t = {}) => this.http.request({
		path: "/get_core_download_urls",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetAppFeatureTipsCreate = (e, t = {}) => this.http.request({
		path: "/user_get_app_feature_tips",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetMessageTipsCreate = (e, t = {}) => this.http.request({
		path: "/user_get_message_tips",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetNewUserBenefitConfigList = (e = {}) => this.http.request({
		path: "/user_get_new_user_benefit_config",
		method: "GET",
		format: "json",
		...e
	});
	getVersionUpdateRemindList = (e = {}) => this.http.request({
		path: "/get_version_update_remind",
		method: "GET",
		format: "json",
		...e
	});
	sendEmailRegisterCaptchaTriggerList = (e = {}) => this.http.request({
		path: "/send_email_register_captcha_trigger",
		method: "GET",
		format: "json",
		...e
	});
	getFaqHelpList2 = (e = {}) => this.http.request({
		path: "/app_statistics/get_faq_help",
		method: "GET",
		format: "json",
		...e
	});
	getQrcodeInfoList = (e = {}) => this.http.request({
		path: "/app_statistics/get_qrcode_info",
		method: "GET",
		format: "json",
		...e
	});
	userGetRatingRewardCreate = (e, t = {}) => this.http.request({
		path: "/user_get_rating_reward",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetRoxyClawList = (e = {}) => this.http.request({
		path: "/user_get_roxy_claw",
		method: "GET",
		format: "json",
		...e
	});
	reportAppVersionUpdateCreate = (e, t = {}) => this.http.request({
		path: "/report_app_version_update",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	getUninstallReasonQuestionListList = (e = {}) => this.http.request({
		path: "/get_uninstall_reason_question_list",
		method: "GET",
		format: "json",
		...e
	});
	getTgWechatQrcodeList = (e = {}) => this.http.request({
		path: "/get_tg_wechat_qrcode",
		method: "GET",
		format: "json",
		...e
	});
	getMidAutumnPromoTimeList = (e = {}) => this.http.request({
		path: "/get_mid_autumn_promo_time",
		method: "GET",
		format: "json",
		...e
	});
	userGetExclusiveRewardContactList = (e = {}) => this.http.request({
		path: "/user_get_exclusive_reward_contact",
		method: "GET",
		format: "json",
		...e
	});
}, h = class {
	http;
	constructor(e) {
		this.http = e;
	}
	userGetProxyModuleList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_module",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userAddProxyModuleCreate = (e, t = {}) => this.http.request({
		path: "/user_add_proxy_module",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfProxyModuleCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_proxy_module",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDelProxyModuleV2Create = (e, t = {}) => this.http.request({
		path: "/user_del_proxy_module_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyTableSortOrderList = (e = {}) => this.http.request({
		path: "/user_get_proxy_table_sort_order",
		method: "GET",
		format: "json",
		...e
	});
	userSaveProxyTableSortOrderCreate = (e, t = {}) => this.http.request({
		path: "/user_save_proxy_table_sort_order",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyTableRowsList = (e = {}) => this.http.request({
		path: "/user_get_proxy_table_rows",
		method: "GET",
		format: "json",
		...e
	});
	userUpdateProxyTableRowsCreate = (e, t = {}) => this.http.request({
		path: "/user_update_proxy_table_rows",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyRecommendInfoList = (e = {}) => this.http.request({
		path: "/user_get_proxy_recommend_info",
		method: "GET",
		format: "json",
		...e
	});
	userGetTimezoneByCoordinatesInfoList = (e, t = {}) => this.http.request({
		path: "/user_get_timezone_by_coordinates_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetUserBuyProxyListList = (e, t = {}) => this.http.request({
		path: "/user_get_user_buy_proxy_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetProxyProviderListList = (e = {}) => this.http.request({
		path: "/user_get_proxy_provider_list",
		method: "GET",
		format: "json",
		...e
	});
	userGetProxyBusinessUseListList = (e = {}) => this.http.request({
		path: "/user_get_proxy_business_use_list",
		method: "GET",
		format: "json",
		...e
	});
	userGetProxyPurchaseCountryListList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_purchase_country_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetProxyPurchaseTimePriceList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_purchase_time_price",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userMdfUserBuyProxyRemarkCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_user_buy_proxy_remark",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userProxyRefundOrReplaceCreate = (e, t = {}) => this.http.request({
		path: "/user_proxy_refund_or_replace",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userCheckProxyCreate = (e, t = {}) => this.http.request({
		path: "/user_check_proxy",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userCheckWindowProxyStatusCreate = (e, t = {}) => this.http.request({
		path: "/user_check_window_proxy_status",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyRefundInfoList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_refund_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetProxyAllCountriesList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_all_countries",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetTimezoneByIpList = (e, t = {}) => this.http.request({
		path: "/user_get_timezone_by_ip",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetPromotionRedeemCodeListList = (e, t = {}) => this.http.request({
		path: "/user_get_promotion_redeem_code_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userRedeemProxyCodeCreate = (e, t = {}) => this.http.request({
		path: "/user_redeem_proxy_code",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSetProxyAutoRenewalCreate = (e, t = {}) => this.http.request({
		path: "/user_set_proxy_auto_renewal",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyProvidersTypeList = (e = {}) => this.http.request({
		path: "/user_get_proxy_providers_type",
		method: "GET",
		format: "json",
		...e
	});
	userRegisterProxyProviderUserCreate = (e, t = {}) => this.http.request({
		path: "/user_register_proxy_provider_user",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyStoreListList = (e = {}) => this.http.request({
		path: "/user_get_proxy_store_list",
		method: "GET",
		format: "json",
		...e
	});
	getConsumptionGiftIpConfigList = (e = {}) => this.http.request({
		path: "/get_consumption_gift_ip_config",
		method: "GET",
		format: "json",
		...e
	});
	userGetProxyCountryPriceListList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_country_price_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetProxyListMergedList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_list_merged",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetProxyVendorListList = (e = {}) => this.http.request({
		path: "/user_get_proxy_vendor_list",
		method: "GET",
		format: "json",
		...e
	});
	userGetProxyBusinessSceneListList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_business_scene_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetProxyProvidersByBusinessSceneList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_providers_by_business_scene",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetProxyCountryListByContinentList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_country_list_by_continent",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetProxyVendorJumpInfoList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_vendor_jump_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userReportProxyOutOfStockCreate = (e, t = {}) => this.http.request({
		path: "/user_report_proxy_out_of_stock",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userBatchMdfProxyModuleCheckCreate = (e, t = {}) => this.http.request({
		path: "/user_batch_mdf_proxy_module_check",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyDetailMergedList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_detail_merged",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetProxyCountryListByBusinessSceneList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_country_list_by_business_scene",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetProxyProvidersByBusinessSceneCountryList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_providers_by_business_scene_country",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userUpgradeProxyBandwidthSettlementCreate = (e, t = {}) => this.http.request({
		path: "/user_upgrade_proxy_bandwidth_settlement",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfProxyBindWindowCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_proxy_bind_window",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyBandwidthUpgradePriceListList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_bandwidth_upgrade_price_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userRenewDeviceProxySettlementCreate = (e, t = {}) => this.http.request({
		path: "/user_renew_device_proxy_settlement",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyRenewPriceListList = (e = {}) => this.http.request({
		path: "/user_get_proxy_renew_price_list",
		method: "GET",
		format: "json",
		...e
	});
	userExportProxyDeviceInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_export_proxy_device_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyOperateRecordListCreate = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_operate_record_list",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userCheckProxyBindRiskCreate = (e, t = {}) => this.http.request({
		path: "/user_check_proxy_bind_risk",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyDeviceDetailList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_device_detail",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userBatchCheckProxyImportCreate = (e, t = {}) => this.http.request({
		path: "/user_batch_check_proxy_import",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyDeviceBoundAccountsList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_device_bound_accounts",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userAddProxyModuleV2Create = (e, t = {}) => this.http.request({
		path: "/user_add_proxy_module_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetRandomAvailableProxyMergedList = (e = {}) => this.http.request({
		path: "/user_get_random_available_proxy_merged",
		method: "GET",
		format: "json",
		...e
	});
	userBatchSetProxyAutoRenewalCreate = (e, t = {}) => this.http.request({
		path: "/user_batch_set_proxy_auto_renewal",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyExpiringSoonListList = (e, t = {}) => this.http.request({
		path: "/user_get_proxy_expiring_soon_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userRegisterProxyProviderUserV2Create = (e, t = {}) => this.http.request({
		path: "/user_register_proxy_provider_user_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetProxyDurationDiscountsByDaysList = (e = {}) => this.http.request({
		path: "/user_get_proxy_duration_discounts_by_days",
		method: "GET",
		format: "json",
		...e
	});
}, g = class {
	http;
	constructor(e) {
		this.http = e;
	}
	userUploadChromePluginsV2Create = (e, t = {}) => this.http.request({
		path: "/user_upload_chrome_plugins_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userUploadPluginInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_upload_plugin_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userRecordPluginUploadV2List = (e = {}) => this.http.request({
		path: "/user_record_plugin_upload_v2",
		method: "GET",
		format: "json",
		...e
	});
	userGetPluginCategoryList = (e = {}) => this.http.request({
		path: "/user_get_plugin_category",
		method: "GET",
		format: "json",
		...e
	});
	userGetSystemPluginList = (e, t = {}) => this.http.request({
		path: "/user_get_system_plugin",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userAddSystemPluginCreate = (e, t = {}) => this.http.request({
		path: "/user_add_system_plugin",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetPluginListList = (e, t = {}) => this.http.request({
		path: "/user_get_plugin_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetPluginInfoByIdList = (e, t = {}) => this.http.request({
		path: "/user_get_plugin_info_by_id",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userDelPluginInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_del_plugin_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userBatchDelPluginInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_batch_del_plugin_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userCheckAllPluginsVersionList = (e, t = {}) => this.http.request({
		path: "/user_check_all_plugins_version",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userUpgradePluginsCreate = (e, t = {}) => this.http.request({
		path: "/user_upgrade_plugins",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetPluginWindowList = (e, t = {}) => this.http.request({
		path: "/user_get_plugin_window",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userAddPluginToWindowCreate = (e, t = {}) => this.http.request({
		path: "/user_add_plugin_to_window",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userFixedPluginToWindowCreate = (e, t = {}) => this.http.request({
		path: "/user_fixed_plugin_to_window",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userReportSystemPluginErrorCreate = (e, t = {}) => this.http.request({
		path: "/user_report_system_plugin_error",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
}, _ = class {
	http;
	constructor(e) {
		this.http = e;
	}
	userGetMemberInfoByWorkspaceList = (e, t = {}) => this.http.request({
		path: "/user_get_member_info_by_workspace",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userMdfTeamInfoV2Create = (e, t = {}) => this.http.request({
		path: "/user_mdf_team_info_v2",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDelTeamInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_del_team_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userAddTeamNicknameCreate = (e, t = {}) => this.http.request({
		path: "/user_add_team_nickname",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userAddTeamWorkspaceNicknameCreate = (e, t = {}) => this.http.request({
		path: "/user_add_team_workspace_nickname",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetTeamPermissionsList = (e, t = {}) => this.http.request({
		path: "/user_get_team_permissions",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userUpdateTeamPermissionsCreate = (e, t = {}) => this.http.request({
		path: "/user_update_team_permissions",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetRolePermissionsList = (e, t = {}) => this.http.request({
		path: "/user_get_role_permissions",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetTeamPermissionVerifyStatusList = (e = {}) => this.http.request({
		path: "/user_get_team_permission_verify_status",
		method: "GET",
		format: "json",
		...e
	});
	userSendTeamPermissionVerifyCodeList = (e = {}) => this.http.request({
		path: "/user_send_team_permission_verify_code",
		method: "GET",
		format: "json",
		...e
	});
	userSetTeamCostCenterViewerEditorAllowCreate = (e, t = {}) => this.http.request({
		path: "/user_set_team_cost_center_viewer_editor_allow",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfWorkspaceTypeCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_workspace_type",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSelectOnboardingWorkspaceTypeCreate = (e, t = {}) => this.http.request({
		path: "/user_select_onboarding_workspace_type",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDelProjectMemberCreate = (e, t = {}) => this.http.request({
		path: "/user_del_project_member",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
}, v = class {
	http;
	constructor(e) {
		this.http = e;
	}
	userGetOperateLogList = (e, t = {}) => this.http.request({
		path: "/user_get_operate_log",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetLoginLogList = (e, t = {}) => this.http.request({
		path: "/user_get_login_log",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
}, y = class {
	http;
	constructor(e) {
		this.http = e;
	}
	userGetWorkspaceListList = (e = {}) => this.http.request({
		path: "/user_get_workspace_list",
		method: "GET",
		format: "json",
		...e
	});
	userAddWorkspaceInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_add_workspace_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfWorkspaceInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_workspace_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDelWorkspaceInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_del_workspace_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userLeaveWorkspaceList = (e, t = {}) => this.http.request({
		path: "/user_leave_workspace",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userMdfWorkspaceTipInfoList = (e = {}) => this.http.request({
		path: "/user_mdf_workspace_tip_info",
		method: "GET",
		format: "json",
		...e
	});
	userGetPublicWorkspaceListList = (e = {}) => this.http.request({
		path: "/user_get_public_workspace_list",
		method: "GET",
		format: "json",
		...e
	});
	userGetProjectInfoByWorkspaceList = (e, t = {}) => this.http.request({
		path: "/user_get_project_info_by_workspace",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetMemberInfoByProjectIdList = (e, t = {}) => this.http.request({
		path: "/user_get_member_info_by_project_id",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetTopProjectInfoList = (e = {}) => this.http.request({
		path: "/user_get_top_project_info",
		method: "GET",
		format: "json",
		...e
	});
	userAddProjectInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_add_project_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfProjectInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_project_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userDelProjectInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_del_project_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userInviteCreate = (e, t = {}) => this.http.request({
		path: "/user_invite",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userBatchInviteCreate = (e, t = {}) => this.http.request({
		path: "/user_batch_invite",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userAddUserByProjectInfoCreate = (e, t = {}) => this.http.request({
		path: "/user_add_user_by_project_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userShowInvitationLinkStatusCreate = (e, t = {}) => this.http.request({
		path: "/user_show_invitation_link_status",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	checkAddUserByProjectInfoCreate = (e, t = {}) => this.http.request({
		path: "/check_add_user_by_project_info",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userMdfProjectSortCreate = (e, t = {}) => this.http.request({
		path: "/user_mdf_project_sort",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
}, b = class {
	http;
	constructor(e) {
		this.http = e;
	}
	userGetUserPayInfoList = (e = {}) => this.http.request({
		path: "/user_get_user_pay_info",
		method: "GET",
		format: "json",
		...e
	});
	userGetWindowPricingRulesListList = (e = {}) => this.http.request({
		path: "/user_get_window_pricing_rules_list",
		method: "GET",
		format: "json",
		...e
	});
	userGetDurationDiscountsList = (e = {}) => this.http.request({
		path: "/user_get_duration_discounts",
		method: "GET",
		format: "json",
		...e
	});
	userGetPurchaseRecordsInfoList = (e, t = {}) => this.http.request({
		path: "/user_get_purchase_records_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetSupportPayTypeList = (e, t = {}) => this.http.request({
		path: "/user_get_support_pay_type",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userQueryOrderStatusList = (e, t = {}) => this.http.request({
		path: "/user_query_order_status",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetPayLinkList = (e, t = {}) => this.http.request({
		path: "/user_get_pay_link",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userSevenDayTrialCreate = (e, t = {}) => this.http.request({
		path: "/user_seven_day_trial",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userPaySettlementCreate = (e, t = {}) => this.http.request({
		path: "/user_pay_settlement",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userRechargeSettlementCreate = (e, t = {}) => this.http.request({
		path: "/user_recharge_settlement",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userWalletSettlementCreate = (e, t = {}) => this.http.request({
		path: "/user_wallet_settlement",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userCalculatePriceDifferenceList = (e, t = {}) => this.http.request({
		path: "/user_calculate_price_difference",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userCalculatePriceDifferenceV2List = (e, t = {}) => this.http.request({
		path: "/user_calculate_price_difference_v2",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userManageSubscriptionList = (e, t = {}) => this.http.request({
		path: "/user_manage_subscription",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userCancelSubscriptionList = (e, t = {}) => this.http.request({
		path: "/user_cancel_subscription",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userDowngradeSubscriptionList = (e, t = {}) => this.http.request({
		path: "/user_downgrade_subscription",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userDowngradeSubscriptionV2List = (e, t = {}) => this.http.request({
		path: "/user_downgrade_subscription_v2",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userUpdatePayTipsList = (e, t = {}) => this.http.request({
		path: "/user_update_pay_tips",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userCalculateWindowMonthsPriceList = (e, t = {}) => this.http.request({
		path: "/user_calculate_window_months_price",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userAutoRenewUpgradeList = (e, t = {}) => this.http.request({
		path: "/user_auto_renew_upgrade",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetDowngradeSubscriptionInfoList = (e = {}) => this.http.request({
		path: "/user_get_downgrade_subscription_info",
		method: "GET",
		format: "json",
		...e
	});
	userUpdateGiftTipsList = (e = {}) => this.http.request({
		path: "/user_update_gift_tips",
		method: "GET",
		format: "json",
		...e
	});
	userCheckTeamUserRightsList = (e = {}) => this.http.request({
		path: "/user_check_team_user_rights",
		method: "GET",
		format: "json",
		...e
	});
	userGetAutoSubscriptionInfoList = (e, t = {}) => this.http.request({
		path: "/user_get_auto_subscription_info",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userBuyProxySettlementCreate = (e, t = {}) => this.http.request({
		path: "/user_buy_proxy_settlement",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSetAutoRenewalStatusCreate = (e, t = {}) => this.http.request({
		path: "/user_set_auto_renewal_status",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetPendingPaymentListList = (e, t = {}) => this.http.request({
		path: "/user_get_pending_payment_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetStripePkKeyList = (e, t = {}) => this.http.request({
		path: "/user_get_stripe_pk_key",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userBindCardCreate = (e, t = {}) => this.http.request({
		path: "/user_bind_card",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetBindCardListList = (e, t = {}) => this.http.request({
		path: "/user_get_bind_card_list",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userSetAutoRechargeStatusCreate = (e, t = {}) => this.http.request({
		path: "/user_set_auto_recharge_status",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userUnbindCardCreate = (e, t = {}) => this.http.request({
		path: "/user_unbind_card",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userSetMainCardCreate = (e, t = {}) => this.http.request({
		path: "/user_set_main_card",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetWindowSubscriptionUpgradeMessageList = (e, t = {}) => this.http.request({
		path: "/user_get_window_subscription_upgrade_message",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetStablecoinInfoList = (e = {}) => this.http.request({
		path: "/user_get_stablecoin_info",
		method: "GET",
		format: "json",
		...e
	});
	userRedeemWindowCodeCreate = (e, t = {}) => this.http.request({
		path: "/user_redeem_window_code",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userQueryRedeemCodeList = (e, t = {}) => this.http.request({
		path: "/user_query_redeem_code",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userRedeemCodeListList = (e = {}) => this.http.request({
		path: "/user_redeem_code_list",
		method: "GET",
		format: "json",
		...e
	});
	userPayCaptchaTriggerList = (e = {}) => this.http.request({
		path: "/user_pay_captcha_trigger",
		method: "GET",
		format: "json",
		...e
	});
	userGetPayChannelFeesList = (e, t = {}) => this.http.request({
		path: "/user_get_pay_channel_fees",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userGetDurationDiscountsByDaysList = (e, t = {}) => this.http.request({
		path: "/user_get_duration_discounts_by_days",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userPermanentWindowSettlementCreate = (e, t = {}) => this.http.request({
		path: "/user_permanent_window_settlement",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	queryOrderStatusList = (e, t = {}) => this.http.request({
		path: "/app_statistics/query_order_status",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userMidAutumnLotteryPrizesList = (e = {}) => this.http.request({
		path: "/user_mid_autumn_lottery_prizes",
		method: "GET",
		format: "json",
		...e
	});
	userMidAutumnLotteryDrawCreate = (e = {}) => this.http.request({
		path: "/user_mid_autumn_lottery_draw",
		method: "POST",
		format: "json",
		...e
	});
	userGetCloudphonePlanOptionsCreate = (e, t = {}) => this.http.request({
		path: "/user_get_cloudphone_plan_options",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userCloudphoneQuoteCreate = (e, t = {}) => this.http.request({
		path: "/user_cloudphone_quote",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userCloudphoneSettlementCreate = (e, t = {}) => this.http.request({
		path: "/user_cloudphone_settlement",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userCloudphonePlanChangeCreate = (e, t = {}) => this.http.request({
		path: "/user_cloudphone_plan_change",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userCloudphonePlanRenewCreate = (e, t = {}) => this.http.request({
		path: "/user_cloudphone_plan_renew",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetExclusiveCouponsList = (e = {}) => this.http.request({
		path: "/user_get_exclusive_coupons",
		method: "GET",
		format: "json",
		...e
	});
	userSubmitExclusiveRewardPhoneCreate = (e, t = {}) => this.http.request({
		path: "/user_submit_exclusive_reward_phone",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	userGetMyCouponListList = (e = {}) => this.http.request({
		path: "/user_get_my_coupon_list",
		method: "GET",
		format: "json",
		...e
	});
	userGetExclusiveRewardDetailList = (e, t = {}) => this.http.request({
		path: "/user_get_exclusive_reward_detail",
		method: "GET",
		query: e,
		format: "json",
		...t
	});
	userMidAutumnClaimCaptchaTriggerList = (e = {}) => this.http.request({
		path: "/user_mid_autumn_claim_captcha_trigger",
		method: "GET",
		format: "json",
		...e
	});
}, x = class {
	http;
	constructor(e) {
		this.http = e;
	}
	appTrackingEventCreate = (e, t = {}) => this.http.request({
		path: "/app_tracking_event",
		method: "POST",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
	appTrackingEventDelete = (e, t = {}) => this.http.request({
		path: "/app_tracking_event",
		method: "DELETE",
		body: e,
		type: l.Json,
		format: "json",
		...t
	});
}, S = /password|passcode|cookie|token|api[\s_-]?key|secret|authorization|credential|密码|口令|令牌|密钥|凭证/i, C = e().trim().min(1).max(80), w = e().trim().min(1).max(64), ee = e().trim().min(1).max(80), te = o([
	e().trim().max(256),
	i().finite(),
	a(),
	n()
]), ne = s({
	key: w,
	name: ee,
	value: te
}), T = s({
	dirId: e().trim().min(1).max(256).describe("Browser directory id used in this conversation, or a current user profile reference for an unused entry."),
	success: a().describe("Whether the started browser window completed the requested work."),
	status: t("unused").optional().describe("Use exactly for an admitted window that was never started; pair with success=false and failureReason=\"\"."),
	failureReason: e().max(2e3).describe("Empty when success=true or status=unused; concise and non-empty when a started window failed.")
}), E = s({
	taskName: C,
	params: r(ne).max(20),
	windows: r(T).min(1).max(100)
}).superRefine((e, t) => {
	D(e.taskName) && t.addIssue({
		code: "custom",
		path: ["taskName"],
		message: "taskName must not contain sensitive data"
	});
	let n = /* @__PURE__ */ new Set();
	for (let [r, i] of e.windows.entries()) n.has(i.dirId) && t.addIssue({
		code: "custom",
		path: [
			"windows",
			r,
			"dirId"
		],
		message: "dirId must be unique within a task report"
	}), n.add(i.dirId), i.status === "unused" && i.success && t.addIssue({
		code: "custom",
		path: [
			"windows",
			r,
			"success"
		],
		message: "expected success=false because status=unused"
	}), i.status === "unused" && i.failureReason !== "" && t.addIssue({
		code: "custom",
		path: [
			"windows",
			r,
			"failureReason"
		],
		message: "expected an empty string because status=unused"
	}), !i.status && i.success && i.failureReason !== "" && t.addIssue({
		code: "custom",
		path: [
			"windows",
			r,
			"failureReason"
		],
		message: "expected an empty string because success=true"
	}), i.status || i.success || i.failureReason.trim() || t.addIssue({
		code: "custom",
		path: [
			"windows",
			r,
			"failureReason"
		],
		message: "expected a non-empty string because success=false"
	}), D(i.failureReason) && t.addIssue({
		code: "custom",
		path: [
			"windows",
			r,
			"failureReason"
		],
		message: "failureReason must not contain sensitive data"
	});
	for (let [n, r] of e.params.entries()) D(r.key) && t.addIssue({
		code: "custom",
		path: [
			"params",
			n,
			"key"
		],
		message: "parameter keys must not contain sensitive data"
	}), D(r.name) && t.addIssue({
		code: "custom",
		path: [
			"params",
			n,
			"name"
		],
		message: "parameter names must not contain sensitive data"
	}), typeof r.value == "string" && D(r.value) && t.addIssue({
		code: "custom",
		path: [
			"params",
			n,
			"value"
		],
		message: "parameter values must not contain sensitive data"
	});
}), re = s({
	sourceReportId: e().trim().min(1).max(256),
	report: E
});
function D(e) {
	return S.test(e);
}
function ie(e) {
	return e.reduce((e, t) => typeof t == "number" ? `${e}[${String(t)}]` : e ? `${e}.${String(t)}` : String(t), "");
}
function ae(e, t) {
	let n = e;
	for (let e of t) {
		if (typeof n != "object" || !n) return;
		n = n[e];
	}
	return n;
}
function oe(e) {
	return e === null ? "null" : Array.isArray(e) ? "an array" : e === void 0 ? "missing" : typeof e == "object" ? "an object" : `a ${typeof e}`;
}
function O(e, t) {
	return e.endsWith(".value") ? "a primitive string, number, boolean, or null" : e.endsWith(".key") ? "a concise parameter key up to 64 characters" : e.endsWith(".name") ? "a brief user-facing name up to 80 characters" : e.endsWith(".status") ? "omit for a started window, or use exactly \"unused\" for an admitted window that was never started" : e.endsWith(".failureReason") ? t.includes("status=unused") ? "an empty string because status=unused" : t.includes("success=true") ? "an empty string because success=true" : t.includes("success=false") ? "a non-empty string because success=false" : "a failure reason consistent with success" : t || "a value matching the report schema";
}
function k(e, t) {
	let n = /* @__PURE__ */ new Set(), r = t.issues.map((t) => {
		let r = ie(t.path);
		n.add(r);
		let i = oe(ae(e, t.path)), a = O(r, t.message);
		return `- ${r || "report"}: expected ${a}. Received ${i}.`;
	}), i = e && typeof e == "object" && !Array.isArray(e) ? e : void 0, a = Array.isArray(i?.windows) ? i.windows : [];
	for (let [e, t] of a.entries()) {
		if (!t || typeof t != "object" || Array.isArray(t)) continue;
		let i = t, a = `windows[${e}].failureReason`;
		n.has(a) || typeof i.success != "boolean" || typeof i.failureReason != "string" || i.status !== "unused" && (i.success && i.failureReason !== "" ? r.push(`- ${a}: expected an empty string because success=true. Received a non-empty string.`) : !i.success && !i.failureReason.trim() && r.push(`- ${a}: expected a non-empty string because success=false. Received an empty string.`));
	}
	return [
		"## Task report validation failed",
		"",
		"The report was not accepted. Fix the input and call roxy_task_report again.",
		"",
		"### Errors",
		"",
		...r,
		"",
		"### Expected shape",
		"",
		"- taskName: a short title in the user's system language, up to 80 characters",
		"- params[].key: concise parameter key, up to 64 characters",
		"- params[].name: brief user-facing name, up to 80 characters",
		"- params[].value: concise primitive string (up to 256 characters), number, boolean, or null",
		"- windows[].dirId: browser directory id",
		"- windows[].success: boolean",
		"- windows[].status: omit for a started window; otherwise use exactly \"unused\" for an admitted window that was not started",
		"- windows[].failureReason: empty on success and non-empty on failure",
		"- For status=\"unused\", use success=false and an empty failureReason."
	].join("\n");
}
// ../../packages/roxy-shared/dist/index.mjs
var se = /^(official|user):([1-9]\d*)$/, A = class extends Error {
	code = "invalid_template_ref";
	constructor() {
		super("Invalid template reference. Expected official:<positive id> or user:<positive id>."), this.name = "TemplateRefParseError";
	}
};
function j(e) {
	if (!Number.isSafeInteger(e) || e <= 0) throw new A();
}
function M(e, t) {
	if (e !== "official" && e !== "user") throw new A();
	return j(t), `${e}:${t}`;
}
function N(e) {
	if (typeof e != "string") throw new A();
	let t = se.exec(e);
	if (!t) throw new A();
	let n = t[1], r = Number(t[2]);
	return j(r), {
		namespace: n,
		id: r,
		value: M(n, r)
	};
}
function ce(e) {
	if (typeof e != "string") return !1;
	try {
		return N(e), !0;
	} catch {
		return !1;
	}
}
function le(e) {
	return N(typeof e == "string" ? e : M(e.namespace, e.id));
}
function ue(e, t) {
	return `[$${e}](${t.trim()})`;
}
function de(e) {
	return `[@profile:${e.length}](${e.join(",")})`;
}
function fe(e) {
	let t = [];
	for (let n of e.matchAll(/\[@profile:[^\]\r\n]*\]\(([^)\r\n]*)\)/g)) n[1].split(",").map((e) => e.trim()).filter(Boolean).forEach((e) => t.push(e));
	return Array.from(new Set(t));
}
function P(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.matchAll(/\[(?:input|textarea|url|project):([^\]]+)\](?:\(([^)]*)\))?/g)) n[2]?.trim() || t.add(n[1]);
	return {
		hasProfileSelection: e.includes("[@profile:"),
		missingInputLabels: Array.from(t)
	};
}
function F(e) {
	let t = e.trim(), n = [], r = P(t);
	t || n.push("Composer prompt must not be empty."), r.hasProfileSelection && n.push("Composer prompt must not contain browser-window selection tokens; select windows when using the template."), r.missingInputLabels.length && n.push(`Composer prompt parameters must have non-empty values: ${r.missingInputLabels.join(", ")}.`), /\{\{[^}]+}}/.test(t) && n.push("Composer prompt must not use double-brace variables."), /\$(?:\{[A-Za-z_]\w*}|[A-Za-z_]\w*)/.test(t) && n.push("Composer prompt must not use dollar variables."), /\[@script:|\[\$[^\]]*]\(/.test(t) && n.push("Composer prompt must not embed script or Skill reference tokens."), /(?:\b(?:password|passcode|cookie|token|api[\s_-]?key|secret|authorization|credential)\b|密码|口令|令牌|密钥|凭证)/i.test(t) && n.push("Composer prompt must not contain sensitive values or secret input fields."), (/(?:^|[\s"'])\/?(?:Users|home)\/[\w.-]+\//.test(t) || /(?:^|[\s"'(])[A-Za-z]:[\\/]/.test(t)) && n.push("Composer prompt must not retain a local filesystem path.");
	for (let e of t.matchAll(/\[(?:input|textarea|url|project):/g)) {
		let r = t.slice(e.index);
		if (!/^\[(?:input|url|project):[^\]\r\n]+\]\([^\r\n)]*\)|^\[textarea:[^\]\r\n]+\]\([^)]*\)/.test(r)) {
			n.push("Composer prompt contains an unsupported or malformed Composer token.");
			break;
		}
	}
	return {
		valid: n.length === 0,
		issues: n
	};
}
var I = "mac", L = "chrome";
function R(e) {
	let t = Number.parseInt(String(e ?? ""), 10);
	return Number.isFinite(t) ? t : void 0;
}
function z(e, t) {
	let n = String(e ?? "").trim().toLowerCase(), r = R(t);
	return n === I && r !== void 0 && r < 22;
}
function B(e, t, n, r) {
	let i = String(n ?? "").trim().toLowerCase() || L, a = R(r);
	return z(e, t) && i === L && a !== void 0 && a >= 151;
}
var V = /* @__PURE__ */ "Andale Mono,Arial,Arial Black,Arial Hebrew,Arial MT,Arial Narrow,Arial Rounded MT Bold,Arial Unicode MS,Bitstream Vera Sans Mono,Book Antiqua,Bookman Old Style,Calibri,Cambria,Cambria Math,Century,Century Gothic,Century Schoolbook,Comic Sans,Comic Sans MS,Consolas,Courier,Courier New,Garamond,Geneva,Georgia,Helvetica,Helvetica Neue,Impact,Lucida Bright,Lucida Calligraphy,Lucida Console,Lucida Fax,LUCIDA GRANDE,Lucida Handwriting,Lucida Sans,Lucida Sans Typewriter,Lucida Sans Unicode,Microsoft Sans Serif,Monaco,Monotype Corsiva,MS Gothic,MS Outlook,MS PGothic,MS Reference Sans Serif,MS Sans Serif,MS Serif,MYRIAD,MYRIAD PRO,Palatino,Palatino Linotype,Segoe Print,Segoe Script,Segoe UI,Segoe UI Light,Segoe UI Semibold,Segoe UI Symbol,Tahoma,Times,Times New Roman,Times New Roman PS,Trebuchet MS,Verdana,Wingdings,Wingdings 2,Wingdings 3,Abadi MT Condensed Light,Academy Engraved LET,ADOBE CASLON PRO,Adobe Garamond,ADOBE GARAMOND PRO,Agency FB,Aharoni,Albertus Extra Bold,Albertus Medium,Algerian,Amazone BT,American Typewriter,American Typewriter Condensed,AmerType Md BT,Andalus,Angsana New,AngsanaUPC,Antique Olive,Aparajita,Apple Chancery,Apple Color Emoji,Apple SD Gothic Neo,Arabic Typesetting,ARCHER,ARNO PRO,Arrus BT,Aurora Cn BT,AvantGarde Bk BT,AvantGarde Md BT,AVENIR,Ayuthaya,Bandy,Bangla Sangam MN,Bank Gothic,BankGothic Md BT,Baskerville,Baskerville Old Face,Batang,BatangChe,Bauer Bodoni,Bauhaus 93,Bazooka,Bell MT,Bembo,Benguiat Bk BT,Berlin Sans FB,Berlin Sans FB Demi,Bernard MT Condensed,BernhardFashion BT,BernhardMod BT,Big Caslon,BinnerD,Blackadder ITC,BlairMdITC TT,Bodoni 72,Bodoni 72 Oldstyle,Bodoni 72 Smallcaps,Bodoni MT,Bodoni MT Black,Bodoni MT Condensed,Bodoni MT Poster Compressed,Bookshelf Symbol 7,Boulder,Bradley Hand,Bradley Hand ITC,Bremen Bd BT,Britannic Bold,Broadway,Browallia New,BrowalliaUPC,Brush Script MT,Californian FB,Calisto MT,Calligrapher,Candara,CaslonOpnface BT,Castellar,Centaur,Cezanne,CG Omega,CG Times,Chalkboard,Chalkboard SE,Chalkduster,Charlesworth,Charter Bd BT,Charter BT,Chaucer,ChelthmITC Bk BT,Chiller,Clarendon,Clarendon Condensed,CloisterBlack BT,Cochin,Colonna MT,Constantia,Cooper Black,Copperplate,Copperplate Gothic,Copperplate Gothic Bold,Copperplate Gothic Light,CopperplGoth Bd BT,Corbel,Cordia New,CordiaUPC,Cornerstone,Coronet,Cuckoo,Curlz MT,DaunPenh,Dauphin,David,DB LCD Temp,DELICIOUS,Denmark,DFKai-SB,Didot,DilleniaUPC,DIN,DokChampa,Dotum,DotumChe,Ebrima,Edwardian Script ITC,Elephant,English 111 Vivace BT,Engravers MT,EngraversGothic BT,Eras Bold ITC,Eras Demi ITC,Eras Light ITC,Eras Medium ITC,EucrosiaUPC,Euphemia,Euphemia UCAS,EUROSTILE,Exotc350 Bd BT,FangSong,Felix Titling,Fixedsys,FONTIN,Footlight MT Light,Forte,FrankRuehl,Fransiscan,Freefrm721 Blk BT,FreesiaUPC,Freestyle Script,French Script MT,FrnkGothITC Bk BT,Fruitger,FRUTIGER,Futura,Futura Bk BT,Futura Lt BT,Futura Md BT,Futura ZBlk BT,FuturaBlack BT,Gabriola,Galliard BT,Gautami,Geeza Pro,Geometr231 BT,Geometr231 Hv BT,Geometr231 Lt BT,GeoSlab 703 Lt BT,GeoSlab 703 XBd BT,Gigi,Gill Sans,Gill Sans MT,Gill Sans MT Condensed,Gill Sans MT Ext Condensed Bold,Gill Sans Ultra Bold,Gill Sans Ultra Bold Condensed,Gisha,Gloucester MT Extra Condensed,GOTHAM,GOTHAM BOLD,Goudy Old Style,Goudy Stout,GoudyHandtooled BT,GoudyOLSt BT,Gujarati Sangam MN,Gulim,GulimChe,Gungsuh,GungsuhChe,Gurmukhi MN,Haettenschweiler,Harlow Solid Italic,Harrington,Heather,Heiti SC,Heiti TC,HELV,Herald,High Tower Text,Hiragino Kaku Gothic ProN,Hiragino Mincho ProN,Hoefler Text,Humanst 521 Cn BT,Humanst521 BT,Humanst521 Lt BT,Imprint MT Shadow,Incised901 Bd BT,Incised901 BT,Incised901 Lt BT,INCONSOLATA,Informal Roman,Informal011 BT,INTERSTATE,IrisUPC,Iskoola Pota,JasmineUPC,Jazz LET,Jenson,Jester,Jokerman,Juice ITC,Kabel Bk BT,Kabel Ult BT,Kailasa,KaiTi,Kalinga,Kannada Sangam MN,Kartika,Kaufmann Bd BT,Kaufmann BT,Khmer UI,KodchiangUPC,Kokila,Korinna BT,Kristen ITC,Krungthep,Kunstler Script,Lao UI,Latha,Leelawadee,Letter Gothic,Levenim MT,LilyUPC,Lithograph,Lithograph Light,Long Island,Lydian BT,Magneto,Maiandra GD,Malayalam Sangam MN,Malgun Gothic,Mangal,Marigold,Marion,Marker Felt,Market,Marlett,Matisse ITC,Matura MT Script Capitals,Meiryo,Meiryo UI,Microsoft Himalaya,Microsoft JhengHei,Microsoft New Tai Lue,Microsoft PhagsPa,Microsoft Tai Le,Microsoft Uighur,Microsoft YaHei,Microsoft Yi Baiti,MingLiU,MingLiU_HKSCS,MingLiU_HKSCS-ExtB,MingLiU-ExtB,Minion,Minion Pro,Miriam,Miriam Fixed,Mistral,Modern,Modern No. 20,Mona Lisa Solid ITC TT,Mongolian Baiti,MONO,MoolBoran,Mrs Eaves,MS LineDraw,MS Mincho,MS PMincho,MS Reference Specialty,MS UI Gothic,MT Extra,MUSEO,MV Boli,Nadeem,Narkisim,NEVIS,News Gothic,News GothicMT,NewsGoth BT,Niagara Engraved,Niagara Solid,Noteworthy,NSimSun,Nyala,OCR A Extended,Old Century,Old English Text MT,Onyx,Onyx BT,OPTIMA,Oriya Sangam MN,OSAKA,OzHandicraft BT,Palace Script MT,Papyrus,Parchment,Party LET,Pegasus,Perpetua,Perpetua Titling MT,PetitaBold,Pickwick,Plantagenet Cherokee,Playbill,PMingLiU,PMingLiU-ExtB,Poor Richard,Poster,PosterBodoni BT,PRINCETOWN LET,Pristina,PTBarnum BT,Pythagoras,Raavi,Rage Italic,Ravie,Ribbon131 Bd BT,Rockwell,Rockwell Condensed,Rockwell Extra Bold,Rod,Roman,Sakkal Majalla,Santa Fe LET,Savoye LET,Sceptre,Script,Script MT Bold,SCRIPTINA,Serifa,Serifa BT,Serifa Th BT,ShelleyVolante BT,Sherwood,Shonar Bangla,Showcard Gothic,Shruti,Signboard,SILKSCREEN,SimHei,Simplified Arabic,Simplified Arabic Fixed,SimSun,SimSun-ExtB,Sinhala Sangam MN,Sketch Rockwell,Skia,Small Fonts,Snap ITC,Snell Roundhand,Socket,Souvenir Lt BT,Staccato222 BT,Steamer,Stencil,Storybook,Styllo,Subway,Swis721 BlkEx BT,Swiss911 XCm BT,Sylfaen,Synchro LET,System,Tamil Sangam MN,Technical,Teletype,Telugu Sangam MN,Tempus Sans ITC,Terminal,Thonburi,Traditional Arabic,Trajan,TRAJAN PRO,Tristan,Tubular,Tunga,Tw Cen MT,Tw Cen MT Condensed,Tw Cen MT Condensed Extra Bold,TypoUpright BT,Unicorn,Univers,Univers CE 55 Medium,Univers Condensed,Utsaah,Vagabond,Vani,Vijaya,Viner Hand ITC,VisualUI,Vivaldi,Vladimir Script,Vrinda,Westminster,WHITNEY,Wide Latin,ZapfEllipt BT,ZapfHumnst BT,ZapfHumnst Dm BT,Zapfino,Zurich BlkEx BT,Zurich Ex BT,ZWAdobeF".split(","), pe = /* @__PURE__ */ "Arial.Calibri.Cambria Math.Cambria.Candara.Comic Sans MS.Consolas.Constantia.Corbel.Courier New.Ebrima.Franklin Gothic.Gabriola.Georgia.Impact.Lucida Console.Lucida Sans Unicode.MS Gothic.MS PGothic.MV Boli.Malgun Gothic.Marlett.Microsoft Himalaya.Microsoft JhengHei.Microsoft New Tai Lue.Microsoft PhagsPa.Microsoft Sans Serif.Microsoft YaHei.Microsoft Yi Baiti.MingLiU-ExtB.Mongolian Baiti.PMingLiU-ExtB.Palatino Linotype.Segoe Print.Segoe Script.Segoe UI Symbol.Segoe UI.SimSun.SimSun-ExtB.Sylfaen.Trebuchet MS.Verdana.Webdings.Gadugi.Javanese Text.Microsoft JhengHei UI.Myanmar Text.Sitka Small.Yu Gothic.MS UI Gothic.Microsoft Tai Le.MingLiU_HKSCS-ExtB.Symbol.Segoe UI Emoji.Bahnschrift".split(".");
function H(e, t) {
	let n = [], r = [];
	e.length > t.length ? (n = e, r = t) : (n = t, r = e);
	let i = [];
	for (let e = 0; e < r.length; e++) for (let t = 0; t < n.length; t++) r[e].toLowerCase() == n[t].toLowerCase() && i.push(n[t]);
	return i;
}
function me(e, t) {
	let n = [];
	for (let r = 0; r < e.length; r++) {
		let i = !1;
		for (let n = 0; n < t.length; n++) e[r].toLowerCase() == t[n].toLowerCase() && (i = !0);
		i || n.push(e[r]);
	}
	return n;
}
function U(e, t) {
	let n = Math.floor(Math.random() * t) + 1;
	console.log("fonts_count->", n);
	let r = /* @__PURE__ */ new Set(), i = 0;
	if (e.length < n) return e;
	for (; r.size < n && i < 100;) {
		let t = e[Math.floor(Math.random() * e.length)];
		r.add(t), i++;
	}
	let a = [];
	for (let e of r) a.push(e);
	return a;
}
function he(e, t) {
	let n = /* @__PURE__ */ new Set();
	for (var r = 0; r < e.length; r++) n.add(e[r]);
	for (var r = 0; r < t.length; r++) n.add(t[r]);
	let i = [];
	for (let e of n) i.push(e);
	return i;
}
function W(e) {
	let t = me(e, H(e, pe)), n = H(t, V), r = U(n, n.length > 5 ? 5 : n.length);
	console.log(n, "->", r);
	let i = he(r, U(t, t.length > 5 ? 5 : t.length));
	return console.log(i.join(";")), i;
}
var ge = 1e4;
function _e(e) {
	let { gateConfUrls: t, defaultAppGateway: n, defaultApiGateway: r, timeoutMs: i = ge, onChange: a, onCountryChanged: o } = e, s = "", c = "", l = "", u = null, d = 0;
	async function f(t) {
		let n = new AbortController(), r = setTimeout(() => n.abort(), i);
		try {
			let r = await fetch(t, {
				method: "GET",
				headers: {
					...e?.headers,
					"Content-Type": "application/json"
				},
				signal: n.signal
			});
			if (!r.ok) throw Error(`gate conf request failed, status: ${r.status}`);
			let i = await r.json();
			if (i?.code === 0 && i?.data?.app_gateway && i?.data?.api_gateway) return i.data;
			throw Error(`invalid gate conf from ${t}: ${JSON.stringify(i)}`);
		} finally {
			clearTimeout(r);
		}
	}
	async function p() {
		let e = t.map((e) => f(e));
		try {
			let t = await Promise.any(e);
			console.log("fetchGateConf first success", t), s = t.app_gateway, c = t.api_gateway, console.log("getGatewayConfig first ok", t);
		} catch (e) {
			console.log("getGatewayConfig all failed", e), s ||= n, c ||= r;
		}
		return a?.({
			baseUrl: s,
			openAPIUrl: c
		}), s;
	}
	async function m() {
		return u || (u = p().finally(() => {
			u = null;
		}), u);
	}
	async function h(e) {
		let { country: t, reqUrl: n, reqTime: r } = e;
		t && (l ? r - d < 1e3 ? console.log("🚀 ~ reGetGatewayConfigByCountryChange skip, reqTime - lastFetchTime < 1000", r, d) : l !== t && n.startsWith(s) && (console.log(`🚀 ~ country changed, previous country: ${l}, current country: ${t}`), l = t, await m(), o?.(t), d = Date.now()) : l = t);
	}
	return {
		getBaseUrl: () => s,
		getOpenAPIUrl: () => c,
		getCountry: () => l,
		getGatewayConfig: m,
		reGetGatewayConfigByCountryChange: h
	};
}
function ve(e, t) {
	if (t ?? (t = e, e = 0), e >= t) throw Error("Invalid input: The maximum value must be greater than the minimum value.");
	return Math.random() * (t - e) + e;
}
function ye(e, t) {
	return Math.floor(ve(e, t));
}
function be(e, t) {
	if (t > e.length) throw Error("Size must be less than or equal to the length of array.");
	let n = Array(t), r = /* @__PURE__ */ new Set();
	for (let i = e.length - t, a = 0; i < e.length; i++, a++) {
		let t = ye(0, i + 1);
		r.has(t) && (t = i), r.add(t), n[a] = e[t];
	}
	return n;
}
var G = [
	{
		name: "Google Bahasa Indonesia",
		lang: "id-ID",
		isLocalService: !1
	},
	{
		name: "Google Deutsch",
		lang: "de-DE",
		isLocalService: !1
	},
	{
		name: "Google español",
		lang: "es-ES",
		isLocalService: !1
	},
	{
		name: "Google español de Estados Unidos",
		lang: "es-US",
		isLocalService: !1
	},
	{
		name: "Google français",
		lang: "fr-FR",
		isLocalService: !1
	},
	{
		name: "Google italiano",
		lang: "it-IT",
		isLocalService: !1
	},
	{
		name: "Google Nederlands",
		lang: "nl-NL",
		isLocalService: !1
	},
	{
		name: "Google polski",
		lang: "pl-PL",
		isLocalService: !1
	},
	{
		name: "Google português do Brasil",
		lang: "pt-BR",
		isLocalService: !1
	},
	{
		name: "Google UK English Female",
		lang: "en-GB",
		isLocalService: !1
	},
	{
		name: "Google UK English Male",
		lang: "en-GB",
		isLocalService: !1
	},
	{
		name: "Google US English",
		lang: "en-US",
		isLocalService: !1
	},
	{
		name: "Google русский",
		lang: "ru-RU",
		isLocalService: !1
	},
	{
		name: "Google हिन्दी",
		lang: "hi-IN",
		isLocalService: !1
	},
	{
		name: "Google 國語（臺灣）",
		lang: "zh-TW",
		isLocalService: !1
	},
	{
		name: "Google 日本語",
		lang: "ja-JP",
		isLocalService: !1
	},
	{
		name: "Google 한국의",
		lang: "ko-KR",
		isLocalService: !1
	},
	{
		name: "Google\xA0普通话（中国大陆）",
		lang: "zh-CN",
		isLocalService: !1
	},
	{
		name: "Google\xA0粤語（香港）",
		lang: "zh-HK",
		isLocalService: !1
	}
], K = [
	{
		name: "Microsoft David - English (United States)",
		lang: "en-US",
		isLocalService: !0
	},
	{
		name: "Microsoft Mark - English (United States)",
		lang: "en-US",
		isLocalService: !0
	},
	{
		name: "Microsoft Zira - English (United States)",
		lang: "en-US",
		isLocalService: !0
	},
	{
		name: "Microsoft Hazel - English (Great Britain)",
		lang: "en-GB",
		isLocalService: !0
	},
	{
		name: "Microsoft George - English (Great Britain)",
		lang: "en-GB",
		isLocalService: !0
	},
	{
		name: "Microsoft Susan - English (Great Britain)",
		lang: "en-GB",
		isLocalService: !0
	},
	{
		name: "Microsoft Hedda - German (Germany)",
		lang: "de-DE",
		isLocalService: !0
	},
	{
		name: "Microsoft Stefan - German (Germany)",
		lang: "de-DE",
		isLocalService: !0
	},
	{
		name: "Microsoft Helena - Spanish (Spain)",
		lang: "es-ES",
		isLocalService: !0
	},
	{
		name: "Microsoft Pablo - Spanish (Spain)",
		lang: "es-ES",
		isLocalService: !0
	},
	{
		name: "Microsoft Laura - Spanish (Mexico)",
		lang: "es-MX",
		isLocalService: !0
	},
	{
		name: "Microsoft Raul - Spanish (Mexico)",
		lang: "es-MX",
		isLocalService: !0
	},
	{
		name: "Microsoft Hortense - French (France)",
		lang: "fr-FR",
		isLocalService: !0
	},
	{
		name: "Microsoft Julie - French (France)",
		lang: "fr-FR",
		isLocalService: !0
	},
	{
		name: "Microsoft Cosimo - Italian (Italy)",
		lang: "it-IT",
		isLocalService: !0
	},
	{
		name: "Microsoft Elsa - Italian (Italy)",
		lang: "it-IT",
		isLocalService: !0
	},
	{
		name: "Microsoft Frank - Dutch (Netherlands)",
		lang: "nl-NL",
		isLocalService: !0
	},
	{
		name: "Microsoft Lili - Dutch (Netherlands)",
		lang: "nl-NL",
		isLocalService: !0
	},
	{
		name: "Microsoft Adam - Polish (Poland)",
		lang: "pl-PL",
		isLocalService: !0
	},
	{
		name: "Microsoft Paulina - Polish (Poland)",
		lang: "pl-PL",
		isLocalService: !0
	},
	{
		name: "Microsoft Maria - Portuguese (Brazil)",
		lang: "pt-BR",
		isLocalService: !0
	},
	{
		name: "Microsoft Daniel - Portuguese (Brazil)",
		lang: "pt-BR",
		isLocalService: !0
	},
	{
		name: "Microsoft Irina - Russian (Russia)",
		lang: "ru-RU",
		isLocalService: !0
	},
	{
		name: "Microsoft Pavel - Russian (Russia)",
		lang: "ru-RU",
		isLocalService: !0
	},
	{
		name: "Microsoft Hemant - Hindi (India)",
		lang: "hi-IN",
		isLocalService: !0
	},
	{
		name: "Microsoft Kalpana - Hindi (India)",
		lang: "hi-IN",
		isLocalService: !0
	},
	{
		name: "Microsoft Andika - Indonesian (Indonesia)",
		lang: "id-ID",
		isLocalService: !0
	},
	{
		name: "Microsoft Tracy - Chinese (Traditional, Taiwan)",
		lang: "zh-TW",
		isLocalService: !0
	},
	{
		name: "Microsoft Danny - Chinese (Traditional, Taiwan)",
		lang: "zh-TW",
		isLocalService: !0
	},
	{
		name: "Microsoft Ayumi - Japanese (Japan)",
		lang: "ja-JP",
		isLocalService: !0
	},
	{
		name: "Microsoft Haruka - Japanese (Japan)",
		lang: "ja-JP",
		isLocalService: !0
	},
	{
		name: "Microsoft Ichiro - Japanese (Japan)",
		lang: "ja-JP",
		isLocalService: !0
	},
	{
		name: "Microsoft Heami - Korean (Korea)",
		lang: "ko-KR",
		isLocalService: !0
	},
	{
		name: "Microsoft Huihui - Chinese (Simplified, PRC)",
		lang: "zh-CN",
		isLocalService: !0
	},
	{
		name: "Microsoft Kangkang - Chinese (Simplified, PRC)",
		lang: "zh-CN",
		isLocalService: !0
	},
	{
		name: "Microsoft Yaoyao - Chinese (Simplified, PRC)",
		lang: "zh-CN",
		isLocalService: !0
	},
	{
		name: "Microsoft Tracy - Chinese (Traditional, Hong Kong S.A.R.)",
		lang: "zh-HK",
		isLocalService: !0
	}
], xe = /* @__PURE__ */ "Andale Mono,Arial,Arial Black,Arial Hebrew,Arial MT,Arial Narrow,Arial Rounded MT Bold,Arial Unicode MS,Bitstream Vera Sans Mono,Book Antiqua,Bookman Old Style,Calibri,Cambria,Cambria Math,Century,Century Gothic,Century Schoolbook,Comic Sans,Comic Sans MS,Consolas,Courier,Courier New,Geneva,Georgia,Helvetica,Helvetica Neue,Impact,Lucida Bright,Lucida Calligraphy,Lucida Console,Lucida Fax,LUCIDA GRANDE,Lucida Handwriting,Lucida Sans,Lucida Sans Typewriter,Lucida Sans Unicode,Microsoft Sans Serif,Monaco,Monotype Corsiva,MS Gothic,MS Outlook,MS PGothic,MS Reference Sans Serif,MS Sans Serif,MS Serif,MYRIAD,MYRIAD PRO,Palatino,Palatino Linotype,Segoe Print,Segoe Script,Segoe UI,Segoe UI Light,Segoe UI Semibold,Segoe UI Symbol,Tahoma,Times,Times New Roman,Times New Roman PS,Trebuchet MS,Verdana,Wingdings,Wingdings 2,Wingdings 3,Abadi MT Condensed Light,Academy Engraved LET,ADOBE CASLON PRO,Adobe Garamond,ADOBE GARAMOND PRO,Agency FB,Aharoni,Albertus Extra Bold,Albertus Medium,Algerian,Amazone BT,American Typewriter,American Typewriter Condensed,AmerType Md BT,Andalus,Angsana New,AngsanaUPC,Antique Olive,Aparajita,Apple Chancery,Apple Color Emoji,Apple SD Gothic Neo,Arabic Typesetting,ARCHER,ARNO PRO,Arrus BT,Aurora Cn BT,AvantGarde Bk BT,AvantGarde Md BT,AVENIR,Ayuthaya,Bandy,Bangla Sangam MN,Bank Gothic,BankGothic Md BT,Baskerville,Baskerville Old Face,Batang,BatangChe,Bauer Bodoni,Bauhaus 93,Bazooka,Bell MT,Bembo,Benguiat Bk BT,Berlin Sans FB,Berlin Sans FB Demi,Bernard MT Condensed,BernhardFashion BT,BernhardMod BT,Big Caslon,BinnerD,Blackadder ITC,BlairMdITC TT,Bodoni 72,Bodoni 72 Oldstyle,Bodoni 72 Smallcaps,Bodoni MT,Bodoni MT Black,Bodoni MT Condensed,Bodoni MT Poster Compressed,Bookshelf Symbol 7,Boulder,Bradley Hand,Bradley Hand ITC,Bremen Bd BT,Britannic Bold,Broadway,Browallia New,BrowalliaUPC,Brush Script MT,Californian FB,Calisto MT,Calligrapher,Candara,CaslonOpnface BT,Castellar,Centaur,Cezanne,CG Omega,CG Times,Chalkboard,Chalkboard SE,Chalkduster,Charlesworth,Charter Bd BT,Charter BT,Chaucer,ChelthmITC Bk BT,Chiller,Clarendon,Clarendon Condensed,CloisterBlack BT,Cochin,Colonna MT,Constantia,Cooper Black,Copperplate,Copperplate Gothic,Copperplate Gothic Bold,Copperplate Gothic Light,CopperplGoth Bd BT,Corbel,Cordia New,CordiaUPC,Cornerstone,Coronet,Cuckoo,Curlz MT,DaunPenh,Dauphin,David,DB LCD Temp,DELICIOUS,Denmark,DFKai-SB,Didot,DilleniaUPC,DIN,DokChampa,Dotum,DotumChe,Ebrima,Edwardian Script ITC,Elephant,English 111 Vivace BT,Engravers MT,EngraversGothic BT,Eras Bold ITC,Eras Demi ITC,Eras Light ITC,Eras Medium ITC,EucrosiaUPC,Euphemia,Euphemia UCAS,EUROSTILE,Exotc350 Bd BT,FangSong,Felix Titling,Fixedsys,FONTIN,Footlight MT Light,Forte,FrankRuehl,Fransiscan,Freefrm721 Blk BT,FreesiaUPC,Freestyle Script,French Script MT,FrnkGothITC Bk BT,Fruitger,FRUTIGER,Futura,Futura Bk BT,Futura Lt BT,Futura Md BT,Futura ZBlk BT,FuturaBlack BT,Gabriola,Galliard BT,Gautami,Geeza Pro,Geometr231 BT,Geometr231 Hv BT,Geometr231 Lt BT,GeoSlab 703 Lt BT,GeoSlab 703 XBd BT,Gigi,Gill Sans,Gill Sans MT,Gill Sans MT Condensed,Gill Sans MT Ext Condensed Bold,Gill Sans Ultra Bold,Gill Sans Ultra Bold Condensed,Gisha,Gloucester MT Extra Condensed,GOTHAM,GOTHAM BOLD,Goudy Old Style,Goudy Stout,GoudyHandtooled BT,GoudyOLSt BT,Gujarati Sangam MN,Gulim,GulimChe,Gungsuh,GungsuhChe,Gurmukhi MN,Haettenschweiler,Harlow Solid Italic,Harrington,Heather,Heiti SC,Heiti TC,HELV,Herald,High Tower Text,Hiragino Kaku Gothic ProN,Hiragino Mincho ProN,Hoefler Text,Humanst 521 Cn BT,Humanst521 BT,Humanst521 Lt BT,Imprint MT Shadow,Incised901 Bd BT,Incised901 BT,Incised901 Lt BT,INCONSOLATA,Informal Roman,Informal011 BT,INTERSTATE,IrisUPC,Iskoola Pota,JasmineUPC,Jazz LET,Jenson,Jester,Jokerman,Juice ITC,Kabel Bk BT,Kabel Ult BT,Kailasa,KaiTi,Kalinga,Kannada Sangam MN,Kartika,Kaufmann Bd BT,Kaufmann BT,Khmer UI,KodchiangUPC,Kokila,Korinna BT,Kristen ITC,Krungthep,Kunstler Script,Lao UI,Latha,Leelawadee,Letter Gothic,Levenim MT,LilyUPC,Lithograph,Lithograph Light,Long Island,Lydian BT,Magneto,Maiandra GD,Malayalam Sangam MN,Malgun Gothic,Mangal,Marigold,Marion,Marker Felt,Market,Marlett,Matisse ITC,Matura MT Script Capitals,Meiryo,Meiryo UI,Microsoft Himalaya,Microsoft JhengHei,Microsoft New Tai Lue,Microsoft PhagsPa,Microsoft Tai Le,Microsoft Uighur,Microsoft YaHei,Microsoft Yi Baiti,MingLiU,MingLiU_HKSCS,MingLiU_HKSCS-ExtB,MingLiU-ExtB,Minion,Minion Pro,Miriam,Miriam Fixed,Mistral,Modern,Modern No. 20,Mona Lisa Solid ITC TT,Mongolian Baiti,MONO,MoolBoran,Mrs Eaves,MS LineDraw,MS Mincho,MS PMincho,MS Reference Specialty,MS UI Gothic,MT Extra,MUSEO,MV Boli,Nadeem,Narkisim,NEVIS,News Gothic,News GothicMT,NewsGoth BT,Niagara Engraved,Niagara Solid,Noteworthy,NSimSun,Nyala,OCR A Extended,Old Century,Old English Text MT,Onyx,Onyx BT,OPTIMA,Oriya Sangam MN,OSAKA,OzHandicraft BT,Palace Script MT,Papyrus,Parchment,Party LET,Pegasus,Perpetua,Perpetua Titling MT,PetitaBold,Pickwick,Plantagenet Cherokee,Playbill,PMingLiU,PMingLiU-ExtB,Poor Richard,Poster,PosterBodoni BT,PRINCETOWN LET,Pristina,PTBarnum BT,Pythagoras,Raavi,Rage Italic,Ravie,Ribbon131 Bd BT,Rockwell,Rockwell Condensed,Rockwell Extra Bold,Rod,Roman,Sakkal Majalla,Santa Fe LET,Savoye LET,Sceptre,Script,Script MT Bold,SCRIPTINA,Serifa,Serifa BT,Serifa Th BT,ShelleyVolante BT,Sherwood,Shonar Bangla,Showcard Gothic,Shruti,Signboard,SILKSCREEN,SimHei,Simplified Arabic,Simplified Arabic Fixed,SimSun,SimSun-ExtB,Sinhala Sangam MN,Sketch Rockwell,Skia,Small Fonts,Snap ITC,Snell Roundhand,Socket,Souvenir Lt BT,Staccato222 BT,Steamer,Stencil,Storybook,Styllo,Subway,Swis721 BlkEx BT,Swiss911 XCm BT,Sylfaen,Synchro LET,System,Tamil Sangam MN,Technical,Teletype,Telugu Sangam MN,Tempus Sans ITC,Terminal,Thonburi,Traditional Arabic,Trajan,TRAJAN PRO,Tristan,Tubular,Tunga,Tw Cen MT,Tw Cen MT Condensed,Tw Cen MT Condensed Extra Bold,TypoUpright BT,Unicorn,Univers,Univers CE 55 Medium,Univers Condensed,Utsaah,Vagabond,Vani,Vijaya,Viner Hand ITC,VisualUI,Vivaldi,Vladimir Script,Vrinda,Westminster,WHITNEY,Wide Latin,ZapfEllipt BT,ZapfHumnst BT,ZapfHumnst Dm BT,Zapfino,Zurich BlkEx BT,Zurich Ex BT,ZWAdobeF,ABeeZee,Abel,Abhaya Libre,Abril Fatface,Aclonica,Acme,Actor,Adamina,Advent Pro,Aguafina Script,Akronim,Aladin,Aldrich,Alef,Alegreya,Alegreya SC,Alegreya Sans,Alegreya Sans SC,Aleo,Alex Brush,Alfa Slab One,Alice,Alike,Alike Angular,Allan,Allerta,Allerta Stencil,Allura,Almarai,Almendra,Almendra Display,Almendra SC,Amarante,Amaranth,Amatic SC,Amethysta,Amiko,Amiri,Amita,Anaheim,Andada,Andika,Angkor,Annie Use Your Telescope,Anonymous Pro,Antic,Antic Didone,Antic Slab,Anton,Arapey,Arbutus,Arbutus Slab,Architects Daughter,Archivo,Archivo Black,Archivo Narrow,Aref Ruqaa,Arima Madurai,Arimo,Arizonia,Armata,Arsenal,Artifika,Arvo,Arya,Asap,Asap Condensed,Asar,Asset,Assistant,Astloch,Asul,Athiti,Atma,Atomic Age,Aubrey,Audiowide,Autour One,Average,Average Sans,Averia Gruesa Libre,Averia Libre,Averia Sans Libre,Averia Serif Libre,B612,B612 Mono,Bad Script,Bahiana,Bahianita,Bai Jamjuree,Baloo,Baloo Bhai,Baloo Bhaijaan,Baloo Bhaina,Baloo Chettan,Baloo Da,Baloo Paaji,Baloo Tamma,Baloo Tammudu,Baloo Thambi,Balthazar,Bangers,Barlow,Barlow Condensed,Barlow Semi Condensed,Barriecito,Barrio,Basic,Battambang,Baumans,Bayon,Be Vietnam,Bebas Neue,Belgrano,Bellefair,Belleza,BenchNine,Bentham,Berkshire Swash,Beth Ellen,Bevan,Big Shoulders Display,Big Shoulders Text,Bigelow Rules,Bigshot One,Bilbo,Bilbo Swash Caps,BioRhyme,BioRhyme Expanded,Biryani,Bitter,Black And White Picture,Black Han Sans,Black Ops One,Blinker,Bokor,Bonbon,Boogaloo,Bowlby One,Bowlby One SC,Brawler,Bree Serif,Bubblegum Sans,Bubbler One,Buda,Buenard,Bungee,Bungee Hairline,Bungee Inline,Bungee Outline,Bungee Shade,Butcherman,Butterfly Kids,Cabin,Cabin Condensed,Cabin Sketch,Caesar Dressing,Cagliostro,Cairo,Calligraffitti,Cambay,Cambo,Candal,Cantarell,Cantata One,Cantora One,Capriola,Cardo,Carme,Carrois Gothic,Carrois Gothic SC,Carter One,Catamaran,Caudex,Caveat,Caveat Brush,Cedarville Cursive,Ceviche One,Chakra Petch,Changa,Changa One,Chango,Charm,Charmonman,Chathura,Chau Philomene One,Chela One,Chelsea Market,Chenla,Cherry Cream Soda,Cherry Swash,Chewy,Chicle,Chilanka,Chivo,Chonburi,Cinzel,Cinzel Decorative,Clicker Script,Coda,Coda Caption,Codystar,Coiny,Combo,Comfortaa,Coming Soon,Concert One,Condiment,Content,Contrail One,Convergence,Cookie,Copse,Corben,Cormorant,Cormorant Garamond,Cormorant Infant,Cormorant SC,Cormorant Unicase,Cormorant Upright,Courgette,Cousine,Coustard,Covered By Your Grace,Crafty Girls,Creepster,Crete Round,Crimson Pro,Crimson Text,Croissant One,Crushed,Cuprum,Cute Font,Cutive,Cutive Mono,DM Sans,DM Serif Display,DM Serif Text,Damion,Dancing Script,Dangrek,Darker Grotesque,David Libre,Dawning of a New Day,Days One,Dekko,Delius,Delius Swash Caps,Delius Unicase,Della Respira,Denk One,Devonshire,Dhurjati,Didact Gothic,Diplomata,Diplomata SC,Do Hyeon,Dokdo,Domine,Donegal One,Doppio One,Dorsa,Dosis,Dr Sugiyama,Duru Sans,Dynalight,EB Garamond,Eagle Lake,East Sea Dokdo,Eater,Economica,Eczar,El Messiri,Electrolize,Elsie,Elsie Swash Caps,Emblema One,Emilys Candy,Encode Sans,Encode Sans Condensed,Encode Sans Expanded,Encode Sans Semi Condensed,Encode Sans Semi Expanded,Engagement,Englebert,Enriqueta,Erica One,Esteban,Euphoria Script,Ewert,Exo,Exo 2,Expletus Sans,Fahkwang,Fanwood Text,Farro,Farsan,Fascinate,Fascinate Inline,Faster One,Fasthand,Fauna One,Faustina,Federant,Federo,Felipa,Fenix,Finger Paint,Fira Code,Fira Mono,Fira Sans,Fira Sans Condensed,Fira Sans Extra Condensed,Fjalla One,Fjord One,Flamenco,Flavors,Fondamento,Fontdiner Swanky,Forum,Francois One,Frank Ruhl Libre,Freckle Face,Fredericka the Great,Fredoka One,Freehand,Fresca,Frijole,Fruktur,Fugaz One,GFS Didot,GFS Neohellenic,Gabriela,Gaegu,Gafata,Galada,Galdeano,Galindo,Gamja Flower,Gayathri,Gentium Basic,Gentium Book Basic,Geo,Geostar,Geostar Fill,Germania One,Gidugu,Gilda Display,Give You Glory,Glass Antiqua,Glegoo,Gloria Hallelujah,Goblin One,Gochi Hand,Gorditas,Gothic A1,Goudy Bookletter 1911,Graduate,Grand Hotel,Gravitas One,Great Vibes,Grenze,Griffy,Gruppo,Gudea,Gugi,Gurajada,Habibi,Halant,Hammersmith One,Hanalei,Hanalei Fill,Handlee,Hanuman,Happy Monkey,Harmattan,Headland One,Heebo,Henny Penny,Hepta Slab,Herr Von Muellerhoff,Hi Melody,Hind,Hind Guntur,Hind Madurai,Hind Siliguri,Hind Vadodara,Holtwood One SC,Homemade Apple,Homenaje,IBM Plex Mono,IBM Plex Sans,IBM Plex Sans Condensed,IBM Plex Serif,IM Fell DW Pica,IM Fell DW Pica SC,IM Fell Double Pica,IM Fell Double Pica SC,IM Fell English,IM Fell English SC,IM Fell French Canon,IM Fell French Canon SC,IM Fell Great Primer,IM Fell Great Primer SC,Iceberg,Iceland,Imprima,Inconsolata,Inder,Indie Flower,Inika,Inknut Antiqua,Irish Grover,Istok Web,Italiana,Italianno,Itim,Jacques Francois,Jacques Francois Shadow,Jaldi,Jim Nightshade,Jockey One,Jolly Lodger,Jomhuria,Jomolhari,Josefin Sans,Josefin Slab,Joti One,Jua,Judson,Julee,Julius Sans One,Junge,Jura,Just Another Hand,Just Me Again Down Here,K2D,Kadwa,Kalam,Kameron,Kanit,Kantumruy,Karla,Karma,Katibeh,Kaushan Script,Kavivanar,Kavoon,Kdam Thmor,Keania One,Kelly Slab,Kenia,Khand,Khmer,Khula,Kirang Haerang,Kite One,Knewave,KoHo,Kodchasan,Kosugi,Kosugi Maru,Kotta One,Koulen,Kranky,Kreon,Kristi,Krona One,Krub,Kulim Park,Kumar One,Kumar One Outline,Kurale,La Belle Aurore,Lacquer,Laila,Lakki Reddy,Lalezar,Lancelot,Lateef,Lato,League Script,Leckerli One,Ledger,Lekton,Lemon,Lemonada,Lexend Deca,Lexend Exa,Lexend Giga,Lexend Mega,Lexend Peta,Lexend Tera,Lexend Zetta,Libre Barcode 128,Libre Barcode 128 Text,Libre Barcode 39,Libre Barcode 39 Extended,Libre Barcode 39 Extended Text,Libre Barcode 39 Text,Libre Baskerville,Libre Caslon Display,Libre Caslon Text,Libre Franklin,Life Savers,Lilita One,Lily Script One,Limelight,Linden Hill,Literata,Liu Jian Mao Cao,Livvic,Lobster,Lobster Two,Londrina Outline,Londrina Shadow,Londrina Sketch,Londrina Solid,Long Cang,Lora,Love Ya Like A Sister,Loved by the King,Lovers Quarrel,Luckiest Guy,Lusitana,Lustria,M PLUS 1p,M PLUS Rounded 1c,Ma Shan Zheng,Macondo,Macondo Swash Caps,Mada,Magra,Maiden Orange,Maitree,Major Mono Display,Mako,Mali,Mallanna,Mandali,Manjari,Mansalva,Manuale,Marcellus,Marcellus SC,Marck Script,Margarine,Markazi Text,Marko One,Marmelad,Martel,Martel Sans,Marvel,Mate,Mate SC,Material Icons,Maven Pro,McLaren,Meddon,MedievalSharp,Medula One,Meera Inimai,Megrim,Meie Script,Merienda,Merienda One,Merriweather,Merriweather Sans,Metal,Metal Mania,Metamorphous,Metrophobic,Michroma,Milonga,Miltonian,Miltonian Tattoo,Mina,Miniver,Miriam Libre,Mirza,Miss Fajardose,Mitr,Modak,Modern Antiqua,Mogra,Molengo,Molle,Monda,Monofett,Monoton,Monsieur La Doulaise,Montaga,Montez,Montserrat,Montserrat Alternates,Montserrat Subrayada,Moul,Moulpali,Mountains of Christmas,Mouse Memoirs,Mr Bedfort,Mr Dafoe,Mr De Haviland,Mrs Saint Delafield,Mrs Sheppards,Mukta,Mukta Mahee,Mukta Malar,Mukta Vaani,Muli,Mystery Quest,NTR,Nanum Brush Script,Nanum Gothic,Nanum Gothic Coding,Nanum Myeongjo,Nanum Pen Script,Neucha,Neuton,New Rocker,News Cycle,Niconne,Niramit,Nixie One,Nobile,Nokora,Norican,Nosifer,Notable,Nothing You Could Do,Noticia Text,Noto Sans,Noto Sans HK,Noto Sans JP,Noto Sans KR,Noto Sans SC,Noto Sans TC,Noto Serif,Noto Serif JP,Noto Serif KR,Noto Serif SC,Noto Serif TC,Nova Cut,Nova Flat,Nova Mono,Nova Oval,Nova Round,Nova Script,Nova Slim,Nova Square,Numans,Nunito,Nunito Sans,Odor Mean Chey,Offside,Old Standard TT,Oldenburg,Oleo Script,Oleo Script Swash Caps,Open Sans,Open Sans Condensed,Oranienbaum,Orbitron,Oregano,Orienta,Original Surfer,Oswald,Over the Rainbow,Overlock,Overlock SC,Overpass,Overpass Mono,Ovo,Oxygen,Oxygen Mono,PT Mono,PT Sans,PT Sans Caption,PT Sans Narrow,PT Serif,PT Serif Caption,Pacifico,Padauk,Palanquin,Palanquin Dark,Pangolin,Paprika,Parisienne,Passero One,Passion One,Pathway Gothic One,Patrick Hand,Patrick Hand SC,Pattaya,Patua One,Pavanam,Paytone One,Peddana,Peralta,Permanent Marker,Petit Formal Script,Petrona,Philosopher,Piedra,Pinyon Script,Pirata One,Plaster,Play,Playball,Playfair Display,Playfair Display SC,Podkova,Poiret One,Poller One,Poly,Pompiere,Pontano Sans,Poor Story,Poppins,Port Lligat Sans,Port Lligat Slab,Pragati Narrow,Prata,Preahvihear,Press Start 2P,Pridi,Princess Sofia,Prociono,Prompt,Prosto One,Proza Libre,Public Sans,Puritan,Purple Purse,Quando,Quantico,Quattrocento,Quattrocento Sans,Questrial,Quicksand,Quintessential,Qwigley,Racing Sans One,Radley,Rajdhani,Rakkas,Raleway,Raleway Dots,Ramabhadra,Ramaraja,Rambla,Rammetto One,Ranchers,Rancho,Ranga,Rasa,Rationale,Ravi Prakash,Red Hat Display,Red Hat Text,Redressed,Reem Kufi,Reenie Beanie,Revalia,Rhodium Libre,Ribeye,Ribeye Marrow,Righteous,Risque,Roboto,Roboto Condensed,Roboto Mono,Roboto Slab,Rochester,Rock Salt,Rokkitt,Romanesco,Ropa Sans,Rosario,Rosarivo,Rouge Script,Rozha One,Rubik,Rubik Mono One,Ruda,Rufina,Ruge Boogie,Ruluko,Rum Raisin,Ruslan Display,Russo One,Ruthie,Rye,Sacramento,Sahitya,Sail,Saira,Saira Condensed,Saira Extra Condensed,Saira Semi Condensed,Saira Stencil One,Salsa,Sanchez,Sancreek,Sansita,Sarabun,Sarala,Sarina,Sarpanch,Satisfy,Sawarabi Gothic,Sawarabi Mincho,Scada,Scheherazade,Schoolbell,Scope One,Seaweed Script,Secular One,Sedgwick Ave,Sedgwick Ave Display,Sevillana,Seymour One,Shadows Into Light,Shadows Into Light Two,Shanti,Share,Share Tech,Share Tech Mono,Shojumaru,Short Stack,Shrikhand,Siemreap,Sigmar One,Signika,Signika Negative,Simonetta,Single Day,Sintony,Sirin Stencil,Six Caps,Skranji,Slabo 13px,Slabo 27px,Slackey,Smokum,Smythe,Sniglet,Snippet,Snowburst One,Sofadi One,Sofia,Song Myung,Sonsie One,Sorts Mill Goudy,Source Code Pro,Source Sans Pro,Source Serif Pro,Space Mono,Special Elite,Spectral,Spectral SC,Spicy Rice,Spinnaker,Spirax,Squada One,Sree Krushnadevaraya,Sriracha,Srisakdi,Staatliches,Stalemate,Stalinist One,Stardos Stencil,Stint Ultra Condensed,Stint Ultra Expanded,Stoke,Strait,Stylish,Sue Ellen Francisco,Suez One,Sumana,Sunflower,Sunshiney,Supermercado One,Sura,Suranna,Suravaram,Suwannaphum,Swanky and Moo Moo,Syncopate,Tajawal,Tangerine,Taprom,Tauri,Taviraj,Teko,Telex,Tenali Ramakrishna,Tenor Sans,Text Me One,Thasadith,The Girl Next Door,Tienne,Tillana,Timmana,Tinos,Titan One,Titillium Web,Tomorrow,Trade Winds,Trirong,Trocchi,Trochut,Trykker,Tulpen One,Turret Road,Ubuntu,Ubuntu Condensed,Ubuntu Mono,Ultra,Uncial Antiqua,Underdog,Unica One,UnifrakturCook,UnifrakturMaguntia,Unkempt,Unlock,Unna,VT323,Vampiro One,Varela,Varela Round,Vast Shadow,Vesper Libre,Vibes,Vibur,Vidaloka,Viga,Voces,Volkhov,Vollkorn,Vollkorn SC,Voltaire,Waiting for the Sunrise,Wallpoet,Walter Turncoat,Warnes,Wellfleet,Wendy One,Wire One,Work Sans,Yanone Kaffeesatz,Yantramanav,Yatra One,Yellowtail,Yeon Sung,Yeseva One,Yesteryear,Yrsa,ZCOOL KuaiLe,ZCOOL QingKe HuangYou,ZCOOL XiaoWei,Zeyada,Zhi Mang Xing,Zilla Slab,Zilla Slab Highlight,Noto Naskh Arabic,Noto Sans Armenian,Noto Sans Bengali,Noto Sans Buginese,Noto Sans Canadian Aboriginal,Noto Sans Cherokee,Noto Sans Devanagari,Noto Sans Ethiopic,Noto Sans Georgian,Noto Sans Gujarati,Noto Sans Gurmukhi,Noto Sans Hebrew,Noto Sans JP Regular,Noto Sans KR Regular,Noto Sans Kannada,Noto Sans Khmer,Noto Sans Lao,Noto Sans Malayalam,Noto Sans Mongolian,Noto Sans Myanmar,Noto Sans Oriya,Noto Sans SC Regular,Noto Sans Sinhala,Noto Sans TC Regular,Noto Sans Tamil,Noto Sans Telugu,Noto Sans Thaana,Noto Sans Thai,Noto Sans Tibetan,Noto Sans Yi,Noto Serif Armenian,Noto Serif Khmer,Noto Serif Lao,Noto Serif Thai".split(",");
function q() {
	return Array.from({ length: 32 }, () => "0123456789ABCDEF"[Q(0, 15)]).join("");
}
function J() {
	return be(xe, Math.floor(Math.random() * 400) + 100).join(";");
}
function Y(e = "Chrome") {
	if (X(e)) return Math.random();
	let t = Math.floor(Math.random() * 10), n = Math.floor(Math.random() * 10), r = "";
	for (let e = 0; e < 14; e++) {
		let e = Math.floor(Math.random() * 36);
		r += "ABCDEFGHIJKLMNOPQISTUVWXYZ0123456789"[e];
	}
	return `${t}${n}${r}`;
}
function X(e = "Chrome") {
	return e === "Firefox";
}
function Z() {
	return {
		clientRectsNoiseFactorX: 2 * Math.random() - 1,
		clientRectsNoiseFactorY: 2 * Math.random() - 1
	};
}
function Q(e, t) {
	return Math.floor(Math.random() * (t - e + 1)) + e;
}
function $(e, t = "Chrome") {
	let n = [...X(t) ? K : G];
	console.log("coreType", t), console.log("newVoices", n);
	for (let e = 0; e < Math.floor(Math.random() * 2); e++) n.splice(Math.floor(Math.random() * (n.length - 1)), 1);
	let r = [];
	for (let e = 0; e < 3; e++) {
		let e = Math.floor(Math.random() * (n.length - 1)), [t] = n.splice(e, 1);
		r.push({
			...t,
			isLocalService: !0
		});
	}
	let i = [];
	return X(t) || e !== "Windows" && e || (i = [
		{
			name: "Microsoft David - English (United States)",
			isLocalService: !0,
			lang: "en-US"
		},
		{
			name: "Microsoft Mark - English (United States)",
			isLocalService: !0,
			lang: "en-US"
		},
		{
			name: "Microsoft Zira - English (United States)",
			isLocalService: !0,
			lang: "en-US"
		}
	]), [
		...i,
		...r,
		...n
	];
}
function Se(e, t, n = "Chrome") {
	if (!t) return e;
	let r = Array.isArray(e) ? e : [], i = X(n) ? K : G, a = r.find((e) => e.lang === t) ?? i.find((e) => e.lang === t);
	if (!a) return e;
	let o = [{
		...a,
		isLocalService: !0
	}, ...r.filter((e) => e.name !== a.name || e.lang !== a.lang).map((e) => ({ ...e }))], s = 0;
	return o.map((e) => !e.isLocalService || (s += 1, s <= 3) ? e : {
		...e,
		isLocalService: !1
	});
}
async function Ce(e) {
	let { payload: t, count: n = 1, genType: r, API: i, getMacAddress: a, local_fonts: o } = e, { fontType: s, canvas: c, webGL: l, audioContext: u, speechVoices: d, clientRects: f, macInfo: p, os: m, osVersion: h, coreVersion: g, coreType: _ } = t, v = r === "api" ? { source: "api" } : {};
	console.debug("genRandomFingerprint options", {
		payload: t,
		count: n,
		genType: r,
		getMacAddress: a,
		local_fonts: o
	});
	let y = await Promise.all([
		i.window.userGetUaWebglV2List({
			os: m,
			osVersion: h,
			coreVersion: g,
			coreType: _,
			count: n
		}, { headers: v }),
		i.window.userGetDeviceNameV2List({
			os: m,
			coreType: _,
			count: n
		}, { headers: v }),
		p ? i.window.userGetMacAddrV2List({
			count: n,
			coreType: _
		}, { headers: v }) : {
			code: 0,
			data: [{ macAddr: await a() }]
		}
	]).catch((e) => (console.error("genRandomFingerprint error", e), Promise.reject(e)));
	console.log("genRandomFingerprint result", y);
	let b = y.find((e) => e.code !== 0);
	if (b) return console.error("unSuccessItem", b), Promise.reject(Error(b.msg));
	let [{ data: x }, { data: S }, { data: C }] = y, w = Array.from({ length: n }).map((e, t) => ({
		...x[t],
		...S[t],
		...C[t],
		mediaDevice: !1,
		mediaDeviceList: [{
			deviceType: "audioinput",
			deviceId: "",
			label: "",
			groupId: ""
		}],
		font: s ? W(o).join(";") : void 0,
		allowFontList: s ? J() : void 0,
		canvasValue: c ? q() : void 0,
		canvasValueV2: X(_) ? Math.random() : Q(1e3, 99999),
		webGLValue: l ? Y(_) : void 0,
		audioContextValue: u ? Math.random() : void 0,
		speechVoicesValue: {
			enable: d,
			voices: $(m, _)
		},
		clientRectsValue: {
			enable: f,
			...Z()
		}
	}));
	return JSON.parse(JSON.stringify(w));
}
var we = {
	genRandomFonts: W,
	getCanvasContextNoiseValue: q,
	getRandomInt: Q,
	getSpeechSynthesis: $,
	getClientRectsValue: Z,
	getwebGLNoiseValue: Y,
	getAllowFontList: J
};
export { f as C, x as D, b as E, g as O, m as S, v as T, k as _, N as a, _ as b, we as c, Ce as d, ce as f, E as g, re as h, ue as i, u as k, B as l, le as m, de as n, F as o, fe as p, W as r, M as s, _e as t, Se as u, d as v, y as w, h as x, p as y };
