import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';
import endpoints from '.././util/api-endpoints';
import fetch from 'node-fetch';

export async function applyManifest(
  orgId: string,
  projectId: string,
  envId: string,
  manifest: string
) {
  const url = `${getAPIGateway()}/${endpoints.RUDDER_MAINFEST_IMPORT}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken(),
    },
    body: JSON.stringify({
      name: 'test',
      organization_id: orgId,
      project_id: projectId,
      environment_id: envId,
      data: manifest,
    }),
  });
  if (!response.ok) {
    throw new APIError('Failed to apply kubernetes manifest', response);
  }
  return (await response.json())?.data ?? [];
}
