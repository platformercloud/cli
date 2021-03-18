import { flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { Observable, of } from 'rxjs';
import { count, filter, mergeMap, tap, toArray } from 'rxjs/operators';
import Command from '../base-command';
import { ensureTargetNamespace } from '../modules/apps/environment';
import { getClusterNamespaces, listClusters } from '../modules/cluster/api';
import {
  getDefaultEnvironment,
  getDefaultOrganization,
  getDefaultProject,
} from '../modules/config/helpers';
import ValidationError from '../modules/errors/validation-error';
import { createOutputPath } from '../modules/gitops/fs';
import { ManifestImportGroup } from '../modules/gitops/manifest-group';
import { importTypes } from '../modules/gitops/manifest-import-types';
import {
  ManifestCtx,
  ManifestFileObject,
  ManifestObject,
  ManifestState,
  skipRemainingManifests,
} from '../modules/gitops/manifest-object';
import { tryValidateCommonFlags } from '../modules/util/validations';
import chalk = require('chalk');

export default class Apply extends Command {
  static description =
    'Import resources from existing namespace in a Kubernetes Cluster';

  static flags = {
    help: flags.help({ char: 'h' }),
    save: flags.boolean(),
    all: flags.boolean({
      char: 'A',
      description: 'Log out of all contexts',
      required: false,
      exclusive: ['context'],
    }),
    organization: flags.string({
      char: 'O',
      description: 'Organization Name',
      required: false,
      multiple: false,
      default: () => getDefaultOrganization()?.name,
    }),
    project: flags.string({
      char: 'P',
      description: 'Project Name',
      required: false,
      multiple: false,
      default: () => getDefaultProject()?.name,
    }),
    environment: flags.string({
      char: 'E',
      description: 'Environment Name',
      required: false,
      multiple: false,
      default: () => getDefaultEnvironment()?.name,
    }),
    cluster: flags.string({
      char: 'C',
      description: 'Cluster Name',
      required: true,
      multiple: false,
    }),
    namespace: flags.string({
      char: 'N',
      description: 'Namspace',
      required: true,
      multiple: false,
    }),
    'target-ns': flags.string({
      char: 'T',
      description: 'Target namespace',
      required: false,
      multiple: false,
    }),
  };

  static args = [];

  async run() {
    const { flags } = this.parse(Apply);
    const context = await tryValidateCommonFlags({
      organization: {
        name: flags.organization,
        required: true,
      },
      project: {
        name: flags.project,
        required: true,
      },
      environment: {
        name: flags.environment,
        required: true,
      },
    });
    const { orgId, projectId, envId } = context as Required<typeof context>;
    const clusterName = flags['cluster'];
    const sourceNS = flags['namespace'];
    const { cluster } = await validateClusterNamespace({
      orgId,
      projectId,
      clusterName,
      namespace: sourceNS,
    });
    const targetNS = flags['target-ns'];
    cli.log(`Target namespace [${targetNS || sourceNS}]`);
    if (targetNS) {
      await ensureTargetNamespace({ orgId, projectId, envId, name: targetNS });
    }
    const clusterId = cluster.id;
    if (flags.save) {
      await createOutputPath(flags.environment);
    }
    const ctx = { orgId, projectId, clusterId, namespace: sourceNS };
    // apply source namespace if target is not provided
    const typesToImport = targetNS
      ? importTypes.filter((f) => !f.skipIfTargetProvided)
      : importTypes;
    const importGroups = typesToImport.map(
      (importType) =>
        new ManifestImportGroup(importType, ctx, sourceNS, targetNS)
    );
    const manifestCtx: ManifestCtx = {
      orgId,
      projectId,
      envId,
      envName: flags.environment,
      saveOutput: flags.save,
    };
    try {
      for (const group of importGroups) {
        const manifestsOfGroup = group.getManifests();
        await applyManifests(manifestsOfGroup, manifestCtx, {
          start: `Applying ${group.resourceTypes.description}`,
        });
        // if no apply failures occured, show warnings for fetch failures
        displayFetchFailures(group);
      }
    } catch (error) {
      // if error occurs, append msg to the running spinner
      cli.action.stop('Error occured');
      cli.action.start('Waiting until other manifests complete');
      skipRemainingManifests();
      // wait till all running tasks are completed or thrown
      await of(...importGroups)
        .pipe(
          mergeMap((group) => group.getFetchedManifests()),
          mergeMap((manifest) => manifest.waitTillCompletion())
        )
        .toPromise();
      cli.action.stop();
    }
    const statusArr = await of(...importGroups)
      .pipe(
        mergeMap((group) =>
          group.getFetchedManifests().map((manifest) => manifest.state)
        ),
        toArray()
      )
      .toPromise();
    const manifestCount = statusArr.length;
    if (manifestCount === 0) {
      throw new ValidationError(
        `No supported manifests were found in the namespace ${sourceNS}`
      );
    }
    await printLogs(importGroups);
    printSummary(statusArr);
  }
}

async function validateClusterNamespace({
  orgId,
  projectId,
  clusterName,
  namespace,
}: {
  orgId: string;
  projectId: string;
  clusterName: string;
  namespace: string;
}) {
  const clusters = await listClusters(orgId, projectId!);
  const cluster = clusters.find((c) => c.name === clusterName);
  if (!cluster) {
    throw new ValidationError(`Invalid Cluster [${clusterName}]`);
  }
  const clusterId = cluster.id;
  const namespaces = await getClusterNamespaces({
    orgId,
    projectId,
    clusterId,
  });
  if (!namespaces.some((ns) => ns.metadata.name === namespace)) {
    throw new ValidationError(`Invalid Namespace [${namespace}]`);
  }
  return { cluster };
}

async function applyManifests(
  manifests: Observable<ManifestObject>,
  ctx: ManifestCtx,
  msgs: Record<'start', string>
) {
  cli.action.start(msgs.start);
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

async function printLogs(groups: ManifestImportGroup[]) {
  const manifests = of(...groups).pipe(
    mergeMap((group) => group.getFetchedManifests())
  );
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
        successTree.insert(`${kind} ${name} applied`, subTree);
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
        cli.log(chalk.green('Applied resources'));
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
        errorTree.insert(`${kind} ${name}`, subTree);
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
        const kind = manifest.manifest.kind;
        const name = manifest.manifest.metadata.name;
        skippedTree.insert(`${kind} ${name}`);
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

async function displayFetchFailures(group: ManifestImportGroup) {
  if (group.fetchFailures.length === 0) return;
  const tree = cli.tree();
  group.fetchFailures.forEach((failure) => {
    const subTree = cli.tree();
    tree.insert(chalk.yellow(`${failure.message}`), subTree);
    if (failure.cause) {
      subTree.insert(failure.cause);
    }
  });
  tree.display();
}

function printSummary(statusArr: ManifestState[]) {
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
