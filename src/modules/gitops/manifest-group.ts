import { defer, Observable, of } from 'rxjs';
import {
  filter,
  map,
  mergeAll,
  mergeMap,
  retry,
  shareReplay,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { queryResource } from '../cluster/api';
import { ImportType, ResourceType } from './manifest-import-types';
import {
  ManifestObject,
  modifyTargetNS,
  skippedStateNotifier,
} from './manifest-object';
import { K8sObject } from './parser';

interface ResourceQuery {
  orgId: string;
  projectId: string;
  clusterId: string;
  namespace: string;
}

export class ManifestImportGroup {
  resourceTypes: ImportType;
  #manifests: ManifestObject[] = [];
  #observable: Observable<ManifestObject>;
  constructor(
    resourceTypes: ImportType,
    query: ResourceQuery,
    targetNS?: string
  ) {
    this.resourceTypes = resourceTypes;
    this.#observable = of(...this.resourceTypes.types).pipe(
      mergeMap((r) => fetchResourcesOfType(query, r), 4),
      takeUntil(skippedStateNotifier),
      map((v) => v.payload),
      mergeAll(),
      filter(shouldImport),
      map((v) => new ManifestObject(modifyTargetNS(v, targetNS))),
      tap((v) => this.#manifests.push(v)),
      shareReplay()
    );
  }
  getFetchedManifests() {
    return this.#manifests;
  }
  getManifests() {
    return this.#observable;
  }
}

function shouldImport(v: K8sObject) {
  const isJobWithCronJobOwner =
    v.kind === 'Job' &&
    v.ownerReferences?.some((ref) => ref.kind === 'CronJob');
  return !isJobWithCronJobOwner;
}

function fetchResourcesOfType(query: ResourceQuery, r: ResourceType) {
  const { orgId, projectId, clusterId, namespace } = query;
  return defer(() =>
    queryResource(
      {
        orgId,
        projectId,
        clusterId,
        apiVersion: r.apiVersion,
        kind: r.kind,
      },
      { namespace }
    )
  ).pipe(retry(2));
}
