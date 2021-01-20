type ManifestImportPriorities = number;

export interface ResourceType {
  kind: string;
  apiVersion: string;
}
export type ImportType = {
  priority: number;
  description: string;
  types: Array<ResourceType>;
};
const importTypes: Array<ImportType> = [
  {
    priority: 0,
    description: 'namespace',
    types: [{ kind: 'Namespace', apiVersion: 'v1' }],
  },
  {
    priority: 1,
    description: 'configuration',
    types: [
      { kind: 'Secret', apiVersion: 'v1' },
      { kind: 'ConfigMap', apiVersion: 'v1' },
      { kind: 'PersistentVolume', apiVersion: 'v1' },
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
      { kind: 'Job', apiVersion: 'batch/v1' },
      { kind: 'CronJob', apiVersion: 'batch/v1' },
    ],
  },
  {
    priority: 3,
    description: 'other manifests',
    types: [
      { kind: 'Service', apiVersion: 'v1' },
      { kind: 'Ingress', apiVersion: 'extensions/v1beta1' },
    ],
  },
];

export { importTypes };
