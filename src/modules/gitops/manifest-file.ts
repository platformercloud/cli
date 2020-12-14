import { fstat } from 'fs';
import { BehaviorSubject, defer, from, ReplaySubject, Subject } from 'rxjs';
import { applyManifest } from './api';
import { FileInfo, writeManifestResult } from './fs';
import {
  isValidK8sObject,
  K8sObject,
  parseK8sManifestsFromFile,
} from './parser';
import { cli } from 'cli-ux';

const prioritizedKinds = ['ConfigMap', 'Secret'];

export class ManifestFile {
  readonly file: FileInfo;
  #manifests: K8sObject[] = [];
  subjects: BehaviorSubject<string>[] = [];
  sub: BehaviorSubject<string>;
  constructor(file: FileInfo) {
    this.file = file;
    this.sub = new BehaviorSubject('Waiting');
  }
  get manifests() {
    return this.#manifests;
  }
  async parseFile() {
    const { filepath, extension } = this.file;
    this.sub.next('Reading file');
    try {
      const manifests = await parseK8sManifestsFromFile(filepath, extension);
      this.#manifests = manifests.sort((a, b) => {
        const bPriority = prioritizedKinds.includes(b.kind);
        if (prioritizedKinds.includes(a.kind)) {
          if (!bPriority) {
            return -1;
          }
        } else if (bPriority) {
          return 1;
        }
        return a.metadata.name.localeCompare(b.metadata.name);
      });
      this.subjects = this.#manifests.map(
        () => new BehaviorSubject<string>('Waiting')
      );
      this.sub.next(`${manifests.length} manifests(s) detected`);
      this.sub.complete();
    } catch (error) {
      this.sub.error(error.message);
    }
    return this;
  }
  async applyManifestAtIdx(
    idx: number,
    ctx: Record<'orgId' | 'projectId' | 'envId', string>
  ) {
    return new Promise<void>(async (resolve, reject) => {
      const s = this.subjects[idx];
      const { orgId, projectId, envId } = ctx;
      s.next('Applying manifest');
      // cli.log('Applying manifest');
      let res;
      try {
        res = await applyManifest(
          orgId,
          projectId,
          envId,
          this.#manifests[idx]
        );
        resolve();
        if (!isValidK8sObject(res)) {
          // cli.log('Failed to parse server response');
          return s.error('Failed to parse server response');
        }
      } catch (error) {
        reject();
        // cli.log(error.message);
        return s.error(error.message);
      }
      s.next('Writing to file');
      // cli.log('Writing to file');
      try {
        await writeManifestResult(res, envId);
        s.next('Done');
        // cli.log('Done');
        s.complete();
      } catch (error) {
        // cli.log('Failed to write to file');
        s.error('Failed to write to file');
      }
    });
  }
  applyManifestsAsObservableArr(
    prioritized: boolean,
    ctx: Record<'orgId' | 'projectId' | 'envId', string>
  ) {
    const selectedIdxArr = this.#manifests
      .map((m, idx) => {
        const isPrioritizedKind = prioritizedKinds.includes(m.kind);
        if (prioritized && isPrioritizedKind) return idx;
        if (!prioritized && !isPrioritizedKind) return idx;
        return -1;
      })
      .filter((idx) => idx !== -1);
    return selectedIdxArr.map((mIdx) => () =>
      this.applyManifestAtIdx(mIdx, ctx)
    );
  }
  skipOnError() {
    if (!this.sub.isStopped) {
      this.sub.error('Skipped');
    }
    this.subjects.forEach((s) => {
      if (s.isStopped || s.getValue() === 'Writing to file') return;
      s.error('Skipped');
    });
  }
}
