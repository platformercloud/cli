import inquirer = require('inquirer');
import cli from 'cli-ux';
import { BehaviorSubject } from 'rxjs';
import { applyManifest } from './api';
import { FileInfo, writeManifestResult } from './fs';
import {
  isValidK8sObject,
  K8sObject,
  parseK8sManifestsFromFile,
} from './parser';
import { MatchedMultipleYamlObjectsError, YamlObject } from './YamlObject';
import chalk = require('chalk');
const prioritizedKinds = ['ConfigMap', 'Secret'];

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
          const bPriority = prioritizedKinds.includes(b.kind);
          if (prioritizedKinds.includes(a.kind)) {
            if (!bPriority) {
              return -1;
            }
          } else if (bPriority) {
            return 1;
          }
          return a.metadata.name.localeCompare(b.metadata.name);
        })
        .map((m) => new ManifestObject(m));
    } catch (error) {}
    return this;
  }
  getManifests(prioritized: boolean) {
    const selectedIdxArr = this.#manifests
      .map((m, idx) => {
        const isPrioritizedKind = prioritizedKinds.includes(m.manifest.kind);
        if (prioritized && isPrioritizedKind) return idx;
        if (!prioritized && !isPrioritizedKind) return idx;
        return -1;
      })
      .filter((idx) => idx !== -1);
    return selectedIdxArr.map((mIdx) => {
      const manifestObj = this.#manifests[mIdx];
      return manifestObj;
    });
  }
  skipOnError() {
    this.#manifests.forEach((s) => {
      s.skipOnError();
    });
  }
}

export const enum ManifestState {
  WAITING = 'WAITING',
  APPLYING = 'APPLYING',
  UNKNOWN_SUCCESS_RESPONSE = 'UNKNOWN_SUCCESS_RESPONSE',
  MULTIPLE_OBJECTS_FOUND = 'MULTIPLE_OBJECTS_FOUND',
  ERROR = 'ERROR',
  SKIPPED = 'SKIPPED',
  WRITING_TO_FILE = 'WRITING_TO_FILE',
  FAILED_TO_WRITE_TO_FILE = 'FAILED_TO_WRITE_TO_FILE',
  COMPLETE = 'COMPLETE',
}
const inProgressStates = [
  ManifestState.APPLYING,
  ManifestState.WRITING_TO_FILE,
];
export class ManifestObject {
  readonly manifest: K8sObject;
  readonly subject: BehaviorSubject<ManifestState>;
  matchedYamlObjects: YamlObject[] = [];
  constructor(manifest: K8sObject) {
    this.manifest = manifest;
    this.subject = new BehaviorSubject<ManifestState>(ManifestState.WAITING);
    // this.subject.subscribe({
    //   next: (v) =>
    //     v !== ManifestState.WAITING &&
    //     cli.log(`${manifest.metadata.name} (${manifest.kind}) ${v}`),
    //   error: (v) =>
    //     cli.log(`${manifest.metadata.name} (${manifest.kind}) ${chalk.red(v)}`),
    // });
  }
  get state(): ManifestState {
    if (this.subject.hasError) return this.subject.thrownError as ManifestState;
    return this.subject.getValue();
  }
  async waitTillCompletion() {
    await this.subject.toPromise().catch(() => {});
  }
  async applyManifest(
    ctx: Record<'orgId' | 'projectId' | 'envId', string>,
    modifiedManifest?: K8sObject
  ) {
    const s = this.subject;
    if (s.isStopped) return;
    const { orgId, projectId, envId } = ctx;
    let res;
    s.next(ManifestState.APPLYING);
    try {
      res = await applyManifest(
        orgId,
        projectId,
        envId,
        modifiedManifest || this.manifest
      );
      if (res === null) {
        s.next(ManifestState.UNKNOWN_SUCCESS_RESPONSE);
        return s.complete();
      }
    } catch (error) {
      if (
        error instanceof MatchedMultipleYamlObjectsError &&
        !modifiedManifest
      ) {
        this.matchedYamlObjects = error.matchedObjects;
        return s.next(ManifestState.MULTIPLE_OBJECTS_FOUND);
      } else {
        s.error(ManifestState.ERROR);
      }
      throw error;
    }
    s.next(ManifestState.WRITING_TO_FILE);
    try {
      await writeManifestResult(res, this.manifest, envId);
      s.next(ManifestState.COMPLETE);
      s.complete();
    } catch (error) {
      console.log(error);
      s.error(ManifestState.FAILED_TO_WRITE_TO_FILE);
    }
  }
  async applyWithSelectedObject(
    ctx: Record<'orgId' | 'projectId' | 'envId', string>
  ) {
    const s = this.subject;
    if (s.isStopped || s.getValue() !== ManifestState.MULTIPLE_OBJECTS_FOUND) {
      throw new Error('Invalid state');
    }
    cli.warn(
      chalk.yellow(
        `Mutiple objects matched for manifest ${this.manifest.metadata.name}`
      )
    );
    const { selectedObjectId } = await inquirer.prompt([
      {
        name: 'selectedObjectId',
        message: 'Select an object',
        type: 'list',
        choices: this.matchedYamlObjects.map((obj) => ({
          name: `${obj.Name} (${obj.Kind})`,
          value: obj.ID,
        })),
      },
    ]);
    const selectedObject = this.matchedYamlObjects.find(
      (o) => o.ID === selectedObjectId
    );
    if (!selectedObject) throw new Error('Invalid selection');
    cli.action.start(
      `Appying ${this.manifest.metadata.name} with ${selectedObject.Label}=${selectedObject.ID}`
    );
    const modified: K8sObject = JSON.parse(JSON.stringify(this.manifest));
    modified.metadata.labels = {
      ...modified.metadata.labels,
      [selectedObject?.Label]: selectedObjectId,
    };
    try {
      await this.applyManifest(ctx, modified);
      cli.action.stop();
    } catch (err) {
      cli.action.stop(chalk.red(`Failed to apply`));
      throw err;
    }
  }
  skipOnError() {
    const s = this.subject;
    // error or completed states
    if (s.isStopped) return;
    // let tasks in progess, run until completion
    if (inProgressStates.includes(s.getValue())) return;
    cli.log(
      'SKIPPING ',
      this.manifest.kind,
      this.manifest.metadata.name,
      ' ',
      this.state
    );
    s.error(ManifestState.SKIPPED);
  }
}
