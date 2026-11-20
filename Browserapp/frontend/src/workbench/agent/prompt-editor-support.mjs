import {
  jn as parseTemplateReference, An as formatScriptToken, h as requests, wn as createTemplateReference,
  yn as formatProfileToken
} from "./utils-BIWenCnY.js";
import { n as workspaceCode } from "./workspace-CNvgSgaH.js";
import { c as TiptapNode, i as Suggestion, l as mergeHtmlAttributes, n as Link, s as Extension } from "./dist-BAPiYeUN.js";
import {
  ensureTokenTooltipElements, windowDisplayInfo, formatSuggestionPrompt, serializeToken,
  promptNormalizedTokens, fetchOpenWindows, markOpenWindow, payloadAttributes, faviconForLink,
  formatTemplatePrompt, suggestionProfileIds, localizedText, parsePromptDocument, suggestionTokenNode,
  readTemplatePrompt, userTemplateIsUnread
} from "./CreateTemplateDialog-Bpq9OLTG.js";

var promptLink = Link.extend({ inclusive: false, renderHTML({ HTMLAttributes: e4 }) {
  let t2 = faviconForLink(e4.href), n2 = t2 ? { "data-agent-favicon-url": t2 } : {};
  return ["a", mergeHtmlAttributes(this.options.HTMLAttributes, e4, n2), 0];
}, addAttributes() {
  return { ...this.parent?.(), markdownSource: { default: null, parseHTML: (e4) => e4.getAttribute("data-markdown-source"), renderHTML: (e4) => e4.markdownSource ? { "data-markdown-source": e4.markdownSource } : {} } };
} }).configure({ shouldAutoLink: (e4) => /^https?:\/\//i.test(e4) });
var promptToken = TiptapNode.create({ name: "agentToken", group: "inline", inline: true, atom: true, selectable: true, addAttributes() {
  return { id: { default: "" }, kind: { default: "skill" }, title: { default: "" }, label: { default: "" }, description: { default: "" }, iconName: { default: "" }, group: { default: "" }, payload: { default: {} } };
}, parseHTML() {
  return [{ tag: "span[data-agent-token]", getAttrs: (e4) => {
    let t2 = e4.getAttribute("data-payload");
    return { id: e4.getAttribute("data-id") || "", kind: e4.getAttribute("data-kind") || e4.getAttribute("data-agent-token") || "skill", title: e4.getAttribute("data-title") || e4.textContent?.trim() || "", label: e4.getAttribute("data-label") || "", description: e4.getAttribute("data-description") || "", iconName: e4.getAttribute("data-icon-name") || "", group: e4.getAttribute("data-group") || "", payload: t2 ? parseTokenPayload(t2) : {} };
  } }];
}, renderHTML({ node: e4 }) {
  let t2 = e4.attrs, n2 = normalizeTokenKind(t2.kind), r2 = t2.iconName || tokenIcon(n2), i2 = tokenLabel(t2), a2 = profileTokenCount(t2), o2 = ensureTokenTooltipElements(payloadAttributes(t2.payload), a2, profileTokenIds(t2)), s2 = (n2 === "input" || n2 === "textarea" || n2 === "url" || n2 === "project") && !t2.payload.value?.trim(), c2 = n2 === "profile" && a2 === 0;
  return ["span", mergeHtmlAttributes({ "data-agent-token": n2, "data-id": t2.id, "data-kind": n2, "data-title": t2.title, "data-label": t2.label || "", "data-description": t2.description, "data-icon-name": t2.iconName, "data-group": t2.group, "data-payload": JSON.stringify(t2.payload || {}), class: ["agent-token", `agent-token--${n2}`, s2 ? "agent-token--input-empty" : "", c2 ? "agent-token--profile-empty" : ""].filter(Boolean).join(" ") }), ...n2 === "profile" && a2 > 0 ? [["span", { class: "agent-token__profile-prefix" }, ["span", { class: "agent-token__icon" }, ["roxy-svg-icon", { name: r2, fallback: tokenIcon(n2), size: 16 }]], ["span", { class: "agent-token__label" }, i2]], ["span", { class: "agent-token__profile-detail" }, ["span", { class: "agent-token__profile-names" }, o2], ["span", { "aria-label": "Remove token", contenteditable: "false", "data-agent-token-remove": "", role: "button", class: "agent-token__remove" }, ["roxy-svg-icon", { name: "base/rx_ic_delete", size: 12 }]]]] : [["span", { class: "agent-token__icon" }, ["roxy-svg-icon", { name: r2, fallback: tokenIcon(n2), size: 16 }]], ["span", { class: "agent-token__label" }, i2]], ...n2 === "input" || n2 === "textarea" || n2 === "url" || n2 === "project" || n2 === "profile" && a2 > 0 ? [] : [["span", { "aria-label": "Remove token", contenteditable: "false", "data-agent-token-remove": "", role: "button", class: "agent-token__remove" }, ["roxy-svg-icon", { name: "base/rx_ic_delete", size: 12 }]]]];
}, renderText({ node: e4 }) {
  return serializeToken(e4.attrs);
} });
function createSlashExtension(e4) {
  return Extension.create({ name: "slashCommand", addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, char: "/", items: ({ query: t2 }) => e4.getItems(t2), command: ({ editor: t2, range: n2, props: r2 }) => {
      e4.command({ editor: t2, range: n2, item: r2 });
    }, render: e4.render })];
  } });
}
function parseTokenPayload(e4) {
  try {
    return JSON.parse(e4);
  } catch {
    return {};
  }
}
function normalizeTokenKind(e4) {
  return e4 === "profile" || e4 === "script" || e4 === "skill" || e4 === "input" || e4 === "textarea" || e4 === "url" || e4 === "project" ? e4 : "skill";
}
function tokenIcon(e4) {
  return e4 === "input" || e4 === "textarea" || e4 === "project" ? "roxy-agent/rx-ic-prompts" : e4 === "url" ? "roxy-agent/rx-ic-url" : e4 === "profile" ? "roxy-agent/rx-ic-token-profile" : e4 === "script" ? "roxy-agent/rx-ic-scripts" : "roxy-agent/rx-ic-skills";
}
function tokenLabel(e4) {
  return e4.kind === "profile" ? profileTokenCount(e4) > 0 ? $t("窗口") : $t("选择窗口") : e4.kind !== "input" && e4.kind !== "textarea" && e4.kind !== "url" && e4.kind !== "project" ? e4.title : e4.payload.value?.trim() || e4.title;
}
function profileTokenCount(e4) {
  if (e4.kind !== "profile") return 0;
  let t2 = e4.payload.dirIds || e4.payload.dirId || e4.id || "";
  if (t2.trim()) return t2.split(",").map((e5) => e5.trim()).filter(Boolean).length;
  let n2 = Number(e4.payload.count);
  return Number.isFinite(n2) ? n2 : 0;
}
function profileTokenIds(e4) {
  return e4.kind === "profile" ? (e4.payload.dirIds || e4.payload.dirId || e4.id || "").split(",").map((e5) => e5.trim()).filter(Boolean) : [];
}
var projectStorageKey = "agent-console:composer-project-selection";
function availableStorage(e4) {
  if (e4 !== undefined) return e4 ?? undefined;
  if (typeof window !== "undefined") try {
    return window.localStorage;
  } catch {
    return;
  }
}
function workspaceProjectKey(e4) {
  let t2 = String(e4 ?? "").trim();
  return t2 ? `${projectStorageKey}:${t2}` : undefined;
}
function readProjectSelection(e4, t2) {
  let n2 = workspaceProjectKey(e4), r2 = availableStorage(t2);
  if (n2 && r2) try {
    return r2.getItem(n2)?.trim() || undefined;
  } catch {
    return;
  }
}
function rememberProjectSelection(e4, t2, n2) {
  let r2 = workspaceProjectKey(e4), i2 = t2.trim(), a2 = availableStorage(n2);
  if (r2 && i2 && a2) try {
    a2.setItem(r2, i2);
  } catch {
  }
}
function suggestionSelectionMode(e4) {
  return e4 === "mention" ? { closeAfterChoose: false, multiSelect: true } : { closeAfterChoose: true, multiSelect: false };
}
function moveSuggestionIndex(e4, t2, n2) {
  return t2 <= 0 ? 0 : (Math.min(Math.max(e4, 0), t2 - 1) + (n2 === "next" ? 1 : -1) + t2) % t2;
}
function needsTrailingSpace(e4, t2) {
  if (!e4 || !t2) return true;
  let n2 = t2.to === t2.from + e4.nodeSize, r2 = e4.type.name === "agentToken" || e4.type.name === "mention";
  return !n2 || !r2;
}
function selectedTokenTargets(e4, t2) {
  let n2 = new Set();
  for (let r2 of promptNormalizedTokens(e4)) r2.kind === t2 && (t2 !== "script" || r2.templateRef) && (t2 !== "skill" || r2.skillPath) && (t2 === "profile" ? splitIdentifiers(r2.target) : [r2.kind === "skill" ? r2.skillPath ?? r2.target : r2.templateRef ?? r2.target]).forEach((e5) => n2.add(e5));
  return n2;
}
function splitIdentifiers(e4) {
  return e4.split(",").map((e5) => e5.trim()).filter(Boolean);
}
var recommendedTemplateLimit = 8;
function takeRecommendedTemplates(e4) {
  return e4.slice(0, recommendedTemplateLimit);
}
var installedSkillRoot = "";
function setInstalledSkillRoot(e4) {
  installedSkillRoot = typeof e4 == "string" ? e4.trim() : "";
}
function getInstalledSkillRoot() {
  return installedSkillRoot;
}
function normalizeSkillSlug(e4) {
  return e4.trim().replace(/[^\w-]/g, "_").replace(/_+/g, "_");
}
function safeSkillPath(e4) {
  let t2 = e4?.trim();
  if (!t2) return "";
  let n2 = t2.replace(/\\/g, "/");
  if (!n2 || n2.startsWith("/") || /^[a-z]:/i.test(n2)) return "";
  let r2 = n2.split("/");
  if (r2.includes("..")) return "";
  let i2 = r2.filter((e5) => e5 && e5 !== ".").join("/");
  return i2 ? normalizeSkillSlug(i2) : "";
}
function relativeSkillPath(e4) {
  return safeSkillPath(e4);
}
function isObject(e4) {
  return typeof e4 == "object" && !!e4 && !Array.isArray(e4);
}
function normalizeTemplateKind(e4) {
  return e4 === "script" || e4 === "scripts" ? "script" : e4 === "skill" || e4 === "skills" ? "skill" : e4 === "prompt" ? e4 : "prompt";
}
function localizedMetadata(e4, t2) {
  return typeof e4 == "string" ? e4.trim() : localizedText(e4, t2).trim();
}
function firstMetadataValue(e4, t2, n2) {
  for (let r2 of t2) {
    let t3 = localizedMetadata(e4[r2], n2);
    if (t3) return t3;
  }
  return "";
}
function stripOfficialPrefix(e4) {
  return e4.startsWith("official-") ? e4.slice(9) : e4;
}
function readSkillSlug(e4) {
  let t2 = firstMetadataValue(e4, ["packageSlug", "package_slug", "skillSlug", "skill_slug"]);
  if (t2) {
    let e5 = safeSkillPath(stripOfficialPrefix(t2));
    if (e5) return e5;
  }
  if (isObject(e4.skillMetadata)) {
    let t3 = firstMetadataValue(e4.skillMetadata, ["packageSlug", "package_slug", "skillSlug", "skill_slug"]);
    if (t3) {
      let e5 = safeSkillPath(stripOfficialPrefix(t3));
      if (e5) return e5;
    }
    let n3 = localizedMetadata(e4.skillMetadata.slug);
    if (n3) return safeSkillPath(stripOfficialPrefix(n3));
  }
  let n2 = localizedMetadata(e4.slug);
  return n2 ? safeSkillPath(stripOfficialPrefix(n2)) : "";
}
function officialSkillSlug(e4) {
  return readSkillSlug(e4.metadata ?? {}) || stripOfficialPrefix(e4.slug?.trim() ?? "");
}
function metadataPrompt(e4, t2) {
  return firstMetadataValue(e4, ["prompt", "promptText", "prompt_text", "templatePrompt", "template_prompt", "content", "text"], t2);
}
function templateKind(e4) {
  return normalizeTemplateKind("kind" in e4 ? e4.kind : e4.templateType);
}
function createTemplateToken(e4) {
  let t2 = createTemplateReference(e4.namespace, e4.id), n2 = e4.kind === "skill" ? relativeSkillPath(e4.skillSlug) : "";
  return { id: n2 || t2, kind: e4.kind, title: e4.title, label: e4.title, description: e4.description, iconName: e4.kind === "skill" ? "roxy-agent/rx-ic-skills" : "roxy-agent/rx-ic-scripts", group: e4.kind === "skill" ? "Skills" : "Scripts", payload: e4.kind === "skill" ? { ...e4.skillSlug ? { skillSlug: e4.skillSlug } : {}, ...n2 ? { skillPath: n2 } : {} } : { templateRef: t2 } };
}
function userTemplateSuggestion(e4, t2) {
  let n2 = isObject(e4.metadata) ? e4.metadata : {}, r2 = templateKind(e4), i2 = localizedText(e4.name, t2) || String(e4.id), a2 = metadataPrompt(n2, t2), o2 = localizedText(e4.description, t2) || a2, s2 = r2 === "skill" ? readSkillSlug(n2) : "";
  let c2 = r2 === "script" || r2 === "skill" ? [createTemplateToken({ id: e4.id, kind: r2, namespace: "user", skillSlug: r2 === "skill" ? s2 : undefined, title: i2, description: o2 })] : [], l2 = { templateType: r2 === "skill" ? "skills" : r2, userTemplateId: String(e4.id), workspaceId: e4.workspaceId };
  return typeof e4.officialTemplateId == "number" && (l2.officialTemplateId = String(e4.officialTemplateId)), { id: `user-template-${e4.id}`, kind: "template", title: i2, label: i2, description: o2, iconName: "roxy-agent/rx-ic-templates", group: "Templates", isTopped: !!e4.isTopped, toppedAt: e4.toppedAt ?? null, templateId: e4.id, templateSource: "user", payload: l2, template: { prompt: a2, tokens: c2 } };
}
function recommendedTemplateSuggestion(e4) {
  let t2 = e4.kind === "script" || e4.kind === "skill" ? [createTemplateToken({ id: e4.id, kind: e4.kind, namespace: "official", skillSlug: e4.kind === "skill" ? officialSkillSlug(e4) : undefined, title: e4.title, description: e4.description })] : [];
  return { id: `recommended-template-${e4.id}`, kind: "template", title: e4.title, label: e4.title, description: e4.description, iconName: e4.iconName, group: "Templates", isTopped: !!e4.isTopped, toppedAt: e4.toppedAt ?? null, templateId: e4.id, templateSource: "official", payload: { officialTemplateId: String(e4.id), templateType: e4.kind === "skill" ? "skills" : e4.kind }, template: { prompt: e4.kind === "script" ? "" : e4.prompt, tokens: t2 } };
}
function officialTemplateSuggestion(e4, t2) {
  return recommendedTemplateSuggestion({ id: e4.id, kind: normalizeTemplateKind(e4.templateType), metadata: e4.metadata, slug: e4.slug, title: localizedText(e4.name, t2) || e4.slug, description: localizedText(e4.description, t2), iconName: "roxy-agent/rx-ic-templates", prompt: readTemplatePrompt(e4, t2), isTopped: e4.isTopped, toppedAt: e4.toppedAt });
}
function pinnedTimestamp(e4) {
  if (!e4) return -1 / 0;
  let t2 = Date.parse(e4);
  return Number.isFinite(t2) ? t2 : -1 / 0;
}
function sortPinnedTemplates(e4) {
  return e4.map((e5, t2) => ({ item: e5, index: t2 })).sort((e5, t2) => {
    let n2 = +!!t2.item.isTopped - +!!e5.item.isTopped;
    if (n2) return n2;
    if (e5.item.isTopped && t2.item.isTopped) {
      let n3 = pinnedTimestamp(t2.item.toppedAt) - pinnedTimestamp(e5.item.toppedAt);
      if (n3) return n3;
    }
    return e5.index - t2.index;
  }).map((e5) => e5.item);
}
function mergeTemplateSuggestions(e4, t2) {
  let n2 = new Set(e4.map((e5) => e5.id)), r2 = new Set(e4.map((e5) => e5.payload.officialTemplateId).filter((e5) => !!e5)), i2 = new Map();
  return t2.forEach((e5) => {
    let t3 = e5.payload.officialTemplateId;
    t3 && !i2.has(t3) && i2.set(t3, e5);
  }), sortPinnedTemplates([...e4.map((e5) => {
    let t3 = e5.payload.officialTemplateId;
    return t3 ? i2.get(t3) ?? e5 : e5;
  }), ...t2.filter((e5) => {
    if (n2.has(e5.id)) return false;
    let t3 = e5.payload.officialTemplateId;
    return !t3 || !r2.has(t3);
  })]);
}
function userTemplatePrompt(e4, t2) {
  return formatTemplatePrompt(userTemplateSuggestion(e4, t2));
}
function formatUserTemplatePrompt(e4, t2) {
  return templateKind(e4) === "script" && userScriptPrompt(e4, t2) || userTemplatePrompt(e4, t2);
}
function formatOfficialTemplatePrompt(e4, t2, n2) {
  return t2?.officialTemplateId === e4.id ? formatUserTemplatePrompt(t2, n2) : e4.kind === "script" ? scriptTemplatePrompt(e4.title, createTemplateReference("official", e4.id)) : formatTemplatePrompt(recommendedTemplateSuggestion(e4));
}
function userTemplateWithoutAuxiliaryPrompt(e4, t2) {
  return formatTemplatePrompt(userTemplateSuggestion(e4, t2), { includeAuxiliaryPrompt: false });
}
function scriptTemplatePrompt(t2, n2) {
  let r2 = t2.trim();
  if (!r2) return "";
  try {
    let t3 = parseTemplateReference(n2);
    return $t("在 {profile} 窗口中运行 {script}", { profile: formatProfileToken([]), script: formatScriptToken(r2, t3) });
  } catch {
    return "";
  }
}
function userScriptPrompt(e4, t2) {
  let n2 = userTemplateWithoutAuxiliaryPrompt(e4, t2);
  return n2 ? $t("在 {profile} 窗口中运行 {script}", { profile: formatProfileToken([]), script: n2 }) : "";
}
var profilePageSize = 10;
var bulkProfilePageSize = 100;
function profileFallbackName(e4) {
  return e4.windowSortNum == null ? e4.dirId || "" : String(e4.windowSortNum);
}
function profileSuggestion(e4, t2) {
  if (!e4.dirId) return;
  let n2 = windowDisplayInfo(e4), r2 = n2.name || profileFallbackName(e4), i2 = workspaceCode(e4.workspaceName || t2), a2 = e4.windowSortNum == null ? "" : i2 ? `${i2}-${e4.windowSortNum}` : String(e4.windowSortNum);
  if (r2) return { id: e4.dirId, kind: "profile", title: r2, label: r2, description: n2.remark, iconName: n2.iconName, isOpen: n2.isOpen, group: "Windows", payload: { dirId: e4.dirId, windowName: n2.name, windowRemark: n2.remark, lastCountry: e4.lastCountry || "", projectId: e4.projectId?.toString() || "", projectName: e4.projectName || "", workspaceName: e4.workspaceName || t2 || "", windowSortNum: e4.windowSortNum?.toString() || "", displayLabel: a2 || n2.name || e4.dirId } };
}
async function queryProfiles(e4) {
  let t2 = e4.pageSize ?? profilePageSize, n2 = e4.keyword?.trim() ?? "", r2 = await requests.window.userGetWindowInfoListList({ page_index: e4.pageIndex, page_size: t2, isDelete: 0, orderName: "createTime", orderType: "desc", ...n2 ? { windowName: n2 } : {}, ...e4.projectId ? { projectIds: e4.projectId } : {} });
  if (r2.code !== 0) throw Error(r2.msg || "Failed to load windows");
  let a2 = r2.data?.rows ?? [], o2 = r2.data?.total ?? a2.length;
  return { rows: a2, total: o2, hasMore: e4.pageIndex * t2 < o2 && a2.length > 0 };
}
function mapProfileSuggestions(e4, t2, n2) {
  return e4.map((e5) => profileSuggestion(markOpenWindow(e5, t2), n2)).filter((e5) => !!e5);
}
async function profileSuggestionPage(e4, t2) {
  let [n2, r2] = await Promise.all([queryProfiles(e4), fetchOpenWindows()]);
  return { items: mapProfileSuggestions(n2.rows, r2, t2), total: n2.total, hasMore: n2.hasMore };
}
async function allProfileSuggestions(e4 = "", t2, n2 = "") {
  let r2 = fetchOpenWindows(), i2 = [], a2 = 1, o2 = 0;
  do {
    let t3 = await queryProfiles({ pageIndex: a2, pageSize: bulkProfilePageSize, keyword: e4, projectId: n2 });
    if (i2.push(...t3.rows), o2 = t3.total, !t3.hasMore) break;
    a2 += 1;
  } while (i2.length < o2);
  return mapProfileSuggestions(i2, await r2, t2);
}
var userTemplatePageSize = 200;
var profileSearchDelay = 250;
var allProjects = "__all__";

function userTemplateReadKey(e4) {
  let t2 = Number(e4.payload.userTemplateId), n2 = e4.payload.workspaceId?.trim();
  if (!(!n2 || !Number.isSafeInteger(t2) || t2 <= 0)) return { id: t2, workspaceId: n2 };
}
function templateIsUnread(e4, t2) {
  let n2 = userTemplateReadKey(t2);
  return !!(n2 && userTemplateIsUnread(e4, n2));
}
function insertSuggestion(e4, t2, n2) {
  if (!e4) return;
  if (t2.kind === "template") {
    insertTemplatePrompt(e4, t2, n2);
    return;
  }
  let r2 = e4.chain().focus(), i2 = needsTrailingSpace(n2 ? e4.state.doc.nodeAt(n2.from) : undefined, n2);
  n2 && r2.deleteRange(n2), r2.insertContent([suggestionTokenNode(t2), ...i2 ? [{ type: "text", text: " " }] : []]).run();
}
function insertTemplatePrompt(e4, t2, n2) {
  let r2 = formatSuggestionPrompt(t2);
  if (!r2) return;
  let i2 = parsePromptDocument(r2, { profiles: [], slashItems: t2.template?.tokens ?? [] }).content ?? [], a2 = e4.chain().focus();
  n2 && a2.deleteRange(n2), a2.insertContent([...i2.flatMap((e5, t3) => [...t3 > 0 ? [{ type: "hardBreak" }] : [], ...e5.content ?? []]), { type: "text", text: " " }]).run();
}
function pasteTokenDocument(e4, t2) {
  return (parsePromptDocument(e4, t2).content ?? []).flatMap((e5, t3) => [...t3 > 0 ? [{ type: "hardBreak" }] : [], ...e5.content ?? []]);
}
function deleteSuggestionRange(e4, t2) {
  t2 && e4.chain().focus().deleteRange(t2).run();
}
function removeNodeWithWhitespace(e4, t2, n2) {
  let { doc: r2, tr: i2 } = e4.state, a2 = t2, o2 = t2 + n2, s2 = a2, c2 = o2;
  r2.textBetween(o2, Math.min(o2 + 1, r2.content.size)) === " " ? c2 = o2 + 1 : r2.textBetween(Math.max(a2 - 1, 0), a2) === " " && (s2 = a2 - 1), e4.dispatch(i2.delete(s2, c2)), e4.focus();
}
function removeSelectedProfiles(e4) {
  let t2 = [];
  if (e4.state.doc.descendants((e5, n3) => {
    isProfileNode(e5) && t2.push({ from: n3, to: n3 + e5.nodeSize });
  }), !t2.length) return;
  let { tr: n2 } = e4.state;
  t2.reverse().forEach((e5) => {
    n2.delete(e5.from, e5.to);
  }), e4.view.dispatch(n2), e4.view.focus();
}
function isProfileNode(e4) {
  return e4.type.name === "mention" || e4.type.name === "agentToken" && e4.attrs.kind === "profile";
}
function readProfileNodeIds(e4) {
  return e4.type.name === "mention" ? new Set(e4.attrs.id ? [e4.attrs.id] : []) : e4.type.name === "agentToken" && e4.attrs.kind === "profile" ? new Set(suggestionProfileIds(e4.attrs)) : new Set();
}
function mergeAttributes(...e4) {
  return Object.assign({}, ...e4);
}

export { createSlashExtension, promptLink, promptToken, tokenIcon, readProjectSelection, rememberProjectSelection, suggestionSelectionMode, moveSuggestionIndex, selectedTokenTargets, recommendedTemplateLimit, takeRecommendedTemplates, setInstalledSkillRoot, getInstalledSkillRoot, userTemplateSuggestion, officialTemplateSuggestion, mergeTemplateSuggestions, profileSuggestionPage, allProfileSuggestions, userTemplatePageSize, profileSearchDelay, allProjects, userTemplateReadKey, templateIsUnread, insertSuggestion, pasteTokenDocument, deleteSuggestionRange, removeNodeWithWhitespace, removeSelectedProfiles, readProfileNodeIds, mergeAttributes, recommendedTemplateSuggestion, formatUserTemplatePrompt, formatOfficialTemplatePrompt };
