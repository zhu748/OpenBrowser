import type { Request, Subscribe } from '../desktop';

export type Family = 'chromium' | 'firefox';

export interface KernelRow {
  id?: string;
  path?: string;
  engine: Family;
  version: string;
  source: string;
  primary?: boolean;
}

type Version = { version: string } | string;
type VersionList = Version[] | { versions: Version[]; historicalVersions?: Version[] };

interface VersionCatalog {
  versions: string[];
  historicalVersions: string[];
}

export interface KernelOps {
  kernelDownload: (force: boolean) => Promise<unknown>;
  kernelCancelDownload: () => Promise<{ canceled: boolean }>;
  kernelChooseCustom: () => Promise<{ canceled: boolean }>;
  kernelSetCustom: (path: string) => Promise<unknown>;
  kernelListVersions: (family: Family, refresh: boolean) => Promise<VersionList>;
  kernelInstallVersion: (family: Family, version: string) => Promise<unknown>;
  kernelCheck: (family: Family, version: string) => Promise<{ version?: string }>;
  kernelPin: (family: Family, version: string) => Promise<unknown>;
  kernelDelete: (family: Family, version: string) => Promise<unknown>;
}

export interface KernelActions {
  list: () => Promise<KernelRow[]>;
  subscribe: Subscribe;
  download: () => Promise<unknown>;
  cancel: KernelOps['kernelCancelDownload'];
  choose: KernelOps['kernelChooseCustom'];
  setCustom: KernelOps['kernelSetCustom'];
  versions: (family: Family) => Promise<VersionCatalog>;
  install: KernelOps['kernelInstallVersion'];
  check: KernelOps['kernelCheck'];
  pin: KernelOps['kernelPin'];
  remove: KernelOps['kernelDelete'];
}

export function kernelActions(request: Request, subscribe: Subscribe, ops: KernelOps): KernelActions {
  return {
    list: () => request<KernelRow[]>('kernels:list'),
    subscribe,
    download: () => ops.kernelDownload(false),
    cancel: ops.kernelCancelDownload,
    choose: ops.kernelChooseCustom,
    setCustom: ops.kernelSetCustom,
    async versions(family) {
      const result = await ops.kernelListVersions(family, true);
      const catalog = Array.isArray(result) ? { versions: result } : result;
      const readVersion = (row: Version) => typeof row === 'string' ? row : row.version;
      return {
        versions: catalog.versions.map(readVersion),
        historicalVersions: (catalog.historicalVersions ?? []).map(readVersion),
      };
    },
    install: ops.kernelInstallVersion,
    check: ops.kernelCheck,
    pin: ops.kernelPin,
    remove: ops.kernelDelete,
  };
}
