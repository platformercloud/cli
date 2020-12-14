import endpoints from '.././util/api-endpoints';
import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';
import { fetch } from '../util/fetch';
import { K8sObject } from './parser';

export async function applyManifest(
  orgId: string,
  projectId: string,
  envId: string,
  manifest: K8sObject
): Promise<unknown> {
  // const url = `${getAPIGateway()}/${endpoints.RUDDER_MAINFEST_IMPORT}`;
  const url = `http://localhost:3000/api/v1/import/manifest`;
  const reqBody = {
    name: manifest.metadata.name,
    organization_id: orgId,
    project_id: projectId,
    environment_id: envId,
    data: manifest,
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
  if (!response.ok) {
    throw new APIError('Failed to apply kubernetes manifest', response);
  }
  try {
    return (await response.json())?.data;
  } catch (error) {
    return null;
  }
}
