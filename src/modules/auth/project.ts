import fetch from 'node-fetch';
import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';
import endpoints from '../util/api-endpoints';

export interface Project {
  project_id: string;
  name: string;
  description: string;
}

export async function fetchProjects(orgId: string): Promise<Project[]> {
  const url = `${getAPIGateway()}/${endpoints.AUTH_PROJECT_LIST}/${orgId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: getAuthToken(),
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
    },
  });
  if (!response.ok) {
    throw new APIError('Failed to fetch project list', response);
  }
  const json = await response.json();
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

export async function getProjectIdByName(
  orgId: string,
  projectName: string
): Promise<Project | undefined> {
  const projects = await fetchProjects(orgId);
  return projects.find((o) => o.name === projectName);
}
