import { request } from '../desktop';

export interface ProxySummary {
  id: string;
  name: string;
  protocol: string;
  host: string;
  port: number;
  remark: string;
  lastCheckOk?: boolean | null;
  lastIp?: string;
  windowCount: number;
}

export interface ProxyRecord extends Omit<ProxySummary, 'windowCount'> {
  username: string;
  password: string;
  maxConcurrency?: number;
}

export const protocols = ['http', 'https', 'socks4', 'socks5'] as const;
export const directProxy = 'direct';
export const customProxy = 'custom';
export const libraryProxy = (id: string) => `library:${id}`;

export function listProxies() {
  return request<ProxySummary[]>('proxies:summaries');
}

export function proxyAddress(value: { host: string; port: number }) {
  const host = value.host.includes(':') ? `[${value.host.replace(/^\[|\]$/g, '')}]` : value.host;
  return `${host}:${value.port}`;
}

export function proxyChoice(dto: Record<string, unknown>) {
  const proxy = Array.isArray(dto.proxyInfoList) ? dto.proxyInfoList[0] : undefined;
  if (dto.proxyCategory === 'noproxy' || proxy?.proxyCategory === 'noproxy' || proxy?.isDirect === true) return directProxy;
  // Saved templates can carry older top-level fields alongside a newer entry.
  if (proxy) {
    const id = proxy.moduleId || proxy.id;
    return id ? libraryProxy(String(id)) : customProxy;
  }
  if (dto.networkMode === 'direct') return directProxy;
  const id = dto.proxyId || dto.moduleId;
  if (id) return libraryProxy(String(id));
  return dto.networkMode === 'proxy' || dto.host ? customProxy : directProxy;
}

export function proxyFields(choice: string, rows: ProxySummary[]): Record<string, unknown> {
  if (choice === directProxy) return { proxyCategory: 'noproxy', proxyInfoList: [{ proxyCategory: 'noproxy', isDirect: true }] };
  const record = rows.find(row => libraryProxy(row.id) === choice);
  if (!record) throw new Error('所选代理不存在，请重新选择');
  return { proxyCategory: record.protocol.toUpperCase(), proxyInfoList: [{ moduleId: record.id }] };
}
