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
  const projects: Project[] = json?.data ?? [];
  return projects;
}
