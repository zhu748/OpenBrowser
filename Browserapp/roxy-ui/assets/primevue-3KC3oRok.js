import {vt as e} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {r as t} from "./basecomponent-ClhuVxJN.js";
import {M as n,c as r} from "./dist-DPswMdzV.js";
import {i,n as a} from "./_Primitives_tokens-N0m8cQDB.js";
import {a as ee,i as te,n as ne,r as re,s as ie} from "./toast-CjMybmc4.js";
import {i as o,n as ae,r as oe,t as s} from "./style-CuLi6QSy.js";
import {t as c} from "./useconfirm-CV4GTWBW.js";
import {t as l} from "./usedialog-Dh0xp3r7.js";
import {n as u,t as d} from "./ripple-DKjDc6yC.js";
import {n as f,t as p} from "./tooltip-BYYKWrvu.js";
import {n as m,t as h} from "./focustrap-DJJkEqE8.js";
import {i as g,n as _,r as v,t as y} from "./style-_2G9QRmx.js";
import {a as b,i as x} from "./button-BKeo7L17.js";
import {t as S} from "./style-DUXp9q6M.js";
import {n as C,t as w} from "./style-BGlNZW5c.js";
import {i as T,n as E,r as D,t as O} from "./style-Nz6iSbce.js";
import {n as k,t as A} from "./style-BVwKkpOq.js";
import {t as j} from "./style-wQ8fEiAg.js";
import {t as M} from "./style-YB-2T3UA.js";
import {t as N} from "./style-DXn2Xqzj.js";
import {n as P,t as F} from "./style-Cb9O3rwa.js";
import {t as I} from "./style-BsQYnaeX.js";
import {n as L,t as R} from "./style-DlMJcXuZ.js";
import {t as z} from "./style-CtmvyDXy.js";
import {t as B} from "./style--P_2bLcB.js";
import {t as V} from "./style-BPHNqLkW.js";
import {t as H} from "./style-Hbl83ARJ.js";
import {t as U} from "./style-Dh_I5WGt.js";
import {t as W} from "./style-f2ODP_Xm.js";
import {t as G} from "./style-uEttjQjV.js";
import {t as K} from "./style-DSnaLsVx.js";
import {t as q} from "./style-CGO5sn8o.js";
import {t as se} from "./style-CvSzqefG.js";
import {t as ce} from "./style-DyhoLZF6.js";
import {t as le} from "./style-D5noSJFr.js";
import {t as ue} from "./style-CSCMuhHp.js";
import {t as de} from "./style-lwdJ6AEv.js";
import {t as fe} from "./style-Bs8ammb0.js";
import {n as pe,t as me} from "./style-DxhTHPhb.js";
import {n as he,t as ge} from "./style-DVUKTuRI.js";
import {a as _e,i as ve,n as ye,r as be,t as xe} from "./style-CEf8x4sr.js";
import {t as Se} from "./style-DcqmecZD.js";
import {t as Ce} from "./style-gUVCyWpA.js";
import {t as we} from "./style-DvVmWLtY.js";
var Te = { install: function(e2) {
  var t2 = { require: function(e3) {
    o.emit("confirm", e3);
  }, close: function() {
    o.emit("close");
  } };
  e2.config.globalProperties.$confirm = t2, e2.provide(c, t2);
} };
var J = r();
var Ee = { install: function(t2) {
  var n2 = { open: function(t3, n3) {
    var r2 = { content: t3 && e(t3), options: n3 || {}, data: n3 && n3.data, close: function(e2) {
      J.emit("close", { instance: r2, params: e2 });
    } };
    return J.emit("open", { instance: r2 }), r2;
  } };
  t2.config.globalProperties.$dialog = n2, t2.provide(l, n2);
} };
var De = { borderRadius: { none: "0", xs: "2px", sm: "4px", md: "6px", lg: "8px", xl: "12px" }, emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#022c22" }, green: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16" }, lime: { 50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635", 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314", 950: "#1a2e05" }, red: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a" }, orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407" }, amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03" }, yellow: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12", 950: "#422006" }, teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" }, cyan: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63", 950: "#083344" }, sky: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e", 950: "#082f49" }, blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554" }, indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b" }, violet: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065" }, purple: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#3b0764" }, fuchsia: { 50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75", 950: "#4a044e" }, pink: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843", 950: "#500724" }, rose: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519" }, slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617" }, gray: { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827", 950: "#030712" }, zinc: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b" }, neutral: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3", 500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717", 950: "#0a0a0a" }, stone: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09" } };
var Oe = JSON.parse('{"colors":{"alpha":{"alpha-white-0":"rgba(255, 255, 255, 0.0000)","alpha-white-5":"rgba(255, 255, 255, 0.0500)","alpha-white-10":"rgba(255, 255, 255, 0.1000)","alpha-white-20":"rgba(255, 255, 255, 0.2000)","alpha-white-30":"rgba(255, 255, 255, 0.3000)","alpha-white-40":"rgba(255, 255, 255, 0.4000)","alpha-white-50":"rgba(255, 255, 255, 0.5000)","alpha-white-60":"rgba(255, 255, 255, 0.6000)","alpha-white-70":"rgba(255, 255, 255, 0.7000)","alpha-white-80":"rgba(255, 255, 255, 0.8000)","alpha-white-90":"rgba(255, 255, 255, 0.9000)","alpha-white-100":"#ffffff","alpha-black-0":"rgba(0, 0, 0, 0.0000)","alpha-black-5":"rgba(0, 0, 0, 0.0500)","alpha-black-10":"rgba(0, 0, 0, 0.1000)","alpha-black-20":"rgba(0, 0, 0, 0.2000)","alpha-black-30":"rgba(0, 0, 0, 0.3000)","alpha-black-40":"rgba(0, 0, 0, 0.4000)","alpha-black-50":"rgba(0, 0, 0, 0.5000)","alpha-black-60":"rgba(0, 0, 0, 0.6000)","alpha-black-70":"rgba(0, 0, 0, 0.7000)","alpha-black-80":"rgba(0, 0, 0, 0.8000)","alpha-black-90":"rgba(0, 0, 0, 0.9000)","alpha-black-100":"#000000"},"background":{"bg-mode":"#ffffff","bg-mode-transparent":"rgba(255, 255, 255, 0.0000)","bg-mode-reverse":"#000000","bg-mode-reverse-transparent":"rgba(0, 0, 0, 0.0000)","bg-example":"#f7fafc","bg-gold":"#fffdf9","bg-gold-2":"#f9e4c0","bg-app":"{primitives.blue.25}","bg-page":"{primitives.netural.0}","bg-mask":"{colors.alpha.alpha-black-20}","bg-overlay":"{primitives.netural.0}","bg-action":"{primitives.netural.0}","bg-action-hover":"{primitives.netural.50}","bg-action-inactive":"{primitives.netural.100}","bg-brand":"{primitives.blue.500}","bg-brand-hover":"{primitives.blue.600}","bg-error":"{primitives.red.500}","bg-error-hover":"{primitives.red.600}","bg-success":"{primitives.green.50}","bg-success-hover":"{primitives.green.100}","bg-warning":"{primitives.yellow.50}","bg-warning-hover":"{primitives.yellow.100}","bg-info":"{primitives.blue.50}","bg-info-hover":"{primitives.blue.100}","bg-block":"{primitives.netural.50}","bg-blur":"{colors.alpha.alpha-white-60}"},"text":{"text-primary":"{primitives.netural.900}","text-primary-hover":"{primitives.netural.950}","text-secondary":"{primitives.netural.700}","text-secondary-hover":"{primitives.netural.800}","text-tertiary":"{primitives.netural.600}","text-tertiary-hover":"{primitives.netural.700}","text-placeholder":"{primitives.netural.600}","text-inactive":"{primitives.netural.500}","text-link":"{primitives.blue.500}","text-brand":"{primitives.blue.500}","text-brand-hover":"{primitives.blue.600}","text-link-hover":"{primitives.blue.600}","text-error":"{primitives.red.500}","text-error-hover":"{primitives.red.600}","text-success":"{primitives.green.500}","text-success-hover":"{primitives.green.600}","text-warning":"{primitives.yellow.500}","text-warning-hover":"{primitives.yellow.600}","text-info":"{primitives.blue.500}","text-info-hover":"{primitives.blue.600}","text-inverse-primary":"{primitives.netural.0}","text-inverse-secondary":"rgba(255, 255, 255, 0.5000)"},"border":{"border-strong":"{primitives.netural.400}","border-strong-hover":"{primitives.netural.400}","border-base":"{primitives.netural.300}","border-base-hover":"{primitives.netural.400}","border-subtle":"{primitives.netural.200}","border-subtle-hover":"{primitives.netural.300}","border-inactive":"{primitives.netural.100}","border-brand":"{primitives.blue.500}","border-brand-hover":"{primitives.blue.600}","border-error":"{primitives.red.600}","border-error-hover":"{primitives.red.700}","border-success":"{primitives.green.300}","border-success-hover":"{primitives.green.400}","border-warning":"{primitives.yellow.300}","border-warning-hover":"{primitives.yellow.400}","border-info":"{primitives.blue.300}","border-info-hover":"{primitives.blue.400}","border-focus":"{blue.100}","border-action":"{colors.border.border-subtle}","border-action-hover":"{colors.border.border-subtle-hover}","border-action-inactive":"{colors.border.border-inactive}","border-container":"{colors.border.border-base}","border-overlay":"{colors.border.border-subtle}","divider":"{colors.border.border-inactive}","divider-dashed":"{colors.border.border-subtle}"},"icon":{"icon-example":"#cfebfc","icon-primary":"{primitives.netural.800}","icon-primary-hover":"{primitives.netural.900}","icon-secondary":"{primitives.netural.600}","icon-secondary-hover":"{primitives.netural.700}","icon-tertiary":"{primitives.netural.500}","icon-tertiary-hover":"{primitives.netural.600}","icon-inactive":"{primitives.netural.400}","icon-note":"{primitives.netural.300}","icon-note-hover":"{primitives.netural.400}","icon-brand":"{primitives.blue.500}","icon-link":"{primitives.blue.500}","icon-error":"{primitives.red.500}","icon-success":"{primitives.green.500}","icon-warning":"{primitives.yellow.500}","icon-info":"{primitives.blue.500}","icon-inverse-primary":"{primitives.netural.0}"}},"component":{"0":"#ffffff","alert":{"announcement":{"border-warning":"{primitives.yellow.500}","border-error":"{primitives.red.300}","border-success":"{primitives.green.500}","border-info":"{primitives.blue.400}","text-warning":"{primitives.yellow.600}","text-error":"{primitives.red.500}","text-success":"{primitives.green.600}","text-info":"{primitives.blue.600}","icon-notif":"{primitives.teal.500}","text-notif":"{component.alert.announcement.icon-notif}"},"bg-success":"{primitives.green.100}","bg-error":"{primitives.red.100}","bg-info":"{primitives.blue.100}","bg-warn":"{primitives.yellow.100}","bg-notif":"{primitives.teal.100}"},"checker":{"bg":"{colors.background.bg-action}","bg-inactive":"{primitives.netural.100}","bg-check-inactive":"{primitives.blue.300}","bg-check-inactive-shadow":"{primitives.blue.400}","inner-border":"{primitives.netural.100}","outer-border":"{primitives.netural.100}","outer-border-inactive":"{primitives.netural.200}"},"switch":{"dot":"{primitives.netural.0}","dot-on-inactive":"{primitives.blue.50}","dot-off-inactive":"{primitives.netural.50}","dot-border-on":"{primitives.blue.200}","dot-border-off":"{primitives.netural.100}","bg-on":"{primitives.blue.500}","bg-off":"{primitives.netural.100}","bg-on-inactive":"{primitives.blue.200}","bg-off-inactive":"{primitives.netural.100}"},"dropdown":{"bg":"{primitives.netural.0}","bg-hover":"{primitives.netural.100}","divider":"{colors.border.border-inactive}","bg-active":"{primitives.blue.500}","text-active":"{primitives.netural.0}","icon-active":"{primitives.netural.0}"},"progress":{"bg":"{primitives.netural.200}","success":"{primitives.green.500}","info":"{primitives.blue.500}"},"skeleton":{"bg":"#ebf1f5","bg-overlay":"#ebf1f5"},"scrollbar":{"bg":"{primitives.netural.50}","border":"{colors.border.border-inactive}","indicator":"{primitives.netural.200}"},"collapse":{"bg":"{primitives.netural.100}"},"marquee":{"indicator":"{primitives.netural.100}","indicator-active":"{colors.background.bg-brand}"},"button":{"primary":{"bg":"{primitives.blue.500}","bg-hover":"{primitives.blue.600}","text":"{primitives.netural.0}","text-inactive":"{primitives.blue.100}","text-hover":"{primitives.netural.0}","border":"{primitives.blue.600}","border-hover":"{primitives.blue.700}","bg-inactive":"{primitives.blue.300}","border-inactive":"{primitives.blue.400}"},"tertiary":{"bg-hover":"{colors.background.bg-action-hover}"},"ghost":{"bg":"{primitives.netural.0}","bg-hover":"{primitives.blue.50}","bg-inactive":"{colors.background.bg-action}","text-hover":"{primitives.blue.600}","text-inactive":"{primitives.blue.300}","border-hover":"{colors.border.border-brand-hover}","border-inactive":"{primitives.blue.200}"},"error":{"bg-hover":"{colors.background.bg-error-hover}","text-inactive":"{primitives.red.100}","bg-inactive":"{primitives.red.300}","border-inactive":"{primitives.red.400}"},"pale":{"bg":"{primitives.netural.50}","bg-hover":"{primitives.netural.100}","bg-inactive":"{colors.background.bg-action-inactive}","text":"{colors.text.text-primary}","text-hover":"{colors.text.text-primary-hover}","text-inactive":"{colors.text.text-inactive}","icon":"{colors.icon.icon-secondary}","icon-hover":"{colors.icon.icon-secondary-hover}","icon-inactive":"{colors.icon.icon-inactive}"}},"tag":{"bg2":"#e2e9ee","bg":"{primitives.netural.100}","bg-hover":"{primitives.netural.200}","text":"{colors.text.text-secondary}","text-hover":"{colors.text.text-secondary-hover}","icon":"{colors.icon.icon-secondary}","icon-hover":"{colors.icon.icon-secondary-hover}","border":"{colors.border.border-subtle}","border-hover":"{colors.border.border-subtle-hover}","bg-strong":"{component.tag.bg}"},"segment":{"bg-selection":"#ebf1f5","bg-action":"#dcf0ff","bg-tab":"{primitives.netural.50}","bg-selection-active":"{colors.background.bg-action}","border-selection-active":"{colors.border.border-base}","text":"{colors.text.text-secondary}"},"table":{"bg-button-hover":"#d3dde4","bg-header":"{primitives.netural.50}","border-header":"{component.table.border-cell}","bg-hover":"{primitives.netural.50}","border-cell":"{colors.border.border-inactive}","border-hover":"{colors.border.border-subtle}","bg-selected":"{primitives.blue.50}","bg-selected-hover":"{primitives.blue.100}","border-selected":"{primitives.blue.200}","border-selected-hover":"{primitives.blue.300}","bg-updated":"{primitives.green.50}","bg-updated-hover":"{primitives.green.100}","border-updated":"{primitives.green.300}","border-updated-hover":"{primitives.green.400}"},"tooltip":{"action":{"bg":"{primitives.netural.0}"},"bg":"{primitives.netural.900}","text-primary":"{primitives.netural.0}","text-secondary":"{primitives.netural.200}","divider":"{primitives.netural.600}"},"Countdown":{"gradient-1":"#ebf7ff","gradient-2":"#cdedfe","bg-1":"#cdedfe","bg-2":"#f0f9ff"},"rainbow":{"Yellow":"#ffdd19","Indigo":"#0064d6","Violet":"#9747ff","Red":"{primitives.red.500}","Orange":"{primitives.yellow.500}","Green":"{primitives.green.500}","Blue":"{primitives.blue.500}","Netural":"{primitives.netural.300}"}},"bg":"#ffffff","pattern":{"resources":{"bg-card-inactive":"{colors.background.bg-block}","border-card-inactive":"{primitives.netural.50}","bg-card-active":"{colors.background.bg-page}","border-card-active":"{colors.border.border-inactive}"},"tutorial":{"banner":{"bg-start":"#faebf3","bg-end":"#ffffff","theme":"#a35ce6","blob1":"#a35ce6","blob2":"#e1cdf4","blob3":"#f3ecf9","theme2":"#ff80f4"},"video":{"bg-start":"#fbf6fd","bg-end":"#faedfb","bg-icon":"#b617da","bg-play":"#efbff6"}},"empty":{"bg-start":"rgba(17, 163, 253, 0.4000)","bg-end":"rgba(17, 163, 253, 0.0000)"},"tour":{"tips":{"bg":"{component.tooltip.bg}","border":"{component.tooltip.bg}"},"mask":{"bg":"{colors.alpha.alpha-black-40}"}},"editor":{"key":"#005cc5","value":"#032f62","btn":{"bg":"{primitives.netural.600}","text":"{primitives.netural.0}","border":"{primitives.netural.600}","bg-hover":"{primitives.netural.700}","text-hover":"{primitives.netural.0}","border-bover":"{primitives.netural.700}","bg-inactive":"{primitives.netural.800}","text-inactive":"{primitives.netural.500}","border-inactive":"{primitives.netural.600}"},"bg":"{primitives.netural.800}","code":"{primitives.netural.0}"},"dashboard":{"card":{"bg":"rgba(0, 0, 0, 0.0200)","bg-card-referral-1":"#fefbf5","bg-card-referral-2":"#fdf0dd","bg-card-bonust-1":"#fafcff","bg-card-bonus-2":"#eff7ff","border-card-referral":"#fdebd3","border-card-bonus":"#e5f2ff"}},"drawer":{"bg-create-btn":"{colors.alpha.alpha-black-10}","bg-create-btn-active":"{component.button.primary.bg}","bg-create-icon":"{primitives.netural.500}","bg-create-icon-active":"{primitives.netural.0}","bg":"{colors.background.bg-app}","border":"{colors.border.border-inactive}"},"topnav":{"space":{"bg-hover":"{primitives.netural.100}","avatar-bg":"{primitives.netural.900}","avatar-text":"{primitives.netural.0}","emoji-bg":"{primitives.netural.100}"}},"profiles":{"input":{"bg":"{primitives.netural.25}","border":"{colors.border.border-subtle}"}},"syncbar":{"dropdown":{"bg":"{pattern.syncbar.bg}","bg-hover":"{primitives.netural.700}","text":"{primitives.netural.25}","text-hover":"{primitives.netural.0}","icon":"{primitives.netural.50}","icon-hover":"{primitives.netural.25}"},"btn":{"bg-hover":"{primitives.netural.700}","bg":"{primitives.netural.800}","border":"{primitives.netural.600}","border-hover":"{primitives.netural.500}","text":"{primitives.netural.25}","text-hover":"{primitives.netural.0}","icon":"{primitives.netural.25}","icon-hover":"{primitives.netural.0}"},"title":"#0cef4c","tag":{"bg":"{primitives.blue.300}","text":"{primitives.blue.700}"},"bg":"{primitives.netural.950}"},"actionbar":{"bg":"{primitives.netural.900}","btn":"{primitives.netural.800}","btn-hover":"{primitives.netural.700}","btn-border":"{primitives.netural.700}","btn-border-hover":"{primitives.netural.600}","text":"{primitives.netural.25}","text-subtle":"{primitives.netural.300}","text-hover":"{primitives.netural.0}","text-subtle-hover":"{primitives.netural.200}","icon-open":"{colors.icon.icon-brand}"},"sidenav":{"bg-hover":"{colors.alpha.alpha-black-5}","bg-active":"{primitives.blue.100}","text-active":"{primitives.blue.600}","icon-active":"{primitives.blue.600}","logo":"{primitives.netural.0}","logo-border":"{colors.border.border-subtle}","metrics":"{colors.alpha.alpha-white-60}","metrics-btn":"{colors.background.bg-action}","metrics-progress":"{primitives.netural.100}","indicator":"{colors.alpha.alpha-black-10}"},"pay":{"expired":"#8badc2","plan":{"gradient-start":"#ec51f7","bg-bill":"#f7fbfd","bg-tag-current":"#90afc2","bg-tag-prime":"#ffffff","bg-plan-inactive":"{primitives.netural.50}","border-plan-inactive":"{primitives.netural.100}","text-plan-inactive":"{colors.text.text-primary}","gradient-end":"{colors.background.bg-brand}","text-plan-selected":"{primitives.blue.600}","bg-slider":"{primitives.netural.50}","bg-slider-dot":"{colors.alpha.alpha-black-10}","border-slider":"{primitives.netural.100}","border-bill-divider":"{colors.border.border-inactive}"},"mood":{"orange":"#ffdadb","magenta":"#ff90ea","blue":"#0094ff","cyan":"#b8e2ff"},"wallet":{"bg":{"start":"#ffffff","end":"#e0f1fe"},"cover":{"bg":"#131313","border":"#131313"}},"gradient-selected-start":"{primitives.blue.50}","gradient-selected-end":"{colors.alpha.alpha-white-0}"},"wallet":{"founding":{"bg":{"tint":"#fdf0dd","shade":"#fde1bd"},"border":{"tint":"#fbe2be","shade":"#dfab65"}},"vip":{"bg":{"tint":"#ffffff","shade":"#a7afd2"},"border":{"tint":"#e3e6f7","shade":"#a7afd2"}},"prime":{"border":{"orange":"#fed1d1","blue":"#66ccff","purple":"#f462fe"}},"cover":"#131313","cover-border":"#131313","free":{"bg":"#d6e2e8"}},"proxystore":{"mood":{"blue":"#11a3fd","orange":"#ff6b6b","purple":"#8780fe","button-bg-1":"#ffd68c","button-bg-2":"#ffe4b2","button-bg-3":"#ffc96e","button-bg-1-hover":"#ffc861","button-bg-2-hover":"#ffd78a","button-bg-3-hover":"#ffbb46","button-text":"#97742f","button-border":"rgba(254, 198, 109, 0.5000)","button-avatar-border":"#fec66d","bg-banner":"#ebf8ff","bg-rola-card-hover":"#e4faf3","border-rola-card-hover":"#1ad79f","bg-store":"{colors.background.bg-page}","button-icon":"{pattern.proxystore.mood.button-text}"}},"roxyclaw":{"bg":"#ff9c7e","border":"#ffd1d1","sidenav":"#ff9c7e","text":"#eb5757"},"referral":{"gradient-01":"#b8ebff","gradient-02":"#ebe0ff","gradient-03":"#ffe6ec"},"operation":{"operation-bg":"#e5f5ff"},"E-Commerce":{"bg-gradient-01":"#11a3fd","bg-gradient-02":"#6dc7ff","top-bg-gradient-01":"#18a7ff","top-bg-gradient-02":"#87d1fc"}},"bg-start":"#ffffff","campaign":{"netflix":{"bg-announcement":"#000000","text-announcement":"#ffffff","bg-faq-btn":"{colors.background.bg-block}","bg-nav-btn":"{colors.alpha.alpha-black-5}"},"BFCM":{"bg-card":"#000000"},"giftcard":{"bg-giftcard":"#fce6fd","icon-giftcard":"#850e8e","text-giftcard-note":"#8b628d","border-giftcard-select":"#b617da"},"New-user":{"border-gradient-1":"#03c1d9","border-gradient-2":"#57da48"},"mayFreedom":{"bg-gradient-1":"#4096ff","bg-gradient-1-hover":"#1f84ff","bg-gradient-2":"#01cab3","bg-gradient-2-hover":"#01a795"}}}');
var ke = JSON.parse('{"colors":{"alpha":{"alpha-white-0":"rgba(255, 255, 255, 0.0000)","alpha-white-5":"rgba(255, 255, 255, 0.0500)","alpha-white-10":"rgba(255, 255, 255, 0.1000)","alpha-white-20":"rgba(255, 255, 255, 0.2000)","alpha-white-30":"rgba(255, 255, 255, 0.3000)","alpha-white-40":"rgba(255, 255, 255, 0.4000)","alpha-white-50":"rgba(255, 255, 255, 0.5000)","alpha-white-60":"rgba(255, 255, 255, 0.6000)","alpha-white-70":"rgba(255, 255, 255, 0.7000)","alpha-white-80":"rgba(255, 255, 255, 0.8000)","alpha-white-90":"rgba(255, 255, 255, 0.9000)","alpha-white-100":"#ffffff","alpha-black-0":"rgba(0, 0, 0, 0.0000)","alpha-black-5":"rgba(0, 0, 0, 0.0500)","alpha-black-10":"rgba(0, 0, 0, 0.1000)","alpha-black-20":"rgba(0, 0, 0, 0.2000)","alpha-black-30":"rgba(0, 0, 0, 0.3000)","alpha-black-40":"rgba(0, 0, 0, 0.4000)","alpha-black-50":"rgba(0, 0, 0, 0.5000)","alpha-black-60":"rgba(0, 0, 0, 0.6000)","alpha-black-70":"rgba(0, 0, 0, 0.7000)","alpha-black-80":"rgba(0, 0, 0, 0.8000)","alpha-black-90":"rgba(0, 0, 0, 0.9000)","alpha-black-100":"#000000"},"background":{"bg-mask":"rgba(36, 38, 41, 0.8000)","bg-mode":"#000000","bg-mode-transparent":"rgba(0, 0, 0, 0.0000)","bg-mode-reverse":"#ffffff","bg-mode-reverse-transparent":"rgba(255, 255, 255, 0.0000)","bg-example":"#20262c","bg-gold":"#393327","bg-gold-2":"#7e5d1f","bg-app":"{primitives.netural.950}","bg-page":"{primitives.netural.900}","bg-overlay":"{primitives.netural.800}","bg-action":"{primitives.netural.800}","bg-action-hover":"{primitives.netural.700}","bg-action-inactive":"{primitives.netural.900}","bg-brand":"{primitives.blue.500}","bg-brand-hover":"{primitives.blue.400}","bg-error":"{primitives.red.500}","bg-error-hover":"{primitives.red.400}","bg-success":"{primitives.green.800}","bg-success-hover":"{primitives.green.700}","bg-warning":"{primitives.yellow.900}","bg-warning-hover":"{primitives.yellow.800}","bg-info":"{primitives.blue.800}","bg-info-hover":"{primitives.blue.700}","bg-block":"{primitives.netural.800}","bg-blur":"{colors.alpha.alpha-black-40}"},"text":{"text-primary":"{primitives.netural.25}","text-primary-hover":"{primitives.netural.0}","text-secondary":"{primitives.netural.200}","text-secondary-hover":"{primitives.netural.100}","text-tertiary":"{primitives.netural.400}","text-tertiary-hover":"{primitives.netural.300}","text-placeholder":"{primitives.netural.400}","text-inactive":"{primitives.netural.500}","text-link":"{primitives.blue.500}","text-brand":"{primitives.blue.500}","text-brand-hover":"{primitives.blue.400}","text-link-hover":"{primitives.blue.400}","text-error":"{primitives.red.400}","text-error-hover":"{primitives.red.300}","text-success":"{primitives.green.400}","text-success-hover":"{primitives.green.300}","text-warning":"{primitives.yellow.500}","text-warning-hover":"{primitives.yellow.400}","text-info":"{primitives.blue.400}","text-info-hover":"{primitives.blue.300}","text-inverse-primary":"{primitives.netural.900}","text-inverse-secondary":"rgba(5, 16, 26, 0.5000)"},"border":{"border-strong":"{primitives.netural.500}","border-strong-hover":"{primitives.netural.400}","border-base":"{primitives.netural.600}","border-base-hover":"{primitives.netural.500}","border-subtle":"{primitives.netural.700}","border-subtle-hover":"{primitives.netural.600}","border-inactive":"{primitives.netural.800}","border-brand":"{primitives.blue.500}","border-brand-hover":"{primitives.blue.400}","border-error":"{primitives.red.600}","border-error-hover":"{primitives.red.500}","border-success":"{primitives.green.800}","border-success-hover":"{primitives.green.700}","border-warning":"{primitives.yellow.800}","border-warning-hover":"{primitives.yellow.700}","border-info":"{primitives.blue.800}","border-info-hover":"{primitives.blue.700}","border-focus":"{blue.800}","border-action":"{colors.border.border-subtle}","border-action-hover":"{colors.border.border-subtle-hover}","border-action-inactive":"{colors.border.border-inactive}","border-container":"{colors.border.border-subtle}","border-overlay":"{colors.border.border-subtle}","divider":"{colors.border.border-inactive}","divider-dashed":"{colors.border.border-subtle}"},"icon":{"icon-example":"#00385c","icon-primary":"{primitives.netural.200}","icon-primary-hover":"{primitives.netural.100}","icon-secondary":"{primitives.netural.300}","icon-secondary-hover":"{primitives.netural.200}","icon-tertiary":"{primitives.netural.500}","icon-tertiary-hover":"{primitives.netural.400}","icon-inactive":"{primitives.netural.700}","icon-note":"{primitives.netural.600}","icon-note-hover":"{primitives.netural.500}","icon-brand":"{primitives.blue.500}","icon-link":"{primitives.blue.500}","icon-error":"{primitives.red.500}","icon-success":"{primitives.green.500}","icon-warning":"{primitives.yellow.500}","icon-info":"{primitives.blue.500}","icon-inverse-primary":"{primitives.netural.900}"}},"component":{"0":"#ffffff","alert":{"announcement":{"border-warning":"{primitives.yellow.600}","border-error":"{primitives.red.700}","border-success":"{primitives.green.600}","border-info":"{primitives.blue.600}","text-warning":"{primitives.yellow.300}","text-error":"{primitives.red.300}","text-success":"{primitives.green.300}","text-info":"{primitives.blue.300}","icon-notif":"{primitives.teal.500}","text-notif":"{component.alert.announcement.icon-notif}"},"bg-success":"{primitives.green.800}","bg-error":"{primitives.red.900}","bg-info":"{primitives.blue.800}","bg-warn":"{primitives.yellow.800}","bg-notif":"{primitives.teal.900}"},"checker":{"bg":"{colors.background.bg-action}","bg-inactive":"{colors.background.bg-action-inactive}","bg-check-inactive":"{primitives.netural.500}","bg-check-inactive-shadow":"{primitives.netural.600}","inner-border":"{primitives.netural.700}","outer-border":"{primitives.netural.700}","outer-border-inactive":"{primitives.netural.800}"},"switch":{"dot":"{colors.background.bg-action}","dot-on-inactive":"{primitives.blue.700}","dot-off-inactive":"{primitives.netural.700}","dot-border-on":"{primitives.blue.700}","dot-border-off":"{primitives.netural.700}","bg-on":"{primitives.blue.500}","bg-off":"{primitives.netural.700}","bg-on-inactive":"{primitives.blue.800}","bg-off-inactive":"{primitives.netural.800}"},"dropdown":{"bg":"{primitives.netural.800}","bg-hover":"{primitives.netural.700}","divider":"{colors.border.border-subtle}","bg-active":"{primitives.blue.600}","text-active":"{primitives.netural.0}","icon-active":"{primitives.netural.0}"},"progress":{"bg":"{primitives.netural.700}","success":"{primitives.green.400}","info":"{primitives.blue.400}"},"skeleton":{"bg-overlay":"#363d45","bg":"{primitives.netural.800}"},"scrollbar":{"bg":"{primitives.netural.800}","border":"{colors.border.border-subtle}","indicator":"{primitives.netural.600}"},"collapse":{"bg":"{primitives.netural.800}"},"marquee":{"indicator":"{primitives.netural.700}","indicator-active":"{colors.background.bg-brand}"},"button":{"primary":{"bg":"{primitives.blue.500}","bg-hover":"{primitives.blue.400}","text":"{primitives.netural.0}","text-inactive":"{primitives.blue.700}","text-hover":"{primitives.netural.0}","border":"{primitives.blue.600}","border-hover":"{primitives.blue.500}","bg-inactive":"{primitives.blue.800}","border-inactive":"{primitives.blue.900}"},"tertiary":{"bg-hover":"{primitives.netural.800}"},"ghost":{"bg":"{colors.background.bg-action-inactive}","bg-hover":"{primitives.blue.900}","bg-inactive":"{colors.background.bg-action-inactive}","text-hover":"{primitives.blue.400}","text-inactive":"{colors.text.text-inactive}","border-hover":"{colors.border.border-brand-hover}","border-inactive":"{colors.border.border-subtle}"},"error":{"bg-hover":"{colors.background.bg-error-hover}","text-inactive":"{primitives.red.700}","bg-inactive":"{primitives.red.900}","border-inactive":"{primitives.red.950}"},"pale":{"bg":"{primitives.netural.800}","bg-hover":"{primitives.netural.700}","bg-inactive":"{colors.background.bg-action-inactive}","text":"{colors.text.text-primary}","text-hover":"{colors.text.text-primary-hover}","text-inactive":"{colors.text.text-inactive}","icon":"{colors.icon.icon-secondary}","icon-hover":"{colors.icon.icon-secondary-hover}","icon-inactive":"{colors.icon.icon-inactive}"}},"tag":{"bg2":"#36404a","bg":"{colors.background.bg-action}","bg-hover":"{colors.background.bg-action-hover}","text":"{colors.text.text-secondary}","text-hover":"{colors.text.text-secondary-hover}","icon":"{colors.icon.icon-secondary}","icon-hover":"{colors.icon.icon-secondary-hover}","border":"{colors.border.border-subtle}","border-hover":"{colors.border.border-subtle-hover}","bg-strong":"{primitives.netural.700}"},"segment":{"bg-action":"#00263d","bg-tab":"{primitives.netural.900}","bg-selection":"{primitives.netural.800}","bg-selection-active":"{primitives.netural.700}","border-selection-active":"{primitives.netural.600}","text":"{colors.text.text-secondary}"},"table":{"bg-header":"{primitives.netural.800}","border-header":"{colors.border.border-subtle}","bg-hover":"{primitives.netural.800}","border-cell":"{colors.border.border-inactive}","border-hover":"{colors.border.border-subtle}","bg-button-hover":"{primitives.netural.700}","bg-selected":"{primitives.blue.900}","bg-selected-hover":"{primitives.blue.800}","border-selected":"{primitives.blue.700}","border-selected-hover":"{primitives.blue.600}","bg-updated":"{primitives.green.900}","bg-updated-hover":"{primitives.green.800}","border-updated":"{primitives.green.700}","border-updated-hover":"{primitives.green.600}"},"tooltip":{"action":{"bg":"{component.tooltip.bg}"},"bg":"{primitives.netural.700}","text-primary":"{primitives.netural.0}","text-secondary":"{primitives.netural.200}","divider":"{primitives.netural.600}"},"Countdown":{"gradient-1":"#013450","gradient-2":"#011d32","bg-1":"#013450","bg-2":"#011d32"},"rainbow":{"Yellow":"#ffdd19","Indigo":"#0064d6","Violet":"#9747ff","Red":"{primitives.red.500}","Orange":"{primitives.yellow.500}","Green":"{primitives.green.500}","Blue":"{primitives.blue.500}","Netural":"{primitives.netural.600}"}},"bg":"#ffffff","pattern":{"resources":{"bg-card-inactive":"{colors.background.bg-page}","border-card-inactive":"{colors.border.border-inactive}","bg-card-active":"{colors.background.bg-block}","border-card-active":"{colors.border.border-inactive}"},"tutorial":{"banner":{"bg-start":"#500745","bg-end":"#160119","theme":"#bd76ff","blob1":"#bd76ff","blob2":"#a57aa6","blob3":"#5c385c","theme2":"#ff9be9"},"video":{"bg-start":"#3c0e3a","bg-end":"#3c0e3a","bg-icon":"#efbff6","bg-play":"#cb4fe7"}},"empty":{"bg-start":"rgba(17, 163, 253, 0.8000)","bg-end":"rgba(17, 163, 253, 0.0000)"},"tour":{"tips":{"bg":"{colors.background.bg-brand}","border":"{colors.border.border-brand}"},"mask":{"bg":"rgba(36, 38, 41, 0.9000)"}},"editor":{"key":"#79c0ff","value":"#a5d6ff","btn":{"bg":"{primitives.netural.700}","text":"{primitives.netural.0}","border":"{primitives.netural.700}","bg-hover":"{primitives.netural.600}","text-hover":"{primitives.netural.0}","border-bover":"{primitives.netural.600}","bg-inactive":"{primitives.netural.800}","text-inactive":"{primitives.netural.600}","border-inactive":"{primitives.netural.700}"},"bg":"{primitives.netural.800}","code":"{primitives.netural.0}"},"dashboard":{"card":{"bg-card-referral-1":"#311e03","bg-card-referral-2":"#613c05","bg-card-bonust-1":"#030f1c","bg-card-bonus-2":"#002951","border-card-referral":"#4a2d07","border-card-bonus":"#0a315c","bg":"{colors.alpha.alpha-white-5}"}},"drawer":{"bg-create-btn":"{colors.alpha.alpha-white-10}","bg-create-btn-active":"{colors.background.bg-brand}","bg-create-icon":"{primitives.netural.0}","bg-create-icon-active":"{primitives.netural.0}","bg":"{colors.background.bg-app}","border":"{colors.border.border-inactive}"},"topnav":{"space":{"bg-hover":"{primitives.netural.800}","avatar-bg":"{primitives.netural.700}","avatar-text":"{primitives.netural.0}","emoji-bg":"{primitives.netural.800}"}},"profiles":{"input":{"bg":"{primitives.netural.700}","border":"{primitives.netural.600}"}},"syncbar":{"dropdown":{"bg":"{pattern.syncbar.bg}","bg-hover":"{primitives.netural.700}","text":"{primitives.netural.25}","text-hover":"{primitives.netural.0}","icon":"{primitives.netural.50}","icon-hover":"{primitives.netural.25}"},"btn":{"bg-hover":"{primitives.netural.700}","bg":"{primitives.netural.800}","border":"{primitives.netural.600}","border-hover":"{primitives.netural.500}","text":"{primitives.netural.25}","text-hover":"{primitives.netural.0}","icon":"{primitives.netural.25}","icon-hover":"{primitives.netural.0}"},"title":"#0cef4c","tag":{"bg":"{primitives.blue.600}","text":"{primitives.blue.300}"},"bg":"{primitives.netural.950}"},"actionbar":{"bg":"{primitives.blue.400}","btn":"{primitives.blue.600}","btn-hover":"{primitives.blue.500}","btn-border":"{primitives.blue.600}","btn-border-hover":"{primitives.blue.500}","text":"{primitives.blue.25}","text-subtle":"{primitives.blue.300}","text-hover":"{primitives.netural.0}","text-subtle-hover":"{primitives.blue.200}","icon-open":"{pattern.actionbar.text}"},"sidenav":{"bg-hover":"{colors.alpha.alpha-white-5}","bg-active":"{primitives.blue.800}","text-active":"{primitives.blue.400}","icon-active":"{primitives.blue.400}","logo":"{primitives.netural.800}","logo-border":"{primitives.netural.800}","metrics":"{colors.alpha.alpha-white-5}","metrics-btn":"{primitives.netural.700}","metrics-progress":"{primitives.netural.700}","indicator":"{colors.alpha.alpha-white-20}"},"pay":{"expired":"#8badc2","plan":{"gradient-start":"#ed0dfd","gradient-end":"#0089d8","bg-tag-current":"#4c738a","bg-tag-prime":"#ffffff","bg-plan-inactive":"{primitives.netural.900}","border-plan-inactive":"{primitives.netural.800}","text-plan-inactive":"{primitives.netural.600}","text-plan-selected":"{primitives.blue.400}","bg-slider":"{primitives.netural.800}","bg-slider-dot":"{colors.alpha.alpha-white-10}","border-slider":"{primitives.netural.800}","bg-bill":"{primitives.netural.800}","border-bill-divider":"{primitives.netural.700}"},"mood":{"orange":"#ff8183","magenta":"#e60eff","blue":"#7cfbff","cyan":"#6f47ff"},"wallet":{"bg":{"start":"#150c18","end":"#233959"},"cover":{"bg":"#131313","border":"#4d4d4d"}},"gradient-selected-start":"{primitives.blue.800}","gradient-selected-end":"{colors.background.bg-action}"},"wallet":{"founding":{"bg":{"tint":"#271801","shade":"#b66c0a"},"border":{"tint":"#fdaf49","shade":"#442904"}},"vip":{"bg":{"tint":"#0d0e0f","shade":"#384374"},"border":{"tint":"#a4acd2","shade":"#3c405a"}},"prime":{"border":{"orange":"#ff8b64","blue":"#4161ff","purple":"#e65cff"}},"cover":"#131313","cover-border":"#4d4d4d","free":{"bg":"{primitives.netural.700}"}},"proxystore":{"mood":{"blue":"#7cfbff","orange":"#ff3737","purple":"#6f47ff","bg-store":"#223c53","button-bg-1":"#f8ab57","button-bg-2":"#f1af5f","button-bg-3":"#fb8f02","button-bg-1-hover":"#f79e3b","button-bg-2-hover":"#efa143","button-bg-3-hover":"#e28102","button-text":"#ffffff","button-border":"rgba(101, 59, 1, 0.2000)","button-avatar-border":"#ffd38a","bg-banner":"#002742","bg-rola-card-hover":"#274444","border-rola-card-hover":"#1ad79f","button-icon":"{pattern.proxystore.mood.button-text}"}},"roxyclaw":{"bg":"#5e1600","border":"#892802","sidenav":"#ee4f1f","text":"#ee4f1f"},"referral":{"gradient-01":"#217275","gradient-02":"#4432aa","gradient-03":"#8c6b6b"},"operation":{"operation-bg":"#00263d"},"E-Commerce":{"bg-gradient-01":"#193565","bg-gradient-02":"#163582","top-bg-gradient-01":"#0455b8","top-bg-gradient-02":"#022652"}},"bg-start":"#ffffff","campaign":{"netflix":{"text-announcement":"#ffffff","bg-announcement":"{colors.background.bg-brand}","bg-faq-btn":"{colors.background.bg-example}","bg-nav-btn":"{colors.alpha.alpha-white-10}"},"BFCM":{"bg-card":"#222938"},"giftcard":{"bg-giftcard":"#5c2161","icon-giftcard":"#ffffff","text-giftcard-note":"#cbaacc","border-giftcard-select":"#e469ff"},"New-user":{"border-gradient-1":"#028b9c","border-gradient-2":"#2c9d20"},"mayFreedom":{"bg-gradient-1":"#4096ff","bg-gradient-1-hover":"#1f84ff","bg-gradient-2":"#01cab3","bg-gradient-2-hover":"#01a795"}}}');
var Ae = { transitionDuration: "0.2s", focusRing: { width: "1px", style: "solid", color: "{primary.color}", offset: "2px", shadow: "none" }, disabledOpacity: "0.6", iconSize: "1rem", anchorGutter: "2px", primary: { 25: "{primitives.blue.25}", 50: "{primitives.blue.50}", 100: "{primitives.blue.100}", 200: "{primitives.blue.200}", 300: "{primitives.blue.300}", 400: "{primitives.blue.400}", 500: "{primitives.blue.500}", 600: "{primitives.blue.600}", 700: "{primitives.blue.700}", 800: "{primitives.blue.800}", 900: "{primitives.blue.900}", 950: "{primitives.blue.950}" }, formField: { paddingX: "0.75rem", paddingY: "0.5rem", sm: { fontSize: "0.875rem", paddingX: "0.625rem", paddingY: "0.375rem" }, lg: { fontSize: "1.125rem", paddingX: "0.875rem", paddingY: "0.625rem" }, borderRadius: "{border.radius.md}", focusRing: { width: "0", style: "none", color: "transparent", offset: "0", shadow: "none" }, transitionDuration: "{transition.duration}" }, list: { padding: "0.25rem 0.25rem", gap: "2px", header: { padding: "0.5rem 1rem 0.25rem 1rem" }, option: { padding: "0.5rem 0.75rem", borderRadius: "{border.radius.sm}" }, optionGroup: { padding: "0.5rem 0.75rem", fontWeight: "600" } }, content: { borderRadius: "{border.radius.md}" }, mask: { transitionDuration: "0.15s" }, navigation: { list: { padding: "0.25rem 0.25rem", gap: "2px" }, item: { padding: "0.5rem 0.75rem", borderRadius: "{border.radius.sm}", gap: "0.5rem" }, submenuLabel: { padding: "0.5rem 0.75rem", fontWeight: "600" }, submenuIcon: { size: "0.875rem" } }, overlay: { select: { borderRadius: "{border.radius.md}", shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)" }, popover: { borderRadius: "{border.radius.md}", padding: "0.75rem", shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)" }, modal: { borderRadius: "{border.radius.lg}", padding: "1.25rem", shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }, navigation: { shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)" } }, colorScheme: { light: { ...Oe, primary: { color: "{primary.500}", contrastColor: "{primitives.netural.0}", hoverColor: "{primary.600}", activeColor: "{primary.600}" }, mask: { background: "{colors.background.bg-mask}" }, formField: { background: "{colors.background.bg-action}", disabledBackground: "{colors.background.bg-action-inactive}", borderColor: "{colors.border.border-action}", hoverBorderColor: "{colors.border.border-action-hover}", focusBorderColor: "{colors.border.border-brand}", invalidBorderColor: "{colors.border.border-error}", color: "{colors.text.text-primary}", disabledColor: "{colors.text.text-inactive}", placeholderColor: "{colors.text.text-secondary}", invalidPlaceholderColor: "{colors.text.text-inactive}", iconColor: "{colors.icon.icon-secondary}", shadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)" }, content: { background: "{colors.background.bg-page}", hoverBackground: "{colors.background.bg-page}", borderColor: "{colors.border.border-subtle}", color: "{colors.text.text-primary}", hoverColor: "{colors.text.text-primary-hover}" }, overlay: { select: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-subtle}", color: "{colors.text.text-primary}" }, popover: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-subtle}", color: "{colors.text.text-primary}" }, modal: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-subtle}", color: "{colors.text.text-primary}" } } }, dark: { ...ke, primary: { color: "{primary.500}", contrastColor: "{primitives.netural.0}", hoverColor: "{primary.400}", activeColor: "{primary.400}" }, mask: { background: "{colors.background.bg-mask}" }, formField: { background: "{colors.background.bg-action}", disabledBackground: "{colors.background.bg-action-inactive}", borderColor: "{colors.border.border-action}", hoverBorderColor: "{colors.border.border-action-hover}", focusBorderColor: "{colors.border.border-brand}", invalidBorderColor: "{colors.border.border-error}", color: "{colors.text.text-primary}", disabledColor: "{colors.text.text-inactive}", placeholderColor: "{colors.text.text-secondary}", invalidPlaceholderColor: "{colors.text.text-inactive}", iconColor: "{colors.icon.icon-secondary}", shadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)" }, content: { background: "{colors.background.bg-page}", hoverBackground: "{colors.background.bg-page}", borderColor: "{colors.border.border-subtle}", color: "{colors.text.text-primary}", hoverColor: "{colors.text.text-primary-hover}" }, overlay: { select: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-subtle}", color: "{colors.text.text-primary}" }, popover: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-subtle}", color: "{colors.text.text-primary}" }, modal: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-subtle}", color: "{colors.text.text-primary}" } } } } };
var je = { accordion: { root: { transitionDuration: "{transition.duration}" }, panel: { borderWidth: "0 0 1px 0", borderColor: "{colors.border.divider-dashed}" }, header: { color: "{colors.text.text-primary}", hoverColor: "{colors.text.text-primary-hover}", activeColor: "{colors.text.text-primary-hover}", padding: "1.125rem", fontWeight: "600", borderRadius: "0", borderWidth: "0", borderColor: "{content.border.color}", background: "transparent", hoverBackground: "transparent", activeBackground: "transparent", activeHoverBackground: "transparent", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" }, toggleIcon: { color: "{colors.text.text-primary}", hoverColor: "{colors.text.text-primary-hover}", activeColor: "{colors.text.text-primary-hover}", activeHoverColor: "{colors.text.text-primary-hover}" }, first: { topBorderRadius: "{content.border.radius}", borderWidth: "0" }, last: { bottomBorderRadius: "{content.border.radius}", activeBottomBorderRadius: "0" } }, content: { borderWidth: "0", borderColor: "{content.border.color}", background: "transparent", color: "{colors.text.text-primary}", padding: "0 1.125rem 1.125rem 1.125rem" } }, autocomplete: { root: { background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}" }, overlay: { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}" }, list: { padding: "{list.padding}", gap: "{list.gap}" }, option: { focusBackground: "{component.dropdown.bg-hover}", selectedBackground: "{component.dropdown.bg-hover}", selectedFocusBackground: "{component.dropdown.bg-hover}", color: "{colors.text.text-primary}", focusColor: "{colors.text.text-primary}", selectedColor: "{colors.text.text-primary}", selectedFocusColor: "{colors.text.text-primary}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}" }, optionGroup: { background: "{list.option.group.background}", color: "{list.option.group.color}", fontWeight: "{list.option.group.font.weight}", padding: "{list.option.group.padding}" }, dropdown: { width: "2.5rem", sm: { width: "2rem" }, lg: { width: "3rem" }, borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.border.color}", activeBorderColor: "{form.field.border.color}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, chip: { borderRadius: "{border.radius.sm}" }, emptyMessage: { padding: "{list.option.padding}" }, colorScheme: { light: { chip: { focusBackground: "{surface.200}", focusColor: "{surface.800}" }, dropdown: { background: "{surface.100}", hoverBackground: "{surface.200}", activeBackground: "{surface.300}", color: "{surface.600}", hoverColor: "{surface.700}", activeColor: "{surface.800}" } }, dark: { chip: { focusBackground: "{surface.700}", focusColor: "{surface.0}" }, dropdown: { background: "{surface.800}", hoverBackground: "{surface.700}", activeBackground: "{surface.600}", color: "{surface.300}", hoverColor: "{surface.200}", activeColor: "{surface.100}" } } } }, avatar: { root: { width: "2rem", height: "2rem", fontSize: "1rem", background: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}" }, icon: { size: "1rem" }, group: { borderColor: "{content.background}", offset: "-0.75rem" }, lg: { width: "3rem", height: "3rem", fontSize: "1.5rem", icon: { size: "1.5rem" }, group: { offset: "-1rem" } }, xl: { width: "4rem", height: "4rem", fontSize: "2rem", icon: { size: "2rem" }, group: { offset: "-1.5rem" } } }, badge: { root: { borderRadius: "{border.radius.md}", padding: "0 0.5rem", fontSize: "0.75rem", fontWeight: "700", minWidth: "1.5rem", height: "1.5rem" }, dot: { size: "0.5rem" }, sm: { fontSize: "0.625rem", minWidth: "1.25rem", height: "1.25rem" }, lg: { fontSize: "0.875rem", minWidth: "1.75rem", height: "1.75rem" }, xl: { fontSize: "1rem", minWidth: "2rem", height: "2rem" }, colorScheme: { light: { primary: { background: "{primary.color}", color: "{primary.contrast.color}" }, secondary: { background: "{surface.100}", color: "{surface.600}" }, success: { background: "{green.500}", color: "{surface.0}" }, info: { background: "{sky.500}", color: "{surface.0}" }, warn: { background: "{orange.500}", color: "{surface.0}" }, danger: { background: "{dark.primitives.red.500}", color: "{surface.0}" }, contrast: { background: "{surface.950}", color: "{surface.0}" } }, dark: { primary: { background: "{primary.color}", color: "{primary.contrast.color}" }, secondary: { background: "{surface.800}", color: "{surface.300}" }, success: { background: "{green.400}", color: "{green.950}" }, info: { background: "{sky.400}", color: "{sky.950}" }, warn: { background: "{orange.400}", color: "{orange.950}" }, danger: { background: "{dark.primitives.red.500}", color: "{dark.primitives.netural.0}" }, contrast: { background: "{surface.0}", color: "{surface.950}" } } } }, blockui: { root: { borderRadius: "{content.border.radius}" } }, breadcrumb: { root: { padding: "1rem", background: "{content.background}", gap: "0.5rem", transitionDuration: "{transition.duration}" }, item: { color: "{text.muted.color}", hoverColor: "{text.color}", borderRadius: "{content.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{navigation.item.icon.color}", hoverColor: "{navigation.item.icon.focus.color}" }, focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, separator: { color: "{navigation.item.icon.color}" } }, button: { root: { borderRadius: "{form.field.border.radius}", roundedBorderRadius: "2rem", gap: "0.5rem", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", iconOnlyWidth: "2.5rem", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}", iconOnlyWidth: "2rem" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}", iconOnlyWidth: "3rem" }, label: { fontWeight: "500" }, raisedShadow: "0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12)", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", offset: "{focus.ring.offset}" }, badgeSize: "1rem", transitionDuration: "{form.field.transition.duration}" }, colorScheme: { light: { root: { primary: { background: "{component.button.primary.bg}", hoverBackground: "{component.button.primary.bg-hover}", activeBackground: "{primary.active.color}", borderColor: "{component.button.primary.border}", hoverBorderColor: "{component.button.primary.border-hover}", activeBorderColor: "{primary.active.color}", color: "{component.button.primary.text}", hoverColor: "{component.button.primary.text}", activeColor: "{component.button.primary.text}", focusRing: { color: "{primary.color}", shadow: "none" } }, secondary: { background: "{component.button.pale.bg}", hoverBackground: "{component.button.pale.bg-hover}", activeBackground: "{component.button.pale.bg-hover}", borderColor: "transparent", hoverBorderColor: "transparent", activeBorderColor: "transparent", color: "{component.button.pale.text}", hoverColor: "{component.button.pale.text-hover}", activeColor: "{component.button.pale.text-hover}", focusRing: { color: "{surface.600}", shadow: "none" } }, info: { background: "{sky.500}", hoverBackground: "{sky.600}", activeBackground: "{sky.700}", borderColor: "{sky.500}", hoverBorderColor: "{sky.600}", activeBorderColor: "{sky.700}", color: "#ffffff", hoverColor: "#ffffff", activeColor: "#ffffff", focusRing: { color: "{sky.500}", shadow: "none" } }, success: { background: "{green.500}", hoverBackground: "{green.600}", activeBackground: "{green.700}", borderColor: "{green.500}", hoverBorderColor: "{green.600}", activeBorderColor: "{green.700}", color: "#ffffff", hoverColor: "#ffffff", activeColor: "#ffffff", focusRing: { color: "{green.500}", shadow: "none" } }, warn: { background: "{orange.500}", hoverBackground: "{orange.600}", activeBackground: "{orange.700}", borderColor: "{orange.500}", hoverBorderColor: "{orange.600}", activeBorderColor: "{orange.700}", color: "#ffffff", hoverColor: "#ffffff", activeColor: "#ffffff", focusRing: { color: "{orange.500}", shadow: "none" } }, help: { background: "{purple.500}", hoverBackground: "{purple.600}", activeBackground: "{purple.700}", borderColor: "{purple.500}", hoverBorderColor: "{purple.600}", activeBorderColor: "{purple.700}", color: "#ffffff", hoverColor: "#ffffff", activeColor: "#ffffff", focusRing: { color: "{purple.500}", shadow: "none" } }, danger: { background: "{colors.background.bg-error}", hoverBackground: "{colors.background.bg-error-hover}", activeBackground: "{red.700}", borderColor: "{colors.border.border-error}", hoverBorderColor: "{colors.border.border-error-hover}", activeBorderColor: "{red.700}", color: "{component.button.primary.text}", hoverColor: "{component.button.primary.text}", activeColor: "{component.button.primary.text}", focusRing: { color: "{red.500}", shadow: "none" } }, contrast: { background: "{surface.950}", hoverBackground: "{surface.900}", activeBackground: "{surface.800}", borderColor: "{surface.950}", hoverBorderColor: "{surface.900}", activeBorderColor: "{surface.800}", color: "{surface.0}", hoverColor: "{surface.0}", activeColor: "{surface.0}", focusRing: { color: "{surface.950}", shadow: "none" } } }, outlined: { primary: { hoverBackground: "{component.button.ghost.bg-hover}", activeBackground: "{primary.100}", borderColor: "{colors.border.border-brand}", color: "{colors.text.text-brand}" }, secondary: { hoverBackground: "{colors.background.bg-action-hover}", activeBackground: "{surface.100}", borderColor: "{colors.border.border-action}", color: "{colors.text.text-primary}" }, success: { hoverBackground: "{green.50}", activeBackground: "{green.100}", borderColor: "{green.200}", color: "{green.500}" }, info: { hoverBackground: "{sky.50}", activeBackground: "{sky.100}", borderColor: "{sky.200}", color: "{sky.500}" }, warn: { hoverBackground: "{orange.50}", activeBackground: "{orange.100}", borderColor: "{orange.200}", color: "{orange.500}" }, help: { hoverBackground: "{purple.50}", activeBackground: "{purple.100}", borderColor: "{purple.200}", color: "{purple.500}" }, danger: { hoverBackground: "{red.50}", activeBackground: "{red.100}", borderColor: "{red.200}", color: "{red.500}" }, contrast: { hoverBackground: "{surface.50}", activeBackground: "{surface.100}", borderColor: "{surface.700}", color: "{surface.950}" }, plain: { hoverBackground: "{surface.50}", activeBackground: "{surface.100}", borderColor: "{surface.200}", color: "{surface.700}" } }, text: { primary: { hoverBackground: "{primary.50}", activeBackground: "{primary.100}", color: "{primary.color}" }, secondary: { hoverBackground: "{component.button.tertiary.bg-hover}", activeBackground: "{surface.100}", color: "{colors.text.text-primary}" }, success: { hoverBackground: "{green.50}", activeBackground: "{green.100}", color: "{green.500}" }, info: { hoverBackground: "{sky.50}", activeBackground: "{sky.100}", color: "{sky.500}" }, warn: { hoverBackground: "{orange.50}", activeBackground: "{orange.100}", color: "{orange.500}" }, help: { hoverBackground: "{purple.50}", activeBackground: "{purple.100}", color: "{purple.500}" }, danger: { hoverBackground: "{red.50}", activeBackground: "{red.100}", color: "{red.500}" }, contrast: { hoverBackground: "{surface.50}", activeBackground: "{surface.100}", color: "{surface.950}" }, plain: { hoverBackground: "{surface.50}", activeBackground: "{surface.100}", color: "{surface.700}" } }, link: { color: "{primary.color}", hoverColor: "{primary.color}", activeColor: "{primary.color}" } }, dark: { root: { primary: { background: "{component.button.primary.bg}", hoverBackground: "{component.button.primary.bg-hover}", activeBackground: "{primary.active.color}", borderColor: "{component.button.primary.border}", hoverBorderColor: "{component.button.primary.border-hover}", activeBorderColor: "{primary.active.color}", color: "{component.button.primary.text}", hoverColor: "{component.button.primary.text}", activeColor: "{component.button.primary.text}", focusRing: { color: "{primary.color}", shadow: "none" } }, secondary: { background: "{component.button.pale.bg}", hoverBackground: "{component.button.pale.bg-hover}", activeBackground: "{component.button.pale.bg-hover}", borderColor: "transparent", hoverBorderColor: "transparent", activeBorderColor: "transparent", color: "{component.button.pale.text}", hoverColor: "{component.button.pale.text-hover}", activeColor: "{component.button.pale.text-hover}", focusRing: { color: "{surface.300}", shadow: "none" } }, info: { background: "{sky.400}", hoverBackground: "{sky.300}", activeBackground: "{sky.200}", borderColor: "{sky.400}", hoverBorderColor: "{sky.300}", activeBorderColor: "{sky.200}", color: "{sky.950}", hoverColor: "{sky.950}", activeColor: "{sky.950}", focusRing: { color: "{sky.400}", shadow: "none" } }, success: { background: "{green.400}", hoverBackground: "{green.300}", activeBackground: "{green.200}", borderColor: "{green.400}", hoverBorderColor: "{green.300}", activeBorderColor: "{green.200}", color: "{green.950}", hoverColor: "{green.950}", activeColor: "{green.950}", focusRing: { color: "{green.400}", shadow: "none" } }, warn: { background: "{orange.400}", hoverBackground: "{orange.300}", activeBackground: "{orange.200}", borderColor: "{orange.400}", hoverBorderColor: "{orange.300}", activeBorderColor: "{orange.200}", color: "{orange.950}", hoverColor: "{orange.950}", activeColor: "{orange.950}", focusRing: { color: "{orange.400}", shadow: "none" } }, help: { background: "{purple.400}", hoverBackground: "{purple.300}", activeBackground: "{purple.200}", borderColor: "{purple.400}", hoverBorderColor: "{purple.300}", activeBorderColor: "{purple.200}", color: "{purple.950}", hoverColor: "{purple.950}", activeColor: "{purple.950}", focusRing: { color: "{purple.400}", shadow: "none" } }, danger: { background: "{colors.background.bg-error}", hoverBackground: "{colors.background.bg-error-hover}", activeBackground: "{red.200}", borderColor: "{colors.border.border-error}", hoverBorderColor: "{colors.border.border-error-hover}", activeBorderColor: "{red.200}", color: "{component.button.primary.text}", hoverColor: "{component.button.primary.text}", activeColor: "{component.button.primary.text}", focusRing: { color: "{red.400}", shadow: "none" } }, contrast: { background: "{surface.0}", hoverBackground: "{surface.100}", activeBackground: "{surface.200}", borderColor: "{surface.0}", hoverBorderColor: "{surface.100}", activeBorderColor: "{surface.200}", color: "{surface.950}", hoverColor: "{surface.950}", activeColor: "{surface.950}", focusRing: { color: "{surface.0}", shadow: "none" } } }, outlined: { primary: { hoverBackground: "{component.button.ghost.bg-hover}", activeBackground: "color-mix(in srgb, {primary.color}, transparent 84%)", borderColor: "{colors.border.border-brand}", color: "{colors.text.text-brand}" }, secondary: { hoverBackground: "{colors.background.bg-action-hover}", activeBackground: "rgba(255,255,255,0.16)", borderColor: "{colors.border.border-action}", color: "{colors.text.text-primary}" }, success: { hoverBackground: "color-mix(in srgb, {green.400}, transparent 96%)", activeBackground: "color-mix(in srgb, {green.400}, transparent 84%)", borderColor: "{green.700}", color: "{green.400}" }, info: { hoverBackground: "color-mix(in srgb, {sky.400}, transparent 96%)", activeBackground: "color-mix(in srgb, {sky.400}, transparent 84%)", borderColor: "{sky.700}", color: "{sky.400}" }, warn: { hoverBackground: "color-mix(in srgb, {orange.400}, transparent 96%)", activeBackground: "color-mix(in srgb, {orange.400}, transparent 84%)", borderColor: "{orange.700}", color: "{orange.400}" }, help: { hoverBackground: "color-mix(in srgb, {purple.400}, transparent 96%)", activeBackground: "color-mix(in srgb, {purple.400}, transparent 84%)", borderColor: "{purple.700}", color: "{purple.400}" }, danger: { hoverBackground: "color-mix(in srgb, {red.400}, transparent 96%)", activeBackground: "color-mix(in srgb, {red.400}, transparent 84%)", borderColor: "{red.700}", color: "{red.400}" }, contrast: { hoverBackground: "{surface.800}", activeBackground: "{surface.700}", borderColor: "{surface.500}", color: "{surface.0}" }, plain: { hoverBackground: "{surface.800}", activeBackground: "{surface.700}", borderColor: "{surface.600}", color: "{surface.0}" } }, text: { primary: { hoverBackground: "color-mix(in srgb, {primary.color}, transparent 96%)", activeBackground: "color-mix(in srgb, {primary.color}, transparent 84%)", color: "{primary.color}" }, secondary: { hoverBackground: "{component.button.tertiary.bg-hover}", activeBackground: "{surface.700}", color: "{colors.text.text-primary}" }, success: { hoverBackground: "color-mix(in srgb, {green.400}, transparent 96%)", activeBackground: "color-mix(in srgb, {green.400}, transparent 84%)", color: "{green.400}" }, info: { hoverBackground: "color-mix(in srgb, {sky.400}, transparent 96%)", activeBackground: "color-mix(in srgb, {sky.400}, transparent 84%)", color: "{sky.400}" }, warn: { hoverBackground: "color-mix(in srgb, {orange.400}, transparent 96%)", activeBackground: "color-mix(in srgb, {orange.400}, transparent 84%)", color: "{orange.400}" }, help: { hoverBackground: "color-mix(in srgb, {purple.400}, transparent 96%)", activeBackground: "color-mix(in srgb, {purple.400}, transparent 84%)", color: "{purple.400}" }, danger: { hoverBackground: "color-mix(in srgb, {red.400}, transparent 96%)", activeBackground: "color-mix(in srgb, {red.400}, transparent 84%)", color: "{red.400}" }, contrast: { hoverBackground: "{surface.800}", activeBackground: "{surface.700}", color: "{surface.0}" }, plain: { hoverBackground: "{surface.800}", activeBackground: "{surface.700}", color: "{surface.0}" } }, link: { color: "{primary.color}", hoverColor: "{primary.color}", activeColor: "{primary.color}" } } } }, datepicker: { root: { transitionDuration: "{transition.duration}" }, panel: { background: "{colors.background.bg-overlay}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}", shadow: "{overlay.popover.shadow}", padding: "{overlay.popover.padding}" }, header: { background: "{colors.background.bg-overlay}", borderColor: "{content.border.color}", color: "{content.color}", padding: "0 0 0.5rem 0" }, title: { gap: "0.5rem", fontWeight: "500" }, dropdown: { width: "2.5rem", sm: { width: "2rem" }, lg: { width: "3rem" }, borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.border.color}", activeBorderColor: "{form.field.border.color}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, inputIcon: { color: "{form.field.icon.color}" }, selectMonth: { hoverBackground: "{content.hover.background}", color: "{content.color}", hoverColor: "{content.hover.color}", padding: "0.25rem 0.5rem", borderRadius: "{content.border.radius}" }, selectYear: { hoverBackground: "{content.hover.background}", color: "{content.color}", hoverColor: "{content.hover.color}", padding: "0.25rem 0.5rem", borderRadius: "{content.border.radius}" }, group: { borderColor: "{content.border.color}", gap: "{overlay.popover.padding}" }, dayView: { margin: "0.5rem 0 0 0" }, weekDay: { padding: "0.25rem", fontWeight: "500", color: "{content.color}" }, date: { hoverBackground: "{colors.background.bg-info-hover}", selectedBackground: "{primary.color}", rangeSelectedBackground: "{colors.background.bg-action-hover}", color: "{content.color}", hoverColor: "{content.hover.color}", selectedColor: "{primary.contrast.color}", rangeSelectedColor: "{colors.text.text-secondary}", width: "2rem", height: "2rem", borderRadius: "50%", padding: "0.25rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, monthView: { margin: "0.5rem 0 0 0" }, month: { padding: "0.375rem", borderRadius: "{content.border.radius}" }, yearView: { margin: "0.5rem 0 0 0" }, year: { padding: "0.375rem", borderRadius: "{content.border.radius}" }, buttonbar: { padding: "0.5rem 0 0 0", borderColor: "{content.border.color}" }, timePicker: { padding: "0.5rem 0 0 0", borderColor: "{content.border.color}", gap: "0.5rem", buttonGap: "0.25rem" }, colorScheme: { light: { dropdown: { background: "{surface.100}", hoverBackground: "{surface.200}", activeBackground: "{surface.300}", color: "{surface.600}", hoverColor: "{surface.700}", activeColor: "{surface.800}" }, today: { background: "{surface.200}", color: "{surface.900}" } }, dark: { dropdown: { background: "{surface.800}", hoverBackground: "{surface.700}", activeBackground: "{surface.600}", color: "{surface.300}", hoverColor: "{surface.200}", activeColor: "{surface.100}" }, today: { background: "{surface.700}", color: "{surface.0}" } } } }, card: { root: { background: "{content.background}", borderRadius: "{border.radius.xl}", color: "{content.color}", shadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)" }, body: { padding: "1.25rem", gap: "0.5rem" }, caption: { gap: "0.5rem" }, title: { fontSize: "1.25rem", fontWeight: "500" }, subtitle: { color: "{text.muted.color}" } }, carousel: { root: { transitionDuration: "{transition.duration}" }, content: { gap: "0.25rem" }, indicatorList: { padding: "1rem", gap: "0.5rem" }, indicator: { width: "2rem", height: "0.5rem", borderRadius: "{content.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, colorScheme: { light: { indicator: { background: "{surface.200}", hoverBackground: "{surface.300}", activeBackground: "{primary.color}" } }, dark: { indicator: { background: "{surface.700}", hoverBackground: "{surface.600}", activeBackground: "{primary.color}" } } } }, cascadeselect: { root: { background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } }, dropdown: { width: "2.5rem", color: "{form.field.icon.color}" }, overlay: { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}" }, list: { padding: "{list.padding}", gap: "{list.gap}", mobileIndent: "1rem" }, option: { focusBackground: "{list.option.focus.background}", selectedBackground: "{list.option.selected.background}", selectedFocusBackground: "{list.option.selected.focus.background}", color: "{list.option.color}", focusColor: "{list.option.focus.color}", selectedColor: "{list.option.selected.color}", selectedFocusColor: "{list.option.selected.focus.color}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}", icon: { color: "{list.option.icon.color}", focusColor: "{list.option.icon.focus.color}", size: "0.875rem" } }, clearIcon: { color: "{form.field.icon.color}" } }, checkbox: { root: { borderRadius: "{border.radius.sm}", width: "1rem", height: "1rem", background: "{colors.background.bg-action}", checkedBackground: "{colors.background.bg-brand}", checkedHoverBackground: "{primary.hover.color}", disabledBackground: "{component.checker.bg-inactive}", filledBackground: "{colors.background.bg-action}", borderColor: "{component.checker.outer-border}", hoverBorderColor: "{component.checker.outer-border}", focusBorderColor: "{component.checker.outer-border}", checkedBorderColor: "{colors.border.border-brand}", checkedHoverBorderColor: "{primary.hover.color}", checkedFocusBorderColor: "{colors.border.border-brand}", checkedDisabledBorderColor: "{component.checker.outer-border-inactive}", invalidBorderColor: "{form.field.invalid.border.color}", shadow: "{form.field.shadow}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { width: "1rem", height: "1rem" }, lg: { width: "1.5rem", height: "1.5rem" } }, icon: { size: "0.875rem", color: "{form.field.color}", checkedColor: "{primary.contrast.color}", checkedHoverColor: "{primary.contrast.color}", disabledColor: "{form.field.disabled.color}", sm: { size: "0.75rem" }, lg: { size: "1rem" } } }, chip: { root: { borderRadius: "16px", paddingX: "0.75rem", paddingY: "0.5rem", gap: "0.5rem", transitionDuration: "{transition.duration}" }, image: { width: "2rem", height: "2rem" }, icon: { size: "1rem" }, removeIcon: { size: "1rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" } }, colorScheme: { light: { root: { background: "{component.tag.bg-strong}", color: "{component.tag.text}" }, icon: { color: "{component.tag.text}" }, removeIcon: { color: "{component.tag.text}" } }, dark: { root: { background: "{component.tag.bg-strong}", color: "{component.tag.text}" }, icon: { color: "{component.tag.text}" }, removeIcon: { color: "{component.tag.text}" } } } }, colorpicker: { root: { transitionDuration: "{transition.duration}" }, preview: { width: "1.5rem", height: "1.5rem", borderRadius: "{form.field.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, panel: { shadow: "{overlay.popover.shadow}", borderRadius: "{overlay.popover.borderRadius}" }, colorScheme: { light: { panel: { background: "{surface.800}", borderColor: "{surface.900}" }, handle: { color: "{surface.0}" } }, dark: { panel: { background: "{surface.900}", borderColor: "{surface.700}" }, handle: { color: "{surface.0}" } } } }, confirmdialog: { icon: { size: "2rem", color: "{overlay.modal.color}" }, content: { gap: "1rem" } }, confirmpopup: { root: { background: "{overlay.popover.background}", borderColor: "{overlay.popover.border.color}", color: "{overlay.popover.color}", borderRadius: "{overlay.popover.border.radius}", shadow: "{overlay.popover.shadow}", gutter: "10px", arrowOffset: "1.25rem" }, content: { padding: "{overlay.popover.padding}", gap: "1rem" }, icon: { size: "1.5rem", color: "{overlay.popover.color}" }, footer: { gap: "0.5rem", padding: "0 {overlay.popover.padding} {overlay.popover.padding} {overlay.popover.padding}" } }, contextmenu: { root: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-overlay}", color: "{colors.text.text-primary}", borderRadius: "{content.border.radius}", shadow: "{overlay.navigation.shadow}", transitionDuration: "{transition.duration}" }, list: { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}" }, item: { focusBackground: "{component.dropdown.bg-hover}", activeBackground: "{component.dropdown.bg-hover}", color: "{colors.text.text-primary}", focusColor: "{colors.text.text-primary-hover}", activeColor: "{colors.text.text-primary-hover}", padding: "{navigation.item.padding}", borderRadius: "{navigation.item.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{colors.icon.icon-secondary}", focusColor: "{colors.icon.icon-secondary-hover}", activeColor: "{colors.icon.icon-secondary-hover}" } }, submenu: { mobileIndent: "1rem" }, submenuIcon: { size: "{navigation.submenu.icon.size}", color: "{colors.icon.icon-secondary}", focusColor: "{colors.icon.icon-secondary-hover}", activeColor: "{colors.icon.icon-secondary-hover}" }, separator: { borderColor: "{component.dropdown.divider}" } }, dataview: { root: { borderColor: "transparent", borderWidth: "0", borderRadius: "0", padding: "0" }, header: { background: "{content.background}", color: "{content.color}", borderColor: "{content.border.color}", borderWidth: "0 0 1px 0", padding: "0.75rem 1rem", borderRadius: "0" }, content: { background: "{content.background}", color: "{content.color}", borderColor: "transparent", borderWidth: "0", padding: "0", borderRadius: "0" }, footer: { background: "{content.background}", color: "{content.color}", borderColor: "{content.border.color}", borderWidth: "1px 0 0 0", padding: "0.75rem 1rem", borderRadius: "0" }, paginatorTop: { borderColor: "{content.border.color}", borderWidth: "0 0 1px 0" }, paginatorBottom: { borderColor: "{content.border.color}", borderWidth: "1px 0 0 0" } }, datatable: { root: { transitionDuration: "{transition.duration}" }, header: { background: "{content.background}", borderColor: "{datatable.border.color}", color: "{content.color}", borderWidth: "0 0 1px 0", padding: "0.75rem 1rem", sm: { padding: "0.375rem 0.5rem" }, lg: { padding: "1rem 1.25rem" } }, headerCell: { background: "{component.table.bg-header}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", borderColor: "{component.table.border-header}", color: "{colors.text.text-primary}", hoverColor: "{content.hover.color}", selectedColor: "{highlight.color}", gap: "0.5rem", padding: "0.5rem 0.75rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" }, sm: { padding: "0.25rem 0.375rem" }, lg: { padding: "0.75rem 1rem" } }, columnTitle: { fontWeight: "600" }, row: { background: "{colors.background.bg-page}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", color: "{colors.text.text-primary}", hoverColor: "{colors.text.text-primary}", selectedColor: "{highlight.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" } }, bodyCell: { borderColor: "{component.table.border-cell}", padding: "0 0.75rem", sm: { padding: "0 0.375rem" }, lg: { padding: "0 1rem" } }, footerCell: { background: "{content.background}", borderColor: "{datatable.border.color}", color: "{content.color}", padding: "0.75rem 1rem", sm: { padding: "0.375rem 0.5rem" }, lg: { padding: "1rem 1.25rem" } }, columnFooter: { fontWeight: "600" }, footer: { background: "{content.background}", borderColor: "{datatable.border.color}", color: "{content.color}", borderWidth: "0 0 1px 0", padding: "0.75rem 1rem", sm: { padding: "0.375rem 0.5rem" }, lg: { padding: "1rem 1.25rem" } }, dropPoint: { color: "{primary.color}" }, columnResizer: { width: "0.5rem" }, resizeIndicator: { width: "1px", color: "{primary.color}" }, sortIcon: { color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", size: "0.875rem" }, loadingIcon: { size: "2rem" }, rowToggleButton: { hoverBackground: "{content.hover.background}", selectedHoverBackground: "{content.background}", color: "{text.muted.color}", hoverColor: "{text.color}", selectedHoverColor: "{primary.color}", size: "1.75rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, filter: { inlineGap: "0.5rem", overlaySelect: { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}" }, overlayPopover: { background: "{overlay.popover.background}", borderColor: "{overlay.popover.border.color}", borderRadius: "{overlay.popover.border.radius}", color: "{overlay.popover.color}", shadow: "{overlay.popover.shadow}", padding: "{overlay.popover.padding}", gap: "0.5rem" }, rule: { borderColor: "{content.border.color}" }, constraintList: { padding: "{list.padding}", gap: "{list.gap}" }, constraint: { focusBackground: "{list.option.focus.background}", selectedBackground: "{list.option.selected.background}", selectedFocusBackground: "{list.option.selected.focus.background}", color: "{list.option.color}", focusColor: "{list.option.focus.color}", selectedColor: "{list.option.selected.color}", selectedFocusColor: "{list.option.selected.focus.color}", separator: { borderColor: "{content.border.color}" }, padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}" } }, paginatorTop: { borderColor: "{datatable.border.color}", borderWidth: "0 0 1px 0" }, paginatorBottom: { borderColor: "{datatable.border.color}", borderWidth: "0 0 1px 0" }, colorScheme: { light: { root: { borderColor: "{content.border.color}" }, row: { stripedBackground: "{surface.50}" }, bodyCell: { selectedBorderColor: "{primary.100}" } }, dark: { root: { borderColor: "{surface.800}" }, row: { stripedBackground: "{surface.950}" }, bodyCell: { selectedBorderColor: "{primary.900}" } } } }, dialog: { root: { background: "{colors.background.bg-page}", borderColor: "{colors.border.border-container}", color: "{colors.text.text-primary}", borderRadius: "{overlay.modal.border.radius}", shadow: "{overlay.modal.shadow}" }, header: { padding: "12px 18px 6px 24px", gap: "0.5rem" }, title: { fontSize: "16px", fontWeight: "600" }, content: { padding: "0 24px {overlay.modal.padding} 24px" }, footer: { padding: "0 24px {overlay.modal.padding} 24px", gap: "0.5rem" } }, divider: { root: { borderColor: "{content.border.color}" }, content: { background: "{content.background}", color: "{text.color}" }, horizontal: { margin: "1rem 0", padding: "0 1rem", content: { padding: "0 0.5rem" } }, vertical: { margin: "0 1rem", padding: "0.5rem 0", content: { padding: "0.5rem 0" } } }, dock: { root: { background: "rgba(255, 255, 255, 0.1)", borderColor: "rgba(255, 255, 255, 0.2)", padding: "0.5rem", borderRadius: "{border.radius.xl}" }, item: { borderRadius: "{content.border.radius}", padding: "0.5rem", size: "3rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } } }, drawer: { root: { background: "{colors.background.bg-page}", borderColor: "{colors.border.border-container}", color: "{colors.text.text-primary}", shadow: "{overlay.modal.shadow}" }, header: { padding: "{overlay.modal.padding}" }, title: { fontSize: "1.5rem", fontWeight: "600" }, content: { padding: "0 {overlay.modal.padding} {overlay.modal.padding} {overlay.modal.padding}" }, footer: { padding: "{overlay.modal.padding}" } }, editor: { toolbar: { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}" }, toolbarItem: { color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{primary.color}" }, overlay: { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}", padding: "{list.padding}" }, overlayOption: { focusBackground: "{list.option.focus.background}", color: "{list.option.color}", focusColor: "{list.option.focus.color}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}" }, content: { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}" } }, fieldset: { root: { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", color: "{content.color}", padding: "0 1.125rem 1.125rem 1.125rem", transitionDuration: "{transition.duration}" }, legend: { background: "{content.background}", hoverBackground: "{content.hover.background}", color: "{content.color}", hoverColor: "{content.hover.color}", borderRadius: "{content.border.radius}", borderWidth: "1px", borderColor: "transparent", padding: "0.5rem 0.75rem", gap: "0.5rem", fontWeight: "600", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, toggleIcon: { color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}" }, content: { padding: "0" } }, fileupload: { root: { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}", transitionDuration: "{transition.duration}" }, header: { background: "transparent", color: "{text.color}", padding: "1.125rem", borderColor: "unset", borderWidth: "0", borderRadius: "0", gap: "0.5rem" }, content: { highlightBorderColor: "{primary.color}", padding: "0 1.125rem 1.125rem 1.125rem", gap: "1rem" }, file: { padding: "1rem", gap: "1rem", borderColor: "{content.border.color}", info: { gap: "0.5rem" } }, fileList: { gap: "0.5rem" }, progressbar: { height: "0.25rem" }, basic: { gap: "0.5rem" } }, iftalabel: { root: { color: "{form.field.float.label.color}", focusColor: "{form.field.float.label.focus.color}", invalidColor: "{form.field.float.label.invalid.color}", transitionDuration: "0.2s", positionX: "{form.field.padding.x}", top: "{form.field.padding.y}", fontSize: "0.75rem", fontWeight: "400" }, input: { paddingTop: "1.5rem", paddingBottom: "{form.field.padding.y}" } }, floatlabel: { root: { color: "{form.field.float.label.color}", focusColor: "{form.field.float.label.focus.color}", activeColor: "{form.field.float.label.active.color}", invalidColor: "{form.field.float.label.invalid.color}", transitionDuration: "0.2s", positionX: "{form.field.padding.x}", positionY: "{form.field.padding.y}", fontWeight: "500", active: { fontSize: "0.75rem", fontWeight: "400" } }, over: { active: { top: "-1.25rem" } }, in: { input: { paddingTop: "1.5rem", paddingBottom: "{form.field.padding.y}" }, active: { top: "{form.field.padding.y}" } }, on: { borderRadius: "{border.radius.xs}", active: { background: "{form.field.background}", padding: "0 0.125rem" } } }, galleria: { root: { borderWidth: "1px", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", transitionDuration: "{transition.duration}" }, navButton: { background: "rgba(255, 255, 255, 0.1)", hoverBackground: "rgba(255, 255, 255, 0.2)", color: "{surface.100}", hoverColor: "{surface.0}", size: "3rem", gutter: "0.5rem", prev: { borderRadius: "50%" }, next: { borderRadius: "50%" }, focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, navIcon: { size: "1.5rem" }, thumbnailsContent: { background: "{content.background}", padding: "1rem 0.25rem" }, thumbnailNavButton: { size: "2rem", borderRadius: "{content.border.radius}", gutter: "0.5rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, thumbnailNavButtonIcon: { size: "1rem" }, caption: { background: "rgba(0, 0, 0, 0.5)", color: "{surface.100}", padding: "1rem" }, indicatorList: { gap: "0.5rem", padding: "1rem" }, indicatorButton: { width: "1rem", height: "1rem", activeBackground: "{primary.color}", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, insetIndicatorList: { background: "rgba(0, 0, 0, 0.5)" }, insetIndicatorButton: { background: "rgba(255, 255, 255, 0.4)", hoverBackground: "rgba(255, 255, 255, 0.6)", activeBackground: "rgba(255, 255, 255, 0.9)" }, closeButton: { size: "3rem", gutter: "0.5rem", background: "rgba(255, 255, 255, 0.1)", hoverBackground: "rgba(255, 255, 255, 0.2)", color: "{surface.50}", hoverColor: "{surface.0}", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, closeButtonIcon: { size: "1.5rem" }, colorScheme: { light: { thumbnailNavButton: { hoverBackground: "{surface.100}", color: "{surface.600}", hoverColor: "{surface.700}" }, indicatorButton: { background: "{surface.200}", hoverBackground: "{surface.300}" } }, dark: { thumbnailNavButton: { hoverBackground: "{surface.700}", color: "{surface.400}", hoverColor: "{surface.0}" }, indicatorButton: { background: "{surface.700}", hoverBackground: "{surface.600}" } } } }, iconfield: { icon: { color: "{form.field.icon.color}" } }, image: { root: { transitionDuration: "{transition.duration}" }, preview: { icon: { size: "1.5rem" }, mask: { background: "{mask.background}", color: "{mask.color}" } }, toolbar: { position: { left: "auto", right: "1rem", top: "1rem", bottom: "auto" }, blur: "8px", background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", borderWidth: "1px", borderRadius: "30px", padding: ".5rem", gap: "0.5rem" }, action: { hoverBackground: "rgba(255,255,255,0.1)", color: "{surface.50}", hoverColor: "{surface.0}", size: "3rem", iconSize: "1.5rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } } }, imagecompare: { handle: { size: "15px", hoverSize: "30px", background: "rgba(255,255,255,0.3)", hoverBackground: "rgba(255,255,255,0.3)", borderColor: "unset", hoverBorderColor: "unset", borderWidth: "0", borderRadius: "50%", transitionDuration: "{transition.duration}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "rgba(255,255,255,0.3)", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } } }, inlinemessage: { root: { padding: "{form.field.padding.y} {form.field.padding.x}", borderRadius: "{content.border.radius}", gap: "0.5rem" }, text: { fontWeight: "500" }, icon: { size: "1rem" }, colorScheme: { light: { info: { background: "color-mix(in srgb, {blue.50}, transparent 5%)", borderColor: "{blue.200}", color: "{blue.600}", shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)" }, success: { background: "color-mix(in srgb, {green.50}, transparent 5%)", borderColor: "{green.200}", color: "{green.600}", shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)" }, warn: { background: "color-mix(in srgb,{yellow.50}, transparent 5%)", borderColor: "{yellow.200}", color: "{yellow.600}", shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)" }, error: { background: "color-mix(in srgb, {red.50}, transparent 5%)", borderColor: "{red.200}", color: "{red.600}", shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)" }, secondary: { background: "{surface.100}", borderColor: "{surface.200}", color: "{surface.600}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)" }, contrast: { background: "{surface.900}", borderColor: "{surface.950}", color: "{surface.50}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)" } }, dark: { info: { background: "color-mix(in srgb, {blue.500}, transparent 84%)", borderColor: "color-mix(in srgb, {blue.700}, transparent 64%)", color: "{blue.500}", shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)" }, success: { background: "color-mix(in srgb, {green.500}, transparent 84%)", borderColor: "color-mix(in srgb, {green.700}, transparent 64%)", color: "{green.500}", shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)" }, warn: { background: "color-mix(in srgb, {yellow.500}, transparent 84%)", borderColor: "color-mix(in srgb, {yellow.700}, transparent 64%)", color: "{yellow.500}", shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)" }, error: { background: "color-mix(in srgb, {red.500}, transparent 84%)", borderColor: "color-mix(in srgb, {red.700}, transparent 64%)", color: "{red.500}", shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)" }, secondary: { background: "{surface.800}", borderColor: "{surface.700}", color: "{surface.300}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)" }, contrast: { background: "{surface.0}", borderColor: "{surface.100}", color: "{surface.950}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)" } } } }, inplace: { root: { padding: "{form.field.padding.y} {form.field.padding.x}", borderRadius: "{content.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, transitionDuration: "{transition.duration}" }, display: { hoverBackground: "{content.hover.background}", hoverColor: "{content.hover.color}" } }, inputchips: { root: { background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}" }, chip: { borderRadius: "{border.radius.sm}" }, colorScheme: { light: { chip: { focusBackground: "{surface.200}", color: "{surface.800}" } }, dark: { chip: { focusBackground: "{surface.700}", color: "{surface.0}" } } } }, inputgroup: { addon: { background: "{colors.background.bg-action}", borderColor: "{colors.border.border-action}", color: "{colors.text.text-primary}", borderRadius: "{form.field.border.radius}", padding: "0.5rem", minWidth: "2.5rem" } }, inputnumber: { root: { transitionDuration: "{transition.duration}" }, button: { width: "2.5rem", borderRadius: "{form.field.border.radius}", verticalPadding: "{form.field.padding.y}" }, colorScheme: { light: { button: { background: "transparent", hoverBackground: "{surface.100}", activeBackground: "{surface.200}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.border.color}", activeBorderColor: "{form.field.border.color}", color: "{surface.400}", hoverColor: "{surface.500}", activeColor: "{surface.600}" } }, dark: { button: { background: "transparent", hoverBackground: "{surface.800}", activeBackground: "{surface.700}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.border.color}", activeBorderColor: "{form.field.border.color}", color: "{surface.400}", hoverColor: "{surface.300}", activeColor: "{surface.200}" } } } }, inputotp: { root: { gap: "0.5rem" }, input: { width: "2.5rem", sm: { width: "2rem" }, lg: { width: "3rem" } } }, inputtext: { root: { background: "{colors.background.bg-action}", disabledBackground: "{colors.background.bg-action-inactive}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{colors.border.border-action}", hoverBorderColor: "{colors.border.border-action-hover}", focusBorderColor: "{colors.border.border-brand}", invalidBorderColor: "{colors.border.border-error}", color: "{colors.text.text-primary}", disabledColor: "{colors.text.text-inactive}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } } }, knob: { root: { transitionDuration: "{transition.duration}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, value: { background: "{primary.color}" }, range: { background: "{content.border.color}" }, text: { color: "{text.muted.color}" } }, listbox: { root: { background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", borderColor: "{form.field.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", shadow: "{form.field.shadow}", borderRadius: "{form.field.border.radius}", transitionDuration: "{form.field.transition.duration}" }, list: { padding: "{list.padding}", gap: "{list.gap}", header: { padding: "{list.header.padding}" } }, option: { focusBackground: "{list.option.focus.background}", selectedBackground: "{list.option.selected.background}", selectedFocusBackground: "{list.option.selected.focus.background}", color: "{list.option.color}", focusColor: "{list.option.focus.color}", selectedColor: "{list.option.selected.color}", selectedFocusColor: "{list.option.selected.focus.color}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}" }, optionGroup: { background: "{list.option.group.background}", color: "{list.option.group.color}", fontWeight: "{list.option.group.font.weight}", padding: "{list.option.group.padding}" }, checkmark: { color: "{list.option.color}", gutterStart: "-0.375rem", gutterEnd: "0.375rem" }, emptyMessage: { padding: "{list.option.padding}" }, colorScheme: { light: { option: { stripedBackground: "{surface.50}" } }, dark: { option: { stripedBackground: "{surface.900}" } } } }, megamenu: { root: { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", color: "{content.color}", gap: "0.5rem", verticalOrientation: { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}" }, horizontalOrientation: { padding: "0.5rem 0.75rem", gap: "0.5rem" }, transitionDuration: "{transition.duration}" }, baseItem: { borderRadius: "{content.border.radius}", padding: "{navigation.item.padding}" }, item: { focusBackground: "{navigation.item.focus.background}", activeBackground: "{navigation.item.active.background}", color: "{navigation.item.color}", focusColor: "{navigation.item.focus.color}", activeColor: "{navigation.item.active.color}", padding: "{navigation.item.padding}", borderRadius: "{navigation.item.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", activeColor: "{navigation.item.icon.active.color}" } }, overlay: { padding: "0", background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", color: "{content.color}", shadow: "{overlay.navigation.shadow}", gap: "0.5rem" }, submenu: { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}" }, submenuLabel: { padding: "{navigation.submenu.label.padding}", fontWeight: "{navigation.submenu.label.font.weight}", background: "{navigation.submenu.label.background.}", color: "{navigation.submenu.label.color}" }, submenuIcon: { size: "{navigation.submenu.icon.size}", color: "{navigation.submenu.icon.color}", focusColor: "{navigation.submenu.icon.focus.color}", activeColor: "{navigation.submenu.icon.active.color}" }, separator: { borderColor: "{content.border.color}" }, mobileButton: { borderRadius: "50%", size: "1.75rem", color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", hoverBackground: "{content.hover.background}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } } }, menu: { root: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-overlay}", color: "{colors.text.text-primary}", borderRadius: "{content.border.radius}", shadow: "{overlay.navigation.shadow}", transitionDuration: "{transition.duration}" }, list: { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}" }, item: { focusBackground: "{component.dropdown.bg-hover}", color: "{colors.text.text-primary}", focusColor: "{colors.text.text-primary-hover}", padding: "{navigation.item.padding}", borderRadius: "{navigation.item.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{colors.icon.icon-secondary}", focusColor: "{colors.icon.icon-secondary-hover}" } }, submenuLabel: { padding: "{navigation.submenu.label.padding}", fontWeight: "{navigation.submenu.label.font.weight}", background: "{navigation.submenu.label.background}", color: "{colors.text.text-primary}" }, separator: { borderColor: "{component.dropdown.divider}" } }, menubar: { root: { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", color: "{content.color}", gap: "0.5rem", padding: "0.5rem 0.75rem", transitionDuration: "{transition.duration}" }, baseItem: { borderRadius: "{content.border.radius}", padding: "{navigation.item.padding}" }, item: { focusBackground: "{component.dropdown.bg-hover}", activeBackground: "{component.dropdown.bg-hover}", color: "{colors.text.text-primary}", focusColor: "{colors.text.text-primary}", activeColor: "{colors.text.text-primary}", padding: "{navigation.item.padding}", borderRadius: "{navigation.item.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", activeColor: "{navigation.item.icon.active.color}" } }, submenu: { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}", background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-overlay}", borderRadius: "{content.border.radius}", shadow: "{overlay.navigation.shadow}", mobileIndent: "1rem", icon: { size: "{navigation.submenu.icon.size}", color: "{navigation.submenu.icon.color}", focusColor: "{navigation.submenu.icon.focus.color}", activeColor: "{navigation.submenu.icon.active.color}" } }, separator: { borderColor: "{component.dropdown.divider}" }, mobileButton: { borderRadius: "50%", size: "1.75rem", color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", hoverBackground: "{content.hover.background}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } } }, message: { root: { borderRadius: "{content.border.radius}", borderWidth: "1px", transitionDuration: "{transition.duration}" }, content: { padding: "0.5rem 0.75rem", gap: "0.5rem", sm: { padding: "0.375rem 0.625rem" }, lg: { padding: "0.625rem 0.875rem" } }, text: { fontSize: "1rem", fontWeight: "500", sm: { fontSize: "0.75rem" }, lg: { fontSize: "1.125rem" } }, icon: { size: "1.125rem", sm: { size: "1rem" }, lg: { size: "1.25rem" } }, closeButton: { width: "1.75rem", height: "1.75rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", offset: "{focus.ring.offset}" } }, closeIcon: { size: "1rem", sm: { size: "0.875rem" }, lg: { size: "1.125rem" } }, outlined: { root: { borderWidth: "1px" } }, simple: { content: { padding: "0" } }, colorScheme: { light: { info: { background: "color-mix(in srgb, {blue.50}, transparent 5%)", borderColor: "{blue.200}", color: "{blue.600}", shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)", closeButton: { hoverBackground: "{blue.100}", focusRing: { color: "{blue.600}", shadow: "none" } }, outlined: { color: "{blue.600}", borderColor: "{blue.600}" }, simple: { color: "{blue.600}" } }, success: { background: "color-mix(in srgb, {green.50}, transparent 5%)", borderColor: "{green.200}", color: "{green.600}", shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)", closeButton: { hoverBackground: "{green.100}", focusRing: { color: "{green.600}", shadow: "none" } }, outlined: { color: "{green.600}", borderColor: "{green.600}" }, simple: { color: "{green.600}" } }, warn: { background: "color-mix(in srgb,{yellow.50}, transparent 5%)", borderColor: "{yellow.200}", color: "{yellow.600}", shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)", closeButton: { hoverBackground: "{yellow.100}", focusRing: { color: "{yellow.600}", shadow: "none" } }, outlined: { color: "{yellow.600}", borderColor: "{yellow.600}" }, simple: { color: "{yellow.600}" } }, error: { background: "color-mix(in srgb, {red.50}, transparent 5%)", borderColor: "{red.200}", color: "{colors.text.text-error}", shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)", closeButton: { hoverBackground: "{red.100}", focusRing: { color: "{colors.text.text-error}", shadow: "none" } }, outlined: { color: "{colors.text.text-error}", borderColor: "{colors.text.text-error}" }, simple: { color: "{colors.text.text-error}" } }, secondary: { background: "{surface.100}", borderColor: "{surface.200}", color: "{surface.600}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)", closeButton: { hoverBackground: "{surface.200}", focusRing: { color: "{surface.600}", shadow: "none" } }, outlined: { color: "{surface.500}", borderColor: "{surface.500}" }, simple: { color: "{surface.500}" } }, contrast: { background: "{surface.900}", borderColor: "{surface.950}", color: "{surface.50}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)", closeButton: { hoverBackground: "{surface.800}", focusRing: { color: "{surface.50}", shadow: "none" } }, outlined: { color: "{surface.950}", borderColor: "{surface.950}" }, simple: { color: "{surface.950}" } } }, dark: { info: { background: "color-mix(in srgb, {blue.500}, transparent 84%)", borderColor: "color-mix(in srgb, {blue.700}, transparent 64%)", color: "{blue.500}", shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)", closeButton: { hoverBackground: "rgba(255, 255, 255, 0.05)", focusRing: { color: "{blue.500}", shadow: "none" } }, outlined: { color: "{blue.500}", borderColor: "{blue.500}" }, simple: { color: "{blue.500}" } }, success: { background: "color-mix(in srgb, {green.500}, transparent 84%)", borderColor: "color-mix(in srgb, {green.700}, transparent 64%)", color: "{green.500}", shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)", closeButton: { hoverBackground: "rgba(255, 255, 255, 0.05)", focusRing: { color: "{green.500}", shadow: "none" } }, outlined: { color: "{green.500}", borderColor: "{green.500}" }, simple: { color: "{green.500}" } }, warn: { background: "color-mix(in srgb, {yellow.500}, transparent 84%)", borderColor: "color-mix(in srgb, {yellow.700}, transparent 64%)", color: "{yellow.500}", shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)", closeButton: { hoverBackground: "rgba(255, 255, 255, 0.05)", focusRing: { color: "{yellow.500}", shadow: "none" } }, outlined: { color: "{yellow.500}", borderColor: "{yellow.500}" }, simple: { color: "{yellow.500}" } }, error: { background: "color-mix(in srgb, {colors.text.text-error}, transparent 84%)", borderColor: "color-mix(in srgb, {red.700}, transparent 64%)", color: "{colors.text.text-error}", shadow: "0px 4px 8px 0px color-mix(in srgb, {colors.text.text-error}, transparent 96%)", closeButton: { hoverBackground: "rgba(255, 255, 255, 0.05)", focusRing: { color: "{colors.text.text-error}", shadow: "none" } }, outlined: { color: "{colors.text.text-error}", borderColor: "{colors.text.text-error}" }, simple: { color: "{colors.text.text-error}" } }, secondary: { background: "{surface.800}", borderColor: "{surface.700}", color: "{surface.300}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)", closeButton: { hoverBackground: "{surface.700}", focusRing: { color: "{surface.300}", shadow: "none" } }, outlined: { color: "{surface.400}", borderColor: "{surface.400}" }, simple: { color: "{surface.400}" } }, contrast: { background: "{surface.0}", borderColor: "{surface.100}", color: "{surface.950}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)", closeButton: { hoverBackground: "{surface.100}", focusRing: { color: "{surface.950}", shadow: "none" } }, outlined: { color: "{surface.0}", borderColor: "{surface.0}" }, simple: { color: "{surface.0}" } } } } }, metergroup: { root: { borderRadius: "{content.border.radius}", gap: "1rem" }, meters: { background: "{content.border.color}", size: "0.5rem" }, label: { gap: "0.5rem" }, labelMarker: { size: "0.5rem" }, labelIcon: { size: "1rem" }, labelList: { verticalGap: "0.5rem", horizontalGap: "1rem" } }, multiselect: { root: { background: "{colors.background.bg-action}", disabledBackground: "{colors.background.bg-action-inactive}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{colors.border.border-action}", hoverBorderColor: "{colors.border.border-action-hover}", focusBorderColor: "{colors.border.border-action-hover}", invalidBorderColor: "{colors.border.border-error}", color: "{colors.text.text-primary}", disabledColor: "{colors.text.text-inactive}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } }, dropdown: { width: "2.5rem", color: "{form.field.icon.color}" }, overlay: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-overlay}", borderRadius: "{overlay.select.border.radius}", color: "{colors.text.text-primary}", shadow: "{overlay.select.shadow}" }, list: { padding: "{list.padding}", gap: "{list.gap}", header: { padding: "{list.header.padding}" } }, option: { focusBackground: "{component.dropdown.bg-hover}", selectedBackground: "{component.dropdown.bg-hover}", selectedFocusBackground: "{component.dropdown.bg-hover}", color: "{colors.text.text-primary}", focusColor: "{colors.text.text-primary}", selectedColor: "{colors.text.text-primary}", selectedFocusColor: "{colors.text.text-primary}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}", gap: "0.5rem" }, optionGroup: { background: "{component.dropdown.bg-hover}", color: "{colors.text.text-primary}", fontWeight: "{list.option.group.font.weight}", padding: "{list.option.group.padding}" }, chip: { borderRadius: "{border.radius.sm}" }, clearIcon: { color: "{form.field.icon.color}" }, emptyMessage: { padding: "{list.option.padding}" } }, orderlist: { root: { gap: "1.125rem" }, controls: { gap: "0.5rem" } }, organizationchart: { root: { gutter: "0.75rem", transitionDuration: "{transition.duration}" }, node: { background: "{content.background}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", borderColor: "{content.border.color}", color: "{content.color}", selectedColor: "{highlight.color}", hoverColor: "{content.hover.color}", padding: "0.75rem 1rem", toggleablePadding: "0.75rem 1rem 1.25rem 1rem", borderRadius: "{content.border.radius}" }, nodeToggleButton: { background: "{content.background}", hoverBackground: "{content.hover.background}", borderColor: "{content.border.color}", color: "{text.muted.color}", hoverColor: "{text.color}", size: "1.5rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, connector: { color: "{content.border.color}", borderRadius: "{content.border.radius}", height: "24px" } }, overlaybadge: { root: { outline: { width: "2px", color: "{content.background}" } } }, popover: { root: { background: "{colors.background.bg-overlay}", borderColor: "{overlay.popover.border.color}", color: "{overlay.popover.color}", borderRadius: "{overlay.popover.border.radius}", shadow: "{overlay.popover.shadow}", gutter: "10px", arrowOffset: "1.25rem" }, content: { padding: "{overlay.popover.padding}" } }, paginator: { root: { padding: "0.5rem 1rem", gap: "0.25rem", borderRadius: "{content.border.radius}", background: "{colors.background.bg-page}", color: "{content.color}", transitionDuration: "{transition.duration}" }, navButton: { background: "transparent", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", selectedColor: "{highlight.color}", width: "2.5rem", height: "2.5rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, currentPageReport: { color: "{text.muted.color}" }, jumpToPageInput: { maxWidth: "2.5rem" } }, password: { meter: { background: "{content.border.color}", borderRadius: "{content.border.radius}", height: ".75rem" }, icon: { color: "{form.field.icon.color}" }, overlay: { background: "{overlay.popover.background}", borderColor: "{overlay.popover.border.color}", borderRadius: "{overlay.popover.border.radius}", color: "{overlay.popover.color}", padding: "{overlay.popover.padding}", shadow: "{overlay.popover.shadow}" }, content: { gap: "0.5rem" }, colorScheme: { light: { strength: { weakBackground: "{red.500}", mediumBackground: "{amber.500}", strongBackground: "{green.500}" } }, dark: { strength: { weakBackground: "{red.400}", mediumBackground: "{amber.400}", strongBackground: "{green.400}" } } } }, panel: { root: { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}" }, header: { background: "transparent", color: "{text.color}", padding: "1.125rem", borderColor: "{content.border.color}", borderWidth: "0", borderRadius: "0" }, toggleableHeader: { padding: "0.375rem 1.125rem" }, title: { fontWeight: "600" }, content: { padding: "0 1.125rem 1.125rem 1.125rem" }, footer: { padding: "0 1.125rem 1.125rem 1.125rem" } }, panelmenu: { root: { gap: "0.5rem", transitionDuration: "{transition.duration}" }, panel: { background: "{content.background}", borderColor: "{content.border.color}", borderWidth: "1px", color: "{content.color}", padding: "0.25rem 0.25rem", borderRadius: "{content.border.radius}", first: { borderWidth: "1px", topBorderRadius: "{content.border.radius}" }, last: { borderWidth: "1px", bottomBorderRadius: "{content.border.radius}" } }, item: { focusBackground: "{navigation.item.focus.background}", color: "{navigation.item.color}", focusColor: "{navigation.item.focus.color}", gap: "0.5rem", padding: "{navigation.item.padding}", borderRadius: "{content.border.radius}", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}" } }, submenu: { indent: "1rem" }, submenuIcon: { color: "{navigation.submenu.icon.color}", focusColor: "{navigation.submenu.icon.focus.color}" } }, picklist: { root: { gap: "1.125rem" }, controls: { gap: "0.5rem" } }, progressbar: { root: { background: "{content.border.color}", borderRadius: "{content.border.radius}", height: "1.25rem" }, value: { background: "{primary.color}" }, label: { color: "{primary.contrast.color}", fontSize: "0.75rem", fontWeight: "600" } }, progressspinner: { colorScheme: { light: { root: { colorOne: "{red.500}", colorTwo: "{blue.500}", colorThree: "{green.500}", colorFour: "{yellow.500}" } }, dark: { root: { colorOne: "{red.400}", colorTwo: "{blue.400}", colorThree: "{green.400}", colorFour: "{yellow.400}" } } } }, radiobutton: { root: { width: "1rem", height: "1rem", background: "{form.field.background}", checkedBackground: "{primary.color}", checkedHoverBackground: "{primary.hover.color}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.border.color}", checkedBorderColor: "{primary.color}", checkedHoverBorderColor: "{primary.hover.color}", checkedFocusBorderColor: "{primary.color}", checkedDisabledBorderColor: "{form.field.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", shadow: "{form.field.shadow}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { width: "0.75rem", height: "0.75rem" }, lg: { width: "1.25rem", height: "1.25rem" } }, icon: { size: "0.5rem", checkedColor: "{component.checker.bg}", checkedHoverColor: "{component.checker.bg}", disabledColor: "transparent", sm: { size: "0.375rem" }, lg: { size: "0.625rem" } } }, rating: { root: { gap: "0.25rem", transitionDuration: "{transition.duration}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, icon: { size: "1rem", color: "{text.muted.color}", hoverColor: "{primary.color}", activeColor: "{primary.color}" } }, ripple: { colorScheme: { light: { root: { background: "rgba(0,0,0,0.1)" } }, dark: { root: { background: "rgba(255,255,255,0.3)" } } } }, scrollpanel: { root: { transitionDuration: "{transition.duration}" }, bar: { size: "9px", borderRadius: "{border.radius.sm}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, colorScheme: { light: { bar: { background: "{surface.100}" } }, dark: { bar: { background: "{surface.800}" } } } }, select: { root: { background: "{colors.background.bg-action}", disabledBackground: "{colors.background.bg-action-inactive}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{colors.border.border-action}", hoverBorderColor: "{colors.border.border-action-hover}", focusBorderColor: "{colors.border.border-action-hover}", invalidBorderColor: "{colors.border.border-error}", color: "{colors.text.text-primary}", disabledColor: "{colors.text.text-inactive}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } }, dropdown: { width: "2.5rem", color: "{form.field.icon.color}" }, overlay: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-overlay}", borderRadius: "{overlay.select.border.radius}", color: "{colors.text.text-primary}", shadow: "{overlay.select.shadow}" }, list: { padding: "{list.padding}", gap: "{list.gap}", header: { padding: "{list.header.padding}" } }, option: { focusBackground: "{component.dropdown.bg-hover}", selectedBackground: "{component.dropdown.bg-hover}", selectedFocusBackground: "{component.dropdown.bg-hover}", color: "{colors.text.text-primary}", focusColor: "{colors.text.text-primary}", selectedColor: "{colors.text.text-primary}", selectedFocusColor: "{colors.text.text-primary}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}" }, optionGroup: { background: "{component.dropdown.bg-hover}", color: "{colors.text.text-primary}", fontWeight: "{list.option.group.font.weight}", padding: "{list.option.group.padding}" }, clearIcon: { color: "{form.field.icon.color}" }, checkmark: { color: "{colors.icon.icon-secondary}", gutterStart: "-0.375rem", gutterEnd: "0.375rem" }, emptyMessage: { padding: "{list.option.padding}" } }, selectbutton: { root: { borderRadius: "{form.field.border.radius}" }, colorScheme: { light: { root: { invalidBorderColor: "{form.field.invalid.border.color}" } }, dark: { root: { invalidBorderColor: "{form.field.invalid.border.color}" } } } }, skeleton: { root: { borderRadius: "{content.border.radius}" }, colorScheme: { light: { root: { background: "{component.skeleton.bg}", animationBackground: "rgba(255,255,255,0.4)" } }, dark: { root: { background: "{component.skeleton.bg}", animationBackground: "rgba(255, 255, 255, 0.04)" } } } }, slider: { root: { transitionDuration: "{transition.duration}" }, track: { background: "{content.border.color}", borderRadius: "{content.border.radius}", size: "3px" }, range: { background: "{primary.color}" }, handle: { width: "20px", height: "20px", borderRadius: "50%", background: "{content.border.color}", hoverBackground: "{content.border.color}", content: { borderRadius: "50%", hoverBackground: "{content.background}", width: "16px", height: "16px", shadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.08), 0px 1px 1px 0px rgba(0, 0, 0, 0.14)" }, focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, colorScheme: { light: { handle: { content: { background: "{surface.0}" } } }, dark: { handle: { content: { background: "{surface.950}" } } } } }, speeddial: { root: { gap: "0.5rem", transitionDuration: "{transition.duration}" } }, splitter: { root: { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", transitionDuration: "{transition.duration}" }, gutter: { background: "{content.border.color}" }, handle: { size: "24px", background: "transparent", borderRadius: "{content.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } } }, splitbutton: { root: { borderRadius: "{form.field.border.radius}", roundedBorderRadius: "2rem", raisedShadow: "0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12)" } }, stepper: { root: { transitionDuration: "{transition.duration}" }, separator: { background: "{content.border.color}", activeBackground: "{primary.color}", margin: "0 0 0 1.625rem", size: "2px" }, step: { padding: "0.5rem", gap: "1rem" }, stepHeader: { padding: "0", borderRadius: "{content.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, gap: "0.5rem" }, stepTitle: { color: "{text.muted.color}", activeColor: "{primary.color}", fontWeight: "500" }, stepNumber: { background: "{content.background}", activeBackground: "{content.background}", borderColor: "{content.border.color}", activeBorderColor: "{content.border.color}", color: "{text.muted.color}", activeColor: "{primary.color}", size: "2rem", fontSize: "1.143rem", fontWeight: "500", borderRadius: "50%", shadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.06), 0px 1px 1px 0px rgba(0, 0, 0, 0.12)" }, steppanels: { padding: "0.875rem 0.5rem 1.125rem 0.5rem" }, steppanel: { background: "{content.background}", color: "{content.color}", padding: "0", indent: "1rem" } }, steps: { root: { transitionDuration: "{transition.duration}" }, separator: { background: "{content.border.color}" }, itemLink: { borderRadius: "{content.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, gap: "0.5rem" }, itemLabel: { color: "{text.muted.color}", activeColor: "{primary.color}", fontWeight: "500" }, itemNumber: { background: "{content.background}", activeBackground: "{content.background}", borderColor: "{content.border.color}", activeBorderColor: "{content.border.color}", color: "{text.muted.color}", activeColor: "{primary.color}", size: "2rem", fontSize: "1.143rem", fontWeight: "500", borderRadius: "50%", shadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.06), 0px 1px 1px 0px rgba(0, 0, 0, 0.12)" } }, tabmenu: { root: { transitionDuration: "{transition.duration}" }, tablist: { borderWidth: "0 0 1px 0", background: "{content.background}", borderColor: "{content.border.color}" }, item: { background: "transparent", hoverBackground: "transparent", activeBackground: "transparent", borderWidth: "0 0 1px 0", borderColor: "{content.border.color}", hoverBorderColor: "{content.border.color}", activeBorderColor: "{primary.color}", color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{primary.color}", padding: "1rem 1.125rem", fontWeight: "600", margin: "0 0 -1px 0", gap: "0.5rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, itemIcon: { color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{primary.color}" }, activeBar: { height: "1px", bottom: "-1px", background: "{primary.color}" } }, tabs: { root: { transitionDuration: "{transition.duration}" }, tablist: { borderWidth: "0 0 0.5px 0", background: "transparent", borderColor: "{colors.border.divider}" }, tab: { background: "transparent", hoverBackground: "transparent", activeBackground: "transparent", borderWidth: "0 0 1px 0", borderColor: "transparent", hoverBorderColor: "transparent", activeBorderColor: "transparent", color: "{colors.text.text-tertiary}", hoverColor: "{colors.text.text-primary}", activeColor: "{colors.text.text-brand}", padding: "1rem 1.125rem", fontWeight: "400", margin: "0 0 -1px 0", gap: "0.5rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" } }, tabpanel: { background: "transparent", color: "{content.color}", padding: "0.875rem 1.125rem 1.125rem 1.125rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "inset {focus.ring.shadow}" } }, navButton: { background: "{content.background}", color: "{text.muted.color}", hoverColor: "{text.color}", width: "2.5rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" } }, activeBar: { height: "2px", bottom: "-1px", background: "{colors.border.border-brand}" }, colorScheme: { light: { navButton: { shadow: "0px 0px 10px 50px rgba(255, 255, 255, 0.6)" } }, dark: { navButton: { shadow: "0px 0px 10px 50px color-mix(in srgb, {content.background}, transparent 50%)" } } } }, tabview: { root: { transitionDuration: "{transition.duration}" }, tabList: { background: "{content.background}", borderColor: "{content.border.color}" }, tab: { borderColor: "{content.border.color}", activeBorderColor: "{primary.color}", color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{primary.color}" }, tabPanel: { background: "{content.background}", color: "{content.color}" }, navButton: { background: "{content.background}", color: "{text.muted.color}", hoverColor: "{text.color}" }, colorScheme: { light: { navButton: { shadow: "0px 0px 10px 50px rgba(255, 255, 255, 0.6)" } }, dark: { navButton: { shadow: "0px 0px 10px 50px color-mix(in srgb, {content.background}, transparent 50%)" } } } }, textarea: { root: { background: "{colors.background.bg-action}", disabledBackground: "{colors.background.bg-action-inactive}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{colors.border.border-action}", hoverBorderColor: "{colors.border.border-action-hover}", focusBorderColor: "{colors.border.border-brand}", invalidBorderColor: "{colors.border.border-error}", color: "{colors.text.text-primary}", disabledColor: "{colors.text.text-inactive}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } } }, tieredmenu: { root: { background: "{colors.background.bg-overlay}", borderColor: "{colors.border.border-overlay}", color: "{colors.text.text-primary}", borderRadius: "{content.border.radius}", shadow: "{overlay.navigation.shadow}", transitionDuration: "{transition.duration}" }, list: { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}" }, item: { focusBackground: "{component.dropdown.bg-hover}", activeBackground: "{component.dropdown.bg-hover}", color: "{colors.text.text-primary}", focusColor: "{colors.text.text-primary-hover}", activeColor: "{colors.text.text-primary-hover}", padding: "{navigation.item.padding}", borderRadius: "{navigation.item.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{colors.icon.icon-secondary}", focusColor: "{colors.icon.icon-secondary-hover}", activeColor: "{colors.icon.icon-secondary-hover}" } }, submenu: { mobileIndent: "1rem" }, submenuIcon: { size: "{navigation.submenu.icon.size}", color: "{colors.icon.icon-secondary}", focusColor: "{colors.icon.icon-secondary-hover}", activeColor: "{colors.icon.icon-secondary-hover}" }, separator: { borderColor: "{component.dropdown.divider}" } }, tag: { root: { fontSize: "0.875rem", fontWeight: "700", padding: "0.25rem 0.5rem", gap: "0.25rem", borderRadius: "{content.border.radius}", roundedBorderRadius: "{border.radius.xl}" }, icon: { size: "0.75rem" }, colorScheme: { light: { primary: { background: "{primary.100}", color: "{primary.700}" }, secondary: { background: "{surface.100}", color: "{surface.600}" }, success: { background: "{green.100}", color: "{green.700}" }, info: { background: "{sky.100}", color: "{sky.700}" }, warn: { background: "{orange.100}", color: "{orange.700}" }, danger: { background: "{red.100}", color: "{red.700}" }, contrast: { background: "{surface.950}", color: "{surface.0}" } }, dark: { primary: { background: "color-mix(in srgb, {primary.500}, transparent 84%)", color: "{primary.300}" }, secondary: { background: "{surface.800}", color: "{surface.300}" }, success: { background: "color-mix(in srgb, {green.500}, transparent 84%)", color: "{green.300}" }, info: { background: "color-mix(in srgb, {sky.500}, transparent 84%)", color: "{sky.300}" }, warn: { background: "color-mix(in srgb, {orange.500}, transparent 84%)", color: "{orange.300}" }, danger: { background: "color-mix(in srgb, {red.500}, transparent 84%)", color: "{red.300}" }, contrast: { background: "{surface.0}", color: "{surface.950}" } } } }, terminal: { root: { background: "{form.field.background}", borderColor: "{form.field.border.color}", color: "{form.field.color}", height: "18rem", padding: "{form.field.padding.y} {form.field.padding.x}", borderRadius: "{form.field.border.radius}" }, prompt: { gap: "0.25rem" }, commandResponse: { margin: "2px 0" } }, timeline: { event: { minHeight: "5rem" }, horizontal: { eventContent: { padding: "1rem 0" } }, vertical: { eventContent: { padding: "0 1rem" } }, eventMarker: { size: "1.125rem", borderRadius: "50%", borderWidth: "2px", background: "{content.background}", borderColor: "{content.border.color}", content: { borderRadius: "50%", size: "0.375rem", background: "{primary.color}", insetShadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.06), 0px 1px 1px 0px rgba(0, 0, 0, 0.12)" } }, eventConnector: { color: "{content.border.color}", size: "2px" } }, togglebutton: { root: { padding: "0.25rem", borderRadius: "{content.border.radius}", gap: "0.5rem", fontWeight: "500", disabledBackground: "{form.field.disabled.background}", disabledBorderColor: "{form.field.disabled.background}", disabledColor: "{form.field.disabled.color}", invalidBorderColor: "{form.field.invalid.border.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", padding: "0.25rem" }, lg: { fontSize: "{form.field.lg.font.size}", padding: "0.25rem" } }, icon: { disabledColor: "{form.field.disabled.color}" }, content: { padding: "0.25rem 0.75rem", borderRadius: "{content.border.radius}", checkedShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.02), 0px 1px 2px 0px rgba(0, 0, 0, 0.04)", sm: { padding: "0.25rem 0.75rem" }, lg: { padding: "0.25rem 0.75rem" } }, colorScheme: { light: { root: { background: "{component.segment.bg-selection}", checkedBackground: "{component.segment.bg-selection}", hoverBackground: "{component.segment.bg-selection}", borderColor: "{component.segment.bg-selection}", color: "{component.segment.text}", hoverColor: "{colors.text.text-primary}", checkedColor: "{colors.text.text-primary}", checkedBorderColor: "{component.segment.bg-selection}" }, content: { checkedBackground: "{component.segment.bg-selection-active}" }, icon: { color: "{component.segment.text}", hoverColor: "{colors.text.text-primary}", checkedColor: "{colors.text.text-primary}" } }, dark: { root: { background: "{component.segment.bg-selection}", checkedBackground: "{component.segment.bg-selection}", hoverBackground: "{component.segment.bg-selection}", borderColor: "{component.segment.bg-selection}", color: "{component.segment.text}", hoverColor: "{colors.text.text-secondary}", checkedColor: "{colors.text.text-primary}", checkedBorderColor: "{component.segment.bg-selection}" }, content: { checkedBackground: "{component.segment.bg-selection-active}" }, icon: { color: "{component.segment.text}", hoverColor: "{colors.text.text-secondary}", checkedColor: "{colors.text.text-primary}" } } } }, toggleswitch: { root: { width: "2.5rem", height: "1.5rem", borderRadius: "30px", gap: "0.25rem", shadow: "{form.field.shadow}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, borderWidth: "1px", borderColor: "transparent", hoverBorderColor: "transparent", checkedBorderColor: "transparent", checkedHoverBorderColor: "transparent", invalidBorderColor: "{form.field.invalid.border.color}", transitionDuration: "{form.field.transition.duration}", slideDuration: "0.2s" }, handle: { borderRadius: "50%", size: "1rem" }, colorScheme: { light: { root: { background: "{component.switch.bg-off}", disabledBackground: "{component.switch.bg-off-inactive}", hoverBackground: "{component.switch.bg-off}", checkedBackground: "{component.switch.bg-on}", checkedHoverBackground: "{component.switch.bg-on}" }, handle: { background: "{component.checker.bg}", disabledBackground: "{component.switch.dot-off-inactive}", hoverBackground: "{component.checker.bg}", checkedBackground: "{component.switch.dot}", checkedHoverBackground: "{component.switch.dot}", color: "{text.muted.color}", hoverColor: "{text.color}", checkedColor: "{primary.color}", checkedHoverColor: "{primary.hover.color}" } }, dark: { root: { background: "{component.switch.bg-off}", disabledBackground: "{component.switch.bg-off-inactive}", hoverBackground: "{component.switch.bg-off}", checkedBackground: "{component.switch.bg-on}", checkedHoverBackground: "{component.switch.bg-on}" }, handle: { background: "{component.checker.bg}", disabledBackground: "{component.switch.dot-off-inactive}", hoverBackground: "{component.checker.bg}", checkedBackground: "{component.switch.dot}", checkedHoverBackground: "{component.switch.dot}", color: "{surface.900}", hoverColor: "{surface.800}", checkedColor: "{primary.color}", checkedHoverColor: "{primary.hover.color}" } } } }, tree: { root: { background: "{content.background}", color: "{content.color}", padding: "1rem", gap: "2px", indent: "1rem", transitionDuration: "{transition.duration}" }, node: { padding: "0.25rem 0.5rem", borderRadius: "{content.border.radius}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", color: "{text.color}", hoverColor: "{text.hover.color}", selectedColor: "{highlight.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" }, gap: "0.25rem" }, nodeIcon: { color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", selectedColor: "{highlight.color}" }, nodeToggleButton: { borderRadius: "50%", size: "1.75rem", hoverBackground: "{content.hover.background}", selectedHoverBackground: "{content.background}", color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", selectedHoverColor: "{primary.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, loadingIcon: { size: "2rem" }, filter: { margin: "0 0 0.5rem 0" } }, treeselect: { root: { background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } }, dropdown: { width: "2.5rem", color: "{form.field.icon.color}" }, overlay: { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}" }, tree: { padding: "{list.padding}" }, emptyMessage: { padding: "{list.option.padding}" }, chip: { borderRadius: "{border.radius.sm}" }, clearIcon: { color: "{form.field.icon.color}" } }, treetable: { root: { transitionDuration: "{transition.duration}" }, header: { background: "{content.background}", borderColor: "{treetable.border.color}", color: "{content.color}", borderWidth: "0 0 1px 0", padding: "0.75rem 1rem" }, headerCell: { background: "{content.background}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", borderColor: "{treetable.border.color}", color: "{content.color}", hoverColor: "{content.hover.color}", selectedColor: "{highlight.color}", gap: "0.5rem", padding: "0.75rem 1rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" } }, columnTitle: { fontWeight: "600" }, row: { background: "{content.background}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", color: "{content.color}", hoverColor: "{content.hover.color}", selectedColor: "{highlight.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" } }, bodyCell: { borderColor: "{treetable.border.color}", padding: "0.75rem 1rem", gap: "0.5rem" }, footerCell: { background: "{content.background}", borderColor: "{treetable.border.color}", color: "{content.color}", padding: "0.75rem 1rem" }, columnFooter: { fontWeight: "600" }, footer: { background: "{content.background}", borderColor: "{treetable.border.color}", color: "{content.color}", borderWidth: "0 0 1px 0", padding: "0.75rem 1rem" }, columnResizer: { width: "0.5rem" }, resizeIndicator: { width: "1px", color: "{primary.color}" }, sortIcon: { color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", size: "0.875rem" }, loadingIcon: { size: "2rem" }, nodeToggleButton: { hoverBackground: "{content.hover.background}", selectedHoverBackground: "{content.background}", color: "{text.muted.color}", hoverColor: "{text.color}", selectedHoverColor: "{primary.color}", size: "1.75rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } }, paginatorTop: { borderColor: "{content.border.color}", borderWidth: "0 0 1px 0" }, paginatorBottom: { borderColor: "{content.border.color}", borderWidth: "0 0 1px 0" }, colorScheme: { light: { root: { borderColor: "{content.border.color}" }, bodyCell: { selectedBorderColor: "{primary.100}" } }, dark: { root: { borderColor: "{surface.800}" }, bodyCell: { selectedBorderColor: "{primary.900}" } } } }, toast: { root: { width: "25rem", borderRadius: "{content.border.radius}", borderWidth: "1px", transitionDuration: "{transition.duration}" }, icon: { size: "1.125rem" }, content: { padding: "{overlay.popover.padding}", gap: "0.5rem" }, text: { gap: "0.5rem" }, summary: { fontWeight: "500", fontSize: "1rem" }, detail: { fontWeight: "500", fontSize: "0.875rem" }, closeButton: { width: "1.75rem", height: "1.75rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", offset: "{focus.ring.offset}" } }, closeIcon: { size: "1rem" }, colorScheme: { light: { root: { blur: "3px" }, info: { background: "color-mix(in srgb, {blue.50}, transparent 5%)", borderColor: "{blue.200}", color: "{blue.600}", detailColor: "{surface.700}", shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)", closeButton: { hoverBackground: "{blue.100}", focusRing: { color: "{blue.600}", shadow: "none" } } }, success: { background: "color-mix(in srgb, {green.50}, transparent 5%)", borderColor: "{green.200}", color: "{green.600}", detailColor: "{surface.700}", shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)", closeButton: { hoverBackground: "{green.100}", focusRing: { color: "{green.600}", shadow: "none" } } }, warn: { background: "color-mix(in srgb,{yellow.50}, transparent 5%)", borderColor: "{yellow.200}", color: "{yellow.600}", detailColor: "{surface.700}", shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)", closeButton: { hoverBackground: "{yellow.100}", focusRing: { color: "{yellow.600}", shadow: "none" } } }, error: { background: "color-mix(in srgb, {red.50}, transparent 5%)", borderColor: "{red.200}", color: "{red.600}", detailColor: "{surface.700}", shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)", closeButton: { hoverBackground: "{red.100}", focusRing: { color: "{red.600}", shadow: "none" } } }, secondary: { background: "{surface.100}", borderColor: "{surface.200}", color: "{surface.600}", detailColor: "{surface.700}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)", closeButton: { hoverBackground: "{surface.200}", focusRing: { color: "{surface.600}", shadow: "none" } } }, contrast: { background: "{surface.900}", borderColor: "{surface.950}", color: "{surface.50}", detailColor: "{surface.0}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)", closeButton: { hoverBackground: "{surface.800}", focusRing: { color: "{surface.50}", shadow: "none" } } } }, dark: { root: { blur: "10px" }, info: { background: "color-mix(in srgb, {blue.500}, transparent 84%)", borderColor: "color-mix(in srgb, {blue.700}, transparent 64%)", color: "{blue.500}", detailColor: "{surface.0}", shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)", closeButton: { hoverBackground: "rgba(255, 255, 255, 0.05)", focusRing: { color: "{blue.500}", shadow: "none" } } }, success: { background: "color-mix(in srgb, {green.500}, transparent 84%)", borderColor: "color-mix(in srgb, {green.700}, transparent 64%)", color: "{green.500}", detailColor: "{surface.0}", shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)", closeButton: { hoverBackground: "rgba(255, 255, 255, 0.05)", focusRing: { color: "{green.500}", shadow: "none" } } }, warn: { background: "color-mix(in srgb, {yellow.500}, transparent 84%)", borderColor: "color-mix(in srgb, {yellow.700}, transparent 64%)", color: "{yellow.500}", detailColor: "{surface.0}", shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)", closeButton: { hoverBackground: "rgba(255, 255, 255, 0.05)", focusRing: { color: "{yellow.500}", shadow: "none" } } }, error: { background: "color-mix(in srgb, {red.500}, transparent 84%)", borderColor: "color-mix(in srgb, {red.700}, transparent 64%)", color: "{red.500}", detailColor: "{surface.0}", shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)", closeButton: { hoverBackground: "rgba(255, 255, 255, 0.05)", focusRing: { color: "{red.500}", shadow: "none" } } }, secondary: { background: "{surface.800}", borderColor: "{surface.700}", color: "{surface.300}", detailColor: "{surface.0}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)", closeButton: { hoverBackground: "{surface.700}", focusRing: { color: "{surface.300}", shadow: "none" } } }, contrast: { background: "{surface.0}", borderColor: "{surface.100}", color: "{surface.950}", detailColor: "{surface.950}", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)", closeButton: { hoverBackground: "{surface.100}", focusRing: { color: "{surface.950}", shadow: "none" } } } } } }, toolbar: { root: { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", color: "{content.color}", gap: "0.5rem", padding: "0.75rem" } }, tooltip: { root: { maxWidth: "12.5rem", gutter: "0.25rem", shadow: "{overlay.popover.shadow}", padding: "0.5rem 0.75rem", borderRadius: "{overlay.popover.border.radius}" }, colorScheme: { light: { root: { background: "{surface.700}", color: "{surface.0}" } }, dark: { root: { background: "{surface.700}", color: "{surface.0}" } } } }, virtualscroller: { loader: { mask: { background: "{content.background}", color: "{text.muted.color}" }, icon: { size: "2rem" } } } };
var Me = { primitive: { ...De, ...a }, semantic: Ae, components: je };
var Ne = t.extend({ name: "accordiontab" });
var Pe = t.extend({ name: "animateonscroll-directive" });
var Fe = t.extend({ name: "autocomplete", style: `
    .p-autocomplete {
        display: inline-flex;
    }

    .p-autocomplete-loader {
        position: absolute;
        top: 50%;
        margin-top: -0.5rem;
        inset-inline-end: dt('autocomplete.padding.x');
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-loader {
        inset-inline-end: calc(dt('autocomplete.dropdown.width') + dt('autocomplete.padding.x'));
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-input {
        flex: 1 1 auto;
        width: 1%;
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-input,
    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-input-multiple {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
    }

    .p-autocomplete-dropdown {
        cursor: pointer;
        display: inline-flex;
        user-select: none;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        width: dt('autocomplete.dropdown.width');
        border-start-end-radius: dt('autocomplete.dropdown.border.radius');
        border-end-end-radius: dt('autocomplete.dropdown.border.radius');
        background: dt('autocomplete.dropdown.background');
        border: 1px solid dt('autocomplete.dropdown.border.color');
        border-inline-start: 0 none;
        color: dt('autocomplete.dropdown.color');
        transition:
            background dt('autocomplete.transition.duration'),
            color dt('autocomplete.transition.duration'),
            border-color dt('autocomplete.transition.duration'),
            outline-color dt('autocomplete.transition.duration'),
            box-shadow dt('autocomplete.transition.duration');
        outline-color: transparent;
    }

    .p-autocomplete-dropdown:not(:disabled):hover {
        background: dt('autocomplete.dropdown.hover.background');
        border-color: dt('autocomplete.dropdown.hover.border.color');
        color: dt('autocomplete.dropdown.hover.color');
    }

    .p-autocomplete-dropdown:not(:disabled):active {
        background: dt('autocomplete.dropdown.active.background');
        border-color: dt('autocomplete.dropdown.active.border.color');
        color: dt('autocomplete.dropdown.active.color');
    }

    .p-autocomplete-dropdown:focus-visible {
        box-shadow: dt('autocomplete.dropdown.focus.ring.shadow');
        outline: dt('autocomplete.dropdown.focus.ring.width') dt('autocomplete.dropdown.focus.ring.style') dt('autocomplete.dropdown.focus.ring.color');
        outline-offset: dt('autocomplete.dropdown.focus.ring.offset');
    }

    .p-autocomplete-overlay {
        position: absolute;
        top: 0;
        left: 0;
        background: dt('autocomplete.overlay.background');
        color: dt('autocomplete.overlay.color');
        border: 1px solid dt('autocomplete.overlay.border.color');
        border-radius: dt('autocomplete.overlay.border.radius');
        box-shadow: dt('autocomplete.overlay.shadow');
        min-width: 100%;
    }

    .p-autocomplete-list-container {
        overflow: auto;
    }

    .p-autocomplete-list {
        margin: 0;
        list-style-type: none;
        display: flex;
        flex-direction: column;
        gap: dt('autocomplete.list.gap');
        padding: dt('autocomplete.list.padding');
    }

    .p-autocomplete-option {
        cursor: pointer;
        white-space: nowrap;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        padding: dt('autocomplete.option.padding');
        border: 0 none;
        color: dt('autocomplete.option.color');
        background: transparent;
        transition:
            background dt('autocomplete.transition.duration'),
            color dt('autocomplete.transition.duration'),
            border-color dt('autocomplete.transition.duration');
        border-radius: dt('autocomplete.option.border.radius');
    }

    .p-autocomplete-option:not(.p-autocomplete-option-selected):not(.p-disabled).p-focus {
        background: dt('autocomplete.option.focus.background');
        color: dt('autocomplete.option.focus.color');
    }

    .p-autocomplete-option:not(.p-autocomplete-option-selected):not(.p-disabled):hover {
        background: dt('autocomplete.option.focus.background');
        color: dt('autocomplete.option.focus.color');
    }

    .p-autocomplete-option-selected {
        background: dt('autocomplete.option.selected.background');
        color: dt('autocomplete.option.selected.color');
    }

    .p-autocomplete-option-selected.p-focus {
        background: dt('autocomplete.option.selected.focus.background');
        color: dt('autocomplete.option.selected.focus.color');
    }

    .p-autocomplete-option-group {
        margin: 0;
        padding: dt('autocomplete.option.group.padding');
        color: dt('autocomplete.option.group.color');
        background: dt('autocomplete.option.group.background');
        font-weight: dt('autocomplete.option.group.font.weight');
    }

    .p-autocomplete-input-multiple {
        margin: 0;
        list-style-type: none;
        cursor: text;
        overflow: hidden;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        padding: calc(dt('autocomplete.padding.y') / 2) dt('autocomplete.padding.x');
        gap: calc(dt('autocomplete.padding.y') / 2);
        color: dt('autocomplete.color');
        background: dt('autocomplete.background');
        border: 1px solid dt('autocomplete.border.color');
        border-radius: dt('autocomplete.border.radius');
        width: 100%;
        transition:
            background dt('autocomplete.transition.duration'),
            color dt('autocomplete.transition.duration'),
            border-color dt('autocomplete.transition.duration'),
            outline-color dt('autocomplete.transition.duration'),
            box-shadow dt('autocomplete.transition.duration');
        outline-color: transparent;
        box-shadow: dt('autocomplete.shadow');
    }

    .p-autocomplete-input-multiple.p-disabled {
        opacity: 1;
        background: dt('autocomplete.disabled.background');
        color: dt('autocomplete.disabled.color');
    }

    .p-autocomplete-input-multiple:not(.p-disabled):hover {
        border-color: dt('autocomplete.hover.border.color');
    }

    .p-autocomplete.p-focus .p-autocomplete-input-multiple:not(.p-disabled) {
        border-color: dt('autocomplete.focus.border.color');
        box-shadow: dt('autocomplete.focus.ring.shadow');
        outline: dt('autocomplete.focus.ring.width') dt('autocomplete.focus.ring.style') dt('autocomplete.focus.ring.color');
        outline-offset: dt('autocomplete.focus.ring.offset');
    }

    .p-autocomplete.p-invalid .p-autocomplete-input-multiple {
        border-color: dt('autocomplete.invalid.border.color');
    }

    .p-variant-filled.p-autocomplete-input-multiple {
        background: dt('autocomplete.filled.background');
    }

    .p-autocomplete-input-multiple.p-variant-filled:not(.p-disabled):hover {
        background: dt('autocomplete.filled.hover.background');
    }

    .p-autocomplete.p-focus .p-autocomplete-input-multiple.p-variant-filled:not(.p-disabled) {
        background: dt('autocomplete.filled.focus.background');
    }

    .p-autocomplete-chip.p-chip {
        padding-block-start: calc(dt('autocomplete.padding.y') / 2);
        padding-block-end: calc(dt('autocomplete.padding.y') / 2);
        border-radius: dt('autocomplete.chip.border.radius');
    }

    .p-autocomplete-input-multiple:has(.p-autocomplete-chip) {
        padding-inline-start: calc(dt('autocomplete.padding.y') / 2);
        padding-inline-end: calc(dt('autocomplete.padding.y') / 2);
    }

    .p-autocomplete-chip-item.p-focus .p-autocomplete-chip {
        background: dt('autocomplete.chip.focus.background');
        color: dt('autocomplete.chip.focus.color');
    }

    .p-autocomplete-input-chip {
        flex: 1 1 auto;
        display: inline-flex;
        padding-block-start: calc(dt('autocomplete.padding.y') / 2);
        padding-block-end: calc(dt('autocomplete.padding.y') / 2);
    }

    .p-autocomplete-input-chip input {
        border: 0 none;
        outline: 0 none;
        background: transparent;
        margin: 0;
        padding: 0;
        box-shadow: none;
        border-radius: 0;
        width: 100%;
        font-family: inherit;
        font-feature-settings: inherit;
        font-size: 1rem;
        color: inherit;
    }

    .p-autocomplete-input-chip input::placeholder {
        color: dt('autocomplete.placeholder.color');
    }

    .p-autocomplete.p-invalid .p-autocomplete-input-chip input::placeholder {
        color: dt('autocomplete.invalid.placeholder.color');
    }

    .p-autocomplete-empty-message {
        padding: dt('autocomplete.empty.message.padding');
    }

    .p-autocomplete-fluid {
        display: flex;
    }

    .p-autocomplete-fluid:has(.p-autocomplete-dropdown) .p-autocomplete-input {
        width: 1%;
    }

    .p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-dropdown {
        width: dt('autocomplete.dropdown.sm.width');
    }

    .p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-dropdown .p-icon {
        font-size: dt('form.field.sm.font.size');
        width: dt('form.field.sm.font.size');
        height: dt('form.field.sm.font.size');
    }

    .p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-dropdown {
        width: dt('autocomplete.dropdown.lg.width');
    }

    .p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-dropdown .p-icon {
        font-size: dt('form.field.lg.font.size');
        width: dt('form.field.lg.font.size');
        height: dt('form.field.lg.font.size');
    }

    .p-autocomplete-clear-icon {
        position: absolute;
        top: 50%;
        margin-top: -0.5rem;
        cursor: pointer;
        color: dt('form.field.icon.color');
        inset-inline-end: dt('autocomplete.padding.x');
    }

    .p-autocomplete:has(.p-autocomplete-dropdown) .p-autocomplete-clear-icon {
        inset-inline-end: calc(dt('autocomplete.padding.x') + dt('autocomplete.dropdown.width'));
    }

    .p-autocomplete:has(.p-autocomplete-clear-icon) .p-autocomplete-input {
        padding-inline-end: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));
    }

    .p-inputgroup .p-autocomplete-dropdown {
        border-radius: 0;
    }

    .p-inputgroup > .p-autocomplete:last-child:has(.p-autocomplete-dropdown) > .p-autocomplete-input {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
    }

    .p-inputgroup > .p-autocomplete:last-child .p-autocomplete-dropdown {
        border-start-end-radius: dt('autocomplete.dropdown.border.radius');
        border-end-end-radius: dt('autocomplete.dropdown.border.radius');
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance;
  return ["p-autocomplete p-component p-inputwrapper", { "p-invalid": t2.$invalid, "p-focus": t2.focused, "p-inputwrapper-filled": t2.$filled || n(t2.inputValue), "p-inputwrapper-focus": t2.focused, "p-autocomplete-open": t2.overlayVisible, "p-autocomplete-fluid": t2.$fluid, "p-autocomplete-clearable": t2.isClearIconVisible }];
}, pcInputText: "p-autocomplete-input", inputMultiple: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-autocomplete-input-multiple", { "p-variant-filled": t2.$variant === "filled", "p-disabled": n2.disabled }];
}, clearIcon: "p-autocomplete-clear-icon", chipItem: function(e2) {
  var t2 = e2.instance, n2 = e2.i;
  return ["p-autocomplete-chip-item", { "p-focus": t2.focusedMultipleOptionIndex === n2 }];
}, pcChip: "p-autocomplete-chip", chipIcon: "p-autocomplete-chip-icon", inputChip: "p-autocomplete-input-chip", loader: "p-autocomplete-loader", dropdown: "p-autocomplete-dropdown", overlay: "p-autocomplete-overlay p-component", listContainer: "p-autocomplete-list-container", list: "p-autocomplete-list", optionGroup: "p-autocomplete-option-group", option: function(e2) {
  var t2 = e2.instance, n2 = e2.option, r2 = e2.i, i2 = e2.getItemOptions;
  return ["p-autocomplete-option", { "p-autocomplete-option-selected": t2.isSelected(n2), "p-focus": t2.focusedOptionIndex === t2.getOptionIndex(r2, i2), "p-disabled": t2.isOptionDisabled(n2) }];
}, emptyMessage: "p-autocomplete-empty-message" }, inlineStyles: { root: { position: "relative" } } });
var Ie = t.extend({ name: "avatar", style: `
    .p-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: dt('avatar.width');
        height: dt('avatar.height');
        font-size: dt('avatar.font.size');
        background: dt('avatar.background');
        color: dt('avatar.color');
        border-radius: dt('avatar.border.radius');
    }

    .p-avatar-image {
        background: transparent;
    }

    .p-avatar-circle {
        border-radius: 50%;
    }

    .p-avatar-circle img {
        border-radius: 50%;
    }

    .p-avatar-icon {
        font-size: dt('avatar.icon.size');
        width: dt('avatar.icon.size');
        height: dt('avatar.icon.size');
    }

    .p-avatar img {
        width: 100%;
        height: 100%;
    }

    .p-avatar-lg {
        width: dt('avatar.lg.width');
        height: dt('avatar.lg.width');
        font-size: dt('avatar.lg.font.size');
    }

    .p-avatar-lg .p-avatar-icon {
        font-size: dt('avatar.lg.icon.size');
        width: dt('avatar.lg.icon.size');
        height: dt('avatar.lg.icon.size');
    }

    .p-avatar-xl {
        width: dt('avatar.xl.width');
        height: dt('avatar.xl.width');
        font-size: dt('avatar.xl.font.size');
    }

    .p-avatar-xl .p-avatar-icon {
        font-size: dt('avatar.xl.icon.size');
        width: dt('avatar.xl.icon.size');
        height: dt('avatar.xl.icon.size');
    }

    .p-avatar-group {
        display: flex;
        align-items: center;
    }

    .p-avatar-group .p-avatar + .p-avatar {
        margin-inline-start: dt('avatar.group.offset');
    }

    .p-avatar-group .p-avatar {
        border: 2px solid dt('avatar.group.border.color');
    }

    .p-avatar-group .p-avatar-lg + .p-avatar-lg {
        margin-inline-start: dt('avatar.lg.group.offset');
    }

    .p-avatar-group .p-avatar-xl + .p-avatar-xl {
        margin-inline-start: dt('avatar.xl.group.offset');
    }
`, classes: { root: function(e2) {
  var t2 = e2.props;
  return ["p-avatar p-component", { "p-avatar-image": t2.image != null, "p-avatar-circle": t2.shape === "circle", "p-avatar-lg": t2.size === "large", "p-avatar-xl": t2.size === "xlarge" }];
}, label: "p-avatar-label", icon: "p-avatar-icon" } });
var Le = t.extend({ name: "avatargroup", classes: { root: "p-avatar-group p-component" } });
var Re = t.extend({ name: "badge-directive", classes: { root: "p-badge p-component" } });
var Y = t.extend({ name: "blockui", style: `
    .p-blockui {
        position: relative;
    }

    .p-blockui-mask {
        border-radius: dt('blockui.border.radius');
    }

    .p-blockui-mask.p-overlay-mask {
        position: absolute;
    }

    .p-blockui-mask-document.p-overlay-mask {
        position: fixed;
    }
`, classes: { root: "p-blockui" } });
var ze = t.extend({ name: "breadcrumb", style: `
    .p-breadcrumb {
        background: dt('breadcrumb.background');
        padding: dt('breadcrumb.padding');
        overflow-x: auto;
    }

    .p-breadcrumb-list {
        margin: 0;
        padding: 0;
        list-style-type: none;
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        gap: dt('breadcrumb.gap');
    }

    .p-breadcrumb-separator {
        display: flex;
        align-items: center;
        color: dt('breadcrumb.separator.color');
    }

    .p-breadcrumb-separator-icon:dir(rtl) {
        transform: rotate(180deg);
    }

    .p-breadcrumb::-webkit-scrollbar {
        display: none;
    }

    .p-breadcrumb-item-link {
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: dt('breadcrumb.item.gap');
        transition:
            background dt('breadcrumb.transition.duration'),
            color dt('breadcrumb.transition.duration'),
            outline-color dt('breadcrumb.transition.duration'),
            box-shadow dt('breadcrumb.transition.duration');
        border-radius: dt('breadcrumb.item.border.radius');
        outline-color: transparent;
        color: dt('breadcrumb.item.color');
    }

    .p-breadcrumb-item-link:focus-visible {
        box-shadow: dt('breadcrumb.item.focus.ring.shadow');
        outline: dt('breadcrumb.item.focus.ring.width') dt('breadcrumb.item.focus.ring.style') dt('breadcrumb.item.focus.ring.color');
        outline-offset: dt('breadcrumb.item.focus.ring.offset');
    }

    .p-breadcrumb-item-link:hover .p-breadcrumb-item-label {
        color: dt('breadcrumb.item.hover.color');
    }

    .p-breadcrumb-item-label {
        transition: inherit;
    }

    .p-breadcrumb-item-icon {
        color: dt('breadcrumb.item.icon.color');
        transition: inherit;
    }

    .p-breadcrumb-item-link:hover .p-breadcrumb-item-icon {
        color: dt('breadcrumb.item.icon.hover.color');
    }
`, classes: { root: "p-breadcrumb p-component", list: "p-breadcrumb-list", homeItem: "p-breadcrumb-home-item", separator: "p-breadcrumb-separator", separatorIcon: "p-breadcrumb-separator-icon", item: function(e2) {
  return ["p-breadcrumb-item", { "p-disabled": e2.instance.disabled() }];
}, itemLink: "p-breadcrumb-item-link", itemIcon: "p-breadcrumb-item-icon", itemLabel: "p-breadcrumb-item-label" } });
var Be = t.extend({ name: "buttongroup", style: `
    .p-buttongroup {
        display: inline-flex;
    }

    .p-buttongroup .p-button {
        margin: 0;
    }

    .p-buttongroup .p-button:not(:last-child),
    .p-buttongroup .p-button:not(:last-child):hover {
        border-inline-end: 0 none;
    }

    .p-buttongroup .p-button:not(:first-of-type):not(:last-of-type) {
        border-radius: 0;
    }

    .p-buttongroup .p-button:first-of-type:not(:only-of-type) {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
    }

    .p-buttongroup .p-button:last-of-type:not(:only-of-type) {
        border-start-start-radius: 0;
        border-end-start-radius: 0;
    }

    .p-buttongroup .p-button:focus {
        position: relative;
        z-index: 1;
    }
`, classes: { root: "p-buttongroup p-component" } });
var Ve = t.extend({ name: "calendar" });
var He = t.extend({ name: "carousel", style: `
    .p-carousel {
        display: flex;
        flex-direction: column;
    }

    .p-carousel-content-container {
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    .p-carousel-content {
        display: flex;
        flex-direction: row;
        gap: dt('carousel.content.gap');
    }

    .p-carousel-content:dir(rtl) {
        flex-direction: row-reverse;
    }

    .p-carousel-viewport {
        overflow: hidden;
        width: 100%;
    }

    .p-carousel-item-list {
        display: flex;
        flex-direction: row;
    }

    .p-carousel-item-list:dir(rtl) {
        flex-direction: row-reverse;
    }

    .p-carousel-prev-button,
    .p-carousel-next-button {
        align-self: center;
        flex-shrink: 0;
    }

    .p-carousel-indicator-list {
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
        padding: dt('carousel.indicator.list.padding');
        gap: dt('carousel.indicator.list.gap');
        margin: 0;
        list-style: none;
    }

    .p-carousel-indicator-button {
        display: flex;
        align-items: center;
        justify-content: center;
        background: dt('carousel.indicator.background');
        width: dt('carousel.indicator.width');
        height: dt('carousel.indicator.height');
        border: 0 none;
        transition:
            background dt('carousel.transition.duration'),
            color dt('carousel.transition.duration'),
            outline-color dt('carousel.transition.duration'),
            box-shadow dt('carousel.transition.duration');
        outline-color: transparent;
        border-radius: dt('carousel.indicator.border.radius');
        padding: 0;
        margin: 0;
        user-select: none;
        cursor: pointer;
    }

    .p-carousel-indicator-button:focus-visible {
        box-shadow: dt('carousel.indicator.focus.ring.shadow');
        outline: dt('carousel.indicator.focus.ring.width') dt('carousel.indicator.focus.ring.style') dt('carousel.indicator.focus.ring.color');
        outline-offset: dt('carousel.indicator.focus.ring.offset');
    }

    .p-carousel-indicator-button:hover {
        background: dt('carousel.indicator.hover.background');
    }

    .p-carousel-indicator-active .p-carousel-indicator-button {
        background: dt('carousel.indicator.active.background');
    }

    .p-carousel-vertical .p-carousel-content {
        flex-direction: column;
    }

    .p-carousel-vertical .p-carousel-item-list {
        flex-direction: column;
        height: 100%;
    }

    .p-items-hidden .p-carousel-item {
        visibility: hidden;
    }

    .p-items-hidden .p-carousel-item.p-carousel-item-active {
        visibility: visible;
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance;
  return ["p-carousel p-component", { "p-carousel-vertical": t2.isVertical(), "p-carousel-horizontal": !t2.isVertical() }];
}, header: "p-carousel-header", contentContainer: "p-carousel-content-container", content: "p-carousel-content", pcPrevButton: function(e2) {
  return ["p-carousel-prev-button", { "p-disabled": e2.instance.backwardIsDisabled }];
}, viewport: "p-carousel-viewport", itemList: "p-carousel-item-list", itemClone: function(e2) {
  var t2 = e2.index, n2 = e2.value, r2 = e2.totalShiftedItems, i2 = e2.d_numVisible;
  return ["p-carousel-item p-carousel-item-clone", { "p-carousel-item-active": r2 * -1 === n2.length + i2, "p-carousel-item-start": t2 === 0, "p-carousel-item-end": n2.slice(-1 * i2).length - 1 === t2 }];
}, item: function(e2) {
  var t2 = e2.instance, n2 = e2.index;
  return ["p-carousel-item", { "p-carousel-item-active": t2.firstIndex() <= n2 && t2.lastIndex() >= n2, "p-carousel-item-start": t2.firstIndex() === n2, "p-carousel-item-end": t2.lastIndex() === n2 }];
}, pcNextButton: function(e2) {
  return ["p-carousel-next-button", { "p-disabled": e2.instance.forwardIsDisabled }];
}, indicatorList: "p-carousel-indicator-list", indicator: function(e2) {
  var t2 = e2.instance, n2 = e2.index;
  return ["p-carousel-indicator", { "p-carousel-indicator-active": t2.d_page === n2 }];
}, indicatorButton: "p-carousel-indicator-button", footer: "p-carousel-footer" } });
var Ue = t.extend({ name: "cascadeselect", style: `
    .p-cascadeselect {
        display: inline-flex;
        cursor: pointer;
        position: relative;
        user-select: none;
        background: dt('cascadeselect.background');
        border: 1px solid dt('cascadeselect.border.color');
        transition:
            background dt('cascadeselect.transition.duration'),
            color dt('cascadeselect.transition.duration'),
            border-color dt('cascadeselect.transition.duration'),
            outline-color dt('cascadeselect.transition.duration'),
            box-shadow dt('cascadeselect.transition.duration');
        border-radius: dt('cascadeselect.border.radius');
        outline-color: transparent;
        box-shadow: dt('cascadeselect.shadow');
    }

    .p-cascadeselect:not(.p-disabled):hover {
        border-color: dt('cascadeselect.hover.border.color');
    }

    .p-cascadeselect:not(.p-disabled).p-focus {
        border-color: dt('cascadeselect.focus.border.color');
        box-shadow: dt('cascadeselect.focus.ring.shadow');
        outline: dt('cascadeselect.focus.ring.width') dt('cascadeselect.focus.ring.style') dt('cascadeselect.focus.ring.color');
        outline-offset: dt('cascadeselect.focus.ring.offset');
    }

    .p-cascadeselect.p-variant-filled {
        background: dt('cascadeselect.filled.background');
    }

    .p-cascadeselect.p-variant-filled:not(.p-disabled):hover {
        background: dt('cascadeselect.filled.hover.background');
    }

    .p-cascadeselect.p-variant-filled.p-focus {
        background: dt('cascadeselect.filled.focus.background');
    }

    .p-cascadeselect.p-invalid {
        border-color: dt('cascadeselect.invalid.border.color');
    }

    .p-cascadeselect.p-disabled {
        opacity: 1;
        background: dt('cascadeselect.disabled.background');
    }

    .p-cascadeselect-dropdown {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: transparent;
        color: dt('cascadeselect.dropdown.color');
        width: dt('cascadeselect.dropdown.width');
        border-start-end-radius: dt('border.radius.md');
        border-end-end-radius: dt('border.radius.md');
    }

    .p-cascadeselect-clear-icon {
        align-self: center;
        color: dt('cascadeselect.clear.icon.color');
        inset-inline-end: dt('cascadeselect.dropdown.width');
    }

    .p-cascadeselect-label {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        flex: 1 1 auto;
        width: 1%;
        text-overflow: ellipsis;
        cursor: pointer;
        padding: dt('cascadeselect.padding.y') dt('cascadeselect.padding.x');
        background: transparent;
        border: 0 none;
        outline: 0 none;
    }

    .p-cascadeselect-label.p-placeholder {
        color: dt('cascadeselect.placeholder.color');
    }

    .p-cascadeselect.p-invalid .p-cascadeselect-label.p-placeholder {
        color: dt('cascadeselect.invalid.placeholder.color');
    }

    .p-cascadeselect.p-disabled .p-cascadeselect-label {
        color: dt('cascadeselect.disabled.color');
    }

    .p-cascadeselect-label-empty {
        overflow: hidden;
        visibility: hidden;
    }

    .p-cascadeselect-overlay {
        background: dt('cascadeselect.overlay.background');
        color: dt('cascadeselect.overlay.color');
        border: 1px solid dt('cascadeselect.overlay.border.color');
        border-radius: dt('cascadeselect.overlay.border.radius');
        box-shadow: dt('cascadeselect.overlay.shadow');
    }

    .p-cascadeselect .p-cascadeselect-overlay {
        min-width: 100%;
    }

    .p-cascadeselect-option-list {
        display: none;
        min-width: 100%;
        position: absolute;
        z-index: 1;
    }

    .p-cascadeselect-list {
        min-width: 100%;
        margin: 0;
        padding: 0;
        list-style-type: none;
        padding: dt('cascadeselect.list.padding');
        display: flex;
        flex-direction: column;
        gap: dt('cascadeselect.list.gap');
    }

    .p-cascadeselect-option {
        cursor: pointer;
        font-weight: normal;
        white-space: nowrap;
        border: 0 none;
        color: dt('cascadeselect.option.color');
        background: transparent;
        border-radius: dt('cascadeselect.option.border.radius');
    }

    .p-cascadeselect-option-active {
        overflow: visible;
    }

    .p-cascadeselect-option-active > .p-cascadeselect-option-content {
        background: dt('cascadeselect.option.focus.background');
        color: dt('cascadeselect.option.focus.color');
    }

    .p-cascadeselect-option:not(.p-cascadeselect-option-selected):not(.p-disabled).p-focus > .p-cascadeselect-option-content {
        background: dt('cascadeselect.option.focus.background');
        color: dt('cascadeselect.option.focus.color');
    }

    .p-cascadeselect-option:not(.p-cascadeselect-option-selected):not(.p-disabled):hover > .p-cascadeselect-option-content {
        background: dt('cascadeselect.option.focus.background');
        color: dt('cascadeselect.option.focus.color');
    }

    .p-cascadeselect-option:not(.p-cascadeselect-option-selected):not(.p-disabled).p-focus > .p-cascadeselect-option-content > .p-cascadeselect-group-icon-container > .p-cascadeselect-group-icon {
        color: dt('cascadeselect.option.icon.focus.color');
    }

    .p-cascadeselect-option:not(.p-cascadeselect-option-selected):not(.p-disabled):hover > .p-cascadeselect-option-content > .p-cascadeselect-group-icon-container > .p-cascadeselect-group-icon {
        color: dt('cascadeselect.option.icon.focus.color');
    }

    .p-cascadeselect-option-selected > .p-cascadeselect-option-content {
        background: dt('cascadeselect.option.selected.background');
        color: dt('cascadeselect.option.selected.color');
    }

    .p-cascadeselect-option-selected.p-focus > .p-cascadeselect-option-content {
        background: dt('cascadeselect.option.selected.focus.background');
        color: dt('cascadeselect.option.selected.focus.color');
    }

    .p-cascadeselect-option-active > .p-cascadeselect-option-list {
        inset-inline-start: 100%;
        inset-block-start: 0;
    }

    .p-cascadeselect-option-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        overflow: hidden;
        position: relative;
        padding: dt('cascadeselect.option.padding');
        border-radius: dt('cascadeselect.option.border.radius');
        transition:
            background dt('cascadeselect.transition.duration'),
            color dt('cascadeselect.transition.duration'),
            border-color dt('cascadeselect.transition.duration'),
            box-shadow dt('cascadeselect.transition.duration'),
            outline-color dt('cascadeselect.transition.duration');
    }

    .p-cascadeselect-group-icon {
        font-size: dt('cascadeselect.option.icon.size');
        width: dt('cascadeselect.option.icon.size');
        height: dt('cascadeselect.option.icon.size');
        color: dt('cascadeselect.option.icon.color');
    }

    .p-cascadeselect-group-icon:dir(rtl) {
        transform: rotate(180deg);
    }

    .p-cascadeselect-mobile-active .p-cascadeselect-option-list {
        position: static;
        box-shadow: none;
        border: 0 none;
        padding-inline-start: dt('tieredmenu.submenu.mobile.indent');
        padding-inline-end: 0;
    }

    .p-cascadeselect-mobile-active .p-cascadeselect-group-icon {
        transition: transform 0.2s;
        transform: rotate(90deg);
    }

    .p-cascadeselect-mobile-active .p-cascadeselect-option-active > .p-cascadeselect-option-content .p-cascadeselect-group-icon {
        transform: rotate(-90deg);
    }

    .p-cascadeselect-sm .p-cascadeselect-label {
        font-size: dt('cascadeselect.sm.font.size');
        padding-block: dt('cascadeselect.sm.padding.y');
        padding-inline: dt('cascadeselect.sm.padding.x');
    }

    .p-cascadeselect-sm .p-cascadeselect-dropdown .p-icon {
        font-size: dt('cascadeselect.sm.font.size');
        width: dt('cascadeselect.sm.font.size');
        height: dt('cascadeselect.sm.font.size');
    }

    .p-cascadeselect-lg .p-cascadeselect-label {
        font-size: dt('cascadeselect.lg.font.size');
        padding-block: dt('cascadeselect.lg.padding.y');
        padding-inline: dt('cascadeselect.lg.padding.x');
    }

    .p-cascadeselect-lg .p-cascadeselect-dropdown .p-icon {
        font-size: dt('cascadeselect.lg.font.size');
        width: dt('cascadeselect.lg.font.size');
        height: dt('cascadeselect.lg.font.size');
    }

    .p-cascadeselect-fluid {
        display: flex;
    }

    .p-cascadeselect-fluid .p-cascadeselect-label {
        width: 1%;
    }

    .p-cascadeselect-fluid .p-cascadeselect-overlay .p-cascadeselect-overlay {
         min-width: 12.5rem;
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-cascadeselect p-component p-inputwrapper", { "p-cascadeselect-mobile": t2.queryMatches, "p-disabled": n2.disabled, "p-invalid": t2.$invalid, "p-variant-filled": t2.$variant === "filled", "p-focus": t2.focused, "p-inputwrapper-filled": t2.$filled, "p-inputwrapper-focus": t2.focused || t2.overlayVisible, "p-cascadeselect-open": t2.overlayVisible, "p-cascadeselect-fluid": t2.$fluid, "p-cascadeselect-sm p-inputfield-sm": n2.size === "small", "p-cascadeselect-lg p-inputfield-lg": n2.size === "large" }];
}, label: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-cascadeselect-label", { "p-placeholder": t2.label === n2.placeholder, "p-cascadeselect-label-empty": !t2.$slots.value && (t2.label === "p-emptylabel" || t2.label?.length === 0) }];
}, clearIcon: "p-cascadeselect-clear-icon", dropdown: "p-cascadeselect-dropdown", loadingIcon: "p-cascadeselect-loading-icon", dropdownIcon: "p-cascadeselect-dropdown-icon", overlay: function(e2) {
  return ["p-cascadeselect-overlay p-component", { "p-cascadeselect-mobile-active": e2.instance.queryMatches }];
}, listContainer: "p-cascadeselect-list-container", list: "p-cascadeselect-list", option: function(e2) {
  var t2 = e2.instance, n2 = e2.processedOption;
  return ["p-cascadeselect-option", { "p-cascadeselect-option-active": t2.isOptionActive(n2), "p-cascadeselect-option-selected": t2.isOptionSelected(n2), "p-focus": t2.isOptionFocused(n2), "p-disabled": t2.isOptionDisabled(n2) }];
}, optionContent: "p-cascadeselect-option-content", optionText: "p-cascadeselect-option-text", groupIconContainer: "p-cascadeselect-group-icon-container", groupIcon: "p-cascadeselect-group-icon", optionList: "p-cascadeselect-overlay p-cascadeselect-option-list" }, inlineStyles: { root: function(e2) {
  return { position: e2.props.appendTo === "self" ? "relative" : void 0 };
} } });
var We = t.extend({ name: "chart", classes: { root: "p-chart" }, inlineStyles: { root: { position: "relative" } } });
var Ge = t.extend({ name: "checkboxgroup", style: `
    .p-checkbox-group {
        display: inline-flex;
    }
`, classes: { root: "p-checkbox-group p-component" } });
var Ke = t.extend({ name: "chips" });
var qe = t.extend({ name: "colorpicker", style: `
    .p-colorpicker {
        display: inline-block;
        position: relative;
    }

    .p-colorpicker-dragging {
        cursor: pointer;
    }

    .p-colorpicker-preview {
        width: dt('colorpicker.preview.width');
        height: dt('colorpicker.preview.height');
        padding: 0;
        border: 0 none;
        border-radius: dt('colorpicker.preview.border.radius');
        transition:
            background dt('colorpicker.transition.duration'),
            color dt('colorpicker.transition.duration'),
            border-color dt('colorpicker.transition.duration'),
            outline-color dt('colorpicker.transition.duration'),
            box-shadow dt('colorpicker.transition.duration');
        outline-color: transparent;
        cursor: pointer;
    }

    .p-colorpicker-preview:enabled:focus-visible {
        border-color: dt('colorpicker.preview.focus.border.color');
        box-shadow: dt('colorpicker.preview.focus.ring.shadow');
        outline: dt('colorpicker.preview.focus.ring.width') dt('colorpicker.preview.focus.ring.style') dt('colorpicker.preview.focus.ring.color');
        outline-offset: dt('colorpicker.preview.focus.ring.offset');
    }

    .p-colorpicker-panel {
        background: dt('colorpicker.panel.background');
        border: 1px solid dt('colorpicker.panel.border.color');
        border-radius: dt('colorpicker.panel.border.radius');
        box-shadow: dt('colorpicker.panel.shadow');
        width: 193px;
        height: 166px;
        position: absolute;
        top: 0;
        left: 0;
    }

    .p-colorpicker-panel-inline {
        box-shadow: none;
        position: static;
    }

    .p-colorpicker-content {
        position: relative;
    }

    .p-colorpicker-color-selector {
        width: 150px;
        height: 150px;
        inset-block-start: 8px;
        inset-inline-start: 8px;
        position: absolute;
    }

    .p-colorpicker-color-background {
        width: 100%;
        height: 100%;
        background: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(to right, #fff 0%, rgba(255, 255, 255, 0) 100%);
    }

    .p-colorpicker-color-handle {
        position: absolute;
        inset-block-start: 0px;
        inset-inline-start: 150px;
        border-radius: 100%;
        width: 10px;
        height: 10px;
        border-width: 1px;
        border-style: solid;
        margin: -5px 0 0 -5px;
        cursor: pointer;
        opacity: 0.85;
        border-color: dt('colorpicker.handle.color');
    }

    .p-colorpicker-hue {
        width: 17px;
        height: 150px;
        inset-block-start: 8px;
        inset-inline-start: 167px;
        position: absolute;
        opacity: 0.85;
        background: linear-gradient(0deg, red 0, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, red);
    }

    .p-colorpicker-hue-handle {
        position: absolute;
        inset-block-start: 150px;
        inset-inline-start: 0px;
        width: 21px;
        margin-inline-start: -2px;
        margin-block-start: -5px;
        height: 10px;
        border-width: 2px;
        border-style: solid;
        opacity: 0.85;
        cursor: pointer;
        border-color: dt('colorpicker.handle.color');
    }
`, classes: { root: "p-colorpicker p-component", preview: function(e2) {
  return ["p-colorpicker-preview", { "p-disabled": e2.props.disabled }];
}, panel: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-colorpicker-panel", { "p-colorpicker-panel-inline": n2.inline, "p-disabled": n2.disabled, "p-invalid": t2.$invalid }];
}, colorSelector: "p-colorpicker-color-selector", colorBackground: "p-colorpicker-color-background", colorHandle: "p-colorpicker-color-handle", hue: "p-colorpicker-hue", hueHandle: "p-colorpicker-hue-handle" } });
var Je = t.extend({ name: "columngroup" });
var X = t.extend({ name: "confirmpopup", style: `
    .p-confirmpopup {
        position: absolute;
        margin-top: dt('confirmpopup.gutter');
        top: 0;
        left: 0;
        background: dt('confirmpopup.background');
        color: dt('confirmpopup.color');
        border: 1px solid dt('confirmpopup.border.color');
        border-radius: dt('confirmpopup.border.radius');
        box-shadow: dt('confirmpopup.shadow');
        will-change: transform;
    }

    .p-confirmpopup-content {
        display: flex;
        align-items: center;
        padding: dt('confirmpopup.content.padding');
        gap: dt('confirmpopup.content.gap');
    }

    .p-confirmpopup-icon {
        font-size: dt('confirmpopup.icon.size');
        width: dt('confirmpopup.icon.size');
        height: dt('confirmpopup.icon.size');
        color: dt('confirmpopup.icon.color');
    }

    .p-confirmpopup-footer {
        display: flex;
        justify-content: flex-end;
        gap: dt('confirmpopup.footer.gap');
        padding: dt('confirmpopup.footer.padding');
    }

    .p-confirmpopup-footer button {
        width: auto;
    }

    .p-confirmpopup-footer button:last-child {
        margin: 0;
    }

    .p-confirmpopup-flipped {
        margin-block-start: calc(dt('confirmpopup.gutter') * -1);
        margin-block-end: dt('confirmpopup.gutter');
    }

    .p-confirmpopup:after,
    .p-confirmpopup:before {
        bottom: 100%;
        left: calc(dt('confirmpopup.arrow.offset') + dt('confirmpopup.arrow.left'));
        content: ' ';
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
    }

    .p-confirmpopup:after {
        border-width: calc(dt('confirmpopup.gutter') - 2px);
        margin-left: calc(-1 * (dt('confirmpopup.gutter') - 2px));
        border-style: solid;
        border-color: transparent;
        border-bottom-color: dt('confirmpopup.background');
    }

    .p-confirmpopup:before {
        border-width: dt('confirmpopup.gutter');
        margin-left: calc(-1 * dt('confirmpopup.gutter'));
        border-style: solid;
        border-color: transparent;
        border-bottom-color: dt('confirmpopup.border.color');
    }

    .p-confirmpopup-flipped:after,
    .p-confirmpopup-flipped:before {
        bottom: auto;
        top: 100%;
    }

    .p-confirmpopup-flipped:after {
        border-bottom-color: transparent;
        border-top-color: dt('confirmpopup.background');
    }

    .p-confirmpopup-flipped:before {
        border-bottom-color: transparent;
        border-top-color: dt('confirmpopup.border.color');
    }
`, classes: { root: "p-confirmpopup p-component", content: "p-confirmpopup-content", icon: "p-confirmpopup-icon", message: "p-confirmpopup-message", footer: "p-confirmpopup-footer", pcRejectButton: "p-confirmpopup-reject-button", pcAcceptButton: "p-confirmpopup-accept-button" } });
var Ye = t.extend({ name: "dataview", style: `
    .p-dataview {
        position: relative;
        display: block;
        border-color: dt('dataview.border.color');
        border-width: dt('dataview.border.width');
        border-style: solid;
        border-radius: dt('dataview.border.radius');
        padding: dt('dataview.padding');
    }

    .p-dataview-header {
        background: dt('dataview.header.background');
        color: dt('dataview.header.color');
        border-color: dt('dataview.header.border.color');
        border-width: dt('dataview.header.border.width');
        border-style: solid;
        padding: dt('dataview.header.padding');
        border-radius: dt('dataview.header.border.radius');
    }

    .p-dataview-content {
        background: dt('dataview.content.background');
        border-color: dt('dataview.content.border.color');
        border-width: dt('dataview.content.border.width');
        border-style: solid;
        color: dt('dataview.content.color');
        padding: dt('dataview.content.padding');
        border-radius: dt('dataview.content.border.radius');
    }

    .p-dataview-footer {
        background: dt('dataview.footer.background');
        color: dt('dataview.footer.color');
        border-color: dt('dataview.footer.border.color');
        border-width: dt('dataview.footer.border.width');
        border-style: solid;
        padding: dt('dataview.footer.padding');
        border-radius: dt('dataview.footer.border.radius');
    }

    .p-dataview-paginator-top {
        border-width: dt('dataview.paginator.top.border.width');
        border-color: dt('dataview.paginator.top.border.color');
        border-style: solid;
    }

    .p-dataview-paginator-bottom {
        border-width: dt('dataview.paginator.bottom.border.width');
        border-color: dt('dataview.paginator.bottom.border.color');
        border-style: solid;
    }

    .p-dataview-loading-overlay {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
    }
`, classes: { root: function(e2) {
  var t2 = e2.props;
  return ["p-dataview p-component", { "p-dataview-list": t2.layout === "list", "p-dataview-grid": t2.layout === "grid" }];
}, header: "p-dataview-header", pcPaginator: function(e2) {
  return "p-dataview-paginator-" + e2.position;
}, content: "p-dataview-content", emptyMessage: "p-dataview-empty-message", footer: "p-dataview-footer" } });
var Xe = t.extend({ name: "deferredcontent" });
var Ze = t.extend({ name: "dock", style: `
    .p-dock {
        position: absolute;
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
    }

    .p-dock-list-container {
        display: flex;
        pointer-events: auto;
        background: dt('dock.background');
        border: 1px solid dt('dock.border.color');
        padding: dt('dock.padding');
        border-radius: dt('dock.border.radius');
    }

    .p-dock-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: 0 none;
    }

    .p-dock-item {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform;
        padding: dt('dock.item.padding');
        border-radius: dt('dock.item.border.radius');
    }

    .p-dock-item.p-focus {
        box-shadow: dt('dock.item.focus.ring.shadow');
        outline: dt('dock.item.focus.ring.width') dt('dock.item.focus.ring.style') dt('dock.item.focus.ring.color');
        outline-offset: dt('dock.item.focus.ring.offset');
    }

    .p-dock-item-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        cursor: default;
        width: dt('dock.item.size');
        height: dt('dock.item.size');
    }

    .p-dock-top {
        left: 0;
        top: 0;
        width: 100%;
    }

    .p-dock-bottom {
        left: 0;
        bottom: 0;
        width: 100%;
    }

    .p-dock-right {
        right: 0;
        top: 0;
        height: 100%;
    }

    .p-dock-right .p-dock-list {
        flex-direction: column;
    }

    .p-dock-left {
        left: 0;
        top: 0;
        height: 100%;
    }

    .p-dock-left .p-dock-list {
        flex-direction: column;
    }

    .p-dock-mobile.p-dock-top .p-dock-list-container,
    .p-dock-mobile.p-dock-bottom .p-dock-list-container {
        overflow-x: auto;
        width: 100%;
    }

    .p-dock-mobile.p-dock-top .p-dock-list-container .p-dock-list,
    .p-dock-mobile.p-dock-bottom .p-dock-list-container .p-dock-list {
        margin: 0 auto;
    }

    .p-dock-mobile.p-dock-left .p-dock-list-container,
    .p-dock-mobile.p-dock-right .p-dock-list-container {
        overflow-y: auto;
        height: 100%;
    }

    .p-dock-mobile.p-dock-left .p-dock-list-container .p-dock-list,
    .p-dock-mobile.p-dock-right .p-dock-list-container .p-dock-list {
        margin: auto 0;
    }

    .p-dock-mobile .p-dock-list .p-dock-item {
        transform: none;
        margin: 0;
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance;
  return ["p-dock p-component", `p-dock-${e2.props.position}`, { "p-dock-mobile": t2.queryMatches }];
}, listContainer: "p-dock-list-container", list: "p-dock-list", item: function(e2) {
  var t2 = e2.instance, n2 = e2.processedItem, r2 = e2.id;
  return ["p-dock-item", { "p-focus": t2.isItemActive(r2), "p-disabled": t2.disabled(n2) }];
}, itemContent: "p-dock-item-content", itemLink: "p-dock-item-link", itemIcon: "p-dock-item-icon" } });
var Qe = t.extend({ name: "dropdown" });
var Z = t.extend({ name: "dynamicdialog" });
var $e = t.extend({ name: "editor", style: `
    /*!
* Quill Editor v1.3.3
* https://quilljs.com/
* Copyright (c) 2014, Jason Chen
* Copyright (c) 2013, salesforce.com
*/
    .ql-container {
        box-sizing: border-box;
        font-family: Helvetica, Arial, sans-serif;
        font-size: 13px;
        height: 100%;
        margin: 0;
        position: relative;
    }
    .ql-container.ql-disabled .ql-tooltip {
        visibility: hidden;
    }
    .ql-container.ql-disabled .ql-editor ul[data-checked] > li::before {
        pointer-events: none;
    }
    .ql-clipboard {
        inset-inline-start: -100000px;
        height: 1px;
        overflow-y: hidden;
        position: absolute;
        top: 50%;
    }
    .ql-clipboard p {
        margin: 0;
        padding: 0;
    }
    .ql-editor {
        box-sizing: border-box;
        line-height: 1.42;
        height: 100%;
        outline: none;
        overflow-y: auto;
        padding: 12px 15px;
        tab-size: 4;
        -moz-tab-size: 4;
        text-align: left;
        white-space: pre-wrap;
        word-wrap: break-word;
    }
    .ql-editor > * {
        cursor: text;
    }
    .ql-editor p,
    .ql-editor ol,
    .ql-editor ul,
    .ql-editor pre,
    .ql-editor blockquote,
    .ql-editor h1,
    .ql-editor h2,
    .ql-editor h3,
    .ql-editor h4,
    .ql-editor h5,
    .ql-editor h6 {
        margin: 0;
        padding: 0;
        counter-reset: list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9;
    }
    .ql-editor ol,
    .ql-editor ul {
        padding-inline-start: 1.5rem;
    }
    .ql-editor ol > li,
    .ql-editor ul > li {
        list-style-type: none;
    }
    .ql-editor ul > li::before {
        content: '\\2022';
    }
    .ql-editor ul[data-checked='true'],
    .ql-editor ul[data-checked='false'] {
        pointer-events: none;
    }
    .ql-editor ul[data-checked='true'] > li *,
    .ql-editor ul[data-checked='false'] > li * {
        pointer-events: all;
    }
    .ql-editor ul[data-checked='true'] > li::before,
    .ql-editor ul[data-checked='false'] > li::before {
        color: #777;
        cursor: pointer;
        pointer-events: all;
    }
    .ql-editor ul[data-checked='true'] > li::before {
        content: '\\2611';
    }
    .ql-editor ul[data-checked='false'] > li::before {
        content: '\\2610';
    }
    .ql-editor li::before {
        display: inline-block;
        white-space: nowrap;
        width: 1.2rem;
    }
    .ql-editor li:not(.ql-direction-rtl)::before {
        margin-inline-start: -1.5rem;
        margin-inline-end: 0.3rem;
        text-align: right;
    }
    .ql-editor li.ql-direction-rtl::before {
        margin-inline-start: 0.3rem;
        margin-inline-end: -1.5rem;
    }
    .ql-editor ol li:not(.ql-direction-rtl),
    .ql-editor ul li:not(.ql-direction-rtl) {
        padding-inline-start: 1.5rem;
    }
    .ql-editor ol li.ql-direction-rtl,
    .ql-editor ul li.ql-direction-rtl {
        padding-inline-end: 1.5rem;
    }
    .ql-editor ol li {
        counter-reset: list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9;
        counter-increment: list-0;
    }
    .ql-editor ol li:before {
        content: counter(list-0, decimal) '. ';
    }
    .ql-editor ol li.ql-indent-1 {
        counter-increment: list-1;
    }
    .ql-editor ol li.ql-indent-1:before {
        content: counter(list-1, lower-alpha) '. ';
    }
    .ql-editor ol li.ql-indent-1 {
        counter-reset: list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9;
    }
    .ql-editor ol li.ql-indent-2 {
        counter-increment: list-2;
    }
    .ql-editor ol li.ql-indent-2:before {
        content: counter(list-2, lower-roman) '. ';
    }
    .ql-editor ol li.ql-indent-2 {
        counter-reset: list-3 list-4 list-5 list-6 list-7 list-8 list-9;
    }
    .ql-editor ol li.ql-indent-3 {
        counter-increment: list-3;
    }
    .ql-editor ol li.ql-indent-3:before {
        content: counter(list-3, decimal) '. ';
    }
    .ql-editor ol li.ql-indent-3 {
        counter-reset: list-4 list-5 list-6 list-7 list-8 list-9;
    }
    .ql-editor ol li.ql-indent-4 {
        counter-increment: list-4;
    }
    .ql-editor ol li.ql-indent-4:before {
        content: counter(list-4, lower-alpha) '. ';
    }
    .ql-editor ol li.ql-indent-4 {
        counter-reset: list-5 list-6 list-7 list-8 list-9;
    }
    .ql-editor ol li.ql-indent-5 {
        counter-increment: list-5;
    }
    .ql-editor ol li.ql-indent-5:before {
        content: counter(list-5, lower-roman) '. ';
    }
    .ql-editor ol li.ql-indent-5 {
        counter-reset: list-6 list-7 list-8 list-9;
    }
    .ql-editor ol li.ql-indent-6 {
        counter-increment: list-6;
    }
    .ql-editor ol li.ql-indent-6:before {
        content: counter(list-6, decimal) '. ';
    }
    .ql-editor ol li.ql-indent-6 {
        counter-reset: list-7 list-8 list-9;
    }
    .ql-editor ol li.ql-indent-7 {
        counter-increment: list-7;
    }
    .ql-editor ol li.ql-indent-7:before {
        content: counter(list-7, lower-alpha) '. ';
    }
    .ql-editor ol li.ql-indent-7 {
        counter-reset: list-8 list-9;
    }
    .ql-editor ol li.ql-indent-8 {
        counter-increment: list-8;
    }
    .ql-editor ol li.ql-indent-8:before {
        content: counter(list-8, lower-roman) '. ';
    }
    .ql-editor ol li.ql-indent-8 {
        counter-reset: list-9;
    }
    .ql-editor ol li.ql-indent-9 {
        counter-increment: list-9;
    }
    .ql-editor ol li.ql-indent-9:before {
        content: counter(list-9, decimal) '. ';
    }
    .ql-editor .ql-video {
        display: block;
        max-width: 100%;
    }
    .ql-editor .ql-video.ql-align-center {
        margin: 0 auto;
    }
    .ql-editor .ql-video.ql-align-right {
        margin: 0 0 0 auto;
    }
    .ql-editor .ql-bg-black {
        background: #000;
    }
    .ql-editor .ql-bg-red {
        background: #e60000;
    }
    .ql-editor .ql-bg-orange {
        background: #f90;
    }
    .ql-editor .ql-bg-yellow {
        background: #ff0;
    }
    .ql-editor .ql-bg-green {
        background: #008a00;
    }
    .ql-editor .ql-bg-blue {
        background: #06c;
    }
    .ql-editor .ql-bg-purple {
        background: #93f;
    }
    .ql-editor .ql-color-white {
        color: #fff;
    }
    .ql-editor .ql-color-red {
        color: #e60000;
    }
    .ql-editor .ql-color-orange {
        color: #f90;
    }
    .ql-editor .ql-color-yellow {
        color: #ff0;
    }
    .ql-editor .ql-color-green {
        color: #008a00;
    }
    .ql-editor .ql-color-blue {
        color: #06c;
    }
    .ql-editor .ql-color-purple {
        color: #93f;
    }
    .ql-editor .ql-font-serif {
        font-family:
            Georgia,
            Times New Roman,
            serif;
    }
    .ql-editor .ql-font-monospace {
        font-family:
            Monaco,
            Courier New,
            monospace;
    }
    .ql-editor .ql-size-small {
        font-size: 0.75rem;
    }
    .ql-editor .ql-size-large {
        font-size: 1.5rem;
    }
    .ql-editor .ql-size-huge {
        font-size: 2.5rem;
    }
    .ql-editor .ql-direction-rtl {
        direction: rtl;
        text-align: inherit;
    }
    .ql-editor .ql-align-center {
        text-align: center;
    }
    .ql-editor .ql-align-justify {
        text-align: justify;
    }
    .ql-editor .ql-align-right {
        text-align: right;
    }
    .ql-editor.ql-blank::before {
        color: dt('form.field.placeholder.color');
        content: attr(data-placeholder);
        font-style: italic;
        inset-inline-start: 15px;
        pointer-events: none;
        position: absolute;
        inset-inline-end: 15px;
    }
    .ql-snow.ql-toolbar:after,
    .ql-snow .ql-toolbar:after {
        clear: both;
        content: '';
        display: table;
    }
    .ql-snow.ql-toolbar button,
    .ql-snow .ql-toolbar button {
        background: none;
        border: none;
        cursor: pointer;
        display: inline-block;
        float: left;
        height: 24px;
        padding-block: 3px;
        padding-inline: 5px;
        width: 28px;
    }
    .ql-snow.ql-toolbar button svg,
    .ql-snow .ql-toolbar button svg {
        float: left;
        height: 100%;
    }
    .ql-snow.ql-toolbar button:active:hover,
    .ql-snow .ql-toolbar button:active:hover {
        outline: none;
    }
    .ql-snow.ql-toolbar input.ql-image[type='file'],
    .ql-snow .ql-toolbar input.ql-image[type='file'] {
        display: none;
    }
    .ql-snow.ql-toolbar button:hover,
    .ql-snow .ql-toolbar button:hover,
    .ql-snow.ql-toolbar button:focus,
    .ql-snow .ql-toolbar button:focus,
    .ql-snow.ql-toolbar button.ql-active,
    .ql-snow .ql-toolbar button.ql-active,
    .ql-snow.ql-toolbar .ql-picker-label:hover,
    .ql-snow .ql-toolbar .ql-picker-label:hover,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active,
    .ql-snow.ql-toolbar .ql-picker-item:hover,
    .ql-snow .ql-toolbar .ql-picker-item:hover,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected {
        color: #06c;
    }
    .ql-snow.ql-toolbar button:hover .ql-fill,
    .ql-snow .ql-toolbar button:hover .ql-fill,
    .ql-snow.ql-toolbar button:focus .ql-fill,
    .ql-snow .ql-toolbar button:focus .ql-fill,
    .ql-snow.ql-toolbar button.ql-active .ql-fill,
    .ql-snow .ql-toolbar button.ql-active .ql-fill,
    .ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill,
    .ql-snow .ql-toolbar .ql-picker-label:hover .ql-fill,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-fill,
    .ql-snow.ql-toolbar .ql-picker-item:hover .ql-fill,
    .ql-snow .ql-toolbar .ql-picker-item:hover .ql-fill,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-fill,
    .ql-snow.ql-toolbar button:hover .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar button:hover .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar button:focus .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar button:focus .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar button.ql-active .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar button.ql-active .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke.ql-fill {
        fill: #06c;
    }
    .ql-snow.ql-toolbar button:hover .ql-stroke,
    .ql-snow .ql-toolbar button:hover .ql-stroke,
    .ql-snow.ql-toolbar button:focus .ql-stroke,
    .ql-snow .ql-toolbar button:focus .ql-stroke,
    .ql-snow.ql-toolbar button.ql-active .ql-stroke,
    .ql-snow .ql-toolbar button.ql-active .ql-stroke,
    .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke,
    .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke,
    .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke,
    .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke,
    .ql-snow.ql-toolbar button:hover .ql-stroke-miter,
    .ql-snow .ql-toolbar button:hover .ql-stroke-miter,
    .ql-snow.ql-toolbar button:focus .ql-stroke-miter,
    .ql-snow .ql-toolbar button:focus .ql-stroke-miter,
    .ql-snow.ql-toolbar button.ql-active .ql-stroke-miter,
    .ql-snow.ql-toolbar button.ql-active .ql-stroke-miter,
    .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke-miter,
    .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke-miter,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter,
    .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke-miter,
    .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke-miter,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter {
        stroke: #06c;
    }
    @media (pointer: coarse) {
        .ql-snow.ql-toolbar button:hover:not(.ql-active),
        .ql-snow .ql-toolbar button:hover:not(.ql-active) {
            color: #444;
        }
        .ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-fill,
        .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-fill,
        .ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-stroke.ql-fill,
        .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-stroke.ql-fill {
            fill: #444;
        }
        .ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-stroke,
        .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-stroke,
        .ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-stroke-miter,
        .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-stroke-miter {
            stroke: #444;
        }
    }
    .ql-snow {
        box-sizing: border-box;
    }
    .ql-snow * {
        box-sizing: border-box;
    }
    .ql-snow .ql-hidden {
        display: none;
    }
    .ql-snow .ql-out-bottom,
    .ql-snow .ql-out-top {
        visibility: hidden;
    }
    .ql-snow .ql-tooltip {
        position: absolute;
        transform: translateY(10px);
    }
    .ql-snow .ql-tooltip a {
        cursor: pointer;
        text-decoration: none;
    }
    .ql-snow .ql-tooltip.ql-flip {
        transform: translateY(-10px);
    }
    .ql-snow .ql-formats {
        display: inline-block;
        vertical-align: middle;
    }
    .ql-snow .ql-formats:after {
        clear: both;
        content: '';
        display: table;
    }
    .ql-snow .ql-stroke {
        fill: none;
        stroke: #444;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 2;
    }
    .ql-snow .ql-stroke-miter {
        fill: none;
        stroke: #444;
        stroke-miterlimit: 10;
        stroke-width: 2;
    }
    .ql-snow .ql-fill,
    .ql-snow .ql-stroke.ql-fill {
        fill: #444;
    }
    .ql-snow .ql-empty {
        fill: none;
    }
    .ql-snow .ql-even {
        fill-rule: evenodd;
    }
    .ql-snow .ql-thin,
    .ql-snow .ql-stroke.ql-thin {
        stroke-width: 1;
    }
    .ql-snow .ql-transparent {
        opacity: 0.4;
    }
    .ql-snow .ql-direction svg:last-child {
        display: none;
    }
    .ql-snow .ql-direction.ql-active svg:last-child {
        display: inline;
    }
    .ql-snow .ql-direction.ql-active svg:first-child {
        display: none;
    }
    .ql-snow .ql-editor h1 {
        font-size: 2rem;
    }
    .ql-snow .ql-editor h2 {
        font-size: 1.5rem;
    }
    .ql-snow .ql-editor h3 {
        font-size: 1.17rem;
    }
    .ql-snow .ql-editor h4 {
        font-size: 1rem;
    }
    .ql-snow .ql-editor h5 {
        font-size: 0.83rem;
    }
    .ql-snow .ql-editor h6 {
        font-size: 0.67rem;
    }
    .ql-snow .ql-editor a {
        text-decoration: underline;
    }
    .ql-snow .ql-editor blockquote {
        border-inline-start: 4px solid #ccc;
        margin-block-end: 5px;
        margin-block-start: 5px;
        padding-inline-start: 16px;
    }
    .ql-snow .ql-editor code,
    .ql-snow .ql-editor pre {
        background: #f0f0f0;
        border-radius: 3px;
    }
    .ql-snow .ql-editor pre {
        white-space: pre-wrap;
        margin-block-end: 5px;
        margin-block-start: 5px;
        padding: 5px 10px;
    }
    .ql-snow .ql-editor code {
        font-size: 85%;
        padding: 2px 4px;
    }
    .ql-snow .ql-editor pre.ql-syntax {
        background: #23241f;
        color: #f8f8f2;
        overflow: visible;
    }
    .ql-snow .ql-editor img {
        max-width: 100%;
    }
    .ql-snow .ql-picker {
        color: #444;
        display: inline-block;
        float: left;
        inset-inline-start: 0;
        font-size: 14px;
        font-weight: 500;
        height: 24px;
        position: relative;
        vertical-align: middle;
    }
    .ql-snow .ql-picker-label {
        cursor: pointer;
        display: inline-block;
        height: 100%;
        padding-inline-start: 8px;
        padding-inline-end: 2px;
        position: relative;
        width: 100%;
    }
    .ql-snow .ql-picker-label::before {
        display: inline-block;
        line-height: 22px;
    }
    .ql-snow .ql-picker-options {
        background: #fff;
        display: none;
        min-width: 100%;
        padding: 4px 8px;
        position: absolute;
        white-space: nowrap;
    }
    .ql-snow .ql-picker-options .ql-picker-item {
        cursor: pointer;
        display: block;
        padding-block-end: 5px;
        padding-block-start: 5px;
    }
    .ql-snow .ql-picker.ql-expanded .ql-picker-label {
        color: #ccc;
        z-index: 2;
    }
    .ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-fill {
        fill: #ccc;
    }
    .ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-stroke {
        stroke: #ccc;
    }
    .ql-snow .ql-picker.ql-expanded .ql-picker-options {
        display: block;
        margin-block-start: -1px;
        top: 100%;
        z-index: 1;
    }
    .ql-snow .ql-color-picker,
    .ql-snow .ql-icon-picker {
        width: 28px;
    }
    .ql-snow .ql-color-picker .ql-picker-label,
    .ql-snow .ql-icon-picker .ql-picker-label {
        padding: 2px 4px;
    }
    .ql-snow .ql-color-picker .ql-picker-label svg,
    .ql-snow .ql-icon-picker .ql-picker-label svg {
        inset-inline-end: 4px;
    }
    .ql-snow .ql-icon-picker .ql-picker-options {
        padding: 4px 0;
    }
    .ql-snow .ql-icon-picker .ql-picker-item {
        height: 24px;
        width: 24px;
        padding: 2px 4px;
    }
    .ql-snow .ql-color-picker .ql-picker-options {
        padding: 3px 5px;
        width: 152px;
    }
    .ql-snow .ql-color-picker .ql-picker-item {
        border: 1px solid transparent;
        float: left;
        height: 16px;
        margin: 2px;
        padding: 0;
        width: 16px;
    }
    .ql-snow .ql-picker:not(.ql-color-picker):not(.ql-icon-picker) svg {
        position: absolute;
        margin-block-start: -9px;
        inset-inline-end: 0;
        top: 50%;
        width: 18px;
    }
    .ql-snow .ql-picker.ql-header .ql-picker-label[data-label]:not([data-label=''])::before,
    .ql-snow .ql-picker.ql-font .ql-picker-label[data-label]:not([data-label=''])::before,
    .ql-snow .ql-picker.ql-size .ql-picker-label[data-label]:not([data-label=''])::before,
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-label]:not([data-label=''])::before,
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-label]:not([data-label=''])::before,
    .ql-snow .ql-picker.ql-size .ql-picker-item[data-label]:not([data-label=''])::before {
        content: attr(data-label);
    }
    .ql-snow .ql-picker.ql-header {
        width: 98px;
    }
    .ql-snow .ql-picker.ql-header .ql-picker-label::before,
    .ql-snow .ql-picker.ql-header .ql-picker-item::before {
        content: 'Normal';
    }
    .ql-snow .ql-picker.ql-header .ql-picker-label[data-value='1']::before,
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='1']::before {
        content: 'Heading 1';
    }
    .ql-snow .ql-picker.ql-header .ql-picker-label[data-value='2']::before,
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='2']::before {
        content: 'Heading 2';
    }
    .ql-snow .ql-picker.ql-header .ql-picker-label[data-value='3']::before,
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='3']::before {
        content: 'Heading 3';
    }
    .ql-snow .ql-picker.ql-header .ql-picker-label[data-value='4']::before,
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before {
        content: 'Heading 4';
    }
    .ql-snow .ql-picker.ql-header .ql-picker-label[data-value='5']::before,
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='5']::before {
        content: 'Heading 5';
    }
    .ql-snow .ql-picker.ql-header .ql-picker-label[data-value='6']::before,
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='6']::before {
        content: 'Heading 6';
    }
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='1']::before {
        font-size: 2rem;
    }
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='2']::before {
        font-size: 1.5rem;
    }
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='3']::before {
        font-size: 1.17rem;
    }
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before {
        font-size: 1rem;
    }
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='5']::before {
        font-size: 0.83rem;
    }
    .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='6']::before {
        font-size: 0.67rem;
    }
    .ql-snow .ql-picker.ql-font {
        width: 108px;
    }
    .ql-snow .ql-picker.ql-font .ql-picker-label::before,
    .ql-snow .ql-picker.ql-font .ql-picker-item::before {
        content: 'Sans Serif';
    }
    .ql-snow .ql-picker.ql-font .ql-picker-label[data-value='serif']::before,
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value='serif']::before {
        content: 'Serif';
    }
    .ql-snow .ql-picker.ql-font .ql-picker-label[data-value='monospace']::before,
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value='monospace']::before {
        content: 'Monospace';
    }
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value='serif']::before {
        font-family:
            Georgia,
            Times New Roman,
            serif;
    }
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value='monospace']::before {
        font-family:
            Monaco,
            Courier New,
            monospace;
    }
    .ql-snow .ql-picker.ql-size {
        width: 98px;
    }
    .ql-snow .ql-picker.ql-size .ql-picker-label::before,
    .ql-snow .ql-picker.ql-size .ql-picker-item::before {
        content: 'Normal';
    }
    .ql-snow .ql-picker.ql-size .ql-picker-label[data-value='small']::before,
    .ql-snow .ql-picker.ql-size .ql-picker-item[data-value='small']::before {
        content: 'Small';
    }
    .ql-snow .ql-picker.ql-size .ql-picker-label[data-value='large']::before,
    .ql-snow .ql-picker.ql-size .ql-picker-item[data-value='large']::before {
        content: 'Large';
    }
    .ql-snow .ql-picker.ql-size .ql-picker-label[data-value='huge']::before,
    .ql-snow .ql-picker.ql-size .ql-picker-item[data-value='huge']::before {
        content: 'Huge';
    }
    .ql-snow .ql-picker.ql-size .ql-picker-item[data-value='small']::before {
        font-size: 10px;
    }
    .ql-snow .ql-picker.ql-size .ql-picker-item[data-value='large']::before {
        font-size: 18px;
    }
    .ql-snow .ql-picker.ql-size .ql-picker-item[data-value='huge']::before {
        font-size: 32px;
    }
    .ql-snow .ql-color-picker.ql-background .ql-picker-item {
        background: #fff;
    }
    .ql-snow .ql-color-picker.ql-color .ql-picker-item {
        background: #000;
    }
    .ql-toolbar.ql-snow {
        border: 1px solid #ccc;
        box-sizing: border-box;
        font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
        padding: 8px;
    }
    .ql-toolbar.ql-snow .ql-formats {
        margin-inline-end: 15px;
    }
    .ql-toolbar.ql-snow .ql-picker-label {
        border: 1px solid transparent;
    }
    .ql-toolbar.ql-snow .ql-picker-options {
        border: 1px solid transparent;
        box-shadow: rgba(0, 0, 0, 0.2) 0 2px 8px;
    }
    .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label {
        border-color: #ccc;
    }
    .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options {
        border-color: #ccc;
    }
    .ql-toolbar.ql-snow .ql-color-picker .ql-picker-item.ql-selected,
    .ql-toolbar.ql-snow .ql-color-picker .ql-picker-item:hover {
        border-color: #000;
    }
    .ql-toolbar.ql-snow + .ql-container.ql-snow {
        border-block-start: 0;
    }
    .ql-snow .ql-tooltip {
        background: #fff;
        border: 1px solid #ccc;
        box-shadow: 0 0 5px #ddd;
        color: #444;
        padding: 5px 12px;
        white-space: nowrap;
    }
    .ql-snow .ql-tooltip::before {
        content: 'Visit URL:';
        line-height: 26px;
        margin-inline-end: 8px;
    }
    .ql-snow .ql-tooltip input[type='text'] {
        display: none;
        border: 1px solid #ccc;
        font-size: 13px;
        height: 26px;
        margin: 0;
        padding: 3px 5px;
        width: 170px;
    }
    .ql-snow .ql-tooltip a.ql-preview {
        display: inline-block;
        max-width: 200px;
        overflow-x: hidden;
        text-overflow: ellipsis;
        vertical-align: top;
    }
    .ql-snow .ql-tooltip a.ql-action::after {
        border-inline-end: 1px solid #ccc;
        content: 'Edit';
        margin-inline-start: 16px;
        padding-inline-end: 8px;
    }
    .ql-snow .ql-tooltip a.ql-remove::before {
        content: 'Remove';
        margin-inline-start: 8px;
    }
    .ql-snow .ql-tooltip a {
        line-height: 26px;
    }
    .ql-snow .ql-tooltip.ql-editing a.ql-preview,
    .ql-snow .ql-tooltip.ql-editing a.ql-remove {
        display: none;
    }
    .ql-snow .ql-tooltip.ql-editing input[type='text'] {
        display: inline-block;
    }
    .ql-snow .ql-tooltip.ql-editing a.ql-action::after {
        border-inline-end: 0;
        content: 'Save';
        padding-inline-end: 0;
    }
    .ql-snow .ql-tooltip[data-mode='link']::before {
        content: 'Enter link:';
    }
    .ql-snow .ql-tooltip[data-mode='formula']::before {
        content: 'Enter formula:';
    }
    .ql-snow .ql-tooltip[data-mode='video']::before {
        content: 'Enter video:';
    }
    .ql-snow a {
        color: #06c;
    }
    .ql-container.ql-snow {
        border: 1px solid #ccc;
    }

    .p-editor {
        display: block;
    }

    .p-editor .p-editor-toolbar {
        background: dt('editor.toolbar.background');
        border-start-end-radius: dt('editor.toolbar.border.radius');
        border-start-start-radius: dt('editor.toolbar.border.radius');
    }

    .p-editor .p-editor-toolbar.ql-snow {
        border: 1px solid dt('editor.toolbar.border.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-stroke {
        stroke: dt('editor.toolbar.item.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-fill {
        fill: dt('editor.toolbar.item.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker .ql-picker-label {
        border: 0 none;
        color: dt('editor.toolbar.item.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker .ql-picker-label:hover {
        color: dt('editor.toolbar.item.hover.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker .ql-picker-label:hover .ql-stroke {
        stroke: dt('editor.toolbar.item.hover.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker .ql-picker-label:hover .ql-fill {
        fill: dt('editor.toolbar.item.hover.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label {
        color: dt('editor.toolbar.item.active.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-stroke {
        stroke: dt('editor.toolbar.item.active.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-fill {
        fill: dt('editor.toolbar.item.active.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options {
        background: dt('editor.overlay.background');
        border: 1px solid dt('editor.overlay.border.color');
        box-shadow: dt('editor.overlay.shadow');
        border-radius: dt('editor.overlay.border.radius');
        padding: dt('editor.overlay.padding');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options .ql-picker-item {
        color: dt('editor.overlay.option.color');
        border-radius: dt('editor.overlay.option.border.radius');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options .ql-picker-item:hover {
        background: dt('editor.overlay.option.focus.background');
        color: dt('editor.overlay.option.focus.color');
    }

    .p-editor .p-editor-toolbar.ql-snow .ql-picker.ql-expanded:not(.ql-color-picker, .ql-icon-picker) .ql-picker-item {
        padding: dt('editor.overlay.option.padding');
    }

    .p-editor .p-editor-content {
        border-end-end-radius: dt('editor.content.border.radius');
        border-end-start-radius: dt('editor.content.border.radius');
    }

    .p-editor .p-editor-content.ql-snow {
        border: 1px solid dt('editor.content.border.color');
    }

    .p-editor .p-editor-content .ql-editor {
        background: dt('editor.content.background');
        color: dt('editor.content.color');
        border-end-end-radius: dt('editor.content.border.radius');
        border-end-start-radius: dt('editor.content.border.radius');
    }

    .p-editor .ql-snow.ql-toolbar button:hover,
    .p-editor .ql-snow.ql-toolbar button:focus {
        color: dt('editor.toolbar.item.hover.color');
    }

    .p-editor .ql-snow.ql-toolbar button:hover .ql-stroke,
    .p-editor .ql-snow.ql-toolbar button:focus .ql-stroke {
        stroke: dt('editor.toolbar.item.hover.color');
    }

    .p-editor .ql-snow.ql-toolbar button:hover .ql-fill,
    .p-editor .ql-snow.ql-toolbar button:focus .ql-fill {
        fill: dt('editor.toolbar.item.hover.color');
    }

    .p-editor .ql-snow.ql-toolbar button.ql-active,
    .p-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active,
    .p-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected {
        color: dt('editor.toolbar.item.active.color');
    }

    .p-editor .ql-snow.ql-toolbar button.ql-active .ql-stroke,
    .p-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,
    .p-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke {
        stroke: dt('editor.toolbar.item.active.color');
    }

    .p-editor .ql-snow.ql-toolbar button.ql-active .ql-fill,
    .p-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill,
    .p-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill {
        fill: dt('editor.toolbar.item.active.color');
    }

    .p-editor .ql-snow.ql-toolbar button.ql-active .ql-picker-label,
    .p-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-picker-label,
    .p-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-picker-label {
        color: dt('editor.toolbar.item.active.color');
    }
`, classes: { root: function(e2) {
  return ["p-editor", { "p-invalid": e2.instance.$invalid }];
}, toolbar: "p-editor-toolbar", content: "p-editor-content" } });
var et = t.extend({ name: "fieldset", style: `
    .p-fieldset {
        background: dt('fieldset.background');
        border: 1px solid dt('fieldset.border.color');
        border-radius: dt('fieldset.border.radius');
        color: dt('fieldset.color');
        padding: dt('fieldset.padding');
        margin: 0;
    }

    .p-fieldset-legend {
        background: dt('fieldset.legend.background');
        border-radius: dt('fieldset.legend.border.radius');
        border-width: dt('fieldset.legend.border.width');
        border-style: solid;
        border-color: dt('fieldset.legend.border.color');
        color: dt('fieldset.legend.color');
        padding: dt('fieldset.legend.padding');
        transition:
            background dt('fieldset.transition.duration'),
            color dt('fieldset.transition.duration'),
            outline-color dt('fieldset.transition.duration'),
            box-shadow dt('fieldset.transition.duration');
    }

    .p-fieldset-toggleable > .p-fieldset-legend {
        padding: 0;
    }

    .p-fieldset-toggle-button {
        cursor: pointer;
        user-select: none;
        overflow: hidden;
        position: relative;
        text-decoration: none;
        display: flex;
        gap: dt('fieldset.legend.gap');
        align-items: center;
        justify-content: center;
        padding: dt('fieldset.legend.padding');
        background: transparent;
        border: 0 none;
        border-radius: dt('fieldset.legend.border.radius');
        transition:
            background dt('fieldset.transition.duration'),
            color dt('fieldset.transition.duration'),
            outline-color dt('fieldset.transition.duration'),
            box-shadow dt('fieldset.transition.duration');
        outline-color: transparent;
    }

    .p-fieldset-legend-label {
        font-weight: dt('fieldset.legend.font.weight');
    }

    .p-fieldset-toggle-button:focus-visible {
        box-shadow: dt('fieldset.legend.focus.ring.shadow');
        outline: dt('fieldset.legend.focus.ring.width') dt('fieldset.legend.focus.ring.style') dt('fieldset.legend.focus.ring.color');
        outline-offset: dt('fieldset.legend.focus.ring.offset');
    }

    .p-fieldset-toggleable > .p-fieldset-legend:hover {
        color: dt('fieldset.legend.hover.color');
        background: dt('fieldset.legend.hover.background');
    }

    .p-fieldset-toggle-icon {
        color: dt('fieldset.toggle.icon.color');
        transition: color dt('fieldset.transition.duration');
    }

    .p-fieldset-toggleable > .p-fieldset-legend:hover .p-fieldset-toggle-icon {
        color: dt('fieldset.toggle.icon.hover.color');
    }

    .p-fieldset-content-container {
        display: grid;
        grid-template-rows: 1fr;
    }

    .p-fieldset-content-wrapper {
        min-height: 0;
    }

    .p-fieldset-content {
        padding: dt('fieldset.content.padding');
    }
`, classes: { root: function(e2) {
  return ["p-fieldset p-component", { "p-fieldset-toggleable": e2.props.toggleable }];
}, legend: "p-fieldset-legend", legendLabel: "p-fieldset-legend-label", toggleButton: "p-fieldset-toggle-button", toggleIcon: "p-fieldset-toggle-icon", contentContainer: "p-fieldset-content-container", contentWrapper: "p-fieldset-content-wrapper", content: "p-fieldset-content" } });
var tt = t.extend({ name: "fileupload", style: `
    .p-fileupload input[type='file'] {
        display: none;
    }

    .p-fileupload-advanced {
        border: 1px solid dt('fileupload.border.color');
        border-radius: dt('fileupload.border.radius');
        background: dt('fileupload.background');
        color: dt('fileupload.color');
    }

    .p-fileupload-header {
        display: flex;
        align-items: center;
        padding: dt('fileupload.header.padding');
        background: dt('fileupload.header.background');
        color: dt('fileupload.header.color');
        border-style: solid;
        border-width: dt('fileupload.header.border.width');
        border-color: dt('fileupload.header.border.color');
        border-radius: dt('fileupload.header.border.radius');
        gap: dt('fileupload.header.gap');
    }

    .p-fileupload-content {
        border: 1px solid transparent;
        display: flex;
        flex-direction: column;
        gap: dt('fileupload.content.gap');
        transition: border-color dt('fileupload.transition.duration');
        padding: dt('fileupload.content.padding');
    }

    .p-fileupload-content .p-progressbar {
        width: 100%;
        height: dt('fileupload.progressbar.height');
    }

    .p-fileupload-file-list {
        display: flex;
        flex-direction: column;
        gap: dt('fileupload.filelist.gap');
    }

    .p-fileupload-file {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        padding: dt('fileupload.file.padding');
        border-block-end: 1px solid dt('fileupload.file.border.color');
        gap: dt('fileupload.file.gap');
    }

    .p-fileupload-file:last-child {
        border-block-end: 0;
    }

    .p-fileupload-file-info {
        display: flex;
        flex-direction: column;
        gap: dt('fileupload.file.info.gap');
    }

    .p-fileupload-file-thumbnail {
        flex-shrink: 0;
    }

    .p-fileupload-file-actions {
        margin-inline-start: auto;
    }

    .p-fileupload-highlight {
        border: 1px dashed dt('fileupload.content.highlight.border.color');
    }

    .p-fileupload-basic .p-message {
        margin-block-end: dt('fileupload.basic.gap');
    }

    .p-fileupload-basic-content {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: dt('fileupload.basic.gap');
    }
`, classes: { root: function(e2) {
  return [`p-fileupload p-fileupload-${e2.props.mode} p-component`];
}, header: "p-fileupload-header", pcChooseButton: "p-fileupload-choose-button", pcUploadButton: "p-fileupload-upload-button", pcCancelButton: "p-fileupload-cancel-button", content: "p-fileupload-content", fileList: "p-fileupload-file-list", file: "p-fileupload-file", fileThumbnail: "p-fileupload-file-thumbnail", fileInfo: "p-fileupload-file-info", fileName: "p-fileupload-file-name", fileSize: "p-fileupload-file-size", pcFileBadge: "p-fileupload-file-badge", fileActions: "p-fileupload-file-actions", pcFileRemoveButton: "p-fileupload-file-remove-button", basicContent: "p-fileupload-basic-content" } });
var nt = t.extend({ name: "floatlabel", style: `
    .p-floatlabel {
        display: block;
        position: relative;
    }

    .p-floatlabel label {
        position: absolute;
        pointer-events: none;
        top: 50%;
        transform: translateY(-50%);
        transition-property: all;
        transition-timing-function: ease;
        line-height: 1;
        font-weight: dt('floatlabel.font.weight');
        inset-inline-start: dt('floatlabel.position.x');
        color: dt('floatlabel.color');
        transition-duration: dt('floatlabel.transition.duration');
    }

    .p-floatlabel:has(.p-textarea) label {
        top: dt('floatlabel.position.y');
        transform: translateY(0);
    }

    .p-floatlabel:has(.p-inputicon:first-child) label {
        inset-inline-start: calc((dt('form.field.padding.x') * 2) + dt('icon.size'));
    }

    .p-floatlabel:has(input:focus) label,
    .p-floatlabel:has(input.p-filled) label,
    .p-floatlabel:has(input:-webkit-autofill) label,
    .p-floatlabel:has(textarea:focus) label,
    .p-floatlabel:has(textarea.p-filled) label,
    .p-floatlabel:has(.p-inputwrapper-focus) label,
    .p-floatlabel:has(.p-inputwrapper-filled) label,
    .p-floatlabel:has(input[placeholder]) label,
    .p-floatlabel:has(textarea[placeholder]) label {
        top: dt('floatlabel.over.active.top');
        transform: translateY(0);
        font-size: dt('floatlabel.active.font.size');
        font-weight: dt('floatlabel.active.font.weight');
    }

    .p-floatlabel:has(input.p-filled) label,
    .p-floatlabel:has(textarea.p-filled) label,
    .p-floatlabel:has(.p-inputwrapper-filled) label {
        color: dt('floatlabel.active.color');
    }

    .p-floatlabel:has(input:focus) label,
    .p-floatlabel:has(input:-webkit-autofill) label,
    .p-floatlabel:has(textarea:focus) label,
    .p-floatlabel:has(.p-inputwrapper-focus) label {
        color: dt('floatlabel.focus.color');
    }

    .p-floatlabel-in .p-inputtext,
    .p-floatlabel-in .p-textarea,
    .p-floatlabel-in .p-select-label,
    .p-floatlabel-in .p-multiselect-label,
    .p-floatlabel-in .p-multiselect-label:has(.p-chip),
    .p-floatlabel-in .p-autocomplete-input-multiple,
    .p-floatlabel-in .p-cascadeselect-label,
    .p-floatlabel-in .p-treeselect-label {
        padding-block-start: dt('floatlabel.in.input.padding.top');
        padding-block-end: dt('floatlabel.in.input.padding.bottom');
    }

    .p-floatlabel-in:has(input:focus) label,
    .p-floatlabel-in:has(input.p-filled) label,
    .p-floatlabel-in:has(input:-webkit-autofill) label,
    .p-floatlabel-in:has(textarea:focus) label,
    .p-floatlabel-in:has(textarea.p-filled) label,
    .p-floatlabel-in:has(.p-inputwrapper-focus) label,
    .p-floatlabel-in:has(.p-inputwrapper-filled) label,
    .p-floatlabel-in:has(input[placeholder]) label,
    .p-floatlabel-in:has(textarea[placeholder]) label {
        top: dt('floatlabel.in.active.top');
    }

    .p-floatlabel-on:has(input:focus) label,
    .p-floatlabel-on:has(input.p-filled) label,
    .p-floatlabel-on:has(input:-webkit-autofill) label,
    .p-floatlabel-on:has(textarea:focus) label,
    .p-floatlabel-on:has(textarea.p-filled) label,
    .p-floatlabel-on:has(.p-inputwrapper-focus) label,
    .p-floatlabel-on:has(.p-inputwrapper-filled) label,
    .p-floatlabel-on:has(input[placeholder]) label,
    .p-floatlabel-on:has(textarea[placeholder]) label {
        top: 0;
        transform: translateY(-50%);
        border-radius: dt('floatlabel.on.border.radius');
        background: dt('floatlabel.on.active.background');
        padding: dt('floatlabel.on.active.padding');
    }

    .p-floatlabel:has([class^='p-'][class$='-fluid']) {
        width: 100%;
    }

    .p-floatlabel:has(.p-invalid) label {
        color: dt('floatlabel.invalid.color');
    }
`, classes: { root: function(e2) {
  var t2 = e2.props;
  return ["p-floatlabel", { "p-floatlabel-over": t2.variant === "over", "p-floatlabel-on": t2.variant === "on", "p-floatlabel-in": t2.variant === "in" }];
} } });
var rt = t.extend({ name: "fluid", classes: { root: "p-fluid" } });
var it = t.extend({ name: "galleria", style: `
    .p-galleria {
        overflow: hidden;
        border-style: solid;
        border-width: dt('galleria.border.width');
        border-color: dt('galleria.border.color');
        border-radius: dt('galleria.border.radius');
    }

    .p-galleria-content {
        display: flex;
        flex-direction: column;
    }

    .p-galleria-items-container {
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .p-galleria-items {
        position: relative;
        display: flex;
        height: 100%;
    }

    .p-galleria-nav-button {
        position: absolute !important;
        top: 50%;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        background: dt('galleria.nav.button.background');
        color: dt('galleria.nav.button.color');
        width: dt('galleria.nav.button.size');
        height: dt('galleria.nav.button.size');
        transition:
            background dt('galleria.transition.duration'),
            color dt('galleria.transition.duration'),
            outline-color dt('galleria.transition.duration'),
            box-shadow dt('galleria.transition.duration');
        margin: calc(-1 * calc(dt('galleria.nav.button.size')) / 2) dt('galleria.nav.button.gutter') 0 dt('galleria.nav.button.gutter');
        padding: 0;
        user-select: none;
        border: 0 none;
        cursor: pointer;
        outline-color: transparent;
    }

    .p-galleria-nav-button:not(.p-disabled):hover {
        background: dt('galleria.nav.button.hover.background');
        color: dt('galleria.nav.button.hover.color');
    }

    .p-galleria-nav-button:not(.p-disabled):focus-visible {
        box-shadow: dt('galleria.nav.button.focus.ring.shadow');
        outline: dt('galleria.nav.button.focus.ring.width') dt('galleria.nav.button.focus.ring.style') dt('galleria.nav.button.focus.ring.color');
        outline-offset: dt('galleria.nav.button.focus.ring.offset');
    }

    .p-galleria-next-icon,
    .p-galleria-prev-icon {
        font-size: dt('galleria.nav.icon.size');
        width: dt('galleria.nav.icon.size');
        height: dt('galleria.nav.icon.size');
    }

    .p-galleria-prev-button {
        border-radius: dt('galleria.nav.button.prev.border.radius');
        left: 0;
    }

    .p-galleria-next-button {
        border-radius: dt('galleria.nav.button.next.border.radius');
        right: 0;
    }

    .p-galleria-prev-button:dir(rtl) {
        left: auto;
        right: 0;
        transform: rotate(180deg);
    }

    .p-galleria-next-button:dir(rtl) {
        right: auto;
        left: 0;
        transform: rotate(180deg);
    }

    .p-galleria-item {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
    }

    .p-galleria-hover-navigators .p-galleria-nav-button {
        pointer-events: none;
        opacity: 0;
        transition: opacity dt('galleria.transition.duration') ease-in-out;
    }

    .p-galleria-hover-navigators .p-galleria-items-container:hover .p-galleria-nav-button {
        pointer-events: all;
        opacity: 1;
    }

    .p-galleria-hover-navigators .p-galleria-items-container:hover .p-galleria-nav-button.p-disabled {
        pointer-events: none;
    }

    .p-galleria-caption {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        background: dt('galleria.caption.background');
        color: dt('galleria.caption.color');
        padding: dt('galleria.caption.padding');
    }

    .p-galleria-thumbnails {
        display: flex;
        flex-direction: column;
        overflow: auto;
        flex-shrink: 0;
    }

    .p-galleria-thumbnail-nav-button {
        align-self: center;
        flex: 0 0 auto;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        position: relative;
        margin: 0 dt('galleria.thumbnail.nav.button.gutter');
        padding: 0;
        border: none;
        user-select: none;
        cursor: pointer;
        background: transparent;
        color: dt('galleria.thumbnail.nav.button.color');
        width: dt('galleria.thumbnail.nav.button.size');
        height: dt('galleria.thumbnail.nav.button.size');
        transition:
            background dt('galleria.transition.duration'),
            color dt('galleria.transition.duration'),
            outline-color dt('galleria.transition.duration');
        outline-color: transparent;
        border-radius: dt('galleria.thumbnail.nav.button.border.radius');
    }

    .p-galleria-thumbnail-nav-button:hover {
        background: dt('galleria.thumbnail.nav.button.hover.background');
        color: dt('galleria.thumbnail.nav.button.hover.color');
    }

    .p-galleria-thumbnail-nav-button:focus-visible {
        box-shadow: dt('galleria.thumbnail.nav.button.focus.ring.shadow');
        outline: dt('galleria.thumbnail.nav.button.focus.ring.width') dt('galleria.thumbnail.nav.button.focus.ring.style') dt('galleria.thumbnail.nav.button.focus.ring.color');
        outline-offset: dt('galleria.thumbnail.nav.button.focus.ring.offset');
    }

    .p-galleria-thumbnail-nav-button .p-galleria-thumbnail-next-icon,
    .p-galleria-thumbnail-nav-button .p-galleria-thumbnail-prev-icon {
        font-size: dt('galleria.thumbnail.nav.button.icon.size');
        width: dt('galleria.thumbnail.nav.button.icon.size');
        height: dt('galleria.thumbnail.nav.button.icon.size');
    }

    .p-galleria-thumbnails-content {
        display: flex;
        flex-direction: row;
        background: dt('galleria.thumbnails.content.background');
        padding: dt('galleria.thumbnails.content.padding');
    }

    .p-galleria-thumbnails-viewport {
        overflow: hidden;
        width: 100%;
    }

    .p-galleria:not(.p-galleria-thumbnails-right):not(.p-galleria-thumbnails-left) .p-galleria-thumbnail-prev-button:dir(rtl),
    .p-galleria:not(.p-galleria-thumbnails-right):not(.p-galleria-thumbnails-left) .p-galleria-thumbnail-next-button:dir(rtl) {
        transform: rotate(180deg);
    }

    .p-galleria-thumbnail-items {
        display: flex;
    }

    .p-galleria-thumbnail-items:dir(rtl) {
        flex-direction: row-reverse;
    }

    .p-galleria-thumbnail-item {
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.5;
    }

    .p-galleria-thumbnail {
        outline-color: transparent;
    }

    .p-galleria-thumbnail-item:hover {
        opacity: 1;
        transition: opacity 0.3s;
    }

    .p-galleria-thumbnail-item-current {
        opacity: 1;
    }

    .p-galleria-thumbnails-left .p-galleria-content,
    .p-galleria-thumbnails-right .p-galleria-content {
        flex-direction: row;
    }

    .p-galleria-thumbnails-left .p-galleria-items-container,
    .p-galleria-thumbnails-right .p-galleria-items-container {
        flex-direction: row;
    }

    .p-galleria-thumbnails-left .p-galleria-items-container,
    .p-galleria-thumbnails-top .p-galleria-items-container {
        order: 2;
    }

    .p-galleria-thumbnails-left .p-galleria-thumbnails,
    .p-galleria-thumbnails-top .p-galleria-thumbnails {
        order: 1;
    }

    .p-galleria-thumbnails-left .p-galleria-thumbnails-content,
    .p-galleria-thumbnails-right .p-galleria-thumbnails-content {
        flex-direction: column;
        flex-grow: 1;
    }

    .p-galleria-thumbnails-left .p-galleria-thumbnail-items,
    .p-galleria-thumbnails-right .p-galleria-thumbnail-items {
        flex-direction: column;
        height: 100%;
    }

    .p-galleria-indicator-list {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: dt('galleria.indicator.list.padding');
        gap: dt('galleria.indicator.list.gap');
        margin: 0;
        list-style: none;
    }

    .p-galleria-indicator-button {
        display: inline-flex;
        align-items: center;
        background: dt('galleria.indicator.button.background');
        width: dt('galleria.indicator.button.width');
        height: dt('galleria.indicator.button.height');
        transition:
            background dt('galleria.transition.duration'),
            color dt('galleria.transition.duration'),
            outline-color dt('galleria.transition.duration'),
            box-shadow dt('galleria.transition.duration');
        outline-color: transparent;
        border-radius: dt('galleria.indicator.button.border.radius');
        margin: 0;
        padding: 0;
        border: none;
        user-select: none;
        cursor: pointer;
    }

    .p-galleria-indicator-button:hover {
        background: dt('galleria.indicator.button.hover.background');
    }

    .p-galleria-indicator-button:focus-visible {
        box-shadow: dt('galleria.indicator.button.focus.ring.shadow');
        outline: dt('galleria.indicator.button.focus.ring.width') dt('galleria.indicator.button.focus.ring.style') dt('galleria.indicator.button.focus.ring.color');
        outline-offset: dt('galleria.indicator.button.focus.ring.offset');
    }

    .p-galleria-indicator-active .p-galleria-indicator-button {
        background: dt('galleria.indicator.button.active.background');
    }

    .p-galleria-indicators-left .p-galleria-items-container,
    .p-galleria-indicators-right .p-galleria-items-container {
        flex-direction: row;
        align-items: center;
    }

    .p-galleria-indicators-left .p-galleria-items,
    .p-galleria-indicators-top .p-galleria-items {
        order: 2;
    }

    .p-galleria-indicators-left .p-galleria-indicator-list,
    .p-galleria-indicators-top .p-galleria-indicator-list {
        order: 1;
    }

    .p-galleria-indicators-left .p-galleria-indicator-list,
    .p-galleria-indicators-right .p-galleria-indicator-list {
        flex-direction: column;
    }

    .p-galleria-inset-indicators .p-galleria-indicator-list {
        position: absolute;
        display: flex;
        z-index: 1;
        background: dt('galleria.inset.indicator.list.background');
    }

    .p-galleria-inset-indicators .p-galleria-indicator-button {
        background: dt('galleria.inset.indicator.button.background');
    }

    .p-galleria-inset-indicators .p-galleria-indicator-button:hover {
        background: dt('galleria.inset.indicator.button.hover.background');
    }

    .p-galleria-inset-indicators .p-galleria-indicator-active .p-galleria-indicator-button {
        background: dt('galleria.inset.indicator.button.active.background');
    }

    .p-galleria-inset-indicators.p-galleria-indicators-top .p-galleria-indicator-list {
        top: 0;
        left: 0;
        width: 100%;
        align-items: flex-start;
    }

    .p-galleria-inset-indicators.p-galleria-indicators-right .p-galleria-indicator-list {
        right: 0;
        top: 0;
        height: 100%;
        align-items: flex-end;
    }

    .p-galleria-inset-indicators.p-galleria-indicators-bottom .p-galleria-indicator-list {
        bottom: 0;
        left: 0;
        width: 100%;
        align-items: flex-end;
    }

    .p-galleria-inset-indicators.p-galleria-indicators-left .p-galleria-indicator-list {
        left: 0;
        top: 0;
        height: 100%;
        align-items: flex-start;
    }

    .p-galleria-mask {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .p-galleria-close-button {
        position: absolute !important;
        top: 0;
        right: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        margin: dt('galleria.close.button.gutter');
        background: dt('galleria.close.button.background');
        color: dt('galleria.close.button.color');
        width: dt('galleria.close.button.size');
        height: dt('galleria.close.button.size');
        padding: 0;
        border: none;
        user-select: none;
        cursor: pointer;
        border-radius: dt('galleria.close.button.border.radius');
        outline-color: transparent;
        transition:
            background dt('galleria.transition.duration'),
            color dt('galleria.transition.duration'),
            outline-color dt('galleria.transition.duration');
    }

    .p-galleria-close-icon {
        font-size: dt('galleria.close.button.icon.size');
        width: dt('galleria.close.button.icon.size');
        height: dt('galleria.close.button.icon.size');
    }

    .p-galleria-close-button:hover {
        background: dt('galleria.close.button.hover.background');
        color: dt('galleria.close.button.hover.color');
    }

    .p-galleria-close-button:focus-visible {
        box-shadow: dt('galleria.close.button.focus.ring.shadow');
        outline: dt('galleria.close.button.focus.ring.width') dt('galleria.close.button.focus.ring.style') dt('galleria.close.button.focus.ring.color');
        outline-offset: dt('galleria.close.button.focus.ring.offset');
    }

    .p-galleria-mask .p-galleria-nav-button {
        position: fixed;
        top: 50%;
    }

       .p-items-hidden .p-galleria-thumbnail-item {
        visibility: hidden;
    }

    .p-items-hidden .p-galleria-thumbnail-item.p-galleria-thumbnail-item-active {
        visibility: visible;
    }

    .p-galleria-enter-active {
        animation: p-animate-galleria-enter 300ms cubic-bezier(.19,1,.22,1);
    }

    .p-galleria-leave-active {
        animation: p-animate-galleria-leave 300ms cubic-bezier(.19,1,.22,1);
    }

    .p-galleria-enter-active .p-galleria-nav-button {
        opacity: 0;
    }

    @keyframes p-animate-galleria-enter {
        from {
            opacity: 0;
            transform: scale(0.93);
        }
    }

    @keyframes p-animate-galleria-leave {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.93);
        }
    }
`, classes: { mask: "p-galleria-mask p-overlay-mask p-overlay-mask-enter-active", root: function(e2) {
  var t2 = e2.instance, n2 = t2.$attrs.showThumbnails && t2.getPositionClass("p-galleria-thumbnails", t2.$attrs.thumbnailsPosition), r2 = t2.$attrs.showIndicators && t2.getPositionClass("p-galleria-indicators", t2.$attrs.indicatorsPosition);
  return ["p-galleria p-component", { "p-galleria-fullscreen": t2.$attrs.fullScreen, "p-galleria-inset-indicators": t2.$attrs.showIndicatorsOnItem, "p-galleria-hover-navigators": t2.$attrs.showItemNavigatorsOnHover && !t2.$attrs.fullScreen }, n2, r2];
}, closeButton: "p-galleria-close-button", closeIcon: "p-galleria-close-icon", header: "p-galleria-header", content: "p-galleria-content", footer: "p-galleria-footer", itemsContainer: "p-galleria-items-container", items: "p-galleria-items", prevButton: function(e2) {
  return ["p-galleria-prev-button p-galleria-nav-button", { "p-disabled": e2.instance.isNavBackwardDisabled }];
}, prevIcon: "p-galleria-prev-icon", item: "p-galleria-item", nextButton: function(e2) {
  return ["p-galleria-next-button p-galleria-nav-button", { "p-disabled": e2.instance.isNavForwardDisabled }];
}, nextIcon: "p-galleria-next-icon", caption: "p-galleria-caption", indicatorList: "p-galleria-indicator-list", indicator: function(e2) {
  var t2 = e2.instance, n2 = e2.index;
  return ["p-galleria-indicator", { "p-galleria-indicator-active": t2.isIndicatorItemActive(n2) }];
}, indicatorButton: "p-galleria-indicator-button", thumbnails: "p-galleria-thumbnails", thumbnailContent: "p-galleria-thumbnails-content", thumbnailPrevButton: function(e2) {
  return ["p-galleria-thumbnail-prev-button p-galleria-thumbnail-nav-button", { "p-disabled": e2.instance.isNavBackwardDisabled }];
}, thumbnailPrevIcon: "p-galleria-thumbnail-prev-icon", thumbnailsViewport: "p-galleria-thumbnails-viewport", thumbnailItems: "p-galleria-thumbnail-items", thumbnailItem: function(e2) {
  var t2 = e2.instance, n2 = e2.index;
  return ["p-galleria-thumbnail-item", { "p-galleria-thumbnail-item-current": e2.activeIndex === n2, "p-galleria-thumbnail-item-active": t2.isItemActive(n2), "p-galleria-thumbnail-item-start": t2.firstItemAciveIndex() === n2, "p-galleria-thumbnail-item-end": t2.lastItemActiveIndex() === n2 }];
}, thumbnail: "p-galleria-thumbnail", thumbnailNextButton: function(e2) {
  return ["p-galleria-thumbnail-next-button p-galleria-thumbnail-nav-button", { "p-disabled": e2.instance.isNavForwardDisabled }];
}, thumbnailNextIcon: "p-galleria-thumbnail-next-icon" } });
var at = t.extend({ name: "iftalabel", style: `
    .p-iftalabel {
        display: block;
        position: relative;
    }

    .p-iftalabel label {
        position: absolute;
        pointer-events: none;
        top: dt('iftalabel.top');
        transition-property: all;
        transition-timing-function: ease;
        line-height: 1;
        font-size: dt('iftalabel.font.size');
        font-weight: dt('iftalabel.font.weight');
        inset-inline-start: dt('iftalabel.position.x');
        color: dt('iftalabel.color');
        transition-duration: dt('iftalabel.transition.duration');
    }

    .p-iftalabel .p-inputtext,
    .p-iftalabel .p-textarea,
    .p-iftalabel .p-select-label,
    .p-iftalabel .p-multiselect-label,
    .p-iftalabel .p-multiselect-label:has(.p-chip),
    .p-iftalabel .p-autocomplete-input-multiple,
    .p-iftalabel .p-cascadeselect-label,
    .p-iftalabel .p-treeselect-label {
        padding-block-start: dt('iftalabel.input.padding.top');
        padding-block-end: dt('iftalabel.input.padding.bottom');
    }

    .p-iftalabel:has(.p-invalid) label {
        color: dt('iftalabel.invalid.color');
    }

    .p-iftalabel:has(input:focus) label,
    .p-iftalabel:has(input:-webkit-autofill) label,
    .p-iftalabel:has(textarea:focus) label,
    .p-iftalabel:has(.p-inputwrapper-focus) label {
        color: dt('iftalabel.focus.color');
    }

    .p-iftalabel .p-inputicon {
        top: dt('iftalabel.input.padding.top');
        transform: translateY(25%);
        margin-top: 0;
    }
`, classes: { root: "p-iftalabel" } });
var ot = t.extend({ name: "image", style: `
    .p-image-mask {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .p-image-preview {
        position: relative;
        display: inline-flex;
        line-height: 0;
    }

    .p-image-preview-mask {
        position: absolute;
        inset-inline-start: 0;
        inset-block-start: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        border: 0 none;
        padding: 0;
        cursor: pointer;
        background: transparent;
        color: dt('image.preview.mask.color');
        transition: background dt('image.transition.duration');
    }

    .p-image-preview:hover > .p-image-preview-mask,
    .p-image-preview-mask:focus-visible {
        opacity: 1;
        cursor: pointer;
        background: dt('image.preview.mask.background');
        outline: 0 none;
    }

    .p-image-preview-icon {
        font-size: dt('image.preview.icon.size');
        width: dt('image.preview.icon.size');
        height: dt('image.preview.icon.size');
    }

    .p-image-toolbar {
        position: absolute;
        inset-block-start: dt('image.toolbar.position.top');
        inset-inline-end: dt('image.toolbar.position.right');
        inset-inline-start: dt('image.toolbar.position.left');
        inset-block-end: dt('image.toolbar.position.bottom');
        display: flex;
        z-index: 1;
        padding: dt('image.toolbar.padding');
        background: dt('image.toolbar.background');
        backdrop-filter: blur(dt('image.toolbar.blur'));
        border-color: dt('image.toolbar.border.color');
        border-style: solid;
        border-width: dt('image.toolbar.border.width');
        border-radius: dt('image.toolbar.border.radius');
        gap: dt('image.toolbar.gap');
    }

    .p-image-action {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        color: dt('image.action.color');
        background: transparent;
        width: dt('image.action.size');
        height: dt('image.action.size');
        margin: 0;
        padding: 0;
        border: 0 none;
        cursor: pointer;
        user-select: none;
        border-radius: dt('image.action.border.radius');
        outline-color: transparent;
        transition:
            background dt('image.transition.duration'),
            color dt('image.transition.duration'),
            outline-color dt('image.transition.duration'),
            box-shadow dt('image.transition.duration');
    }

    .p-image-action:hover {
        color: dt('image.action.hover.color');
        background: dt('image.action.hover.background');
    }

    .p-image-action:focus-visible {
        box-shadow: dt('image.action.focus.ring.shadow');
        outline: dt('image.action.focus.ring.width') dt('image.action.focus.ring.style') dt('image.action.focus.ring.color');
        outline-offset: dt('image.action.focus.ring.offset');
    }

    .p-image-action .p-icon {
        font-size: dt('image.action.icon.size');
        width: dt('image.action.icon.size');
        height: dt('image.action.icon.size');
    }

    .p-image-action.p-disabled {
        pointer-events: auto;
    }

    .p-image-original {
        max-width: 100vw;
        max-height: 100vh;
        transition: transform 300ms;
    }

    .p-image-original-enter-active {
        animation: p-animate-image-original-enter 300ms cubic-bezier(.19,1,.22,1);
    }

    .p-image-original-leave-active {
        animation: p-animate-image-original-leave 300ms cubic-bezier(.19,1,.22,1);
    }

    @keyframes p-animate-image-original-enter {
        from {
            opacity: 0;
            transform: scale(0.93);
        }
    }

    @keyframes p-animate-image-original-leave {
        to {
            opacity: 0;
            transform: scale(0.93);
        }
    }
`, classes: { root: function(e2) {
  return ["p-image p-component", { "p-image-preview": e2.props.preview }];
}, previewMask: "p-image-preview-mask", previewIcon: "p-image-preview-icon", mask: "p-image-mask p-overlay-mask p-overlay-mask-enter-active", toolbar: "p-image-toolbar", rotateRightButton: "p-image-action p-image-rotate-right-button", rotateLeftButton: "p-image-action p-image-rotate-left-button", zoomOutButton: function(e2) {
  return ["p-image-action p-image-zoom-out-button", { "p-disabled": e2.instance.isZoomOutDisabled }];
}, zoomInButton: function(e2) {
  return ["p-image-action p-image-zoom-in-button", { "p-disabled": e2.instance.isZoomInDisabled }];
}, closeButton: "p-image-action p-image-close-button", original: "p-image-original" } });
var st = t.extend({ name: "imagecompare", style: `
    .p-imagecompare {
        position: relative;
        overflow: hidden;
        width: 100%;
        aspect-ratio: 16 / 9;
    }

    .p-imagecompare img {
        width: 100%;
        height: 100%;
        position: absolute;
    }

    .p-imagecompare img + img {
        clip-path: polygon(0 0, dt('imagecompare.scope.x', '50%') 0, dt('imagecompare.scope.x', '50%') 100%, 0 100%);
    }

    .p-imagecompare:dir(rtl) img + img {
        clip-path: polygon(calc(100% - dt('imagecompare.scope.x', '50%')) 0, 100% 0, 100% 100%, calc(100% - dt('imagecompare.scope.x', '50%')) 100%);
    }

    .p-imagecompare-slider {
        position: relative;
        -webkit-appearance: none;
        width: calc(100% + dt('imagecompare.handle.size'));
        height: 100%;
        margin-inline-start: calc(-1 * calc(dt('imagecompare.handle.size') / 2));
        background-color: transparent;
        outline: none;
        transition: all dt('imagecompare.handle.transition.duration');
    }

    .p-imagecompare-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: dt('imagecompare.handle.size');
        width: dt('imagecompare.handle.size');
        background: dt('imagecompare.handle.background');
        border: dt('imagecompare.handle.border.width') solid dt('imagecompare.handle.border.color');
        border-radius: dt('imagecompare.handle.border.radius');
        background-size: contain;
        cursor: ew-resize;
        transition: all dt('imagecompare.handle.transition.duration');
    }

    .p-imagecompare-slider::-moz-range-thumb {
        height: dt('imagecompare.handle.size');
        width: dt('imagecompare.handle.size');
        background: dt('imagecompare.handle.background');
        border: dt('imagecompare.handle.border.width') dt('imagecompare.handle.border.style') dt('imagecompare.handle.border.color');
        border-radius: dt('imagecompare.handle.border.radius');
        background-size: contain;
        cursor: ew-resize;
    }

    .p-imagecompare-slider:focus-visible::-webkit-slider-thumb {
        box-shadow: dt('imagecompare.handle.focus.ring.shadow');
        outline: dt('imagecompare.handle.focus.ring.width') dt('imagecompare.handle.focus.ring.style') dt('imagecompare.handle.focus.ring.color');
        outline-offset: dt('imagecompare.handle.focus.ring.offset');
    }

    .p-imagecompare-slider:focus-visible::-moz-range-thumb {
        box-shadow: dt('imagecompare.handle.focus.ring.shadow');
        outline: dt('imagecompare.handle.focus.ring.width') dt('imagecompare.handle.focus.ring.style') dt('imagecompare.handle.focus.ring.color');
        outline-offset: dt('imagecompare.handle.focus.ring.offset');
    }

    .p-imagecompare-slider:hover {
        width: calc(100% + dt('imagecompare.handle.hover.size'));
        margin-inline-start: calc(-1 * calc(dt('imagecompare.handle.hover.size') / 2));
    }

    .p-imagecompare-slider:hover::-webkit-slider-thumb {
        background: dt('imagecompare.handle.hover.background');
        border-color: dt('imagecompare.handle.hover.border.color');
        height: dt('imagecompare.handle.hover.size');
        width: dt('imagecompare.handle.hover.size');
    }

    .p-imagecompare-slider:hover::-moz-range-thumb {
        background: dt('imagecompare.handle.hover.background');
        border-color: dt('imagecompare.handle.hover.border.color');
        height: dt('imagecompare.handle.hover.size');
        width: dt('imagecompare.handle.hover.size');
    }
`, classes: { root: "p-imagecompare", slider: "p-imagecompare-slider" } });
var ct = t.extend({ name: "inlinemessage", style: `
    .p-inlinemessage {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: dt('inlinemessage.padding');
        border-radius: dt('inlinemessage.border.radius');
        gap: dt('inlinemessage.gap');
    }

    .p-inlinemessage-text {
        font-weight: dt('inlinemessage.text.font.weight');
    }

    .p-inlinemessage-icon {
        flex-shrink: 0;
        font-size: dt('inlinemessage.icon.size');
        width: dt('inlinemessage.icon.size');
        height: dt('inlinemessage.icon.size');
    }

    .p-inlinemessage-icon-only .p-inlinemessage-text {
        visibility: hidden;
        width: 0;
    }

    .p-inlinemessage-info {
        background: dt('inlinemessage.info.background');
        border: 1px solid dt('inlinemessage.info.border.color');
        color: dt('inlinemessage.info.color');
        box-shadow: dt('inlinemessage.info.shadow');
    }

    .p-inlinemessage-info .p-inlinemessage-icon {
        color: dt('inlinemessage.info.color');
    }

    .p-inlinemessage-success {
        background: dt('inlinemessage.success.background');
        border: 1px solid dt('inlinemessage.success.border.color');
        color: dt('inlinemessage.success.color');
        box-shadow: dt('inlinemessage.success.shadow');
    }

    .p-inlinemessage-success .p-inlinemessage-icon {
        color: dt('inlinemessage.success.color');
    }

    .p-inlinemessage-warn {
        background: dt('inlinemessage.warn.background');
        border: 1px solid dt('inlinemessage.warn.border.color');
        color: dt('inlinemessage.warn.color');
        box-shadow: dt('inlinemessage.warn.shadow');
    }

    .p-inlinemessage-warn .p-inlinemessage-icon {
        color: dt('inlinemessage.warn.color');
    }

    .p-inlinemessage-error {
        background: dt('inlinemessage.error.background');
        border: 1px solid dt('inlinemessage.error.border.color');
        color: dt('inlinemessage.error.color');
        box-shadow: dt('inlinemessage.error.shadow');
    }

    .p-inlinemessage-error .p-inlinemessage-icon {
        color: dt('inlinemessage.error.color');
    }

    .p-inlinemessage-secondary {
        background: dt('inlinemessage.secondary.background');
        border: 1px solid dt('inlinemessage.secondary.border.color');
        color: dt('inlinemessage.secondary.color');
        box-shadow: dt('inlinemessage.secondary.shadow');
    }

    .p-inlinemessage-secondary .p-inlinemessage-icon {
        color: dt('inlinemessage.secondary.color');
    }

    .p-inlinemessage-contrast {
        background: dt('inlinemessage.contrast.background');
        border: 1px solid dt('inlinemessage.contrast.border.color');
        color: dt('inlinemessage.contrast.color');
        box-shadow: dt('inlinemessage.contrast.shadow');
    }

    .p-inlinemessage-contrast .p-inlinemessage-icon {
        color: dt('inlinemessage.contrast.color');
    }
`, classes: { root: function(e2) {
  var t2 = e2.props, n2 = e2.instance;
  return ["p-inlinemessage p-component p-inlinemessage-" + t2.severity, { "p-inlinemessage-icon-only": !n2.$slots.default }];
}, icon: function(e2) {
  return ["p-inlinemessage-icon", e2.props.icon];
}, text: "p-inlinemessage-text" } });
var lt = t.extend({ name: "inputchips", style: `
    .p-inputchips {
        display: inline-flex;
    }

    .p-inputchips-input {
        margin: 0;
        list-style-type: none;
        cursor: text;
        overflow: hidden;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        padding: calc(dt('inputchips.padding.y') / 2) dt('inputchips.padding.x');
        gap: calc(dt('inputchips.padding.y') / 2);
        color: dt('inputchips.color');
        background: dt('inputchips.background');
        border: 1px solid dt('inputchips.border.color');
        border-radius: dt('inputchips.border.radius');
        width: 100%;
        transition:
            background dt('inputchips.transition.duration'),
            color dt('inputchips.transition.duration'),
            border-color dt('inputchips.transition.duration'),
            outline-color dt('inputchips.transition.duration'),
            box-shadow dt('inputchips.transition.duration');
        outline-color: transparent;
        box-shadow: dt('inputchips.shadow');
    }

    .p-inputchips:not(.p-disabled):hover .p-inputchips-input {
        border-color: dt('inputchips.hover.border.color');
    }

    .p-inputchips:not(.p-disabled).p-focus .p-inputchips-input {
        border-color: dt('inputchips.focus.border.color');
        box-shadow: dt('inputchips.focus.ring.shadow');
        outline: dt('inputchips.focus.ring.width') dt('inputchips.focus.ring.style') dt('inputchips.focus.ring.color');
        outline-offset: dt('inputchips.focus.ring.offset');
    }

    .p-inputchips.p-invalid .p-inputchips-input {
        border-color: dt('inputchips.invalid.border.color');
    }

    .p-variant-filled.p-inputchips-input {
        background: dt('inputchips.filled.background');
    }

    .p-inputchips:not(.p-disabled).p-focus .p-variant-filled.p-inputchips-input {
        background: dt('inputchips.filled.focus.background');
    }

    .p-inputchips.p-disabled .p-inputchips-input {
        opacity: 1;
        background: dt('inputchips.disabled.background');
        color: dt('inputchips.disabled.color');
    }

    .p-inputchips-chip.p-chip {
        padding-top: calc(dt('inputchips.padding.y') / 2);
        padding-bottom: calc(dt('inputchips.padding.y') / 2);
        border-radius: dt('inputchips.chip.border.radius');
        transition:
            background dt('inputchips.transition.duration'),
            color dt('inputchips.transition.duration');
    }

    .p-inputchips-chip-item.p-focus .p-inputchips-chip {
        background: dt('inputchips.chip.focus.background');
        color: dt('inputchips.chip.focus.color');
    }

    .p-inputchips-input:has(.p-inputchips-chip) {
        padding-left: calc(dt('inputchips.padding.y') / 2);
        padding-right: calc(dt('inputchips.padding.y') / 2);
    }

    .p-inputchips-input-item {
        flex: 1 1 auto;
        display: inline-flex;
        padding-top: calc(dt('inputchips.padding.y') / 2);
        padding-bottom: calc(dt('inputchips.padding.y') / 2);
    }

    .p-inputchips-input-item input {
        border: 0 none;
        outline: 0 none;
        background: transparent;
        margin: 0;
        padding: 0;
        box-shadow: none;
        border-radius: 0;
        width: 100%;
        font-family: inherit;
        font-feature-settings: inherit;
        font-size: 1rem;
        color: inherit;
    }

    .p-inputchips-input-item input::placeholder {
        color: dt('inputchips.placeholder.color');
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-inputchips p-component p-inputwrapper", { "p-disabled": n2.disabled, "p-invalid": n2.invalid, "p-focus": t2.focused, "p-inputwrapper-filled": n2.modelValue && n2.modelValue.length || t2.inputValue && t2.inputValue.length, "p-inputwrapper-focus": t2.focused }];
}, input: function(e2) {
  var t2 = e2.props, n2 = e2.instance;
  return ["p-inputchips-input", { "p-variant-filled": t2.variant ? t2.variant === "filled" : n2.$primevue.config.inputStyle === "filled" || n2.$primevue.config.inputVariant === "filled" }];
}, chipItem: function(e2) {
  var t2 = e2.state, n2 = e2.index;
  return ["p-inputchips-chip-item", { "p-focus": t2.focusedIndex === n2 }];
}, pcChip: "p-inputchips-chip", chipIcon: "p-inputchips-chip-icon", inputItem: "p-inputchips-input-item" } });
var ut = t.extend({ name: "inputswitch" });
var dt = t.extend({ name: "keyfilter-directive" });
var ft = t.extend({ name: "knob", style: `
    .p-knob-range {
        fill: none;
        transition: stroke 0.1s ease-in;
    }

    .p-knob-value {
        animation-name: p-knob-dash-frame;
        animation-fill-mode: forwards;
        fill: none;
    }

    .p-knob-text {
        font-size: 1.3rem;
        text-align: center;
    }

    .p-knob svg {
        border-radius: 50%;
        outline-color: transparent;
        transition:
            background dt('knob.transition.duration'),
            color dt('knob.transition.duration'),
            outline-color dt('knob.transition.duration'),
            box-shadow dt('knob.transition.duration');
    }

    .p-knob svg:focus-visible {
        box-shadow: dt('knob.focus.ring.shadow');
        outline: dt('knob.focus.ring.width') dt('knob.focus.ring.style') dt('knob.focus.ring.color');
        outline-offset: dt('knob.focus.ring.offset');
    }

    @keyframes p-knob-dash-frame {
        100% {
            stroke-dashoffset: 0;
        }
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance;
  return ["p-knob p-component", { "p-disabled": e2.props.disabled, "p-invalid": t2.$invalid }];
}, range: "p-knob-range", value: "p-knob-value", text: "p-knob-text" } });
var pt = t.extend({ name: "listbox", style: `
    .p-listbox {
        display: block;
        background: dt('listbox.background');
        color: dt('listbox.color');
        border: 1px solid dt('listbox.border.color');
        border-radius: dt('listbox.border.radius');
        transition:
            background dt('listbox.transition.duration'),
            color dt('listbox.transition.duration'),
            border-color dt('listbox.transition.duration'),
            box-shadow dt('listbox.transition.duration'),
            outline-color dt('listbox.transition.duration');
        outline-color: transparent;
        box-shadow: dt('listbox.shadow');
    }

    .p-listbox.p-disabled {
        opacity: 1;
        background: dt('listbox.disabled.background');
        color: dt('listbox.disabled.color');
    }

    .p-listbox.p-disabled .p-listbox-option {
        color: dt('listbox.disabled.color');
    }

    .p-listbox.p-invalid {
        border-color: dt('listbox.invalid.border.color');
    }

    .p-listbox-header {
        padding: dt('listbox.list.header.padding');
    }

    .p-listbox-filter {
        width: 100%;
    }

    .p-listbox-list-container {
        overflow: auto;
    }

    .p-listbox-list {
        list-style-type: none;
        margin: 0;
        padding: dt('listbox.list.padding');
        outline: 0 none;
        display: flex;
        flex-direction: column;
        gap: dt('listbox.list.gap');
    }

    .p-listbox-option {
        display: flex;
        align-items: center;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        padding: dt('listbox.option.padding');
        border: 0 none;
        border-radius: dt('listbox.option.border.radius');
        color: dt('listbox.option.color');
        transition:
            background dt('listbox.transition.duration'),
            color dt('listbox.transition.duration'),
            border-color dt('listbox.transition.duration'),
            box-shadow dt('listbox.transition.duration'),
            outline-color dt('listbox.transition.duration');
    }

    .p-listbox-striped li:nth-child(even of .p-listbox-option) {
        background: dt('listbox.option.striped.background');
    }

    .p-listbox .p-listbox-list .p-listbox-option.p-listbox-option-selected {
        background: dt('listbox.option.selected.background');
        color: dt('listbox.option.selected.color');
    }

    .p-listbox:not(.p-disabled) .p-listbox-option.p-listbox-option-selected.p-focus {
        background: dt('listbox.option.selected.focus.background');
        color: dt('listbox.option.selected.focus.color');
    }

    .p-listbox:not(.p-disabled) .p-listbox-option:not(.p-listbox-option-selected):not(.p-disabled).p-focus {
        background: dt('listbox.option.focus.background');
        color: dt('listbox.option.focus.color');
    }

    .p-listbox:not(.p-disabled) .p-listbox-option:not(.p-listbox-option-selected):not(.p-disabled):hover {
        background: dt('listbox.option.focus.background');
        color: dt('listbox.option.focus.color');
    }

    .p-listbox-option-blank-icon {
        flex-shrink: 0;
    }

    .p-listbox-option-check-icon {
        position: relative;
        flex-shrink: 0;
        margin-inline-start: dt('listbox.checkmark.gutter.start');
        margin-inline-end: dt('listbox.checkmark.gutter.end');
        color: dt('listbox.checkmark.color');
    }

    .p-listbox-option-group {
        margin: 0;
        padding: dt('listbox.option.group.padding');
        color: dt('listbox.option.group.color');
        background: dt('listbox.option.group.background');
        font-weight: dt('listbox.option.group.font.weight');
    }

    .p-listbox-empty-message {
        padding: dt('listbox.empty.message.padding');
    }

    .p-listbox-fluid {
        width: 100%;
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-listbox p-component", { "p-listbox-striped": n2.striped, "p-disabled": n2.disabled, "p-listbox-fluid": n2.fluid, "p-invalid": t2.$invalid }];
}, header: "p-listbox-header", pcFilter: "p-listbox-filter", listContainer: "p-listbox-list-container", list: "p-listbox-list", optionGroup: "p-listbox-option-group", option: function(e2) {
  var t2 = e2.instance, n2 = e2.props, r2 = e2.option, i2 = e2.index, a2 = e2.getItemOptions;
  return ["p-listbox-option", { "p-listbox-option-selected": t2.isSelected(r2) && n2.highlightOnSelect, "p-focus": t2.focusedOptionIndex === t2.getOptionIndex(i2, a2), "p-disabled": t2.isOptionDisabled(r2) }];
}, optionCheckIcon: "p-listbox-option-check-icon", optionBlankIcon: "p-listbox-option-blank-icon", emptyMessage: "p-listbox-empty-message" } });
var mt = t.extend({ name: "megamenu", style: `
    .p-megamenu {
        position: relative;
        display: flex;
        align-items: center;
        background: dt('megamenu.background');
        border: 1px solid dt('megamenu.border.color');
        border-radius: dt('megamenu.border.radius');
        color: dt('megamenu.color');
        gap: dt('megamenu.gap');
    }

    .p-megamenu-start,
    .p-megamenu-end {
        display: flex;
        align-items: center;
    }

    .p-megamenu-root-list {
        margin: 0;
        padding: 0;
        list-style: none;
        outline: 0 none;
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: dt('megamenu.gap');
    }

    .p-megamenu-root-list > .p-megamenu-item > .p-megamenu-item-content {
        border-radius: dt('megamenu.base.item.border.radius');
    }

    .p-megamenu-root-list > .p-megamenu-item > .p-megamenu-item-content > .p-megamenu-item-link {
        padding: dt('megamenu.base.item.padding');
    }

    .p-megamenu-item-content {
        transition:
            background dt('megamenu.transition.duration'),
            color dt('megamenu.transition.duration');
        border-radius: dt('megamenu.item.border.radius');
        color: dt('megamenu.item.color');
    }

    .p-megamenu-item-link {
        cursor: pointer;
        display: flex;
        align-items: center;
        text-decoration: none;
        overflow: hidden;
        position: relative;
        color: inherit;
        padding: dt('megamenu.item.padding');
        gap: dt('megamenu.item.gap');
        user-select: none;
        outline: 0 none;
    }

    .p-megamenu-item-label {
        line-height: 1;
    }

    .p-megamenu-item-icon {
        color: dt('megamenu.item.icon.color');
    }

    .p-megamenu-submenu-icon {
        color: dt('megamenu.submenu.icon.color');
        font-size: dt('megamenu.submenu.icon.size');
        width: dt('megamenu.submenu.icon.size');
        height: dt('megamenu.submenu.icon.size');
    }

    .p-megamenu-item.p-focus > .p-megamenu-item-content {
        color: dt('megamenu.item.focus.color');
        background: dt('megamenu.item.focus.background');
    }

    .p-megamenu-item.p-focus > .p-megamenu-item-content .p-megamenu-item-icon {
        color: dt('megamenu.item.icon.focus.color');
    }

    .p-megamenu-item.p-focus > .p-megamenu-item-content .p-megamenu-submenu-icon {
        color: dt('megamenu.submenu.icon.focus.color');
    }

    .p-megamenu-item:not(.p-disabled) > .p-megamenu-item-content:hover {
        color: dt('megamenu.item.focus.color');
        background: dt('megamenu.item.focus.background');
    }

    .p-megamenu-item:not(.p-disabled) > .p-megamenu-item-content:hover .p-megamenu-item-icon {
        color: dt('megamenu.item.icon.focus.color');
    }

    .p-megamenu-item:not(.p-disabled) > .p-megamenu-item-content:hover .p-megamenu-submenu-icon {
        color: dt('megamenu.submenu.icon.focus.color');
    }

    .p-megamenu-item-active > .p-megamenu-item-content {
        color: dt('megamenu.item.active.color');
        background: dt('megamenu.item.active.background');
    }

    .p-megamenu-item-active > .p-megamenu-item-content .p-megamenu-item-icon {
        color: dt('megamenu.item.icon.active.color');
    }

    .p-megamenu-item-active > .p-megamenu-item-content .p-megamenu-submenu-icon {
        color: dt('megamenu.submenu.icon.active.color');
    }

    .p-megamenu-overlay {
        display: none;
        position: absolute;
        width: auto;
        z-index: 1;
        left: 0;
        min-width: 100%;
        padding: dt('megamenu.overlay.padding');
        background: dt('megamenu.overlay.background');
        color: dt('megamenu.overlay.color');
        border: 1px solid dt('megamenu.overlay.border.color');
        border-radius: dt('megamenu.overlay.border.radius');
        box-shadow: dt('megamenu.overlay.shadow');
    }

    .p-megamenu-overlay:dir(rtl) {
        left: auto;
        right: 0;
    }

    .p-megamenu-root-list > .p-megamenu-item-active > .p-megamenu-overlay {
        display: block;
    }

    .p-megamenu-submenu {
        margin: 0;
        list-style: none;
        padding: dt('megamenu.submenu.padding');
        min-width: 12.5rem;
        display: flex;
        flex-direction: column;
        gap: dt('megamenu.submenu.gap');
    }

    .p-megamenu-submenu-label {
        padding: dt('megamenu.submenu.label.padding');
        color: dt('megamenu.submenu.label.color');
        font-weight: dt('megamenu.submenu.label.font.weight');
        background: dt('megamenu.submenu.label.background');
    }

    .p-megamenu-separator {
        border-block-start: 1px solid dt('megamenu.separator.border.color');
    }

    .p-megamenu-horizontal {
        align-items: center;
        padding: dt('megamenu.horizontal.orientation.padding');
    }

    .p-megamenu-horizontal .p-megamenu-root-list {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: dt('megamenu.horizontal.orientation.gap');
    }

    .p-megamenu-horizontal .p-megamenu-end {
        margin-left: auto;
        align-self: center;
    }

    .p-megamenu-horizontal .p-megamenu-end:dir(rtl) {
        margin-left: 0;
        margin-right: auto;
    }

    .p-megamenu-vertical {
        display: inline-flex;
        min-width: 12.5rem;
        flex-direction: column;
        align-items: stretch;
        padding: dt('megamenu.vertical.orientation.padding');
    }

    .p-megamenu-vertical .p-megamenu-root-list {
        align-items: stretch;
        flex-direction: column;
        gap: dt('megamenu.vertical.orientation.gap');
    }

    .p-megamenu-vertical .p-megamenu-root-list > .p-megamenu-item-active > .p-megamenu-overlay {
        left: 100%;
        top: 0;
    }

    .p-megamenu-vertical .p-megamenu-root-list > .p-megamenu-item-active > .p-megamenu-overlay:dir(rtl) {
        left: auto;
        right: 100%;
    }

    .p-megamenu-vertical .p-megamenu-root-list > .p-megamenu-item > .p-megamenu-item-content .p-megamenu-submenu-icon {
        margin-left: auto;
    }

    .p-megamenu-vertical .p-megamenu-root-list > .p-megamenu-item > .p-megamenu-item-content .p-megamenu-submenu-icon:dir(rtl) {
        margin-left: 0;
        margin-right: auto;
        transform: rotate(180deg);
    }

    .p-megamenu-grid {
        display: flex;
    }

    .p-megamenu-col-2,
    .p-megamenu-col-3,
    .p-megamenu-col-4,
    .p-megamenu-col-6,
    .p-megamenu-col-12 {
        flex: 0 0 auto;
        padding: dt('megamenu.overlay.gap');
    }

    .p-megamenu-col-2 {
        width: 16.6667%;
    }

    .p-megamenu-col-3 {
        width: 25%;
    }

    .p-megamenu-col-4 {
        width: 33.3333%;
    }

    .p-megamenu-col-6 {
        width: 50%;
    }

    .p-megamenu-col-12 {
        width: 100%;
    }

    .p-megamenu-button {
        display: none;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        width: dt('megamenu.mobile.button.size');
        height: dt('megamenu.mobile.button.size');
        position: relative;
        color: dt('megamenu.mobile.button.color');
        border: 0 none;
        background: transparent;
        border-radius: dt('megamenu.mobile.button.border.radius');
        transition:
            background dt('megamenu.transition.duration'),
            color dt('megamenu.transition.duration'),
            outline-color dt('megamenu.transition.duration'),
            box-shadow dt('megamenu.transition.duration');
        outline-color: transparent;
    }

    .p-megamenu-button:hover {
        color: dt('megamenu.mobile.button.hover.color');
        background: dt('megamenu.mobile.button.hover.background');
    }

    .p-megamenu-button:focus-visible {
        box-shadow: dt('megamenu.mobile.button.focus.ring.shadow');
        outline: dt('megamenu.mobile.button.focus.ring.width') dt('megamenu.mobile.button.focus.ring.style') dt('megamenu.mobile.button.focus.ring.color');
        outline-offset: dt('megamenu.mobile.button.focus.ring.offset');
    }

    .p-megamenu-mobile {
        display: flex;
    }

    .p-megamenu-mobile .p-megamenu-button {
        display: flex;
    }

    .p-megamenu-mobile .p-megamenu-root-list {
        position: absolute;
        display: none;
        flex-direction: column;
        top: 100%;
        left: 0;
        z-index: 1;
        width: 100%;
        padding: dt('megamenu.submenu.padding');
        gap: dt('megamenu.submenu.gap');
        background: dt('megamenu.overlay.background');
        border: 1px solid dt('megamenu.overlay.border.color');
        box-shadow: dt('megamenu.overlay.shadow');
    }

    .p-megamenu-mobile .p-megamenu-root-list:dir(rtl) {
        left: auto;
        right: 0;
    }

    .p-megamenu-mobile-active .p-megamenu-root-list {
        display: block;
    }

    .p-megamenu-mobile .p-megamenu-root-list .p-megamenu-item {
        width: 100%;
        position: static;
    }

    .p-megamenu-mobile .p-megamenu-overlay {
        position: static;
        border: 0 none;
        border-radius: 0;
        box-shadow: none;
    }

    .p-megamenu-mobile .p-megamenu-grid {
        flex-wrap: wrap;
        overflow: auto;
        max-height: 90%;
    }

    .p-megamenu-mobile .p-megamenu-root-list > .p-megamenu-item > .p-megamenu-item-content .p-megamenu-submenu-icon {
        margin-left: auto;
        transition: transform 0.2s;
    }

    .p-megamenu-mobile .p-megamenu-root-list > .p-megamenu-item > .p-megamenu-item-content .p-megamenu-submenu-icon:dir(rtl) {
        margin-left: 0;
        margin-right: auto;
    }

    .p-megamenu-mobile .p-megamenu-root-list > .p-megamenu-item-active > .p-megamenu-item-content .p-megamenu-submenu-icon {
        transform: rotate(-180deg);
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance;
  return ["p-megamenu p-component", { "p-megamenu-mobile": t2.queryMatches, "p-megamenu-mobile-active": t2.mobileActive, "p-megamenu-horizontal": t2.horizontal, "p-megamenu-vertical": t2.vertical }];
}, start: "p-megamenu-start", button: "p-megamenu-button", rootList: "p-megamenu-root-list", submenuLabel: function(e2) {
  var t2 = e2.instance, n2 = e2.processedItem;
  return ["p-megamenu-submenu-label", { "p-disabled": t2.isItemDisabled(n2) }];
}, item: function(e2) {
  var t2 = e2.instance, n2 = e2.processedItem;
  return ["p-megamenu-item", { "p-megamenu-item-active": t2.isItemActive(n2), "p-focus": t2.isItemFocused(n2), "p-disabled": t2.isItemDisabled(n2) }];
}, itemContent: "p-megamenu-item-content", itemLink: "p-megamenu-item-link", itemIcon: "p-megamenu-item-icon", itemLabel: "p-megamenu-item-label", submenuIcon: "p-megamenu-submenu-icon", overlay: "p-megamenu-overlay", grid: "p-megamenu-grid", column: function(e2) {
  var t2 = e2.instance, n2 = e2.processedItem, r2 = t2.isItemGroup(n2) ? n2.items.length : 0, i2;
  if (t2.$parentInstance.queryMatches) i2 = "p-megamenu-col-12";
  else switch (r2) {
    case 2:
      i2 = "p-megamenu-col-6";
      break;
    case 3:
      i2 = "p-megamenu-col-4";
      break;
    case 4:
      i2 = "p-megamenu-col-3";
      break;
    case 6:
      i2 = "p-megamenu-col-2";
      break;
    default:
      i2 = "p-megamenu-col-12";
  }
  return i2;
}, submenu: "p-megamenu-submenu", separator: "p-megamenu-separator", end: "p-megamenu-end" }, inlineStyles: { rootList: function(e2) {
  return { "max-height": e2.props.scrollHeight, overflow: "auto" };
} } });
var ht = t.extend({ name: "metergroup", style: `
    .p-metergroup {
        display: flex;
        gap: dt('metergroup.gap');
    }

    .p-metergroup-meters {
        display: flex;
        background: dt('metergroup.meters.background');
        border-radius: dt('metergroup.border.radius');
    }

    .p-metergroup-label-list {
        display: flex;
        flex-wrap: wrap;
        margin: 0;
        padding: 0;
        list-style-type: none;
    }

    .p-metergroup-label {
        display: inline-flex;
        align-items: center;
        gap: dt('metergroup.label.gap');
    }

    .p-metergroup-label-marker {
        display: inline-flex;
        width: dt('metergroup.label.marker.size');
        height: dt('metergroup.label.marker.size');
        border-radius: 100%;
    }

    .p-metergroup-label-icon {
        font-size: dt('metergroup.label.icon.size');
        width: dt('metergroup.label.icon.size');
        height: dt('metergroup.label.icon.size');
    }

    .p-metergroup-horizontal {
        flex-direction: column;
    }

    .p-metergroup-label-list-horizontal {
        gap: dt('metergroup.label.list.horizontal.gap');
    }

    .p-metergroup-horizontal .p-metergroup-meters {
        height: dt('metergroup.meters.size');
    }

    .p-metergroup-horizontal .p-metergroup-meter:first-of-type {
        border-start-start-radius: dt('metergroup.border.radius');
        border-end-start-radius: dt('metergroup.border.radius');
    }

    .p-metergroup-horizontal .p-metergroup-meter:last-of-type {
        border-start-end-radius: dt('metergroup.border.radius');
        border-end-end-radius: dt('metergroup.border.radius');
    }

    .p-metergroup-vertical {
        flex-direction: row;
    }

    .p-metergroup-label-list-vertical {
        flex-direction: column;
        gap: dt('metergroup.label.list.vertical.gap');
    }

    .p-metergroup-vertical .p-metergroup-meters {
        flex-direction: column;
        width: dt('metergroup.meters.size');
        height: 100%;
    }

    .p-metergroup-vertical .p-metergroup-label-list {
        align-items: flex-start;
    }

    .p-metergroup-vertical .p-metergroup-meter:first-of-type {
        border-start-start-radius: dt('metergroup.border.radius');
        border-start-end-radius: dt('metergroup.border.radius');
    }

    .p-metergroup-vertical .p-metergroup-meter:last-of-type {
        border-end-start-radius: dt('metergroup.border.radius');
        border-end-end-radius: dt('metergroup.border.radius');
    }
`, classes: { root: function(e2) {
  var t2 = e2.props;
  return ["p-metergroup p-component", { "p-metergroup-horizontal": t2.orientation === "horizontal", "p-metergroup-vertical": t2.orientation === "vertical" }];
}, meters: "p-metergroup-meters", meter: "p-metergroup-meter", labelList: function(e2) {
  var t2 = e2.props;
  return ["p-metergroup-label-list", { "p-metergroup-label-list-vertical": t2.labelOrientation === "vertical", "p-metergroup-label-list-horizontal": t2.labelOrientation === "horizontal" }];
}, label: "p-metergroup-label", labelIcon: "p-metergroup-label-icon", labelMarker: "p-metergroup-label-marker", labelText: "p-metergroup-label-text" } });
var gt = t.extend({ name: "orderlist", style: `
    .p-orderlist {
        display: flex;
        gap: dt('orderlist.gap');
    }

    .p-orderlist .p-listbox {
        flex: 1 1 auto;
    }

    .p-orderlist-controls {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: dt('orderlist.controls.gap');
    }
`, classes: { root: "p-orderlist p-component", controls: "p-orderlist-controls" } });
var _t = t.extend({ name: "organizationchart", style: `
    .p-organizationchart-table {
        border-spacing: 0;
        border-collapse: separate;
        margin: 0 auto;
    }

    .p-organizationchart-table > tbody > tr > td {
        text-align: center;
        vertical-align: top;
        padding: 0 dt('organizationchart.gutter');
    }

    .p-organizationchart-node {
        display: inline-block;
        position: relative;
        border: 1px solid dt('organizationchart.node.border.color');
        background: dt('organizationchart.node.background');
        color: dt('organizationchart.node.color');
        padding: dt('organizationchart.node.padding');
        border-radius: dt('organizationchart.node.border.radius');
        transition:
            background dt('organizationchart.transition.duration'),
            border-color dt('organizationchart.transition.duration'),
            color dt('organizationchart.transition.duration'),
            box-shadow dt('organizationchart.transition.duration');
    }

    .p-organizationchart-node:has(.p-organizationchart-node-toggle-button) {
        padding: dt('organizationchart.node.toggleable.padding');
    }

    .p-organizationchart-node.p-organizationchart-node-selectable:not(.p-organizationchart-node-selected):hover {
        background: dt('organizationchart.node.hover.background');
        color: dt('organizationchart.node.hover.color');
    }

    .p-organizationchart-node-selected {
        background: dt('organizationchart.node.selected.background');
        color: dt('organizationchart.node.selected.color');
    }

    .p-organizationchart-node-toggle-button {
        position: absolute;
        inset-block-end: calc(-1 * calc(dt('organizationchart.node.toggle.button.size') / 2));
        margin-inline-start: calc(-1 * calc(dt('organizationchart.node.toggle.button.size') / 2));
        z-index: 2;
        inset-inline-start: 50%;
        user-select: none;
        cursor: pointer;
        width: dt('organizationchart.node.toggle.button.size');
        height: dt('organizationchart.node.toggle.button.size');
        text-decoration: none;
        background: dt('organizationchart.node.toggle.button.background');
        color: dt('organizationchart.node.toggle.button.color');
        border-radius: dt('organizationchart.node.toggle.button.border.radius');
        border: 1px solid dt('organizationchart.node.toggle.button.border.color');
        display: inline-flex;
        justify-content: center;
        align-items: center;
        outline-color: transparent;
        transition:
            background dt('organizationchart.transition.duration'),
            color dt('organizationchart.transition.duration'),
            border-color dt('organizationchart.transition.duration'),
            outline-color dt('organizationchart.transition.duration'),
            box-shadow dt('organizationchart.transition.duration');
    }

    .p-organizationchart-node-toggle-button:hover {
        background: dt('organizationchart.node.toggle.button.hover.background');
        color: dt('organizationchart.node.toggle.button.hover.color');
    }

    .p-organizationchart-node-toggle-button:focus-visible {
        box-shadow: dt('organizationchart.node.toggle.button.focus.ring.shadow');
        outline: dt('organizationchart.node.toggle.button.focus.ring.width') dt('organizationchart.node.toggle.button.focus.ring.style') dt('organizationchart.node.toggle.button.focus.ring.color');
        outline-offset: dt('organizationchart.node.toggle.button.focus.ring.offset');
    }

    .p-organizationchart-node-toggle-button-icon {
        position: relative;
        inset-block-start: 1px;
    }

    .p-organizationchart-connector-down {
        margin: 0 auto;
        height: dt('organizationchart.connector.height');
        width: 1px;
        background: dt('organizationchart.connector.color');
    }

    .p-organizationchart-connector-right {
        border-radius: 0;
    }

    .p-organizationchart-connector-left {
        border-radius: 0;
        border-inline-end: 1px solid dt('organizationchart.connector.color');
    }

    .p-organizationchart-connector-top {
        border-block-start: 1px solid dt('organizationchart.connector.color');
    }

    .p-organizationchart-node-selectable {
        cursor: pointer;
    }

    .p-organizationchart-connectors :nth-child(1 of .p-organizationchart-connector-left) {
        border-inline-end: 0 none;
    }

    .p-organizationchart-connectors :nth-last-child(1 of .p-organizationchart-connector-left) {
        border-start-end-radius: dt('organizationchart.connector.border.radius');
    }

    .p-organizationchart-connectors :nth-child(1 of .p-organizationchart-connector-right) {
        border-inline-start: 1px solid dt('organizationchart.connector.color');
        border-start-start-radius: dt('organizationchart.connector.border.radius');
    }
`, classes: { root: "p-organizationchart p-component", table: "p-organizationchart-table", node: function(e2) {
  var t2 = e2.instance;
  return ["p-organizationchart-node", { "p-organizationchart-node-selectable": t2.selectable, "p-organizationchart-node-selected": t2.selected }];
}, nodeToggleButton: function(e2) {
  return ["p-organizationchart-node-toggle-button", { "p-disabled": !e2.instance.selectable }];
}, nodeToggleButtonIcon: "p-organizationchart-node-toggle-button-icon", connectors: "p-organizationchart-connectors", connectorDown: "p-organizationchart-connector-down", connectorLeft: function(e2) {
  return ["p-organizationchart-connector-left", { "p-organizationchart-connector-top": e2.index !== 0 }];
}, connectorRight: function(e2) {
  var t2 = e2.props;
  return ["p-organizationchart-connector-right", { "p-organizationchart-connector-top": e2.index !== t2.node.children.length - 1 }];
}, nodeChildren: "p-organizationchart-node-children" } });
var vt = t.extend({ name: "overlaypanel" });
var yt = t.extend({ name: "panel", style: `
    .p-panel {
        display: block;
        border: 1px solid dt('panel.border.color');
        border-radius: dt('panel.border.radius');
        background: dt('panel.background');
        color: dt('panel.color');
    }

    .p-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: dt('panel.header.padding');
        background: dt('panel.header.background');
        color: dt('panel.header.color');
        border-style: solid;
        border-width: dt('panel.header.border.width');
        border-color: dt('panel.header.border.color');
        border-radius: dt('panel.header.border.radius');
    }

    .p-panel-toggleable .p-panel-header {
        padding: dt('panel.toggleable.header.padding');
    }

    .p-panel-title {
        line-height: 1;
        font-weight: dt('panel.title.font.weight');
    }

    .p-panel-content-container {
        display: grid;
        grid-template-rows: 1fr;
    }

    .p-panel-content-wrapper {
        min-height: 0;
    }

    .p-panel-content {
        padding: dt('panel.content.padding');
    }

    .p-panel-footer {
        padding: dt('panel.footer.padding');
    }
`, classes: { root: function(e2) {
  return ["p-panel p-component", { "p-panel-toggleable": e2.props.toggleable }];
}, header: "p-panel-header", title: "p-panel-title", headerActions: "p-panel-header-actions", pcToggleButton: "p-panel-toggle-button", contentContainer: "p-panel-content-container", contentWrapper: "p-panel-content-wrapper", content: "p-panel-content", footer: "p-panel-footer" } });
var bt = t.extend({ name: "panelmenu", style: `
    .p-panelmenu {
        display: flex;
        flex-direction: column;
        gap: dt('panelmenu.gap');
    }

    .p-panelmenu-panel {
        background: dt('panelmenu.panel.background');
        border-width: dt('panelmenu.panel.border.width');
        border-style: solid;
        border-color: dt('panelmenu.panel.border.color');
        color: dt('panelmenu.panel.color');
        border-radius: dt('panelmenu.panel.border.radius');
        padding: dt('panelmenu.panel.padding');
    }

    .p-panelmenu-panel:first-child {
        border-width: dt('panelmenu.panel.first.border.width');
        border-start-start-radius: dt('panelmenu.panel.first.top.border.radius');
        border-start-end-radius: dt('panelmenu.panel.first.top.border.radius');
    }

    .p-panelmenu-panel:last-child {
        border-width: dt('panelmenu.panel.last.border.width');
        border-end-start-radius: dt('panelmenu.panel.last.bottom.border.radius');
        border-end-end-radius: dt('panelmenu.panel.last.bottom.border.radius');
    }

    .p-panelmenu-header {
        outline: 0 none;
    }

    .p-panelmenu-header-content {
        border-radius: dt('panelmenu.item.border.radius');
        transition:
            background dt('panelmenu.transition.duration'),
            color dt('panelmenu.transition.duration'),
            outline-color dt('panelmenu.transition.duration'),
            box-shadow dt('panelmenu.transition.duration');
        outline-color: transparent;
        color: dt('panelmenu.item.color');
    }

    .p-panelmenu-header-link {
        display: flex;
        gap: dt('panelmenu.item.gap');
        padding: dt('panelmenu.item.padding');
        align-items: center;
        user-select: none;
        cursor: pointer;
        position: relative;
        text-decoration: none;
        color: inherit;
    }

    .p-panelmenu-header-icon,
    .p-panelmenu-item-icon {
        color: dt('panelmenu.item.icon.color');
    }

    .p-panelmenu-submenu-icon {
        color: dt('panelmenu.submenu.icon.color');
    }

    .p-panelmenu-submenu-icon:dir(rtl) {
        transform: rotate(180deg);
    }

    .p-panelmenu-header:not(.p-disabled):focus-visible .p-panelmenu-header-content {
        background: dt('panelmenu.item.focus.background');
        color: dt('panelmenu.item.focus.color');
    }

    .p-panelmenu-header:not(.p-disabled):focus-visible .p-panelmenu-header-content .p-panelmenu-header-icon {
        color: dt('panelmenu.item.icon.focus.color');
    }

    .p-panelmenu-header:not(.p-disabled):focus-visible .p-panelmenu-header-content .p-panelmenu-submenu-icon {
        color: dt('panelmenu.submenu.icon.focus.color');
    }

    .p-panelmenu-header:not(.p-disabled) .p-panelmenu-header-content:hover {
        background: dt('panelmenu.item.focus.background');
        color: dt('panelmenu.item.focus.color');
    }

    .p-panelmenu-header:not(.p-disabled) .p-panelmenu-header-content:hover .p-panelmenu-header-icon {
        color: dt('panelmenu.item.icon.focus.color');
    }

    .p-panelmenu-header:not(.p-disabled) .p-panelmenu-header-content:hover .p-panelmenu-submenu-icon {
        color: dt('panelmenu.submenu.icon.focus.color');
    }

    .p-panelmenu-submenu {
        margin: 0;
        padding: 0 0 0 dt('panelmenu.submenu.indent');
        outline: 0;
        list-style: none;
    }

    .p-panelmenu-submenu:dir(rtl) {
        padding: 0 dt('panelmenu.submenu.indent') 0 0;
    }

    .p-panelmenu-item-link {
        display: flex;
        gap: dt('panelmenu.item.gap');
        padding: dt('panelmenu.item.padding');
        align-items: center;
        user-select: none;
        cursor: pointer;
        text-decoration: none;
        color: inherit;
        position: relative;
        overflow: hidden;
    }

    .p-panelmenu-item-label {
        line-height: 1;
    }

    .p-panelmenu-item-content {
        border-radius: dt('panelmenu.item.border.radius');
        transition:
            background dt('panelmenu.transition.duration'),
            color dt('panelmenu.transition.duration'),
            outline-color dt('panelmenu.transition.duration'),
            box-shadow dt('panelmenu.transition.duration');
        color: dt('panelmenu.item.color');
        outline-color: transparent;
    }

    .p-panelmenu-item.p-focus > .p-panelmenu-item-content {
        background: dt('panelmenu.item.focus.background');
        color: dt('panelmenu.item.focus.color');
    }

    .p-panelmenu-item.p-focus > .p-panelmenu-item-content .p-panelmenu-item-icon {
        color: dt('panelmenu.item.focus.color');
    }

    .p-panelmenu-item.p-focus > .p-panelmenu-item-content .p-panelmenu-submenu-icon {
        color: dt('panelmenu.submenu.icon.focus.color');
    }

    .p-panelmenu-item:not(.p-disabled) > .p-panelmenu-item-content:hover {
        background: dt('panelmenu.item.focus.background');
        color: dt('panelmenu.item.focus.color');
    }

    .p-panelmenu-item:not(.p-disabled) > .p-panelmenu-item-content:hover .p-panelmenu-item-icon {
        color: dt('panelmenu.item.icon.focus.color');
    }

    .p-panelmenu-item:not(.p-disabled) > .p-panelmenu-item-content:hover .p-panelmenu-submenu-icon {
        color: dt('panelmenu.submenu.icon.focus.color');
    }

    .p-panelmenu-content-container {
        display: grid;
        grid-template-rows: 1fr;
    }

    .p-panelmenu-content-wrapper {
        min-height: 0;
    }
`, classes: { root: "p-panelmenu p-component", panel: "p-panelmenu-panel", header: function(e2) {
  var t2 = e2.instance, n2 = e2.item;
  return ["p-panelmenu-header", { "p-panelmenu-header-active": t2.isItemActive(n2) && !!n2.items, "p-disabled": t2.isItemDisabled(n2) }];
}, headerContent: "p-panelmenu-header-content", headerLink: "p-panelmenu-header-link", headerIcon: "p-panelmenu-header-icon", headerLabel: "p-panelmenu-header-label", contentContainer: "p-panelmenu-content-container", contentWrapper: "p-panelmenu-content-wrapper", content: "p-panelmenu-content", rootList: "p-panelmenu-root-list", item: function(e2) {
  var t2 = e2.instance, n2 = e2.processedItem;
  return ["p-panelmenu-item", { "p-focus": t2.isItemFocused(n2), "p-disabled": t2.isItemDisabled(n2) }];
}, itemContent: "p-panelmenu-item-content", itemLink: "p-panelmenu-item-link", itemIcon: "p-panelmenu-item-icon", itemLabel: "p-panelmenu-item-label", submenuIcon: "p-panelmenu-submenu-icon", submenu: "p-panelmenu-submenu", separator: "p-menuitem-separator" } });
var xt = t.extend({ name: "picklist", style: `
    .p-picklist {
        display: flex;
        gap: dt('picklist.gap');
    }

    .p-picklist-controls {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: dt('picklist.controls.gap');
    }

    .p-picklist-list-container {
        flex: 1 1 50%;
    }

    .p-picklist .p-listbox {
        height: 100%;
    }
`, classes: { root: "p-picklist p-component", sourceControls: "p-picklist-controls p-picklist-source-controls", sourceListContainer: "p-picklist-list-container p-picklist-source-list-container", transferControls: "p-picklist-controls p-picklist-transfer-controls", targetListContainer: "p-picklist-list-container p-picklist-target-list-container", targetControls: "p-picklist-controls p-picklist-target-controls" } });
var St = t.extend({ name: "portal" });
var Ct = t.extend({ name: "progressspinner", style: `
    .p-progressspinner {
        position: relative;
        margin: 0 auto;
        width: 100px;
        height: 100px;
        display: inline-block;
    }

    .p-progressspinner::before {
        content: '';
        display: block;
        padding-top: 100%;
    }

    .p-progressspinner-spin {
        height: 100%;
        transform-origin: center center;
        width: 100%;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        margin: auto;
        animation: p-progressspinner-rotate 2s linear infinite;
    }

    .p-progressspinner-circle {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: 0;
        stroke: dt('progressspinner.colorOne');
        animation:
            p-progressspinner-dash 1.5s ease-in-out infinite,
            p-progressspinner-color 6s ease-in-out infinite;
        stroke-linecap: round;
    }

    @keyframes p-progressspinner-rotate {
        100% {
            transform: rotate(360deg);
        }
    }
    @keyframes p-progressspinner-dash {
        0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
        }
        50% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -35px;
        }
        100% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -124px;
        }
    }
    @keyframes p-progressspinner-color {
        100%,
        0% {
            stroke: dt('progressspinner.color.one');
        }
        40% {
            stroke: dt('progressspinner.color.two');
        }
        66% {
            stroke: dt('progressspinner.color.three');
        }
        80%,
        90% {
            stroke: dt('progressspinner.color.four');
        }
    }
`, classes: { root: "p-progressspinner", spin: "p-progressspinner-spin", circle: "p-progressspinner-circle" } });
var wt = t.extend({ name: "row" });
var Tt = t.extend({ name: "scrolltop", style: `
    .p-scrolltop.p-button {
        position: fixed !important;
        inset-block-end: 20px;
        inset-inline-end: 20px;
    }

    .p-scrolltop-sticky.p-button {
        position: sticky !important;
        display: flex;
        margin-inline-start: auto;
    }

    .p-scrolltop-enter-from {
        opacity: 0;
    }

    .p-scrolltop-enter-active {
        transition: opacity 300ms;
    }

    .p-scrolltop-leave-to {
        opacity: 0;
    }

    .p-scrolltop-leave-active {
        transition: opacity 300ms;
    }
`, classes: { root: function(e2) {
  return ["p-scrolltop", { "p-scrolltop-sticky": e2.props.target !== "window" }];
}, icon: "p-scrolltop-icon" } });
var Et = t.extend({ name: "sidebar" });
var Dt = t.extend({ name: "slider", style: `
    .p-slider {
        display: block;
        position: relative;
        background: dt('slider.track.background');
        border-radius: dt('slider.track.border.radius');
    }

    .p-slider-handle {
        cursor: grab;
        touch-action: none;
        user-select: none;
        display: flex;
        justify-content: center;
        align-items: center;
        height: dt('slider.handle.height');
        width: dt('slider.handle.width');
        background: dt('slider.handle.background');
        border-radius: dt('slider.handle.border.radius');
        transition:
            background dt('slider.transition.duration'),
            color dt('slider.transition.duration'),
            border-color dt('slider.transition.duration'),
            box-shadow dt('slider.transition.duration'),
            outline-color dt('slider.transition.duration');
        outline-color: transparent;
    }

    .p-slider-handle::before {
        content: '';
        width: dt('slider.handle.content.width');
        height: dt('slider.handle.content.height');
        display: block;
        background: dt('slider.handle.content.background');
        border-radius: dt('slider.handle.content.border.radius');
        box-shadow: dt('slider.handle.content.shadow');
        transition: background dt('slider.transition.duration');
    }

    .p-slider:not(.p-disabled) .p-slider-handle:hover {
        background: dt('slider.handle.hover.background');
    }

    .p-slider:not(.p-disabled) .p-slider-handle:hover::before {
        background: dt('slider.handle.content.hover.background');
    }

    .p-slider-handle:focus-visible {
        box-shadow: dt('slider.handle.focus.ring.shadow');
        outline: dt('slider.handle.focus.ring.width') dt('slider.handle.focus.ring.style') dt('slider.handle.focus.ring.color');
        outline-offset: dt('slider.handle.focus.ring.offset');
    }

    .p-slider-range {
        display: block;
        background: dt('slider.range.background');
        border-radius: dt('slider.track.border.radius');
    }

    .p-slider.p-slider-horizontal {
        height: dt('slider.track.size');
    }

    .p-slider-horizontal .p-slider-range {
        inset-block-start: 0;
        inset-inline-start: 0;
        height: 100%;
    }

    .p-slider-horizontal .p-slider-handle {
        inset-block-start: 50%;
        margin-block-start: calc(-1 * calc(dt('slider.handle.height') / 2));
        margin-inline-start: calc(-1 * calc(dt('slider.handle.width') / 2));
    }

    .p-slider-vertical {
        min-height: 100px;
        width: dt('slider.track.size');
    }

    .p-slider-vertical .p-slider-handle {
        inset-inline-start: 50%;
        margin-inline-start: calc(-1 * calc(dt('slider.handle.width') / 2));
        margin-block-end: calc(-1 * calc(dt('slider.handle.height') / 2));
    }

    .p-slider-vertical .p-slider-range {
        inset-block-end: 0;
        inset-inline-start: 0;
        width: 100%;
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-slider p-component", { "p-disabled": n2.disabled, "p-invalid": t2.$invalid, "p-slider-horizontal": n2.orientation === "horizontal", "p-slider-vertical": n2.orientation === "vertical" }];
}, range: "p-slider-range", handle: "p-slider-handle" }, inlineStyles: { handle: { position: "absolute" }, range: { position: "absolute" } } });
var Ot = `
    .p-speeddial {
        position: static;
        display: flex;
        gap: dt('speeddial.gap');
    }

    .p-speeddial-button {
        z-index: 1;
    }

    .p-speeddial-button.p-speeddial-rotate {
        transition:
            transform 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
            background dt('speeddial.transition.duration'),
            color dt('speeddial.transition.duration'),
            border-color dt('speeddial.transition.duration'),
            box-shadow dt('speeddial.transition.duration'),
            outline-color dt('speeddial.transition.duration');
        will-change: transform;
    }

    .p-speeddial-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: inset-block-start 0s linear dt('speeddial.transition.duration');
        pointer-events: none;
        outline: 0 none;
        z-index: 2;
        gap: dt('speeddial.gap');
    }

    .p-speeddial-item {
        transform: scale(0);
        opacity: 0;
        transition:
            transform 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
            opacity 0.8s;
        will-change: transform;
    }

    .p-speeddial-circle .p-speeddial-item,
    .p-speeddial-semi-circle .p-speeddial-item,
    .p-speeddial-quarter-circle .p-speeddial-item {
        position: absolute;
    }

    .p-speeddial-mask {
        position: absolute;
        border-radius: dt('content.border.radius');
    }

    .p-speeddial-open .p-speeddial-list {
        pointer-events: auto;
    }

    .p-speeddial-open .p-speeddial-item {
        transform: scale(1);
        opacity: 1;
    }

    .p-speeddial-open .p-speeddial-rotate {
        transform: rotate(45deg);
    }
`;
function Q(e2) {
  "@babel/helpers - typeof";
  return Q = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e3) {
    return typeof e3;
  } : function(e3) {
    return e3 && typeof Symbol == "function" && e3.constructor === Symbol && e3 !== Symbol.prototype ? "symbol" : typeof e3;
  }, Q(e2);
}
function $(e2, t2, n2) {
  return (t2 = kt(t2)) in e2 ? Object.defineProperty(e2, t2, { value: n2, enumerable: !0, configurable: !0, writable: !0 }) : e2[t2] = n2, e2;
}
function kt(e2) {
  var t2 = At(e2, "string");
  return Q(t2) == "symbol" ? t2 : t2 + "";
}
function At(e2, t2) {
  if (Q(e2) != "object" || !e2) return e2;
  var n2 = e2[Symbol.toPrimitive];
  if (n2 !== void 0) {
    var r2 = n2.call(e2, t2);
    if (Q(r2) != "object") return r2;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t2 === "string" ? String : Number)(e2);
}
var jt = t.extend({ name: "speeddial", style: Ot, classes: { root: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return [`p-speeddial p-component p-speeddial-${n2.type}`, $($($({}, `p-speeddial-direction-${n2.direction}`, n2.type !== "circle"), "p-speeddial-open", t2.d_visible), "p-disabled", n2.disabled)];
}, pcButton: function(e2) {
  var t2 = e2.props;
  return ["p-speeddial-button", { "p-speeddial-rotate": t2.rotateAnimation && !t2.hideIcon }];
}, list: "p-speeddial-list", item: function(e2) {
  var t2 = e2.item;
  return ["p-speeddial-item", { "p-disabled": t2 && (typeof t2.disabled == "function" ? t2.disabled() : t2.disabled) }];
}, action: "p-speeddial-action", actionIcon: "p-speeddial-action-icon", mask: "p-speeddial-mask p-overlay-mask" }, inlineStyles: { root: function(e2) {
  var t2 = e2.props;
  return { alignItems: (t2.direction === "up" || t2.direction === "down") && "center", justifyContent: (t2.direction === "left" || t2.direction === "right") && "center", flexDirection: t2.direction === "up" ? "column-reverse" : t2.direction === "down" ? "column" : t2.direction === "left" ? "row-reverse" : t2.direction === "right" ? "row" : null };
}, list: function(e2) {
  var t2 = e2.props;
  return { flexDirection: t2.direction === "up" ? "column-reverse" : t2.direction === "down" ? "column" : t2.direction === "left" ? "row-reverse" : t2.direction === "right" ? "row" : null };
} } });
var Mt = t.extend({ name: "splitter", style: `
    .p-splitter {
        display: flex;
        flex-wrap: nowrap;
        border: 1px solid dt('splitter.border.color');
        background: dt('splitter.background');
        border-radius: dt('border.radius.md');
        color: dt('splitter.color');
    }

    .p-splitter-vertical {
        flex-direction: column;
    }

    .p-splitter-gutter {
        flex-grow: 0;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
        background: dt('splitter.gutter.background');
    }

    .p-splitter-gutter-handle {
        border-radius: dt('splitter.handle.border.radius');
        background: dt('splitter.handle.background');
        transition:
            outline-color dt('splitter.transition.duration'),
            box-shadow dt('splitter.transition.duration');
        outline-color: transparent;
    }

    .p-splitter-gutter-handle:focus-visible {
        box-shadow: dt('splitter.handle.focus.ring.shadow');
        outline: dt('splitter.handle.focus.ring.width') dt('splitter.handle.focus.ring.style') dt('splitter.handle.focus.ring.color');
        outline-offset: dt('splitter.handle.focus.ring.offset');
    }

    .p-splitter-horizontal.p-splitter-resizing {
        cursor: col-resize;
        user-select: none;
    }

    .p-splitter-vertical.p-splitter-resizing {
        cursor: row-resize;
        user-select: none;
    }

    .p-splitter-horizontal > .p-splitter-gutter > .p-splitter-gutter-handle {
        height: dt('splitter.handle.size');
        width: 100%;
    }

    .p-splitter-vertical > .p-splitter-gutter > .p-splitter-gutter-handle {
        width: dt('splitter.handle.size');
        height: 100%;
    }

    .p-splitter-horizontal > .p-splitter-gutter {
        cursor: col-resize;
    }

    .p-splitter-vertical > .p-splitter-gutter {
        cursor: row-resize;
    }

    .p-splitterpanel {
        flex-grow: 1;
        overflow: hidden;
    }

    .p-splitterpanel-nested {
        display: flex;
    }

    .p-splitterpanel .p-splitter {
        flex-grow: 1;
        min-width: 0;
        min-height: 0;
        border: 0 none;
    }
`, classes: { root: function(e2) {
  return ["p-splitter p-component", "p-splitter-" + e2.props.layout];
}, gutter: "p-splitter-gutter", gutterHandle: "p-splitter-gutter-handle" } });
var Nt = t.extend({ name: "splitterpanel", classes: { root: function(e2) {
  return ["p-splitterpanel", { "p-splitterpanel-nested": e2.instance.isNested }];
} } });
var Pt = t.extend({ name: "step", classes: { root: function(e2) {
  var t2 = e2.instance;
  return ["p-step", { "p-step-active": t2.active, "p-disabled": t2.isStepDisabled }];
}, header: "p-step-header", number: "p-step-number", title: "p-step-title" } });
var Ft = t.extend({ name: "stepitem", classes: { root: function(e2) {
  return ["p-stepitem", { "p-stepitem-active": e2.instance.isActive }];
} } });
var It = t.extend({ name: "steplist", classes: { root: "p-steplist" } });
var Lt = t.extend({ name: "steppanel", classes: { root: function(e2) {
  var t2 = e2.instance;
  return ["p-steppanel", { "p-steppanel-active": t2.isVertical && t2.active }];
}, contentWrapper: "p-steppanel-content-wrapper", content: "p-steppanel-content" } });
var Rt = t.extend({ name: "steppanels", classes: { root: "p-steppanels" } });
var zt = t.extend({ name: "stepper", style: `
    .p-steplist {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0;
        padding: 0;
        list-style-type: none;
        overflow-x: auto;
    }

    .p-step {
        position: relative;
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        gap: dt('stepper.step.gap');
        padding: dt('stepper.step.padding');
    }

    .p-step:last-of-type {
        flex: initial;
    }

    .p-step-header {
        border: 0 none;
        display: inline-flex;
        align-items: center;
        text-decoration: none;
        cursor: pointer;
        transition:
            background dt('stepper.transition.duration'),
            color dt('stepper.transition.duration'),
            border-color dt('stepper.transition.duration'),
            outline-color dt('stepper.transition.duration'),
            box-shadow dt('stepper.transition.duration');
        border-radius: dt('stepper.step.header.border.radius');
        outline-color: transparent;
        background: transparent;
        padding: dt('stepper.step.header.padding');
        gap: dt('stepper.step.header.gap');
    }

    .p-step-header:focus-visible {
        box-shadow: dt('stepper.step.header.focus.ring.shadow');
        outline: dt('stepper.step.header.focus.ring.width') dt('stepper.step.header.focus.ring.style') dt('stepper.step.header.focus.ring.color');
        outline-offset: dt('stepper.step.header.focus.ring.offset');
    }

    .p-stepper.p-stepper-readonly .p-step {
        cursor: auto;
    }

    .p-step-title {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        color: dt('stepper.step.title.color');
        font-weight: dt('stepper.step.title.font.weight');
        transition:
            background dt('stepper.transition.duration'),
            color dt('stepper.transition.duration'),
            border-color dt('stepper.transition.duration'),
            box-shadow dt('stepper.transition.duration'),
            outline-color dt('stepper.transition.duration');
    }

    .p-step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        color: dt('stepper.step.number.color');
        border: 2px solid dt('stepper.step.number.border.color');
        background: dt('stepper.step.number.background');
        min-width: dt('stepper.step.number.size');
        height: dt('stepper.step.number.size');
        line-height: dt('stepper.step.number.size');
        font-size: dt('stepper.step.number.font.size');
        z-index: 1;
        border-radius: dt('stepper.step.number.border.radius');
        position: relative;
        font-weight: dt('stepper.step.number.font.weight');
    }

    .p-step-number::after {
        content: ' ';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: dt('stepper.step.number.border.radius');
        box-shadow: dt('stepper.step.number.shadow');
    }

    .p-step-active .p-step-header {
        cursor: default;
    }

    .p-step-active .p-step-number {
        background: dt('stepper.step.number.active.background');
        border-color: dt('stepper.step.number.active.border.color');
        color: dt('stepper.step.number.active.color');
    }

    .p-step-active .p-step-title {
        color: dt('stepper.step.title.active.color');
    }

    .p-step:not(.p-disabled):focus-visible {
        outline: dt('focus.ring.width') dt('focus.ring.style') dt('focus.ring.color');
        outline-offset: dt('focus.ring.offset');
    }

    .p-step:has(~ .p-step-active) .p-stepper-separator {
        background: dt('stepper.separator.active.background');
    }

    .p-stepper-separator {
        flex: 1 1 0;
        background: dt('stepper.separator.background');
        width: 100%;
        height: dt('stepper.separator.size');
        transition:
            background dt('stepper.transition.duration'),
            color dt('stepper.transition.duration'),
            border-color dt('stepper.transition.duration'),
            box-shadow dt('stepper.transition.duration'),
            outline-color dt('stepper.transition.duration');
    }

    .p-steppanels {
        padding: dt('stepper.steppanels.padding');
    }

    .p-steppanel {
        background: dt('stepper.steppanel.background');
        color: dt('stepper.steppanel.color');
    }

    .p-stepper:has(.p-stepitem) {
        display: flex;
        flex-direction: column;
    }

    .p-stepitem {
        display: flex;
        flex-direction: column;
        flex: initial;
    }

    .p-stepitem.p-stepitem-active {
        flex: 1 1 auto;
    }

    .p-stepitem .p-step {
        flex: initial;
    }
    
    .p-stepitem .p-steppanel {
        display: grid;
        grid-template-rows: 1fr;
    }

    .p-stepitem .p-steppanel-content-wrapper {
        display: flex;
        flex: 1 1 auto;
        min-height: 0;
    }
    .p-stepitem .p-steppanel-content {
        width: 100%;
        padding: dt('stepper.steppanel.padding');
        margin-inline-start: 1rem;
    }

    .p-stepitem .p-stepper-separator {
        flex: 0 0 auto;
        width: dt('stepper.separator.size');
        height: auto;
        margin: dt('stepper.separator.margin');
        position: relative;
        left: calc(-1 * dt('stepper.separator.size'));
    }

    .p-stepitem .p-stepper-separator:dir(rtl) {
        left: calc(-9 * dt('stepper.separator.size'));
    }

    .p-stepitem:has(~ .p-stepitem-active) .p-stepper-separator {
        background: dt('stepper.separator.active.background');
    }

    .p-stepitem:last-of-type .p-steppanel {
        padding-inline-start: dt('stepper.step.number.size');
    }
`, classes: { root: function(e2) {
  return ["p-stepper p-component", { "p-readonly": e2.props.linear }];
}, separator: "p-stepper-separator" } });
var Bt = t.extend({ name: "steps", style: `
    .p-steps {
        position: relative;
    }

    .p-steps-list {
        padding: 0;
        margin: 0;
        list-style-type: none;
        display: flex;
    }

    .p-steps-item {
        position: relative;
        display: flex;
        justify-content: center;
        flex: 1 1 auto;
    }

    .p-steps-item.p-disabled,
    .p-steps-item.p-disabled * {
        opacity: 1;
        pointer-events: auto;
        user-select: auto;
        cursor: auto;
    }

    .p-steps-item:before {
        content: ' ';
        border-top: 2px solid dt('steps.separator.background');
        width: 100%;
        top: 50%;
        left: 0;
        display: block;
        position: absolute;
        margin-top: calc(-1rem + 1px);
    }

    .p-steps-item:first-child::before {
        width: calc(50% + 1rem);
        transform: translateX(100%);
    }

    .p-steps-item:last-child::before {
        width: 50%;
    }

    .p-steps-item-link {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
        text-decoration: none;
        transition:
            outline-color dt('steps.transition.duration'),
            box-shadow dt('steps.transition.duration');
        border-radius: dt('steps.item.link.border.radius');
        outline-color: transparent;
        gap: dt('steps.item.link.gap');
    }

    .p-steps-item-link:not(.p-disabled):focus-visible {
        box-shadow: dt('steps.item.link.focus.ring.shadow');
        outline: dt('steps.item.link.focus.ring.width') dt('steps.item.link.focus.ring.style') dt('steps.item.link.focus.ring.color');
        outline-offset: dt('steps.item.link.focus.ring.offset');
    }

    .p-steps-item-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        color: dt('steps.item.label.color');
        display: block;
        font-weight: dt('steps.item.label.font.weight');
    }

    .p-steps-item-number {
        display: flex;
        align-items: center;
        justify-content: center;
        color: dt('steps.item.number.color');
        border: 2px solid dt('steps.item.number.border.color');
        background: dt('steps.item.number.background');
        min-width: dt('steps.item.number.size');
        height: dt('steps.item.number.size');
        line-height: dt('steps.item.number.size');
        font-size: dt('steps.item.number.font.size');
        z-index: 1;
        border-radius: dt('steps.item.number.border.radius');
        position: relative;
        font-weight: dt('steps.item.number.font.weight');
    }

    .p-steps-item-number::after {
        content: ' ';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: dt('steps.item.number.border.radius');
        box-shadow: dt('steps.item.number.shadow');
    }

    .p-steps:not(.p-readonly) .p-steps-item {
        cursor: pointer;
    }

    .p-steps-item-active .p-steps-item-number {
        background: dt('steps.item.number.active.background');
        border-color: dt('steps.item.number.active.border.color');
        color: dt('steps.item.number.active.color');
    }

    .p-steps-item-active .p-steps-item-label {
        color: dt('steps.item.label.active.color');
    }
`, classes: { root: function(e2) {
  return ["p-steps p-component", { "p-readonly": e2.props.readonly }];
}, list: "p-steps-list", item: function(e2) {
  var t2 = e2.instance, n2 = e2.item, r2 = e2.index;
  return ["p-steps-item", { "p-steps-item-active": t2.isActive(r2), "p-disabled": t2.isItemDisabled(n2, r2) }];
}, itemLink: "p-steps-item-link", itemNumber: "p-steps-item-number", itemLabel: "p-steps-item-label" } });
var Vt = t.extend({ name: "styleclass-directive" });
var Ht = t.extend({ name: "tabmenu", style: `
    .p-tabmenu {
        overflow-x: auto;
    }

    .p-tabmenu-tablist {
        display: flex;
        margin: 0;
        padding: 0;
        list-style-type: none;
        background: dt('tabmenu.tablist.background');
        border-style: solid;
        border-color: dt('tabmenu.tablist.border.color');
        border-width: dt('tabmenu.tablist.border.width');
        position: relative;
    }

    .p-tabmenu-item-link {
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        text-decoration: none;
        position: relative;
        overflow: hidden;
        background: dt('tabmenu.item.background');
        border-style: solid;
        border-width: dt('tabmenu.item.border.width');
        border-color: dt('tabmenu.item.border.color');
        color: dt('tabmenu.item.color');
        padding: dt('tabmenu.item.padding');
        font-weight: dt('tabmenu.item.font.weight');
        transition:
            background dt('tabmenu.transition.duration'),
            border-color dt('tabmenu.transition.duration'),
            color dt('tabmenu.transition.duration'),
            outline-color dt('tabmenu.transition.duration'),
            box-shadow dt('tabmenu.transition.duration');
        margin: dt('tabmenu.item.margin');
        outline-color: transparent;
        gap: dt('tabmenu.item.gap');
    }

    .p-tabmenu-item-link:focus-visible {
        z-index: 1;
        box-shadow: dt('tabmenu.item.focus.ring.shadow');
        outline: dt('tabmenu.item.focus.ring.width') dt('tabmenu.item.focus.ring.style') dt('tabmenu.item.focus.ring.color');
        outline-offset: dt('tabmenu.item.focus.ring.offset');
    }

    .p-tabmenu-item-icon {
        color: dt('tabmenu.item.icon.color');
        transition:
            background dt('tabmenu.transition.duration'),
            border-color dt('tabmenu.transition.duration'),
            color dt('tabmenu.transition.duration'),
            outline-color dt('tabmenu.transition.duration'),
            box-shadow dt('tabmenu.transition.duration');
    }

    .p-tabmenu-item-label {
        line-height: 1;
    }

    .p-tabmenu-item:not(.p-tabmenu-item-active):not(.p-disabled):hover .p-tabmenu-item-link {
        background: dt('tabmenu.item.hover.background');
        border-color: dt('tabmenu.item.hover.border.color');
        color: dt('tabmenu.item.hover.color');
    }

    .p-tabmenu-item:not(.p-tabmenu-item-active):not(.p-disabled):hover .p-tabmenu-item-icon {
        color: dt('tabmenu.item.icon.hover.color');
    }

    .p-tabmenu-item-active .p-tabmenu-item-link {
        background: dt('tabmenu.item.active.background');
        border-color: dt('tabmenu.item.active.border.color');
        color: dt('tabmenu.item.active.color');
    }

    .p-tabmenu-item-active .p-tabmenu-item-icon {
        color: dt('tabmenu.item.icon.active.color');
    }

    .p-tabmenu-active-bar {
        z-index: 1;
        display: block;
        position: absolute;
        bottom: dt('tabmenu.active.bar.bottom');
        height: dt('tabmenu.active.bar.height');
        background: dt('tabmenu.active.bar.background');
        transition: 250ms cubic-bezier(0.35, 0, 0.25, 1);
    }

    .p-tabmenu::-webkit-scrollbar {
        display: none;
    }
`, classes: { root: "p-tabmenu p-component", tablist: "p-tabmenu-tablist", item: function(e2) {
  var t2 = e2.instance, n2 = e2.index, r2 = e2.item;
  return ["p-tabmenu-item", { "p-tabmenu-item-active": t2.d_activeIndex === n2, "p-disabled": t2.disabled(r2) }];
}, itemLink: "p-tabmenu-item-link", itemIcon: "p-tabmenu-item-icon", itemLabel: "p-tabmenu-item-label", activeBar: "p-tabmenu-active-bar" } });
var Ut = t.extend({ name: "tabview", style: `
    .p-tabview-tablist-container {
        position: relative;
    }

    .p-tabview-scrollable > .p-tabview-tablist-container {
        overflow: hidden;
    }

    .p-tabview-tablist-scroll-container {
        overflow-x: auto;
        overflow-y: hidden;
        scroll-behavior: smooth;
        scrollbar-width: none;
        overscroll-behavior: contain auto;
    }

    .p-tabview-tablist-scroll-container::-webkit-scrollbar {
        display: none;
    }

    .p-tabview-tablist {
        display: flex;
        margin: 0;
        padding: 0;
        list-style-type: none;
        flex: 1 1 auto;
        background: dt('tabview.tab.list.background');
        border: 1px solid dt('tabview.tab.list.border.color');
        border-width: 0 0 1px 0;
        position: relative;
    }

    .p-tabview-tab-header {
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        text-decoration: none;
        position: relative;
        overflow: hidden;
        border-style: solid;
        border-width: 0 0 1px 0;
        border-color: transparent transparent dt('tabview.tab.border.color') transparent;
        color: dt('tabview.tab.color');
        padding: 1rem 1.125rem;
        font-weight: 600;
        border-top-right-radius: dt('border.radius.md');
        border-top-left-radius: dt('border.radius.md');
        transition:
            color dt('tabview.transition.duration'),
            outline-color dt('tabview.transition.duration');
        margin: 0 0 -1px 0;
        outline-color: transparent;
    }

    .p-tabview-tablist-item:not(.p-disabled) .p-tabview-tab-header:focus-visible {
        outline: dt('focus.ring.width') dt('focus.ring.style') dt('focus.ring.color');
        outline-offset: -1px;
    }

    .p-tabview-tablist-item:not(.p-highlight):not(.p-disabled):hover > .p-tabview-tab-header {
        color: dt('tabview.tab.hover.color');
    }

    .p-tabview-tablist-item.p-highlight > .p-tabview-tab-header {
        color: dt('tabview.tab.active.color');
    }

    .p-tabview-tab-title {
        line-height: 1;
        white-space: nowrap;
    }

    .p-tabview-next-button,
    .p-tabview-prev-button {
        position: absolute;
        top: 0;
        margin: 0;
        padding: 0;
        z-index: 2;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: dt('tabview.nav.button.background');
        color: dt('tabview.nav.button.color');
        width: 2.5rem;
        border-radius: 0;
        outline-color: transparent;
        transition:
            color dt('tabview.transition.duration'),
            outline-color dt('tabview.transition.duration');
        box-shadow: dt('tabview.nav.button.shadow');
        border: none;
        cursor: pointer;
        user-select: none;
    }

    .p-tabview-next-button:focus-visible,
    .p-tabview-prev-button:focus-visible {
        outline: dt('focus.ring.width') dt('focus.ring.style') dt('focus.ring.color');
        outline-offset: dt('focus.ring.offset');
    }

    .p-tabview-next-button:hover,
    .p-tabview-prev-button:hover {
        color: dt('tabview.nav.button.hover.color');
    }

    .p-tabview-prev-button {
        left: 0;
    }

    .p-tabview-next-button {
        right: 0;
    }

    .p-tabview-panels {
        background: dt('tabview.tab.panel.background');
        color: dt('tabview.tab.panel.color');
        padding: 0.875rem 1.125rem 1.125rem 1.125rem;
    }

    .p-tabview-ink-bar {
        z-index: 1;
        display: block;
        position: absolute;
        bottom: -1px;
        height: 1px;
        background: dt('tabview.tab.active.border.color');
        transition: 250ms cubic-bezier(0.35, 0, 0.25, 1);
    }
`, classes: { root: function(e2) {
  return ["p-tabview p-component", { "p-tabview-scrollable": e2.props.scrollable }];
}, navContainer: "p-tabview-tablist-container", prevButton: "p-tabview-prev-button", navContent: "p-tabview-tablist-scroll-container", nav: "p-tabview-tablist", tab: { header: function(e2) {
  var t2 = e2.instance, n2 = e2.tab, r2 = e2.index;
  return ["p-tabview-tablist-item", t2.getTabProp(n2, "headerClass"), { "p-tabview-tablist-item-active": t2.d_activeIndex === r2, "p-disabled": t2.getTabProp(n2, "disabled") }];
}, headerAction: "p-tabview-tab-header", headerTitle: "p-tabview-tab-title", content: function(e2) {
  var t2 = e2.instance, n2 = e2.tab;
  return ["p-tabview-panel", t2.getTabProp(n2, "contentClass")];
} }, inkbar: "p-tabview-ink-bar", nextButton: "p-tabview-next-button", panelContainer: "p-tabview-panels" } });
var Wt = t.extend({ name: "tag", style: `
    .p-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: dt('tag.primary.background');
        color: dt('tag.primary.color');
        font-size: dt('tag.font.size');
        font-weight: dt('tag.font.weight');
        padding: dt('tag.padding');
        border-radius: dt('tag.border.radius');
        gap: dt('tag.gap');
    }

    .p-tag-icon {
        font-size: dt('tag.icon.size');
        width: dt('tag.icon.size');
        height: dt('tag.icon.size');
    }

    .p-tag-rounded {
        border-radius: dt('tag.rounded.border.radius');
    }

    .p-tag-success {
        background: dt('tag.success.background');
        color: dt('tag.success.color');
    }

    .p-tag-info {
        background: dt('tag.info.background');
        color: dt('tag.info.color');
    }

    .p-tag-warn {
        background: dt('tag.warn.background');
        color: dt('tag.warn.color');
    }

    .p-tag-danger {
        background: dt('tag.danger.background');
        color: dt('tag.danger.color');
    }

    .p-tag-secondary {
        background: dt('tag.secondary.background');
        color: dt('tag.secondary.color');
    }

    .p-tag-contrast {
        background: dt('tag.contrast.background');
        color: dt('tag.contrast.color');
    }
`, classes: { root: function(e2) {
  var t2 = e2.props;
  return ["p-tag p-component", { "p-tag-info": t2.severity === "info", "p-tag-success": t2.severity === "success", "p-tag-warn": t2.severity === "warn", "p-tag-danger": t2.severity === "danger", "p-tag-secondary": t2.severity === "secondary", "p-tag-contrast": t2.severity === "contrast", "p-tag-rounded": t2.rounded }];
}, icon: "p-tag-icon", label: "p-tag-label" } });
var Gt = t.extend({ name: "terminal", style: `
    .p-terminal {
        display: block;
        height: dt('terminal.height');
        overflow: auto;
        background: dt('terminal.background');
        color: dt('terminal.color');
        border: 1px solid dt('terminal.border.color');
        padding: dt('terminal.padding');
        border-radius: dt('terminal.border.radius');
    }

    .p-terminal-prompt {
        display: flex;
        align-items: center;
    }

    .p-terminal-prompt-value {
        flex: 1 1 auto;
        border: 0 none;
        background: transparent;
        color: inherit;
        padding: 0;
        outline: 0 none;
        font-family: inherit;
        font-feature-settings: inherit;
        font-size: 1rem;
    }

    .p-terminal-prompt-label {
        margin-inline-end: dt('terminal.prompt.gap');
    }

    .p-terminal-input::-ms-clear {
        display: none;
    }

    .p-terminal-command-response {
        margin: dt('terminal.command.response.margin');
    }
`, classes: { root: "p-terminal p-component", welcomeMessage: "p-terminal-welcome-message", commandList: "p-terminal-command-list", command: "p-terminal-command", commandValue: "p-terminal-command-value", commandResponse: "p-terminal-command-response", prompt: "p-terminal-prompt", promptLabel: "p-terminal-prompt-label", promptValue: "p-terminal-prompt-value" } });
var Kt = t.extend({ name: "timeline", style: `
    .p-timeline {
        display: flex;
        flex-grow: 1;
        flex-direction: column;
        direction: ltr;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .p-timeline-left .p-timeline-event-opposite {
        text-align: right;
    }

    .p-timeline-left .p-timeline-event-content {
        text-align: left;
    }

    .p-timeline-right .p-timeline-event {
        flex-direction: row-reverse;
    }

    .p-timeline-right .p-timeline-event-opposite {
        text-align: left;
    }

    .p-timeline-right .p-timeline-event-content {
        text-align: right;
    }

    .p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(even) {
        flex-direction: row-reverse;
    }

    .p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(odd) .p-timeline-event-opposite {
        text-align: right;
    }

    .p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(odd) .p-timeline-event-content {
        text-align: left;
    }

    .p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(even) .p-timeline-event-opposite {
        text-align: left;
    }

    .p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(even) .p-timeline-event-content {
        text-align: right;
    }

    .p-timeline-vertical .p-timeline-event-opposite,
    .p-timeline-vertical .p-timeline-event-content {
        padding: dt('timeline.vertical.event.content.padding');
    }

    .p-timeline-vertical .p-timeline-event-connector {
        width: dt('timeline.event.connector.size');
    }

    .p-timeline-event {
        display: flex;
        position: relative;
        min-height: dt('timeline.event.min.height');
    }

    .p-timeline-event:last-child {
        min-height: 0;
    }

    .p-timeline-event-opposite {
        flex: 1;
    }

    .p-timeline-event-content {
        flex: 1;
    }

    .p-timeline-event-separator {
        flex: 0;
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .p-timeline-event-marker {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        align-self: baseline;
        border-width: dt('timeline.event.marker.border.width');
        border-style: solid;
        border-color: dt('timeline.event.marker.border.color');
        border-radius: dt('timeline.event.marker.border.radius');
        width: dt('timeline.event.marker.size');
        height: dt('timeline.event.marker.size');
        background: dt('timeline.event.marker.background');
    }

    .p-timeline-event-marker::before {
        content: ' ';
        border-radius: dt('timeline.event.marker.content.border.radius');
        width: dt('timeline.event.marker.content.size');
        height: dt('timeline.event.marker.content.size');
        background: dt('timeline.event.marker.content.background');
    }

    .p-timeline-event-marker::after {
        content: ' ';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: dt('timeline.event.marker.border.radius');
        box-shadow: dt('timeline.event.marker.content.inset.shadow');
    }

    .p-timeline-event-connector {
        flex-grow: 1;
        background: dt('timeline.event.connector.color');
    }

    .p-timeline-horizontal {
        flex-direction: row;
    }

    .p-timeline-horizontal .p-timeline-event {
        flex-direction: column;
        flex: 1;
    }

    .p-timeline-horizontal .p-timeline-event:last-child {
        flex: 0;
    }

    .p-timeline-horizontal .p-timeline-event-separator {
        flex-direction: row;
    }

    .p-timeline-horizontal .p-timeline-event-connector {
        width: 100%;
        height: dt('timeline.event.connector.size');
    }

    .p-timeline-horizontal .p-timeline-event-opposite,
    .p-timeline-horizontal .p-timeline-event-content {
        padding: dt('timeline.horizontal.event.content.padding');
    }

    .p-timeline-horizontal.p-timeline-alternate .p-timeline-event:nth-child(even) {
        flex-direction: column-reverse;
    }

    .p-timeline-bottom .p-timeline-event {
        flex-direction: column-reverse;
    }
`, classes: { root: function(e2) {
  var t2 = e2.props;
  return ["p-timeline p-component", "p-timeline-" + t2.align, "p-timeline-" + t2.layout];
}, event: "p-timeline-event", eventOpposite: "p-timeline-event-opposite", eventSeparator: "p-timeline-event-separator", eventMarker: "p-timeline-event-marker", eventConnector: "p-timeline-event-connector", eventContent: "p-timeline-event-content" } });
var qt = t.extend({ name: "toolbar", style: `
    .p-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        padding: dt('toolbar.padding');
        background: dt('toolbar.background');
        border: 1px solid dt('toolbar.border.color');
        color: dt('toolbar.color');
        border-radius: dt('toolbar.border.radius');
        gap: dt('toolbar.gap');
    }

    .p-toolbar-start,
    .p-toolbar-center,
    .p-toolbar-end {
        display: flex;
        align-items: center;
    }
`, classes: { root: "p-toolbar p-component", start: "p-toolbar-start", center: "p-toolbar-center", end: "p-toolbar-end" } });
var Jt = t.extend({ name: "treeselect", style: `
    .p-treeselect {
        display: inline-flex;
        cursor: pointer;
        position: relative;
        user-select: none;
        background: dt('treeselect.background');
        border: 1px solid dt('treeselect.border.color');
        transition:
            background dt('treeselect.transition.duration'),
            color dt('treeselect.transition.duration'),
            border-color dt('treeselect.transition.duration'),
            outline-color dt('treeselect.transition.duration'),
            box-shadow dt('treeselect.transition.duration');
        border-radius: dt('treeselect.border.radius');
        outline-color: transparent;
        box-shadow: dt('treeselect.shadow');
    }

    .p-treeselect:not(.p-disabled):hover {
        border-color: dt('treeselect.hover.border.color');
    }

    .p-treeselect:not(.p-disabled).p-focus {
        border-color: dt('treeselect.focus.border.color');
        box-shadow: dt('treeselect.focus.ring.shadow');
        outline: dt('treeselect.focus.ring.width') dt('treeselect.focus.ring.style') dt('treeselect.focus.ring.color');
        outline-offset: dt('treeselect.focus.ring.offset');
    }

    .p-treeselect.p-variant-filled {
        background: dt('treeselect.filled.background');
    }

    .p-treeselect.p-variant-filled:not(.p-disabled):hover {
        background: dt('treeselect.filled.hover.background');
    }

    .p-treeselect.p-variant-filled.p-focus {
        background: dt('treeselect.filled.focus.background');
    }

    .p-treeselect.p-invalid {
        border-color: dt('treeselect.invalid.border.color');
    }

    .p-treeselect.p-disabled {
        opacity: 1;
        background: dt('treeselect.disabled.background');
    }

    .p-treeselect-clear-icon {
        align-self: center;
        color: dt('treeselect.clear.icon.color');
        inset-inline-end: dt('treeselect.dropdown.width');
    }

    .p-treeselect-dropdown {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: transparent;
        color: dt('treeselect.dropdown.color');
        width: dt('treeselect.dropdown.width');
        border-start-end-radius: dt('border.radius.md');
        border-end-end-radius: dt('border.radius.md');
    }

    .p-treeselect-label-container {
        overflow: hidden;
        flex: 1 1 auto;
        cursor: pointer;
    }

    .p-treeselect-label {
        display: flex;
        align-items: center;
        gap: calc(dt('treeselect.padding.y') / 2);
        white-space: nowrap;
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: dt('treeselect.padding.y') dt('treeselect.padding.x');
        color: dt('treeselect.color');
    }

    .p-treeselect-label.p-placeholder {
        color: dt('treeselect.placeholder.color');
    }

    .p-treeselect.p-invalid .p-treeselect-label.p-placeholder {
        color: dt('treeselect.invalid.placeholder.color');
    }

    .p-treeselect:has(.p-select-clear-icon) .p-treeselect-label {
        padding-inline-end: dt('treeselect.padding.x');
    }

    .p-treeselect.p-disabled .p-treeselect-label {
        color: dt('treeselect.disabled.color');
    }

    .p-treeselect-label-empty {
        overflow: hidden;
        visibility: hidden;
    }

    .p-treeselect-overlay {
        position: absolute;
        top: 0;
        left: 0;
        background: dt('treeselect.overlay.background');
        color: dt('treeselect.overlay.color');
        border: 1px solid dt('treeselect.overlay.border.color');
        border-radius: dt('treeselect.overlay.border.radius');
        box-shadow: dt('treeselect.overlay.shadow');
        overflow: hidden;
        min-width: 100%;
        will-change: transform;
    }

    .p-treeselect-tree-container {
        overflow: auto;
    }

    .p-treeselect-empty-message {
        padding: dt('treeselect.empty.message.padding');
        background: transparent;
    }

    .p-treeselect-fluid {
        display: flex;
    }

    .p-treeselect-overlay .p-tree {
        padding: dt('treeselect.tree.padding');
    }

    .p-treeselect-overlay .p-tree-loading {
        min-height: 3rem;
    }

    .p-treeselect-label .p-chip {
        padding-block-start: calc(dt('treeselect.padding.y') / 2);
        padding-block-end: calc(dt('treeselect.padding.y') / 2);
        border-radius: dt('treeselect.chip.border.radius');
    }

    .p-treeselect-label:has(.p-chip) {
        padding: calc(dt('treeselect.padding.y') / 2) calc(dt('treeselect.padding.x') / 2);
    }

    .p-treeselect-sm .p-treeselect-label {
        font-size: dt('treeselect.sm.font.size');
        padding-block: dt('treeselect.sm.padding.y');
        padding-inline: dt('treeselect.sm.padding.x');
    }

    .p-treeselect-sm .p-treeselect-dropdown .p-icon {
        font-size: dt('treeselect.sm.font.size');
        width: dt('treeselect.sm.font.size');
        height: dt('treeselect.sm.font.size');
    }

    .p-treeselect-lg .p-treeselect-label {
        font-size: dt('treeselect.lg.font.size');
        padding-block: dt('treeselect.lg.padding.y');
        padding-inline: dt('treeselect.lg.padding.x');
    }

    .p-treeselect-lg .p-treeselect-dropdown .p-icon {
        font-size: dt('treeselect.lg.font.size');
        width: dt('treeselect.lg.font.size');
        height: dt('treeselect.lg.font.size');
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-treeselect p-component p-inputwrapper", { "p-treeselect-display-chip": n2.display === "chip", "p-disabled": n2.disabled, "p-invalid": t2.$invalid, "p-focus": t2.focused, "p-variant-filled": t2.$variant === "filled", "p-inputwrapper-filled": t2.$filled, "p-inputwrapper-focus": t2.focused || t2.overlayVisible, "p-treeselect-open": t2.overlayVisible, "p-treeselect-fluid": t2.$fluid, "p-treeselect-sm p-inputfield-sm": n2.size === "small", "p-treeselect-lg p-inputfield-lg": n2.size === "large" }];
}, labelContainer: "p-treeselect-label-container", label: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-treeselect-label", { "p-placeholder": t2.label === n2.placeholder, "p-treeselect-label-empty": !n2.placeholder && t2.emptyValue }];
}, clearIcon: "p-treeselect-clear-icon", chip: "p-treeselect-chip-item", pcChip: "p-treeselect-chip", dropdown: "p-treeselect-dropdown", dropdownIcon: "p-treeselect-dropdown-icon", panel: "p-treeselect-overlay p-component", treeContainer: "p-treeselect-tree-container", emptyMessage: "p-treeselect-empty-message" }, inlineStyles: { root: function(e2) {
  return { position: e2.props.appendTo === "self" ? "relative" : void 0 };
} } });
var Yt = t.extend({ name: "treetable", style: `
    .p-treetable {
        position: relative;
    }

    .p-treetable-table {
        border-spacing: 0;
        border-collapse: separate;
        width: 100%;
    }

    .p-treetable-scrollable > .p-treetable-table-container {
        position: relative;
    }

    .p-treetable-scrollable-table > .p-treetable-thead {
        inset-block-start: 0;
        z-index: 1;
    }

    .p-treetable-scrollable-table > .p-treetable-frozen-tbody {
        position: sticky;
        z-index: 1;
    }

    .p-treetable-scrollable-table > .p-treetable-tfoot {
        inset-block-end: 0;
        z-index: 1;
    }

    .p-treetable-scrollable .p-treetable-frozen-column {
        position: sticky;
        background: dt('treetable.header.cell.background');
    }

    .p-treetable-scrollable th.p-treetable-frozen-column {
        z-index: 1;
    }

    .p-treetable-scrollable > .p-treetable-table-container > .p-treetable-table > .p-treetable-thead {
        background: dt('treetable.header.cell.background');
    }

    .p-treetable-scrollable > .p-treetable-table-container > .p-treetable-table > .p-treetable-tfoot {
        background: dt('treetable.footer.cell.background');
    }

    .p-treetable-flex-scrollable {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .p-treetable-flex-scrollable > .p-treetable-table-container {
        display: flex;
        flex-direction: column;
        flex: 1;
        height: 100%;
    }

    .p-treetable-scrollable-table > .p-treetable-tbody > .p-treetable-row-group-header {
        position: sticky;
        z-index: 1;
    }

    .p-treetable-resizable-table > .p-treetable-thead > tr > th,
    .p-treetable-resizable-table > .p-treetable-tfoot > tr > td,
    .p-treetable-resizable-table > .p-treetable-tbody > tr > td {
        overflow: hidden;
        white-space: nowrap;
    }

    .p-treetable-resizable-table > .p-treetable-thead > tr > th.p-treetable-resizable-column:not(.p-treetable-frozen-column) {
        background-clip: padding-box;
        position: relative;
    }

    .p-treetable-resizable-table-fit > .p-treetable-thead > tr > th.p-treetable-resizable-column:last-child .p-treetable-column-resizer {
        display: none;
    }

    .p-treetable-column-resizer {
        display: block;
        position: absolute;
        inset-block-start: 0;
        inset-inline-end: 0;
        margin: 0;
        width: dt('treetable.column.resizer.width');
        height: 100%;
        padding: 0;
        cursor: col-resize;
        border: 1px solid transparent;
    }

    .p-treetable-column-header-content {
        display: flex;
        align-items: center;
        gap: dt('treetable.header.cell.gap');
    }

    .p-treetable-column-resize-indicator {
        width: dt('treetable.resize.indicator.width');
        position: absolute;
        z-index: 10;
        display: none;
        background: dt('treetable.resize.indicator.color');
    }

    .p-treetable-mask {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
    }

    .p-treetable-paginator-top {
        border-color: dt('treetable.paginator.top.border.color');
        border-style: solid;
        border-width: dt('treetable.paginator.top.border.width');
    }

    .p-treetable-paginator-bottom {
        border-color: dt('treetable.paginator.bottom.border.color');
        border-style: solid;
        border-width: dt('treetable.paginator.bottom.border.width');
    }

    .p-treetable-header {
        background: dt('treetable.header.background');
        color: dt('treetable.header.color');
        border-color: dt('treetable.header.border.color');
        border-style: solid;
        border-width: dt('treetable.header.border.width');
        padding: dt('treetable.header.padding');
    }

    .p-treetable-footer {
        background: dt('treetable.footer.background');
        color: dt('treetable.footer.color');
        border-color: dt('treetable.footer.border.color');
        border-style: solid;
        border-width: dt('treetable.footer.border.width');
        padding: dt('treetable.footer.padding');
    }

    .p-treetable-header-cell {
        padding: dt('treetable.header.cell.padding');
        background: dt('treetable.header.cell.background');
        border-color: dt('treetable.header.cell.border.color');
        border-style: solid;
        border-width: 0 0 1px 0;
        color: dt('treetable.header.cell.color');
        font-weight: normal;
        text-align: start;
        transition:
            background dt('treetable.transition.duration'),
            color dt('treetable.transition.duration'),
            border-color dt('treetable.transition.duration'),
            outline-color dt('treetable.transition.duration'),
            box-shadow dt('treetable.transition.duration');
    }

    .p-treetable-column-title {
        font-weight: dt('treetable.column.title.font.weight');
    }

    .p-treetable-tbody > tr {
        outline-color: transparent;
        background: dt('treetable.row.background');
        color: dt('treetable.row.color');
        transition:
            background dt('treetable.transition.duration'),
            color dt('treetable.transition.duration'),
            border-color dt('treetable.transition.duration'),
            outline-color dt('treetable.transition.duration'),
            box-shadow dt('treetable.transition.duration');
    }

    .p-treetable-tbody > tr > td {
        text-align: start;
        border-color: dt('treetable.body.cell.border.color');
        border-style: solid;
        border-width: 0 0 1px 0;
        padding: dt('treetable.body.cell.padding');
    }

    .p-treetable-hoverable .p-treetable-tbody > tr:not(.p-treetable-row-selected):hover {
        background: dt('treetable.row.hover.background');
        color: dt('treetable.row.hover.color');
    }

    .p-treetable-tbody > tr.p-treetable-row-selected {
        background: dt('treetable.row.selected.background');
        color: dt('treetable.row.selected.color');
    }

    .p-treetable-tbody > tr:has(+ .p-treetable-row-selected) > td {
        border-block-end-color: dt('treetable.body.cell.selected.border.color');
    }

    .p-treetable-tbody > tr.p-treetable-row-selected > td {
        border-block-end-color: dt('treetable.body.cell.selected.border.color');
    }

    .p-treetable-tbody > tr:focus-visible,
    .p-treetable-tbody > tr.p-treetable-contextmenu-row-selected {
        box-shadow: dt('treetable.row.focus.ring.shadow');
        outline: dt('treetable.row.focus.ring.width') dt('treetable.row.focus.ring.style') dt('treetable.row.focus.ring.color');
        outline-offset: dt('treetable.row.focus.ring.offset');
    }

    .p-treetable-tfoot > tr > td {
        text-align: start;
        padding: dt('treetable.footer.cell.padding');
        border-color: dt('treetable.footer.cell.border.color');
        border-style: solid;
        border-width: 0 0 1px 0;
        color: dt('treetable.footer.cell.color');
        background: dt('treetable.footer.cell.background');
    }

    .p-treetable-column-footer {
        font-weight: dt('treetable.column.footer.font.weight');
    }

    .p-treetable-sortable-column {
        cursor: pointer;
        user-select: none;
        outline-color: transparent;
    }

    .p-treetable-column-title,
    .p-treetable-sort-icon,
    .p-treetable-sort-badge {
        vertical-align: middle;
    }

    .p-treetable-sort-icon {
        color: dt('treetable.sort.icon.color');
        font-size: dt('treetable.sort.icon.size');
        width: dt('treetable.sort.icon.size');
        height: dt('treetable.sort.icon.size');
        transition: color dt('treetable.transition.duration');
    }

    .p-treetable-sortable-column:not(.p-treetable-column-sorted):hover {
        background: dt('treetable.header.cell.hover.background');
        color: dt('treetable.header.cell.hover.color');
    }

    .p-treetable-sortable-column:not(.p-treetable-column-sorted):hover .p-treetable-sort-icon {
        color: dt('treetable.sort.icon.hover.color');
    }

    .p-treetable-column-sorted {
        background: dt('treetable.header.cell.selected.background');
        color: dt('treetable.header.cell.selected.color');
    }

    .p-treetable-column-sorted .p-treetable-sort-icon {
        color: dt('treetable.header.cell.selected.color');
    }

    .p-treetable-sortable-column:focus-visible {
        box-shadow: dt('treetable.header.cell.focus.ring.shadow');
        outline: dt('treetable.header.cell.focus.ring.width') dt('treetable.header.cell.focus.ring.style') dt('treetable.header.cell.focus.ring.color');
        outline-offset: dt('treetable.header.cell.focus.ring.offset');
    }

    .p-treetable-hoverable .p-treetable-selectable-row {
        cursor: pointer;
    }

    .p-treetable-loading-icon {
        font-size: dt('treetable.loading.icon.size');
        width: dt('treetable.loading.icon.size');
        height: dt('treetable.loading.icon.size');
    }

    .p-treetable-gridlines .p-treetable-header {
        border-width: 1px 1px 0 1px;
    }

    .p-treetable-gridlines .p-treetable-footer {
        border-width: 0 1px 1px 1px;
    }

    .p-treetable-gridlines .p-treetable-paginator-top {
        border-width: 1px 1px 0 1px;
    }

    .p-treetable-gridlines .p-treetable-paginator-bottom {
        border-width: 0 1px 1px 1px;
    }

    .p-treetable-gridlines .p-treetable-thead > tr > th {
        border-width: 1px 0 1px 1px;
    }

    .p-treetable-gridlines .p-treetable-thead > tr > th:last-child {
        border-width: 1px;
    }

    .p-treetable-gridlines .p-treetable-tbody > tr > td {
        border-width: 1px 0 0 1px;
    }

    .p-treetable-gridlines .p-treetable-tbody > tr > td:last-child {
        border-width: 1px 1px 0 1px;
    }

    .p-treetable-gridlines .p-treetable-tbody > tr:last-child > td {
        border-width: 1px 0 1px 1px;
    }

    .p-treetable-gridlines .p-treetable-tbody > tr:last-child > td:last-child {
        border-width: 1px;
    }

    .p-treetable-gridlines .p-treetable-tfoot > tr > td {
        border-width: 1px 0 1px 1px;
    }

    .p-treetable-gridlines .p-treetable-tfoot > tr > td:last-child {
        border-width: 1px 1px 1px 1px;
    }

    .p-treetable.p-treetable-gridlines .p-treetable-thead + .p-treetable-tfoot > tr > td {
        border-width: 0 0 1px 1px;
    }

    .p-treetable.p-treetable-gridlines .p-treetable-thead + .p-treetable-tfoot > tr > td:last-child {
        border-width: 0 1px 1px 1px;
    }

    .p-treetable.p-treetable-gridlines:has(.p-treetable-thead):has(.p-treetable-tbody) .p-treetable-tbody > tr > td {
        border-width: 0 0 1px 1px;
    }

    .p-treetable.p-treetable-gridlines:has(.p-treetable-thead):has(.p-treetable-tbody) .p-treetable-tbody > tr > td:last-child {
        border-width: 0 1px 1px 1px;
    }

    .p-treetable.p-treetable-gridlines:has(.p-treetable-tbody):has(.p-treetable-tfoot) .p-treetable-tbody > tr:last-child > td {
        border-width: 0 0 0 1px;
    }

    .p-treetable.p-treetable-gridlines:has(.p-treetable-tbody):has(.p-treetable-tfoot) .p-treetable-tbody > tr:last-child > td:last-child {
        border-width: 0 1px 0 1px;
    }

    .p-treetable.p-treetable-sm .p-treetable-header {
        padding: 0.375rem 0.5rem;
    }

    .p-treetable.p-treetable-sm .p-treetable-thead > tr > th {
        padding: 0.375rem 0.5rem;
    }

    .p-treetable.p-treetable-sm .p-treetable-tbody > tr > td {
        padding: 0.375rem 0.5rem;
    }

    .p-treetable.p-treetable-sm .p-treetable-tfoot > tr > td {
        padding: 0.375rem 0.5rem;
    }

    .p-treetable.p-treetable-sm .p-treetable-footer {
        padding: 0.375rem 0.5rem;
    }

    .p-treetable.p-treetable-lg .p-treetable-header {
        padding: 0.9375rem 1.25rem;
    }

    .p-treetable.p-treetable-lg .p-treetable-thead > tr > th {
        padding: 0.9375rem 1.25rem;
    }

    .p-treetable.p-treetable-lg .p-treetable-tbody > tr > td {
        padding: 0.9375rem 1.25rem;
    }

    .p-treetable.p-treetable-lg .p-treetable-tfoot > tr > td {
        padding: 0.9375rem 1.25rem;
    }

    .p-treetable.p-treetable-lg .p-treetable-footer {
        padding: 0.9375rem 1.25rem;
    }

    .p-treetable-body-cell-content {
        display: flex;
        align-items: center;
        gap: dt('treetable.body.cell.gap');
    }

    .p-treetable-tbody > tr.p-treetable-row-selected .p-treetable-node-toggle-button {
        color: inherit;
    }

    .p-treetable-node-toggle-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        width: dt('treetable.node.toggle.button.size');
        height: dt('treetable.node.toggle.button.size');
        color: dt('treetable.node.toggle.button.color');
        border: 0 none;
        background: transparent;
        cursor: pointer;
        border-radius: dt('treetable.node.toggle.button.border.radius');
        transition:
            background dt('treetable.transition.duration'),
            color dt('treetable.transition.duration'),
            border-color dt('treetable.transition.duration'),
            outline-color dt('treetable.transition.duration'),
            box-shadow dt('treetable.transition.duration');
        outline-color: transparent;
        user-select: none;
    }

    .p-treetable-node-toggle-button:enabled:hover {
        color: dt('treetable.node.toggle.button.hover.color');
        background: dt('treetable.node.toggle.button.hover.background');
    }

    .p-treetable-tbody > tr.p-treetable-row-selected .p-treetable-node-toggle-button:hover {
        background: dt('treetable.node.toggle.button.selected.hover.background');
        color: dt('treetable.node.toggle.button.selected.hover.color');
    }

    .p-treetable-node-toggle-button:focus-visible {
        box-shadow: dt('treetable.node.toggle.button.focus.ring.shadow');
        outline: dt('treetable.node.toggle.button.focus.ring.width') dt('treetable.node.toggle.button.focus.ring.style') dt('treetable.node.toggle.button.focus.ring.color');
        outline-offset: dt('treetable.node.toggle.button.focus.ring.offset');
    }

    .p-treetable-node-toggle-icon:dir(rtl) {
        transform: rotate(180deg);
    }
`, classes: { root: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-treetable p-component", { "p-treetable-hoverable": n2.rowHover || t2.rowSelectionMode, "p-treetable-resizable": n2.resizableColumns, "p-treetable-resizable-fit": n2.resizableColumns && n2.columnResizeMode === "fit", "p-treetable-scrollable": n2.scrollable, "p-treetable-flex-scrollable": n2.scrollable && n2.scrollHeight === "flex", "p-treetable-gridlines": n2.showGridlines, "p-treetable-sm": n2.size === "small", "p-treetable-lg": n2.size === "large" }];
}, loading: "p-treetable-loading", mask: "p-treetable-mask p-overlay-mask", loadingIcon: "p-treetable-loading-icon", header: "p-treetable-header", paginator: function(e2) {
  return "p-treetable-paginator-" + e2.position;
}, tableContainer: "p-treetable-table-container", table: function(e2) {
  var t2 = e2.props;
  return ["p-treetable-table", { "p-treetable-scrollable-table": t2.scrollable, "p-treetable-resizable-table": t2.resizableColumns, "p-treetable-resizable-table-fit": t2.resizableColumns && t2.columnResizeMode === "fit" }];
}, thead: "p-treetable-thead", headerCell: function(e2) {
  var t2 = e2.instance, n2 = e2.props;
  return ["p-treetable-header-cell", { "p-treetable-sortable-column": t2.columnProp("sortable"), "p-treetable-resizable-column": n2.resizableColumns, "p-treetable-column-sorted": t2.columnProp("sortable") ? t2.isColumnSorted() : !1, "p-treetable-frozen-column": t2.columnProp("frozen") }];
}, columnResizer: "p-treetable-column-resizer", columnHeaderContent: "p-treetable-column-header-content", columnTitle: "p-treetable-column-title", sortIcon: "p-treetable-sort-icon", pcSortBadge: "p-treetable-sort-badge", tbody: "p-treetable-tbody", row: function(e2) {
  var t2 = e2.props, n2 = e2.instance;
  return [{ "p-treetable-selectable-row": n2.$parentInstance.rowSelectionMode, "p-treetable-row-selected": n2.selected, "p-treetable-contextmenu-row-selected": t2.contextMenuSelection && n2.isSelectedWithContextMenu }];
}, bodyCell: function(e2) {
  return [{ "p-treetable-frozen-column": e2.instance.columnProp("frozen") }];
}, bodyCellContent: function(e2) {
  return ["p-treetable-body-cell-content", { "p-treetable-body-cell-content-expander": e2.instance.columnProp("expander") }];
}, nodeToggleButton: "p-treetable-node-toggle-button", nodeToggleIcon: "p-treetable-node-toggle-icon", pcNodeCheckbox: "p-treetable-node-checkbox", emptyMessage: "p-treetable-empty-message", tfoot: "p-treetable-tfoot", footerCell: function(e2) {
  return [{ "p-treetable-frozen-column": e2.instance.columnProp("frozen") }];
}, footer: "p-treetable-footer", columnResizeIndicator: "p-treetable-column-resize-indicator" }, inlineStyles: { tableContainer: { overflow: "auto" }, thead: { position: "sticky" }, tfoot: { position: "sticky" } } });
var Xt = [g, v, _, y, Ne, Pe, Fe, Ie, Le, b, Re, Y, ze, x, Be, Ve, re, He, Ue, We, S, Ge, C, Ke, qe, T, Je, oe, X, D, E, Ye, k, Xe, j, M, Ze, N, Qe, Z, $e, et, tt, nt, rt, m, it, P, at, ot, st, ct, I, lt, L, R, F, z, B, V, ut, H, dt, ft, pt, mt, U, W, G, ht, w, gt, _t, K, vt, q, yt, bt, se, xt, O, St, ce, Ct, le, ue, de, u, wt, fe, Tt, pe, he, Et, A, Dt, jt, ae, Mt, Nt, Pt, Ft, It, Lt, Rt, zt, Bt, Vt, _e, ve, Ht, be, ye, xe, Ut, Wt, Gt, Se, s, Kt, ne, ge, Ce, qt, f, we, Jt, Yt, me];
function Zt() {
  for (let e2 of Xt) if (e2?.name && e2.getComponentTheme && e2.load && !document.querySelector(`style[data-primevue-style-id="${e2.name}-variables"]`)) try {
    let t2 = e2.getComponentTheme();
    t2?.css && e2.load(t2.css, { name: `${e2.name}-variables` }), t2?.style && e2.loadStyle && e2.loadStyle({ name: `${e2.name}-style` }, t2.style);
  } catch (t2) {
    console.warn("[PrimeVue] load component variables failed", e2.name, t2);
  }
}
function Qt(e2) {
  e2.use(te), e2.use(Ee), e2.use(Te), e2.directive("ripple", d), e2.directive("tooltip", p), e2.directive("focustrap", h), e2.use(ee, { ripple: !0, theme: { options: { prefix: "", darkModeSelector: ".app-dark" }, preset: i(ie, Me) }, pt: { splitbutton: { pcMenu: { item: "text-3.25" } } } }), Zt();
}
export {J as i,Z as n,X as r,Qt as t};