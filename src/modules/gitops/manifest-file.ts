import { FileInfo } from './fs';
import { KindPriorityMap } from './manifest-import-types';
import { ManifestFileObject, modifyYAML } from './manifest-object';
import { parseK8sManifestsFromFile } from './parser';

export class ManifestFile {
  readonly file: FileInfo;
  #targetNS?: string;
  #priorities: KindPriorityMap;
  #manifests: ManifestFileObject[] = [];
  constructor(file: FileInfo, priorityMap: KindPriorityMap, targetNS?: string) {
    this.file = file;
    this.#targetNS = targetNS;
    this.#priorities = priorityMap;
  }
  get manifests() {
    return this.#manifests;
  }
  async parseFile() {
    const { filepath, extension } = this.file;
    try {
      const manifests = await parseK8sManifestsFromFile(filepath, extension);
      const sorted = manifests.sort((a, b) => {
        const aPriority =
          this.#priorities.get(a.kind) ?? Number.MAX_SAFE_INTEGER;
        const bPriority =
          this.#priorities.get(b.kind) ?? Number.MAX_SAFE_INTEGER;
        if (aPriority && bPriority) {
          return aPriority > bPriority ? -1 : 1;
        } else if (bPriority) {
          return 1;
        } else if (aPriority) {
          return -1;
        }
        return a.metadata.name.localeCompare(b.metadata.name);
      });
      // remove namespaces if a target namespace is provided
      const filtered = this.#targetNS
        ? sorted.filter((m) => m.kind !== 'Namespace')
        : sorted;
      this.#manifests = filtered.map(
        (m) => new ManifestFileObject(modifyYAML(m, this.#targetNS), this)
      );
    } catch (error) {}
    return this;
  }
  getManifests(priority: number | null) {
    return this.#manifests
      .map((m) => {
        const assignedPriority = this.#priorities.get(m.manifest.kind) ?? null;
        if (assignedPriority === priority) return m;
        return null;
      })
      .filter((m): m is ManifestFileObject => m !== null);
  }
}
