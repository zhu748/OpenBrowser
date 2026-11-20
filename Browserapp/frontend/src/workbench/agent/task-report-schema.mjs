import { t as z } from './external-CdTk2m9u.js';

const sensitive = /password|passcode|cookie|token|api[\s_-]?key|secret|authorization|credential|密码|口令|令牌|密钥|凭证/i;
const parameter = z.object({ key: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(80),
  value: z.union([z.string().trim().max(256), z.number().finite(), z.boolean(), z.null()]) });
const windowResult = z.object({ dirId: z.string().trim().min(1).max(256), success: z.boolean(),
  status: z.literal('unused').optional(), failureReason: z.string().max(2000) });
const taskReport = z.object({ taskName: z.string().trim().min(1).max(80), params: z.array(parameter).max(20),
  windows: z.array(windowResult).min(1).max(100) }).superRefine((report, context) => {
  function check(condition, path, message) {
    if (condition) context.addIssue({ code: 'custom', path, message });
  }
  check(sensitive.test(report.taskName), ['taskName'], 'taskName must not contain sensitive data');
  const seen = new Set();
  for (const [index, result] of report.windows.entries()) {
    const { dirId, success, status, failureReason } = result;
    check(seen.has(dirId), ['windows', index, 'dirId'], 'dirId must be unique within a task report');
    seen.add(dirId);
    const unused = status === 'unused';
    check(unused && success, ['windows', index, 'success'], 'expected success=false because status=unused');
    check((unused || success) && failureReason !== '', ['windows', index, 'failureReason'], 'expected an empty failure reason');
    check(!unused && !success && !failureReason.trim(), ['windows', index, 'failureReason'], 'expected a non-empty string because success=false');
    check(sensitive.test(failureReason), ['windows', index, 'failureReason'], 'failure reasons must not contain sensitive data');
  }
  for (const [index, entry] of report.params.entries()) {
    for (const key of ['key', 'name', 'value']) {
      const value = entry[key];
      check(typeof value === 'string' && sensitive.test(value), ['params', index, key], 'parameters must not contain sensitive data');
    }
  }
});
export { taskReport as Nn };
