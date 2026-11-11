'use strict';

const { firstDefined, firstArray, firstString, normalizeRpaInput } = require('./input');
const { ok, fail, decodePathId } = require('./responses');

/** HTTP-independent handlers with explicit domain dependencies. */
class RpaRoutes {
  constructor({ rpaStore, rpaEngine } = {}) {
    this.rpaStore = rpaStore;
    this.rpaEngine = rpaEngine;
  }

  async routeRpaPlansList() {
    return ok({ list: this.rpaStore.listPlans() });
  }

  async routeRpaPlanUpsert({ input }) {
    const rpaInput = normalizeRpaInput(input);
    return ok(await this.rpaStore.upsertPlan({
      ...rpaInput,
      id: rpaInput.id ?? rpaInput.plan_id,
    }));
  }

  async routeRpaPlanDelete({ pathname }) {
    const id = decodePathId(pathname.slice('/api/rpa/plans/'.length), 'RPA plan');
    return ok(await this.rpaStore.deletePlan(id));
  }

  async routeRpaTasksList({ input }) {
    const rpaInput = normalizeRpaInput(input);
    const list = this.rpaStore.listTasks(rpaInput);
    const limit = Math.max(1, Math.min(500, Number(rpaInput.limit) || 50));
    return ok({ list: list.slice(0, limit), total: list.length });
  }

  async routeRpaTaskGet({ pathname }) {
    const id = decodePathId(pathname.slice('/api/rpa/tasks/'.length), 'RPA task');
    const task = this.rpaStore.getTask(id);
    if (!task) return fail('task not found: ' + id, 404);
    return ok({ task });
  }

  async routeRpaTaskDelete({ pathname }) {
    const id = decodePathId(pathname.slice('/api/rpa/tasks/'.length), 'RPA task');
    if (this.isTaskActive(id)) return fail('task is running or queued: ' + id, 409);
    return ok(await this.rpaStore.deleteTask(id));
  }

  isTaskActive(id) {
    if (typeof this.rpaEngine?.isTaskActive === 'function') return this.rpaEngine.isTaskActive(id);
    const status = this.rpaEngine?.getStatus?.() || {};
    return (status.running || []).includes(id) || (status.queued || []).includes(id);
  }

  async routeRpaTasksDelete({ input }) {
    const rpaInput = normalizeRpaInput(input);
    const rawIds = firstArray(rpaInput, ['task_ids', 'taskIds', 'ids']) || [firstDefined(rpaInput, ['task_id', 'taskId', 'id'])];
    const ids = rawIds.map((v) => String(v || '').trim()).filter(Boolean);
    const deleted = []; const skipped = [];
    for (const id of ids) {
      if (this.isTaskActive(id)) { skipped.push(id); continue; }
      const res = await this.rpaStore.deleteTask(id);
      if (res && res.deleted) deleted.push(id);
    }
    return ok({ deleted, skipped });
  }

  async routeRpaRun({ input }) {
    if (!this.rpaEngine) return fail('rpa engine unavailable', 503);
    if (!this.rpaStore) return fail('rpa store unavailable', 503);
    const rpaInput = normalizeRpaInput(input);
    const wait = rpaInput.wait !== false && rpaInput.wait !== 'false';
    if (rpaInput.plan_id) {
      if (!wait) {
        this.rpaEngine.runPlan(String(rpaInput.plan_id), rpaInput).catch(() => {});
        return ok({ async: true, plan_id: String(rpaInput.plan_id) });
      }
      return ok(await this.rpaEngine.runPlan(String(rpaInput.plan_id), rpaInput));
    }
    if (rpaInput.task_id) {
      if (!wait) {
        this.rpaEngine.runTask(String(rpaInput.task_id), rpaInput).catch(() => {});
        return ok({ async: true, task_id: String(rpaInput.task_id) });
      }
      return ok(await this.rpaEngine.runTask(String(rpaInput.task_id), rpaInput));
    }
    if (Array.isArray(rpaInput.steps)) {
      // Ad-hoc steps skip template import's validation, so a typo'd or newer-
      // than-runtime step type used to be persisted and only fail (or silently
      // no-op) mid-run. Reject non-empty findUnsupportedSteps up front, exactly
      // like template installation does (rpa-store.js installTemplate).
      const { findUnsupportedSteps } = require('../rpa-engine');
      const unsupported = findUnsupportedSteps(rpaInput.steps);
      if (unsupported.length) {
        const summary = unsupported.slice(0, 4).map((item) => `${item.path.join('.')}: ${item.type}`).join(', ');
        return fail(`steps contain unsupported RPA step types: ${summary}`, 400);
      }
      const task = await this.rpaStore.createTask({
        profile_id: firstString(rpaInput, ['profile_id', 'user_id']),
        process_name: String(rpaInput.process_name || rpaInput.name || 'adhoc'),
        steps: rpaInput.steps,
      });
      if (!wait) {
        this.rpaEngine.runTask(task.id, rpaInput).catch(() => {});
        return ok({ async: true, task_id: task.id, task });
      }
      return ok(await this.rpaEngine.runTask(task.id, rpaInput));
    }
    return fail('plan_id, task_id or steps required', 400);
  }

  async routeRpaStatus() {
    if (!this.rpaEngine) return fail('rpa engine unavailable', 503);
    if (!this.rpaStore) return fail('rpa store unavailable', 503);
    return ok({
      ...this.rpaEngine.getStatus(),
      tasks: this.rpaStore.listTasks({ status: 'running' }),
    });
  }

  async routeRpaStop({ input }) {
    const rpaInput = normalizeRpaInput(input);
    if (!this.rpaEngine) return fail('rpa engine unavailable', 503);
    const taskId = rpaInput.task_id || null;
    if (taskId && this.rpaStore) {
      const task = this.rpaStore.getTask(taskId);
      if (!task && !this.rpaEngine.running?.has(taskId)) {
        return fail('task not found: ' + taskId, 404);
      }
    }
    return ok(await this.rpaEngine.stop(taskId));
  }

  async routeRpaTemplatesList({ input }) {
    const rpaInput = normalizeRpaInput(input);
    return ok({
      list: this.rpaStore.listTemplates(rpaInput),
      categories: this.rpaStore.listTemplateCategories(),
    });
  }

  async routeRpaTemplatesAction({ input }) {
    const rpaInput = normalizeRpaInput(input);
    if (rpaInput.action === 'install' || rpaInput.install) {
      return ok(await this.rpaStore.installTemplate(String(rpaInput.id || rpaInput.template_id), rpaInput));
    }
    if (rpaInput.action === 'import') {
      return ok(await this.rpaStore.importTemplates(rpaInput.payload || rpaInput.data || rpaInput));
    }
    if (rpaInput.action === 'save_as' || rpaInput.save_as) {
      return ok(await this.rpaStore.saveAsTemplate(rpaInput));
    }
    return ok(await this.rpaStore.upsertTemplate(rpaInput));
  }

  async routeRpaTemplateInstall({ pathname, input }) {
    const rpaInput = normalizeRpaInput(input);
    const encodedId = pathname.slice('/api/rpa/templates/'.length, -'/install'.length);
    const id = decodePathId(encodedId, 'RPA template');
    return ok(await this.rpaStore.installTemplate(id, rpaInput));
  }

  async routeRpaTemplateGet({ pathname }) {
    const id = decodePathId(pathname.slice('/api/rpa/templates/'.length), 'RPA template');
    const tpl = this.rpaStore.getTemplate(id);
    if (!tpl) return fail('template not found', 404);
    return ok(tpl);
  }

  async routeRpaTemplateDelete({ pathname }) {
    const id = decodePathId(pathname.slice('/api/rpa/templates/'.length), 'RPA template');
    return ok(await this.rpaStore.deleteTemplate(id));
  }
}

module.exports = { RpaRoutes };
