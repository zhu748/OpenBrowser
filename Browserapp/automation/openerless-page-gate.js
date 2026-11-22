'use strict';

class OpenerlessPageGate {
  constructor(state) {
    this.state = state;
    this.contexts = new Map();
  }

  observeContext(event) {
    const { method, params } = event;
    if (method === 'Runtime.executionContextsCleared') this.contexts.clear();
    if (method === 'Runtime.executionContextDestroyed') this.contexts.delete(params.executionContextId);
    if (method === 'Runtime.executionContextCreated' && params.context?.auxData?.isDefault) {
      this.contexts.set(params.context.id, params.context);
    }
  }

  async evaluate(params, timeout) {
    const command = extra => this.state.command('Runtime.evaluate', { ...params, ...extra, disableBreaks: true }, { timeout });
    const result = await command({});
    if (params.returnByValue || result.exceptionDetails) return result;

    // Static same-process frames, including srcdoc, can get a document before
    // the first script pauses. Page.addScript covers subsequent documents.
    for (const [id, context] of this.contexts) {
      if (context.auxData.frameId === this.state.targetId) continue;
      const target = context.uniqueId ? { uniqueContextId: context.uniqueId } : { contextId: id };
      try {
        const frameResult = await command(target);
        if (frameResult.exceptionDetails) return frameResult;
      } catch (error) {
        if (this.contexts.get(id) === context) throw error;
      }
    }
    return result;
  }

  async arm(resume, budget) {
    const state = this.state;
    // The renderer may not exist yet. Chromium queues the debugger commands
    // and drains them when the original navigation resumes.
    const enabled = state.command('Debugger.enable', {}, { timeout: budget });
    this.armed = state.command('Debugger.setInstrumentationBreakpoint', {
      instrumentation: 'beforeScriptExecution',
    }, { timeout: budget + 1000 });
    const [, { breakpointId }] = await Promise.all([enabled, this.armed, resume(budget + 2000)]);
    if (!breakpointId) throw new Error('Openerless page instrumentation breakpoint was not registered');
  }

  handlePaused(params) {
    if (this.regularBreakpoint && params.hitBreakpoints?.includes(this.regularBreakpoint)) {
      this.markPaused();
      return;
    }
    if (params.reason !== 'instrumentation' || this.conversion) return;

    const conversion = this.convert(params);
    this.conversion = conversion;
    conversion.then(() => {
      if (this.conversion === conversion) this.conversion = null;
    }, error => this.state.cancel('failed', error.message));
  }

  async convert(params) {
    const state = this.state;
    const location = params.callFrames?.[0]?.location;
    if (!location?.scriptId) throw new Error('Openerless document first-script location is unavailable');
    const { breakpointId } = await this.armed;
    // An instrumentation pause freezes the renderer protocol handlers too.
    // Set a regular breakpoint at this instruction via the debugger's IO
    // channel. Its pause still gates site code but allows CDP evaluation.
    let regular;
    try {
      regular = await state.command('Debugger.setBreakpoint', { location }, { timeout: 3000 });
    } catch (error) {
      const { locations } = await state.command('Debugger.getPossibleBreakpoints', {
        start: location,
      }, { timeout: 3000 });
      if (!Array.isArray(locations) || locations.length) throw error;
      // A declaration-only script can have no executable instruction. Leave
      // instrumentation armed for the next script.
      await state.command('Debugger.resume', {}, { timeout: 3000 });
      return;
    }
    if (!regular.breakpointId) throw new Error('Openerless page execution breakpoint was not registered');
    this.regularBreakpoint = regular.breakpointId;
    const paused = new Promise(resolve => { this.markPaused = resolve; });
    let timer;
    try {
      await state.command('Debugger.removeBreakpoint', { breakpointId }, { timeout: 3000 });
      await state.command('Debugger.resume', {}, { timeout: 3000 });
      await state.run(() => Promise.race([paused, new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Openerless page execution pause was not confirmed')), 3000);
      })]));
    } finally { clearTimeout(timer); }
  }

  async release() {
    // If a script arrived during setup, verify the breakpoint handoff before
    // releasing it. On a scriptless document this just clears the pending gate.
    while (this.conversion) await this.state.run(() => this.conversion);
    await this.state.command('Debugger.disable', {}, { timeout: 3000 });
  }
}

module.exports = { OpenerlessPageGate };
