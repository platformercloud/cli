export interface ResourceType {
  kind: string;
  apiVersion: string;
}
export type ImportType = {
  skipIfTargetProvided?: boolean;
  priority: number;
  description: string;
  types: Array<ResourceType>;
};
const importTypes: Array<ImportType> = [
  {
    priority: 0,
    skipIfTargetProvided: true,
    description: 'namespace',
    types: [{ kind: 'Namespace', apiVersion: 'v1' }],
  },
  {
    priority: 1,
    description: 'configurations',
    types: [
      { kind: 'Secret', apiVersion: 'v1' },
      { kind: 'ConfigMap', apiVersion: 'v1' },
      { kind: 'PersistentVolumeClaim', apiVersion: 'v1' },
    ],
  },
  {
    priority: 2,
    description: 'deployments',
    types: [
      { kind: 'Deployment', apiVersion: 'apps/v1' },
      { kind: 'Deployment', apiVersion: 'extensions/v1beta1' },
      { kind: 'StatefulSet', apiVersion: 'apps/v1' },
      { kind: 'DaemonSet', apiVersion: 'apps/v1' },
      { kind: 'CronJob', apiVersion: 'batch/v1' },
      { kind: 'CronJob', apiVersion: 'batch/v1beta1' },
    ],
  },
  {
    priority: 3,
    description: 'services',
    types: [
      { kind: 'Service', apiVersion: 'v1' },
      { kind: 'Ingress', apiVersion: 'extensions/v1beta1' },
    ],
  },
];

export { importTypes };

export type KindPriorityMap = Map<string, number>;

export function getKindToPriorityMap(importTypes: ImportType[]) {
  const priorityMap: KindPriorityMap = new Map();
  const importTypeMap = new Map<number, ImportType>();
  importTypes.forEach((group) => {
    importTypeMap.set(group.priority, group);
    group.types.forEach((type) => {
      priorityMap.set(type.kind, group.priority);
    });
  });
  const priorities = [...importTypeMap.keys()].sort();
  return { priorityMap, importTypeMap, priorities };
}
