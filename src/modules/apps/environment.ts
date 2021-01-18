import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';
import endpoints from '../util/api-endpoints';
import fetch from 'node-fetch';

export interface Environment {
  ID: string;
  name: string;
  organization_id: string;
  project_id: string;
  description: string;
  namespace: string;
  namespaces?: string[];
  environment_clusters?: string[];
}

export interface EnvNamespace {
  ID: string;
  metadata: null;
  organization_id: string;
  project_id: string;
  name: string;
  environment_id: string;
  environment: null;
  annotations: null;
}

export interface EnvironmentCluster {
  ID: string;
  cluster: null;
  cluster_id: string;
  environment_id: string;
  environment: null;
  namespace: string;
  mode: 'PRIMARY';
}

export interface EnvironmentDetails
  extends Omit<Environment, 'environment_clusters' | 'namespaces'> {
  environment_clusters: EnvironmentCluster[];
  namespaces: Array<EnvNamespace>;
}
export async function fetchEnvironments(
  orgId: string,
  projectId: string
): Promise<Environment[]> {
  const url = new URL(`${getAPIGateway()}/${endpoints.RUDDER_ENV_LIST}`);
  url.searchParams.append('project_id', projectId);

  const response = await fetch(url.href, {
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken(),
    },
  });
  if (!response.ok) {
    throw new APIError('Failed to fetch environment list', response);
  }
  return (await response.json())?.data ?? [];
}

export async function getEnvironmentIdByName(
  orgId: string,
  projectId: string,
  envName: string
): Promise<Environment | undefined> {
  const environments = await fetchEnvironments(orgId, projectId);
  return environments.find((e) => e.name === envName);
}

export async function fetchEnvironmentDetails(
  orgId: string,
  projectId: string,
  envId: string
): Promise<EnvironmentDetails> {
  const url = new URL(
    `${getAPIGateway()}/${endpoints.RUDDER_ENV_LIST}/${envId}`
  );
  url.searchParams.append('project_id', projectId);

  const response = await fetch(url.href, {
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      'x-env-id': envId,
      Authorization: getAuthToken(),
    },
  });
  if (!response.ok) {
    throw new APIError('Failed to fetch environment', response);
  }
  return (await response.json())?.data as EnvironmentDetails;
}
