import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';
import endpoints from '../util/api-endpoints';
import { fetch } from '../util/fetch';
import ValidationError from '../errors/validation-error';

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

export async function fetchEnvironmentDetails({
  orgId,
  projectId,
  envId,
}: {
  orgId: string;
  projectId: string;
  envId: string;
}): Promise<EnvironmentDetails> {
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

interface NamespaceCreate {
  name: string;
  orgId: string;
  projectId: string;
  envId: string;
}

export async function createNamespace(data: NamespaceCreate) {
  const { orgId, projectId, envId, name } = data;
  const url = `${getAPIGateway()}/${
    endpoints.RUDDER_ENV_LIST
  }/${envId}/namespace`;
  const reqBody = {
    name,
    organization_id: orgId,
    project_id: projectId,
    environment_id: envId,
    metdata: {},
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken(),
    },
    body: JSON.stringify(reqBody),
  });
  if (response.ok) {
    return;
  }
  throw new APIError('Failed to create namespace', response);
}

/**
 * Create if the namespace doesn't exist on rudder
 * @param data
 */
export async function ensureTargetNamespace(data: NamespaceCreate) {
  const { orgId, projectId, envId, name } = data;
  const env = await fetchEnvironmentDetails({ orgId, projectId, envId });
  if (env.namespaces.some((ns) => ns.name === name)) return;
  await createNamespace(data);
}

export async function validateNamespace(data: NamespaceCreate) {
  const { orgId, projectId, envId, name } = data;
  const env = await fetchEnvironmentDetails({ orgId, projectId, envId });
  if (env.namespaces.some((ns) => ns.name === name)) return;
  throw new ValidationError('Namespace not found');
}
