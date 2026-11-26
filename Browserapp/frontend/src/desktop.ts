export type Request = <T>(method: string, payload?: Record<string, unknown>) => Promise<T>;
export type Subscribe = (listener: (event: DesktopEvent) => void) => () => void;

export interface DesktopEvent {
  type?: string;
  action?: string;
  phase?: string;
  message?: string;
  percent?: number;
  received?: number;
  total?: number;
  speed?: number;
  version?: string;
  engine?: string;
  lifecycle?: { pending?: boolean };
}

export type Reply<T> = { ipcResult: 1; ok: true; value: T }
  | { ipcResult: 1; ok: false; error: { message: string; code?: string | number; completed?: number } };

declare global {
  interface Window {
    rebuild: { request: <T>(method: string, payload: Record<string, unknown>) => Promise<Reply<T>>; onEvent: Subscribe };
    ops: KernelOps & { rotateApiKey: () => Promise<{ apiKey: string }> };
  }
}

export function unwrap<T>(reply: Reply<T>): T {
  if (reply.ok) return reply.value;
  throw Object.assign(new Error(reply.error.message), reply.error);
}

export const request: Request = async <T>(method: string, payload: Record<string, unknown> = {}) =>
  unwrap(await window.rebuild.request<T>(method, payload));

export const subscribe: Subscribe = listener => window.rebuild.onEvent(listener);

export function message(failure: unknown): string {
  return failure instanceof Error ? failure.message : String(failure);
}

import type { KernelOps } from './kernels/api';

