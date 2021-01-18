import inquirer = require('inquirer');
import cli from 'cli-ux';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { applyManifest } from './api';
import { writeManifestResult } from './fs';
import { ManifestFile } from './manifest-file';
import { K8sObject } from './parser';
import { MatchedMultipleYamlObjectsError, YamlObject } from './yaml-object';
import chalk = require('chalk');

export const skippedSubject = new BehaviorSubject<boolean>(false);
export const skippedStateNotifier = skippedSubject.pipe(
  first((s) => s === true)
);

export function skipRemainingManifests() {
  skippedSubject.next(true);
  skippedSubject.complete();
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
  errorMsg: string | null = null;
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
    try {
      await this.subject.toPromise();
    } catch (error) {}
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
        this.errorMsg = (error as Error).message;
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
      cli.action.stop(chalk.red('Failed to apply'));
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

export class ManifestFileObject extends ManifestObject {
  readonly file: ManifestFile;
  constructor(manifest: K8sObject, file: ManifestFile) {
    super(manifest);
    this.file = file;
  }
}
