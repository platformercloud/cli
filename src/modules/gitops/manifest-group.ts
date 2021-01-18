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
import { ImportTypes, ResourceType } from './manifest-import-types';
import { ManifestObject, skippedStateNotifier } from './manifest-object';
import { K8sObject } from './parser';

interface ResourceQuery {
  orgId: string;
  projectId: string;
  clusterId: string;
  namespace: string;
}

export class ManifestImportGroup {
  resourceTypes: ImportTypes[keyof ImportTypes];
  #manifests: ManifestObject[] = [];
  #observable: Observable<ManifestObject>;
  constructor(
    resourceTypes: ImportTypes[keyof ImportTypes],
    query: ResourceQuery
  ) {
    this.resourceTypes = resourceTypes;
    this.#observable = of(...this.resourceTypes.types).pipe(
      mergeMap((r) => fetchResourcesOfType(query, r), 4),
      takeUntil(skippedStateNotifier),
      map((v) => v.payload),
      filter((v): v is K8sObject[] => Boolean(v)),
      mergeAll(),
      map((v) => new ManifestObject(v)),
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
