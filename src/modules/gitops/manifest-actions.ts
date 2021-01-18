import { cli } from 'cli-ux';
import { Observable } from 'rxjs';
import { count, filter, mergeMap, tap, toArray } from 'rxjs/operators';
import { ManifestFile } from './manifest-file';
import { ManifestFileObject, ManifestState } from './manifest-object';
import chalk = require('chalk');

export async function applyManifests(
  parsedFiles: Observable<ManifestFile>,
  ctx: Record<'orgId' | 'projectId' | 'envId', string>,
  priority: 1 | 2 | null,
  msgs: Record<'start', string>
) {
  cli.action.start(msgs.start);
  const manifests = parsedFiles.pipe(
    mergeMap((file) => file.getManifests(priority))
  );
  const { length: mainifestCount } = await manifests
    .pipe(
      mergeMap(async (manifest) => manifest.applyManifest(ctx), 5),
      toArray()
    )
    .toPromise();
  if (mainifestCount === 0) {
    cli.action.stop('Not found');
    return;
  }
  const incompleteManifests = await manifests
    .pipe(
      mergeMap(async (manifest) => {
        if (manifest.state === ManifestState.MULTIPLE_OBJECTS_FOUND) {
          return manifest;
        }
        return null;
      }, 1),
      filter((m): m is ManifestFileObject => m !== null),
      toArray()
    )
    .toPromise();
  if (incompleteManifests.length === 0) {
    cli.action.stop();
    return;
  }
  const incompleteCount = incompleteManifests.length;
  cli.action.stop(
    `${incompleteCount} manifest${
      incompleteCount > 1 ? 's' : ''
    } matched with multiple objects`
  );
  for (const manifest of incompleteManifests) {
    await manifest.applyWithSelectedObject(ctx);
  }
}
export async function printLogs(parsedFiles: Observable<ManifestFile>) {
  const manifests = parsedFiles.pipe(mergeMap((file) => file.manifests));
  const successStates = [
    ManifestState.UNKNOWN_SUCCESS_RESPONSE,
    ManifestState.FAILED_TO_WRITE_TO_FILE,
    ManifestState.COMPLETE,
  ];
  const successTree = cli.tree();
  await manifests
    .pipe(
      filter((m) => successStates.includes(m.state)),
      tap((manifest) => {
        const subTree = cli.tree();
        const kind = manifest.manifest.kind;
        const name = manifest.manifest.metadata.name;
        const fileName = manifest.file.file.fileName;
        successTree.insert(`${kind} ${name} created (${fileName})`, subTree);
        if (manifest.state === ManifestState.UNKNOWN_SUCCESS_RESPONSE) {
          subTree.insert(chalk.yellow('Unknown server response'));
        }
        if (manifest.state === ManifestState.FAILED_TO_WRITE_TO_FILE) {
          subTree.insert(chalk.yellow('Failed to write output to file'));
        }
      }),
      count(),
      tap((count) => {
        if (count === 0) return;
        cli.log('');
        cli.log(chalk.green('Created resources'));
        successTree.display();
      })
    )
    .toPromise();
  const errorTree = cli.tree();
  await manifests
    .pipe(
      filter((m) => m.state === ManifestState.ERROR),
      tap((manifest) => {
        const subTree = cli.tree();
        const kind = manifest.manifest.kind;
        const name = manifest.manifest.metadata.name;
        const fileName = manifest.file.file.fileName;
        errorTree.insert(`${kind} ${name} (${fileName})`, subTree);
        if (manifest.errorMsg) {
          subTree.insert(chalk.red(manifest.errorMsg));
        }
      }),
      count(),
      tap((count) => {
        if (count === 0) return;
        cli.log('');
        cli.log(chalk.red('Failed manifests'));
        errorTree.display();
      })
    )
    .toPromise();
  const skippedTree = cli.tree();
  await manifests
    .pipe(
      filter((m) => m.state === ManifestState.SKIPPED),
      tap((manifest) => {
        const subTree = cli.tree();
        const kind = manifest.manifest.kind;
        const name = manifest.manifest.metadata.name;
        const fileName = manifest.file.file.fileName;
        skippedTree.insert(`${kind} ${name} (${fileName})`, subTree);
      }),
      count(),
      tap((count) => {
        if (count === 0) return;
        cli.log('');
        cli.log(chalk.red('Skipped manifests'));
        skippedTree.display();
      })
    )
    .toPromise();
}
export function printSummary(statusArr: ManifestState[]) {
  const manifestCount = statusArr.length;
  const summary = new Map<ManifestState, number>();
  statusArr.forEach((status) => {
    summary.set(status, (summary.get(status) || 0) + 1);
  });
  const errCount = summary.get(ManifestState.ERROR) || 0;
  const skippedCount = summary.get(ManifestState.SKIPPED) || 0;
  // msg
  const successCount =
    (summary.get(ManifestState.UNKNOWN_SUCCESS_RESPONSE) || 0) +
    (summary.get(ManifestState.FAILED_TO_WRITE_TO_FILE) || 0) +
    (summary.get(ManifestState.COMPLETE) || 0);
  cli.log();
  if (manifestCount === successCount) {
    cli.log(chalk.green('Success'));
  } else if (successCount === 0) {
    cli.log(chalk.red('Failure'));
  } else {
    cli.log(chalk.yellow('Failed to apply some manifests.'));
  }
  // counts
  cli.log('Manifests found: ', chalk.blue(manifestCount));
  cli.log('Success count: ', chalk.blue(successCount));
  cli.log(
    'Errors occurred: ',
    errCount === 0 ? chalk.blue(0) : chalk.red(errCount)
  );
  cli.log(
    'Skipped manfests: ',
    skippedCount === 0 ? chalk.blue(0) : chalk.yellow(skippedCount)
  );
}
