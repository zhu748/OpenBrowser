<script setup>
import { Teleport } from 'vue';
import { Z as Icon } from './basecomponent-ClhuVxJN.js';
import { t as Paginator } from './paginator-vnwyVxKC.js';
import { t as Skeleton } from './skeleton-CcmFVUhV.js';
import { t as TaskStatusBadge } from './TaskStatusBadge-fl9VE7c_.js';
import { g as TableText } from './CreateTemplateDialog-Bpq9OLTG.js';
import { a as PageSizeSelect } from './ScriptSchemaForm-z_48GvPJ.js';
import { r as Tooltip, t as PageLayout } from './AgentConsolePageLayout-CwKh-Fcw.js';
import { t as Popover } from './AgentPopover-BDVkdMHH.js';
import { l as formatTime } from './useTemplateTaskExecution-yGKXS9Rw.js';
import { defaultPageSize, useTaskManager } from './workbench-task-manager-state.js';
import TaskTableSkeleton from './workbench-task-table-skeleton.js';
import TaskLogDrawer from './workbench-task-log-drawer.js';

defineProps({ activeConversationId: {}, routeTitle: {}, thinking: Boolean });
defineEmits(['send']);
const prompt = defineModel('prompt', { required: true });
const {
  tabs, taskStatuses, logStatuses, stoppingLabel, activeTab, api, logStore, localeClass, canManage, tasks, taskCount,
  tasksLoading, showTaskSkeleton, tasksFailed, logOffset, logPageSize, logCount, logPageSizes, pageLogs, logsLoading, showLogSkeleton, logsFailed,
  startingTasks, stoppingLogs, deletingLogs, taskScroll, activityScroll, taskOverlap, activityOverlap, drawerWindowNames, drawerMissingWindows,
  openLog, logDetail, drawerWindowsReady, canCreate, canStopTask, canStopLog, resetLogPage, onTaskScroll, onActivityScroll,
  formatSchedule, isActiveStatus, locallyRunningTasks, taskStatus, canAddPlan, isRunning, isStopping, taskWindowLabel, logWindowLabel,
  endReason, viewLog, closeLog, goToLogs, openTaskEditor, openSchedule, toggleSchedule, removeTask, taskMenuOpen, setTaskMenu,
  closeTaskMenu, logMenuOpen, setLogMenu, startTask, inspectTemplate, retryTasks, stopTask, stopLog, removeLog,
} = useTaskManager(prompt);

const taskColumns = {
  task: '任务名称', template: '任务模板', windows: '关联窗口', created: '创建时间',
  schedule: '执行计划', status: '状态', actions: '操作',
};
const activityColumns = {
  task: '任务', template: '模板', windows: '窗口', started: '开始时间', ended: '结束时间', status: '状态', actions: '操作',
};
</script>

<template>
  <PageLayout overflow="auto" padding="56px 20px 40px" mobile-padding="56px 16px 32px" :title="$t('任务管理')">
    <div class="task-manager-content" :class="localeClass">
      <h1>{{ $t('任务管理') }}</h1>
      <div class="task-tabs" role="tablist" :aria-label="$t('任务管理视图')">
        <button v-for="tab in tabs" :key="tab.id" class="task-tab" :class="{ active: activeTab === tab.id }"
          type="button" role="tab" :aria-selected="activeTab === tab.id" @click="activeTab = tab.id">{{ tab.label }}</button>
      </div>
      <p class="my-4 text-3 leading-5 text-[var(--color-text-tertiary)]">
        {{ $t(activeTab === 'tasks' ? '空间拥有者和管理者可查看、修改和删除所有任务；其他角色只能查看和管理自己的任务。计划任务仍由创建者账号登录的客户端执行。' : '仅显示当前账号在本机的执行日志。') }}
      </p>
      <div v-if="activeTab === 'tasks'" class="task-list-toolbar">
        <Skeleton v-if="tasksLoading && !tasks.length" class="task-list-toolbar__count-skeleton" :class="{ 'is-hidden': !showTaskSkeleton }"
          width="96px" height="20px" border-radius="4px" />
        <p v-else>{{ $t('共 {count} 个任务', { count: taskCount }) }}</p>
        <Tooltip :content="$t('请先创建一个用户模板')" :disabled="canCreate">
          <button class="new-task-button" type="button" :disabled="!canCreate" @click="openTaskEditor()">
            <Icon name="base/rx_ic_plus" size="18" aria-hidden="true" /><span>{{ $t('创建任务') }}</span>
          </button>
        </Tooltip>
      </div>
      <div v-if="activeTab === 'tasks'" class="task-view">
        <template v-if="tasksLoading && !tasks.length"><TaskTableSkeleton v-if="showTaskSkeleton" variant="tasks" :rows="5" /></template>
        <div v-else-if="tasksFailed && !tasks.length" class="task-state">
          <Icon name="roxy-agent/rx-ic-task-manager" size="32" />
          <strong>{{ $t('任务加载失败') }}</strong><span>{{ $t('请检查网络连接后重试。') }}</span>
          <button class="state-action" type="button" @click="retryTasks">{{ $t('重试') }}</button>
        </div>
        <div v-else-if="tasks.length" ref="taskScroll" class="task-table-scroll" :class="{ 'task-table-scroll--sticky-overlap': taskOverlap }" @scroll.passive="onTaskScroll">
          <table class="task-table">
            <colgroup><col v-for="(_, key) in taskColumns" :key="key" :class="'col-' + key"></colgroup>
            <thead><tr><th v-for="label in taskColumns" :key="label" scope="col">{{ $t(label) }}</th></tr></thead>
            <tbody>
              <tr v-for="task in tasks" :key="task.id">
                <td class="task-name-cell"><TableText :content="task.name" /></td>
                <td>
                  <button type="button" class="template-badge template-badge--link" :disabled="!task.userTemplateId" @click="inspectTemplate(task)">
                    <span class="template-badge__name">{{ task.templateName }}</span>
                  </button>
                </td>
                <td><TableText :content="taskWindowLabel(task)" /></td>
                <td>{{ formatTime(task.createdAt) }}</td>
                <td><TableText :content="formatSchedule(task)" /></td>
                <td>
                  <button v-if="canAddPlan(task) && canManage(task)" class="status-pill status-pill--add-plan" type="button" @click="openSchedule(task)">
                    <Icon name="base/rx_ic_plus" size="14" aria-hidden="true" /><span>{{ $t('添加计划') }}</span>
                  </button>
                  <span v-else-if="taskStatus(task) === 'running' && !isStopping(task)" class="status-pill running"><TaskStatusBadge status="running" /></span>
                  <span v-else class="status-pill" :class="isStopping(task) ? 'stopping' : taskStatus(task)">
                    <span class="status-dot" aria-hidden="true"></span> {{ isStopping(task) ? stoppingLabel : taskStatuses[taskStatus(task)] }}
                  </span>
                </td>
                <td>
                  <div class="task-actions">
                    <button v-if="canStopTask(task) && isRunning(task)" class="stop-task-button" type="button"
                      :disabled="isStopping(task) || !locallyRunningTasks.has(task.id)"
                      :title="locallyRunningTasks.has(task.id) ? undefined : $t('请在执行任务的客户端停止任务')" @click="stopTask(task)">
                      {{ $t(isStopping(task) ? '停止中...' : '停止任务') }}
                    </button>
                    <button v-if="!isRunning(task) && canManage(task)" class="run-button" type="button" :disabled="startingTasks.has(task.id)"
                      @click="startTask(task)">{{ $t(startingTasks.has(task.id) ? '启动中...' : '立即执行') }}</button>
                    <Popover :open="taskMenuOpen(task)" content-class="task-action-popover task-list-action-popover" placement="bottom-end"
                      :offset="6" :z-index="80" @update:open="setTaskMenu($event, task)">
                      <template #content>
                        <button v-if="canManage(task)" type="button" @click="closeTaskMenu(); openTaskEditor(task)">
                          <Icon name="base/rx_ic_agent_edit" size="16" /><span>{{ $t('编辑') }}</span>
                        </button>
                        <button type="button" @click="goToLogs(task)"><Icon name="roxy-agent/rx-ic-task-logs" size="16" /><span>{{ $t('查看日志') }}</span></button>
                        <button v-if="canManage(task)" type="button" @click="openSchedule(task)">
                          <Icon name="roxy-agent/rx-ic-task-schedule" size="16" /><span>{{ $t('计划') }}</span>
                        </button>
                        <button v-if="canManage(task) && task.planType !== 'manual'" type="button" @click="toggleSchedule(task)">
                          <Icon :name="task.enabled ? 'roxy-agent/rx-ic-task-pause' : 'base/rx_ic_play'" size="16" />
                          <span>{{ $t(task.enabled ? '暂停计划' : '启用计划') }}</span>
                        </button>
                        <button v-if="canManage(task)" class="danger" type="button" @click="removeTask(task)">
                          <Icon name="base/rx_ic_bin_1" size="16" /><span>{{ $t('删除') }}</span>
                        </button>
                      </template>
                      <button class="icon-button" type="button" :aria-label="$t('更多任务操作：{name}', { name: task.name })"
                        :aria-expanded="taskMenuOpen(task)"><Icon name="base/rx_ic_more-v" size="16" /></button>
                    </Popover>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="task-state">
          <Icon name="roxy-agent/rx-ic-task-manager" size="32" />
          <strong>{{ $t('暂无任务') }}</strong><span>{{ $t('创建任务后，可在此统一管理任务定义与执行计划。') }}</span>
        </div>
      </div>
      <template v-else-if="logsLoading"><TaskTableSkeleton v-if="showLogSkeleton" variant="activity" :rows="defaultPageSize" /></template>
      <div v-else-if="logsFailed" class="task-state">
        <Icon name="roxy-agent/rx-ic-task-manager" size="32" /><strong>{{ $t('执行日志加载失败') }}</strong>
        <button class="state-action" type="button" @click="logStore.reconnect()">{{ $t('重试') }}</button>
      </div>
      <div v-else-if="logCount" class="activity-view">
        <div ref="activityScroll" class="task-table-scroll activity-table-scroll" :class="{ 'task-table-scroll--sticky-overlap': activityOverlap }" @scroll.passive="onActivityScroll">
          <table class="task-table activity-table">
            <colgroup><col v-for="(_, key) in activityColumns" :key="key" :class="'col-activity-' + key"></colgroup>
            <thead><tr><th v-for="label in activityColumns" :key="label" scope="col">{{ $t(label) }}</th></tr></thead>
            <tbody>
              <tr v-for="log in pageLogs" :key="log.id">
                <td class="task-name-cell"><TableText :content="log.taskName" /></td>
                <td><div class="template-badge"><TableText :content="log.templateName" /></div></td>
                <td><TableText :content="logWindowLabel(log)" /></td>
                <td>{{ formatTime(log.startedAt) }}</td>
                <td>{{ formatTime(log.endedAt) }}</td>
                <td>
                  <span class="activity-status" :class="stoppingLogs.has(log.id) ? 'stopping' : log.status" :title="endReason(log) || undefined">
                    <span class="status-dot" aria-hidden="true"></span>
                    <span class="activity-status-label">{{ stoppingLogs.has(log.id) ? stoppingLabel : logStatuses[log.status] }}</span>
                  </span>
                </td>
                <td>
                  <div class="task-actions activity-actions">
                    <button class="view-logs-button" type="button" @click.stop="viewLog(log)">{{ $t('查看日志') }}</button>
                    <Popover v-if="!isActiveStatus(log.status) || canStopLog(log)" :open="logMenuOpen(log)"
                      content-class="task-action-popover" placement="bottom-end" :offset="6" :z-index="80" @update:open="setLogMenu($event, log)">
                      <template #content>
                        <button v-if="isActiveStatus(log.status)" type="button" :disabled="stoppingLogs.has(log.id)" @click="stopLog(log)">
                          <Icon name="base/rx_ic_pause" size="16" /><span>{{ $t(stoppingLogs.has(log.id) ? '停止中...' : '停止任务') }}</span>
                        </button>
                        <button v-else class="danger" type="button" :disabled="deletingLogs.has(log.id)" @click="removeLog(log)">
                          <Icon name="base/rx_ic_bin_1" size="16" /><span>{{ $t(deletingLogs.has(log.id) ? '删除中...' : '删除记录') }}</span>
                        </button>
                      </template>
                      <button class="icon-button" type="button" :aria-label="$t('更多执行记录操作：{name}', { name: log.taskName })"
                        :aria-expanded="logMenuOpen(log)"><Icon name="base/rx_ic_more-v" size="16" /></button>
                    </Popover>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Paginator v-model:first="logOffset" class="activity-paginator" :rows="logPageSize" :total-records="logCount" :page-link-size="5"
          template="JumpToPageInput PrevPageLink PageLinks NextPageLink">
          <template #start>
            <div class="activity-paginator-start">
              <span class="activity-paginator-total">{{ $t('总计 {total} 个', { total: logCount }) }}</span>
              <PageSizeSelect v-model="logPageSize" class="activity-page-size-select" name="activityRowsPerPage" :options="logPageSizes" @change="resetLogPage" />
              <span class="activity-paginator-jump-label">{{ $t('跳转页数至') }}</span>
            </div>
          </template>
        </Paginator>
      </div>
      <div v-else class="task-state">
        <Icon name="roxy-agent/rx-ic-task-manager" size="32" /><strong>{{ $t('暂无执行日志') }}</strong>
      </div>
    </div>
  </PageLayout>
  <Teleport to="body">
    <TaskLogDrawer v-if="openLog" :log="openLog" :detail="logDetail" :detail-ready="logStore.taskExecutionReady.value"
      :end-reason="endReason(openLog)" :window-labels="drawerWindowNames" :deleted-window-labels="drawerMissingWindows"
      :window-labels-ready="drawerWindowsReady" :file-url="api.getFileUrl" @close="closeLog" />
  </Teleport>
</template>
