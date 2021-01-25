import { defer, EMPTY, Observable, of } from 'rxjs';
import {
  catchError,
  delay,
  filter,
  map,
  mergeAll,
  mergeMap,
  retryWhen,
  shareReplay,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { ClusterResources, queryResource } from '../cluster/api';
import APIError from '../errors/api-error';
import { ImportType, ResourceType } from './manifest-import-types';
import {
  ManifestObject,
  modifyYAML,
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
  fetchFailures: YamlFectchFailure[] = [];
  #observable: Observable<ManifestObject>;
  constructor(
    resourceTypes: ImportType,
    query: ResourceQuery,
    sourceNS: string,
    targetNS?: string
  ) {
    this.resourceTypes = resourceTypes;
    this.#observable = of(...this.resourceTypes.types).pipe(
      mergeMap((r) => fetchResourcesOfType(query, r), 4),
      filter((v): v is ClusterResources => {
        if (v instanceof YamlFectchFailure) {
          this.fetchFailures.push(v);
          return false;
        }
        return true;
      }),
      takeUntil(skippedStateNotifier),
      map((v) => v.payload),
      mergeAll(),
      filter((v) => shouldImport(v, sourceNS)),
      map((v) => new ManifestObject(modifyYAML(v, targetNS))),
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

function shouldImport(v: K8sObject, sourceNS: string) {
  if (v.kind === 'Namespace') {
    return v.metadata.name === sourceNS;
  }
  if (v.kind === 'Secret') {
    return v.type === 'Opaque';
  }
  if (v.kind === 'Job') {
    return !v.ownerReferences?.some((ref) => ref.kind === 'CronJob');
  }
  return true;
}

function fetchResourcesOfType(query: ResourceQuery, r: ResourceType) {
  const { orgId, projectId, clusterId, namespace } = query;
  return defer(async () => {
    try {
      const res = await queryResource(
        {
          orgId,
          projectId,
          clusterId,
          apiVersion: r.apiVersion,
          kind: r.kind,
        },
        { namespace }
      );
      return res;
    } catch (err) {
      const data = err instanceof APIError ? await err.data() : null;
      const cause = isClusterResourcesFailure(data) ? data.error : null;
      throw new YamlFectchFailure(r, query, cause);
    }
  }).pipe(
    retryWhen((errors) =>
      errors.pipe(
        delay(1000),
        mergeMap((v, i) => {
          // error msg available, no need to retry
          if (v instanceof YamlFectchFailure && v.cause) throw v;
          // allow 2 retries
          if (i >= 2) throw v;
          return of(null);
        })
      )
    ),
    catchError(async (err) => {
      if (err instanceof YamlFectchFailure) return err;
      return EMPTY;
    })
  );
}

export class YamlFectchFailure extends Error {
  readonly resourceType: ResourceType;
  readonly resourceQuery: ResourceQuery;
  readonly cause: string | null;
  constructor(
    resourceType: ResourceType,
    resourceQuery: ResourceQuery,
    cause: string | null
  ) {
    super(
      `Failed to fetch resources of kind : ${resourceType.kind} (${resourceType.apiVersion})`
    );
    this.cause = cause;
    this.resourceType = resourceType;
    this.resourceQuery = resourceQuery;
  }
}

export interface ClusterResourcesFailure {
  clusterID: string;
  error: string;
  identifier: 'resource:get';
  requestID: string;
  status: 'fail';
  type: 'query';
}
export function isClusterResourcesFailure(
  data: any
): data is ClusterResourcesFailure {
  if (typeof data !== 'object' || data === null) return false;
  if (!['status', 'error'].every((prop) => typeof data[prop] === 'string')) {
    return false;
  }
  return data['status'] === 'fail';
}
