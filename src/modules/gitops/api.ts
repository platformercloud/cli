import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';
import apiEndpoints from '../util/api-endpoints';
import { fetch } from '../util/fetch';
import { K8sObject } from './parser';
import { MatchedMultipleYamlObjectsError, YamlObject } from './yaml-object';

export async function applyManifest(
  orgId: string,
  projectId: string,
  envId: string,
  manifest: K8sObject
) {
  const url = `${getAPIGateway()}/${apiEndpoints.RUDDER_MAINFEST_IMPORT}`;
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
  if (response.ok) {
    try {
      const data = (await response.json())?.data;
      if (typeof data === 'object' && data !== null) {
        return data as Record<string, any>;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  let yamlObjects;
  let errorMsg;
  try {
    const res = await response.json();
    yamlObjects = res?.errors?.message?.additional;
    errorMsg = res?.errors?.message?.error;
  } catch (error) {}
  if (Array.isArray(yamlObjects) && yamlObjects.length > 1) {
    throw new MatchedMultipleYamlObjectsError(yamlObjects as YamlObject[]);
  }
  if (typeof errorMsg === 'string' && errorMsg.length > 0) {
    throw new APIError(errorMsg, response);
  }
  throw new APIError('Failed to apply kubernetes manifest', response);
}
