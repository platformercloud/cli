import fetch from 'node-fetch';
import { getAPIGateway, getAuthToken } from '../config/helpers';
import endpoints from '../util/api-endpoints';

export interface Project {
  project_id: string;
  name: string;
  description: string;
}

export async function fetchProjects(orgId: string): Promise<Project[]> {
  const url = `${getAPIGateway()}/${endpoints.AUTH_PROJECT_LIST_URL}/${orgId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: getAuthToken(),
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
    },
  });
  const json = await response.json();
  if (response.status > 300) {
    throw new Error(JSON.stringify(json));
  }
  return json?.data ?? [];
}

export async function validateAndGetProjectId(
  orgId: string,
  projectName: string
): Promise<string> {
  const projects = await fetchProjects(orgId);
  const project = projects.find((o) => o.name === projectName);
  if (!project) {
    throw new Error(`Invalid project name "${projectName}"`);
  }
  return project.project_id;
}
