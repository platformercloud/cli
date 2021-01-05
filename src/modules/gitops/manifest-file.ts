import inquirer = require('inquirer');
import cli from 'cli-ux';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { applyManifest } from './api';
import { FileInfo, writeManifestResult } from './fs';
import { K8sObject, parseK8sManifestsFromFile } from './parser';
import { MatchedMultipleYamlObjectsError, YamlObject } from './YamlObject';
import chalk = require('chalk');

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

const skippedSubject = new BehaviorSubject<boolean>(false);
export const skippedStateNotifier = skippedSubject.pipe(
  first((s) => s === true)
);

export function skipRemainingManifests() {
  skippedSubject.next(true);
  skippedSubject.complete();
}

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
        .map((m) => new ManifestObject(m));
    } catch (error) {}
    return this;
  }
  getManifests(priority: 1 | 2 | null) {
    return this.#manifests
      .map((m, idx) => {
        const assignedPriority = priorities[m.manifest.kind] || null;
        if (assignedPriority === priority) return m;
        return null;
      })
      .filter((m): m is ManifestObject => m !== null);
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
    skippedStateNotifier.subscribe(() => {
      this.skipOnError();
    });
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
        if (skippedSubject.getValue()) {
          // request was already in progress, when skipped notification was issued.
          // ignore matched objects, and mark as skipped
          s.error(ManifestState.SKIPPED);
        }
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
    cli.log(
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
    s.error(ManifestState.SKIPPED);
  }
}
