import { h, nextTick, reactive, ref, unref } from './workbench-vue.js';
import { h as api, xr as isEmpty } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { n as labelPermission } from './permission-DOhNJfB3.js';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { n as useDynamicDialog } from './usedialog-Dh0xp3r7.js';
import { t as usePopupMenu } from './usePopupMenu-BRw1zJ0m.js';
import { o as Fuse } from './form-BQBA_XzO.js';
import { t as TagEditor } from './edit-BQkIxl5s.js';
import { n as useProjectLabels } from './useProjectEntityLabels-DdcfADRx.js';
import { t as useProjectEditor } from './useProject-BHb2F7tC.js';
import TagColorDot from './workbench-tag-color-dot.js';
import TagMenuSearch from './workbench-tag-menu-search.js';

const isMemberLabel = value => String(value).startsWith('u_');
const normalizeLabelId = value => String(value);
const footerClass = 'flex items-center gap-1.5 py-3 px-3.5 cursor-pointer border-0 border-t-1 border-solid border-[var(--component-dropdown-divider)]';
function getLabelSources() {
  async function getTags() {
    const { code, data, msg } = await api.window.userGetLabelInfoList({ page_index: '1', page_size: '999', requestType: labelPermission.SelectLabel });
    if (code !== 0) throw Error(msg || $t('加载标签失败'));
    return (data?.rows ?? []).map(tag => ({ name: tag.name, label: tag.name, value: String(tag.id), _origin: tag,
      render: () => h('div', { class: 'flex items-center flex-1 overflow-hidden' }, [
        h(TagColorDot, { class: 'shrink-0', color: tag.color }),
        h('span', { class: 'ellipsis-1 text-3.25', title: tag.name }, tag.name),
      ]),
    }));
  }
  async function getProjects() {
    const { code, data, msg } = await api.limit.userGetProjectInfoByWorkspaceList({ default: 2 });
    if (code !== 0) throw Error(msg || $t('加载项目失败'));
    return (data?.rows ?? []).map(project => ({ label: project.projectName, value: String(project.project_id),
      projectDefault: project.projectDefault, _origin: project }));
  }
  return { getTags, getProjects, async getProjectMember() { return []; } };
}

function searchable(items, keys, placeholder) {
  const options = reactive([...items]);
  const search = ref(null);
  const fuse = new Fuse(items, { threshold: 0.3, ignoreLocation: true, keys });
  function filterOptions(query) {
    query = query.trim();
    const results = query ? fuse.search(query).map(result => result.item) : items;
    options.splice(0, options.length, ...results);
    return results.length === 0;
  }
  return { options, onShow: () => nextTick(() => search.value?.focus()),
    start: () => h(TagMenuSearch, { ref: search, empty: !items.length, filterOptions, placeholder }) };
}
function footer(text, onClick) {
  return h('div', { class: footerClass, onClick }, [h(Icon, { name: 'base/rx_ic_plus' }), h('div', { class: 'text-3.25' }, text)]);
}
function useProjectMenu(props) {
  const { getProjects } = getLabelSources();
  const { showMenu } = usePopupMenu();
  const [newProject] = useProjectEditor();
  const labels = useProjectLabels();
  const [, notify] = useFeedback();
  let loading = false;
  function create() {
    return newProject({ confirmNext: ({ params, res }) => {
      const id = res?.data?.projectId;
      if (id != null) props.onChange({ projectId: String(id), projectName: params.projectName || labels.value.unspecified, projectDefault: 0 });
    } });
  }
  async function openMenu(event) {
    if (unref(props.disabled) || loading) return;
    loading = true;
    // Store the anchor before awaiting the local request. Native events clear currentTarget after dispatch.
    const target = event.currentTarget;
    try {
      const projects = await getProjects();
      const initial = unref(props.projectId)?.toString();
      const search = searchable(projects, ['label'], labels.value.searchPlaceholder);
      showMenu({ currentTarget: target, target: event.target }, {
        mode: { type: 'single', value: initial, options: search.options, field: 'value' },
        menuProps: { onShow: search.onShow, onHide: ({ value }) => {
          if (isEmpty(value) || value === initial) return;
          const project = projects.find(item => item.value === value);
          props.onChange({ projectId: String(value), projectName: project?.label || labels.value.unspecified, projectDefault: project?.projectDefault || 0 });
        } },
        slots: { start: search.start, end: unref(props.canCreate) ? () => footer(labels.value.createTitle, create) : undefined },
      });
    } catch (error) {
      notify(-1, error.message);
    } finally {
      loading = false;
    }
  }
  return { openMenu };
}

function useTagEditor() {
  const dialog = useDynamicDialog();
  const [, notify] = useFeedback();
  return [({ confirmNext, ...props } = {}) => dialog.open(TagEditor, {
    props: { showHeader: false, modal: true, blockScroll: true },
    data: { props, onConfirm: async params => {
      const res = props.id ? await api.window.userMdfLabelInfoCreate({ ...params, id: props.id }) : await api.window.userAddLabelInfoCreate(params);
      notify(res.code, res.msg);
      if (res.code === 0) await confirmNext?.({ params, res });
    }, onCancel() {} },
  })];
}

function useTagMenu(props) {
  const [createTag] = useTagEditor();
  const { getTags } = getLabelSources();
  const { showMenu } = usePopupMenu();
  const [, notify] = useFeedback();
  let loading = false;
  function commit(labelInfo) {
    props.onUpdate({ labelInfo, labelIds: labelInfo.map(item => String(item.labelId)), requestType: labelPermission.SelectLabel });
  }
  function create() {
    createTag({ confirmNext: ({ params, res }) => {
      commit([...(unref(props.labels) ?? []), { labelColor: params.color, labelName: params.name, labelId: String(res.data.id) }]);
    } });
  }
  async function openMenu(event) {
    if (unref(props.disabled) || loading) return;
    loading = true;
    const target = event.currentTarget;
    try {
      const labels = unref(props.labels) ?? [];
      const initial = labels.map(item => String(item.labelId));
      const selected = new Set(initial);
      const options = (await getTags()).sort((left, right) => Number(selected.has(right.value)) - Number(selected.has(left.value)));
      const search = searchable(options, ['label', 'name', '_origin.name', '_origin.userName']);
      showMenu({ currentTarget: target, target: event.target }, {
        mode: { type: 'multiple', value: initial, options: search.options, field: 'value' },
        menuProps: { onShow: search.onShow, onHide: ({ value }) => {
          if (!Array.isArray(value)) return;
          const next = value.map(String);
          if (initial.length === next.length && next.every(id => selected.has(id))) return;
          const labelsById = new Map(labels.map(label => [String(label.labelId), label]));
          for (const { value: id, _origin: tag } of options) labelsById.set(id, { labelId: id, labelName: tag.name, labelColor: tag.color });
          commit(next.map(id => labelsById.get(id)).filter(Boolean));
        } },
        slots: { start: search.start, end: unref(props.genTag) === false ? undefined : () => footer($t('新增标签'), create) },
      });
    } catch (error) {
      notify(-1, error.message);
    } finally {
      loading = false;
    }
  }
  return { openMenu };
}

export { normalizeLabelId as a, isMemberLabel as i, useTagEditor as n, getLabelSources as o, useProjectMenu as r, useTagMenu as t };
