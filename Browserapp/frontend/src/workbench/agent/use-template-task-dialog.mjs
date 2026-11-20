import { N as useTasks, mt as useWorkspace } from './utils-BIWenCnY.js';
import { n as useFeedback } from './agent-BmSFI9WH.js';
import { n as useDialog } from './usedialog-Dh0xp3r7.js';
import { P as loadWindows } from './CreateTemplateDialog-Bpq9OLTG.js';
import { a as concurrencyOptions, h as readData, r as CreateTaskDialog, v as planOf } from './useTemplateTaskExecution-yGKXS9Rw.js';

function useTemplateTaskDialog() {
  const dialog = useDialog();
  const workspace = useWorkspace();
  const tasks = useTasks();
  const [notify, warn] = useFeedback();

  async function save(values, onCreated) {
    const { name, userTemplateId, windowIds, planType, cron, timezone, executeAt, enabled, concurrency } = values;
    let task;
    try {
      const result = await tasks.userTasks.createUserTask({ name, user_template_id: userTemplateId, window_ids: windowIds,
        plan_type: planOf(planType), cron, timezone, execute_at: executeAt, enabled, metadata: concurrencyOptions(concurrency) });
      task = readData(result, $t('创建任务失败'));
    } catch (error) {
      warn(-1, error?.message || $t('创建任务失败'));
      return false;
    }
    notify(0, $t('任务已创建'));
    try { await tasks.syncTasks(); }
    catch (error) {
      console.warn('Failed to sync local task scheduler', error);
      warn(-1, $t('任务已保存，本地计划同步失败，将自动重试'));
    }
    try { await onCreated?.(task); }
    catch (error) { console.warn('Failed to refresh task list after save', error); }
    return true;
  }

  async function openCreateTaskDialog(template, { onCreated } = {}) {
    try {
      const { name, id, kind } = template;
      const workspaceName = workspace.currentWorkspace?.workspaceName;
      dialog.open(CreateTaskDialog, {
        props: { modal: true, blockScroll: true, dismissableMask: false, draggable: false, showHeader: false,
          style: { width: 'min(440px, calc(100vw - 32px))' },
          pt: { root: 'agent-console-dialog agent-console-create-task-dialog', content: '!p-0 !overflow-hidden' } },
        data: {
          initialValues: { name, userTemplateId: id, windowIds: [], planType: 'manual', cron: null, timezone: null,
            executeAt: null, enabled: true, concurrency: kind === 'script' ? undefined : null },
          templateOptions: [{ kind, label: name, value: id }], windowOptions: [], lockTemplate: true,
          loadWindowOptions: (pageIndex, keyword, projectId) => loadWindows({ pageIndex, pageSize: 10, keyword, projectId }, workspaceName),
          onSave: values => save(values, onCreated),
        },
      });
      return true;
    } catch (error) {
      warn(-1, error?.message || $t('加载任务创建信息失败'));
      return false;
    }
  }

  return { openCreateTaskDialog };
}

export { useTemplateTaskDialog as n };
