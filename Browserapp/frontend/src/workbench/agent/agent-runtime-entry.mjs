// Compatibility exports shared by the recovered Agent views and workbench routes.
import { useAgentConversation as mh } from './workbench-agent-conversation.js';
import {
  classifyMemoryOperations as au,
  parseSearch as du,
  toolFamily as fu,
  skillInPath as Ou,
  toolLabel as Fu,
  summarizeTools as Pu,
  retryIcon as Xf,
} from './workbench-tool-event-labels.js';
import {
  batchCreateRoute as _p,
  createAutomationRoute as Ip,
  batchCreateGuide,
  automationGuide,
} from './workbench-agent-route-intents.js';
import { useTaskMonitor } from './workbench-agent-task-monitor.js';
import { parseAgentStatus as Pd } from './workbench-agent-status.js';
import {
  AnimationFrameQueue as Fw,
  copySelectionAsMarkdown as Aw,
} from './workbench-agent-message-selection.js';
import {
  lastMeaningfulEvent as hS,
  groupEvents as _S,
  splitProcessSteps as vS,
  scrollSignatures as IS,
  shouldCollapse as AS,
  loadWindowInfo as kS,
  formatWindowTitle as ES,
} from './workbench-agent-timeline-state.js';
import AgentBrand from './workbench-agent-brand.js';
import HomeCardSkeleton from './workbench-agent-home-card-skeleton.js';
import WindowGuide from './workbench-agent-window-guide.js';
import Monitor from './workbench-agent-monitor.js';
import CopyButton from './workbench-agent-copy-button.js';
import Collapse from './workbench-agent-collapse.js';
import EventList from './workbench-agent-process-event-list.js';
import LifecycleTree from './workbench-agent-lifecycle-tree.js';
import ReportCard from './workbench-agent-task-report.js';
import CopyNotification from './workbench-agent-copy-notification.js';
import ProcessTimeline from './workbench-agent-process-timeline.js';
import StatusMessage from './workbench-agent-status-message.js';
import AgentSidebar from './workbench-agent-sidebar.js';
import DeleteConfirmation from './workbench-agent-delete-confirmation.js';
import RenameConversation from './workbench-agent-rename-conversation.js';
import { N as x, di as ae, gt as ce, ht as j, or as be, sn as Se, v as Ee } from './utils-BIWenCnY.js';
import {
  F as Me,
  H as Pe,
  R as ze,
  S as Be,
  St as N,
  Tt as Ve,
  V as He,
  d as F,
  st as K,
} from './runtime-core.esm-bundler-CBj16o9G.js';
import { t as Y } from './preload-helper-BLdHbfdN.js';
import { a as _t } from './dist-NctnpPRe.js';
import { n as Ct } from './agent-BmSFI9WH.js';
import { b as kt, y as jt } from './rich-html-link-VdBpR3Cm.js';
import { n as tn } from './useconfirm-CV4GTWBW.js';
import { n as nn } from './usedialog-Dh0xp3r7.js';
import { n as cn } from './theme-mq6SsndU.js';
import { n as qn } from './TaskStatusBadge-fl9VE7c_.js';
import {
  B as Zn,
  C as Qn,
  G as $n,
  H as er,
  J as nr,
  K as rr,
  O as sr,
  U as ur,
  V as dr,
  _ as gr,
  a as _r,
  c as vr,
  g as xr,
  i as Cr,
  k as wr,
  n as Er,
  q as Or,
  r as kr,
  s as Ar,
  t as jr,
  x as Nr,
} from './CreateTemplateDialog-Bpq9OLTG.js';
import { i as Ir, n as Lr, t as zr } from './AgentConsolePageLayout-CwKh-Fcw.js';
import {
  a as Ur,
  c as Wr,
  i as Gr,
  n as Kr,
  o as qr,
  r as Jr,
  s as Yr,
  t as Xr,
} from './template-guide-OgW15d11.js';
const {
  event: xp,
  request: Op,
  shown: Ep,
  remember: Dp,
  requested: kp,
  forced: Ap,
  clear: jp,
} = batchCreateGuide;
const { event: Hp, request: Jp, shown: Kp, remember: qp, requested: Yp, clear: Xp } = automationGuide;
const lm = () => useTaskMonitor(Fu);
async function hh(prompt, { startNewChat, sendPrompt, onRunStarted }) {
  await startNewChat();
  return sendPrompt({ content: prompt, onRunStarted });
}
function gh(runId, runs) {
  return ['completed', 'failed', 'cancelled'].includes(runs[runId]?.status);
}
var sampleTemplateSlugs = {
  'copy-editing': 'copy-editing',
  'ad-creative': 'ad-creative',
  'tiktok-captions': 'tiktok-captions',
  'reddit-post': 'reddit-posts',
};
var sampleInputs = {
  'copy-editing': [
    {
      labels: ['原文', 'copy', 'текст'],
      values: {
        en: 'This smart water bottle is made of 316 stainless steel, offers long-lasting insulation, supports app connectivity, and lets you check your water intake anytime. It is ideal for office workers.',
        ru: 'Эта умная бутылка для воды изготовлена из нержавеющей стали 316, долго сохраняет температуру, поддерживает подключение к приложению и позволяет в любой момент проверить количество выпитой воды. Подходит для офисных работников.',
        zh: '这款智能水杯采用316不锈钢材质，长效保温，支持APP连接，随时查看饮水量，适合上班族使用。',
      },
    },
    {
      labels: ['受众', 'audience', 'аудитории'],
      values: {
        en: 'Urban professionals aged 25-35 who care about their health but lead busy lives, prefer minimalist design, and often forget to drink water',
        ru: 'Городские офисные сотрудники 25-35 лет, которые заботятся о здоровье, но ведут активный образ жизни, любят минималистичный дизайн и часто забывают пить воду',
        zh: '25-35岁都市白领，注重健康但忙碌，喜欢简约设计，经常忘记喝水',
      },
    },
    {
      labels: ['语气', 'tone', 'тон'],
      values: {
        en: 'Friendly, conversational, and slightly encouraging; avoid stiff technical jargon',
        ru: 'Дружелюбный, разговорный, немного вдохновляющий тон; избегать сухих технических терминов',
        zh: '亲切、生活化、带点鼓励感，避免生硬技术术语',
      },
    },
  ],
  'ad-creative': [
    {
      labels: ['产品/服务', 'product or service', 'продукта или услуги'],
      values: { en: 'anti-detect browser', ru: 'антидетект-браузера', zh: '指纹浏览器' },
    },
    {
      labels: ['受众', 'audience', 'целевая аудитория'],
      values: {
        en: 'cross-border e-commerce sellers',
        ru: 'продавцов, работающих в сфере трансграничной электронной торговли',
        zh: '跨境商家',
      },
    },
    {
      labels: ['平台和格式', 'platform and format', 'платформа и формат'],
      values: { en: 'TikTok', ru: 'TikTok', zh: 'TikTok' },
    },
  ],
  'tiktok-captions': [
    {
      labels: ['产品或主题', 'product or topic', 'продукте или теме'],
      values: {
        en: 'Optimum Nutrition protein powder',
        ru: 'протеиновый порошок Optimum Nutrition',
        zh: 'Optimum Nutrition 蛋白粉',
      },
    },
    {
      labels: ['目标人群', 'audience', 'целевой аудитории'],
      values: { en: 'fitness enthusiasts', ru: 'фитнес-энтузиасты', zh: '健身人士' },
    },
  ],
  'reddit-post': [
    {
      labels: ['主题或产品', 'Product or topic', 'Product name or topic', 'название продукта или тема'],
      values: { en: 'DeepSeek', ru: 'DeepSeek', zh: 'DeepSeek' },
    },
    {
      labels: [
        'subreddit',
        'Target subreddit',
        'Target subreddit, e.g. r/Entrepreneur or r/Productivity',
        'целевой subreddit',
        'целевой subreddit, например r/Entrepreneur или r/Productivity',
      ],
      values: { en: 'r/selfhosted', ru: 'r/selfhosted', zh: 'r/selfhosted' },
    },
    {
      labels: [
        '发帖目标',
        'Posting goal',
        'Posting goal, e.g. get feedback/share experience/spark discussion/soft promotion',
        'цель публикации',
        'цель публикации, например получить обратную связь',
      ],
      values: {
        en: 'discuss the cost-effectiveness of the DeepSeek API and attract self-hosting enthusiasts',
        ru: 'обсудить экономическую эффективность API DeepSeek и привлечь энтузиастов самостоятельного хостинга',
        zh: '讨论 DeepSeek API 的成本效益，吸引自部署爱好者关注',
      },
    },
    {
      labels: [
        'Target users, e.g. independent store sellers',
        'целевая аудитория, например продавцы независимых магазинов',
      ],
      values: { en: 'software developers', ru: 'разработчики программного обеспечения' },
    },
    {
      labels: [
        'Expressions to avoid, e.g. too salesy',
        'формулировки которых нужно избегать, например слишком рекламный тон',
      ],
      values: { en: 'too salesy', ru: 'слишком рекламный тон' },
    },
  ],
};
function sampleLanguage(locale) {
  let language = locale?.trim().toLowerCase();
  return language?.startsWith('en') ? 'en' : language?.startsWith('ru') ? 'ru' : 'zh';
}
function normalizeLabel(label) {
  return label.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
function buildSamplePrompt(prompt, example) {
  let skill = gr(prompt).find((e3) => e3.kind === 'skill' && e3.skillPath),
    input = example.trim();
  return skill ? `${skill.raw} ${input}`.trim() : '';
}
function fillSampleInputs(prompt, template, locale) {
  let values = new Map(),
    language = sampleLanguage(locale);
  sampleInputs[template].forEach((e3) => {
    let t3 = e3.values[language];
    t3 &&
      e3.labels.forEach((e4) => {
        values.set(normalizeLabel(e4), t3);
      });
  });
  let offset = 0,
    result = '';
  return (
    gr(prompt).forEach((t3) => {
      if (t3.kind !== 'input' && t3.kind !== 'textarea' && t3.kind !== 'url') return;
      let n3 = values.get(normalizeLabel(t3.title));
      n3 &&
        ((result += prompt.slice(offset, t3.index)),
        (result += `[${t3.kind}:${t3.title}](${n3})`),
        (offset = t3.index + t3.raw.length));
    }),
    offset ? `${result}${prompt.slice(offset)}` : prompt
  );
}
var Onboarding = { render: () => null };
export { Ip as N, _p as P };
export {
  ConfirmDialog as K,
  ConfirmDialog as agentConfirmDialog,
  TieredMenu as s,
  SplitButton as o,
} from './workbench-prime-menus.js';
export {
  router as d,
  installRouter as f,
  menuCommands as m,
  useAgentNavigation as u,
  useBusinessCode as w,
} from './workbench-router.js';

export const chatWorkspaceRuntime = {
  jt,
  kt,
  Ct,
  N,
  Ve,
  x,
  nn,
  Se,
  cn,
  Ee,
  _t,
  Zn,
  F,
  ur,
  rr,
  er,
  $n,
  _r,
  Cr,
  j,
  nr,
  Or,
  dr,
  kr,
  vr,
  ce,
  wr,
  sr,
  Nr,
  Me,
  Gr,
  Yr,
  Kr,
  jr,
  Qn,
  Ar,
  qr,
  Ur,
  Wr,
  Jr,
  kp,
  Ap,
  Ep,
  jp,
  Dp,
  Yp,
  Kp,
  Xp,
  qp,
  Ay: sampleTemplateSlugs,
  Ly: buildSamplePrompt,
  Ry: fillSampleInputs,
  K,
  He,
  xp,
  Hp,
  Xr,
  ze,
  PageLayout: zr,
  ProfileMonitor: Lr,
  TemplateSkeleton: HomeCardSkeleton,
  TableText: xr,
  Composer: Er,
  Guide: WindowGuide,
  Onboarding: Onboarding,
};

export const agentShellRuntime = {
  Be,
  Y,
  ae,
  ce,
  He,
  x,
  qn,
  Pe,
  mh,
  N,
  F,
  Ve,
  K,
  jt,
  kt,
  tn,
  nn,
  Ct,
  Hv: RenameConversation,
  hh,
  gh,
  Me,
  Ir,
  DeleteConfirm: DeleteConfirmation,
  Sidebar: AgentSidebar,
  ProfileMonitor: Monitor,
  Guide: WindowGuide,
  Brand: AgentBrand,
};

export const chatMessageRuntime = {
  Ct,
  N,
  Fw,
  Aw,
  be,
  F,
  K,
  Me,
  He,
  ze,
  CopyNotification,
  CopyButton,
  Timeline: ProcessTimeline,
  StatusMessage,
};

export { Pd as parseAgentStatus };
export const processTimelineRuntime = {
  Collapse,
  EventList,
  LifecycleTree,
  ReportCard,
  splitProcessSteps: vS,
  shouldCollapse: AS,
  loadWindowInfo: kS,
};

export const processEventRuntime = {
  groupEvents: _S,
  scrollSignatures: IS,
  lastMeaningfulEvent: hS,
  toolLabel: Fu,
  patchLabel: au,
  toolFamily: fu,
  parseSearch: du,
  isSkillPath: Ou,
  retryIcon: Xf,
  summarizeTools: Pu,
};
export const reportCardRuntime = { useTaskMonitor: lm, formatWindowTitle: ES };
