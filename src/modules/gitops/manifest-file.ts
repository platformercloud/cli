import { FileInfo } from './fs';
import { ManifestObject } from './manifest-object';
import { parseK8sManifestsFromFile } from './parser';

const priorities: Record<string, 1 | 2> = {
  ConfigMap: 1,
  Secret: 1,
  PersistentVolume: 1,
  PersistentVolumeClaim: 1,
  Deployment: 2,
  StatefulSet: 2,
  DaemonSet: 2,
  CronJob: 2,
  Job: 2,
};

export class ManifestFile {
  readonly file: FileInfo;
  #manifests: ManifestObject[] = [];
  constructor(file: FileInfo) {
    this.file = file;
  }
  get manifests() {
    return this.#manifests;
  }
  async parseFile() {
    const { filepath, extension } = this.file;
    try {
      const manifests = await parseK8sManifestsFromFile(filepath, extension);
      this.#manifests = manifests
        .sort((a, b) => {
          const aPriority = priorities[a.kind];
          const bPriority = priorities[b.kind];
          if (aPriority && bPriority) {
            return aPriority > bPriority ? -1 : 1;
          } else if (bPriority) {
            return 1;
          } else if (aPriority) {
            return -1;
          }
          return a.metadata.name.localeCompare(b.metadata.name);
        })
        .map((m) => new ManifestObject(m, this));
    } catch (error) {}
    return this;
  }
  getManifests(priority: 1 | 2 | null) {
    return this.#manifests
      .map((m) => {
        const assignedPriority = priorities[m.manifest.kind] || null;
        if (assignedPriority === priority) return m;
        return null;
      })
      .filter((m): m is ManifestObject => m !== null);
  }
}
