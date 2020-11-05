import fetch from 'node-fetch';
import { getAuthToken } from '../config/helpers';
import url from '../util/url';

export interface Project {
  project_id: string;
  name: string;
  description: string;
}

export async function fetchProjects(orgId: string): Promise<Project[]> {
  const response = await fetch(`${url.AUTH_PROJECT_LIST_URL}/${orgId}`, {
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
