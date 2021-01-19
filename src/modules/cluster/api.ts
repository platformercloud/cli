import config from '../../modules/config';
import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';
import { K8sObject } from '../gitops/parser';
import endpoints from '../util/api-endpoints';
import { fetch } from '../util/fetch';

export interface AgentCredentials {
  clientID: string;
  clientSecret: string;
}

export interface ConnectedCluster {
  id: string;
  name: string;
  isActive: boolean;
  lastConnected: string;
  lastDisconnected: string;
  createdOn: string;
  upgradeInProgress?: boolean;
  upgradeAvailable?: string;
}

export async function registerCluster(
  organization_id: string,
  project_id: string,
  cluster_name: string
): Promise<AgentCredentials> {
  const url = `${getAPIGateway()}/${endpoints.MIZZEN_REGISTER_CLUSTER}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': organization_id,
      'x-project-id': project_id,
      Authorization: getAuthToken(),
    },
    body: JSON.stringify({
      cluster_name,
      organization_id,
      project_id,
      whitelist_ips: [],
    }),
  });
  if (!response.ok) {
    throw new APIError('Failed to register (connect) new cluster', response);
  }

  const { clientID, clientSecret } = await response.json();
  return {
    clientID,
    clientSecret,
  };
}

export function generateAgentInstallationLink({
  clientID,
  clientSecret,
}: AgentCredentials) {
  const encodedToken = Buffer.from(`${clientID};${clientSecret}`).toString(
    'base64'
  );
  const currentContext = config.get('currentContext');
  const url = `${config.get(
    `contexts.${currentContext}.platformerAPIGateway`
  )}/mizzen/generate/v1/agent/${encodedToken}`;
  return url;
}

export async function listClusters(
  orgId: string,
  projectId: string
): Promise<ConnectedCluster[]> {
  const url = new URL(`${getAPIGateway()}/${endpoints.MIZZEN_LIST_CLUSTERS}`);
  url.searchParams.append('project_id', projectId);
  url.searchParams.append('organization_id', orgId);

  const response = await fetch(url.href, {
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken(),
    },
  });
  if (!response.ok) {
    throw new APIError('Failed to fetch connected cluster list', response);
  }
  return await response.json();
}

interface ClusterResourceQuery {
  orgId: string;
  projectId: string;
  clusterId: string;
  apiVersion: string;
  kind: string;
}
interface ClusterResources {
  clusterID: string;
  payload: K8sObject[];
}

/**
 * Query any resource on the Cluster
 * Tip: use kubectl api-versions and kubectl api-resources to figure out the exact
 * ApiVersion and ResourceKind to query.
 */
export async function queryResource<T = any>(
  { orgId, projectId, clusterId, apiVersion, kind }: ClusterResourceQuery,
  q?: {
    namespace?: string;
    name?: string;
    labelSelector?: string;
    fieldSelector?: string;
    limit?: number;
  }
): Promise<ClusterResources> {
  apiVersion = encodeURIComponent(apiVersion);
  kind = encodeURIComponent(kind);
  const url = new URL(
    `${getAPIGateway()}/mizzen/api/v1/query/${clusterId}/${apiVersion}/${kind}`
  );
  const params = url.searchParams;
  if (q?.namespace) params.set('namespace', q?.namespace);
  if (q?.name) params.set('name', q?.name);
  if (q?.labelSelector) params.set('labelSelector', q?.labelSelector);
  if (q?.fieldSelector) params.set('fieldSelector', q?.fieldSelector);
  if (q?.limit) params.set('limit', `${q?.limit}`);
  const response = await fetch(url.href, {
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken(),
    },
  });
  if (response.ok) {
    const data = await response.json();
    if (typeof data.clusterID === 'string') {
      const resources = data as ClusterResources;
      const { clusterID, payload } = resources;
      resources.payload?.forEach((m) => {
        m.kind = m.kind ?? kind;
        m.apiVersion = m.apiVersion ?? apiVersion;
      });
      return { clusterID, payload: payload ?? [] };
    }
  }
  throw new APIError('Failed to fetch cluster resources', response);
}

export interface ClusterNamespace {
  metadata: { name: string };
}
export async function getClusterNamespaces(
  query: Omit<ClusterResourceQuery, 'kind' | 'apiVersion'>
) {
  const res = await queryResource<ClusterNamespace>({
    ...query,
    kind: 'Namespace',
    apiVersion: 'v1',
  });
  return res.payload;
}
