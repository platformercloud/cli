export const manifestImportPriorities = ['1', '2', '3'] as const;

type ManifestImportPriorities = typeof manifestImportPriorities[number];

export interface ResourceType {
  kind: string;
  apiVersion: string;
}
export type ImportTypes = Record<
  ManifestImportPriorities,
  {
    description: string;
    types: Array<ResourceType>;
  }
>;
const importTypes: ImportTypes = {
  1: {
    description: 'configuration',
    types: [
      { kind: 'Secret', apiVersion: 'v1' },
      { kind: 'ConfigMap', apiVersion: 'v1' },
    ],
  },
  2: {
    description: 'deployments',
    types: [
      { kind: 'Deployment', apiVersion: 'apps/v1' },
      { kind: 'StatfulSet', apiVersion: 'apps/v1' },
    ],
  },
  3: {
    description: 'other manifests',
    types: [],
  },
};

export { importTypes };
