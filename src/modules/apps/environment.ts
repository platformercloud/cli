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
