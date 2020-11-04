import fetch from 'node-fetch';
import { getSavedOrganizationId, getToken } from '../config';
import url from '../util/url';

export interface Project {
  projectId: string;
  projectName: string;
  roles: {
    collection_id: string;
    roles_id: string;
  };
  isProjectOwner: boolean;
}

interface SelectProjectName {
  name: string;
}

let projectList: Project[];

export async function loadProjectList() {
  const token: string = getToken() as string;
  const orgId: string =  getSavedOrganizationId() as string
  const resp = await fetch(`${url.AUTH_PROJECT_LIST_URL}/${orgId}`,
    {
      method: 'GET',
      headers: { Authorization: token}
    });

  const json = await resp.json();
  console.log(json)
  projectList = json?.data;

  return projectList;
}

export async function getProjectNamesList() {
  const projList: Project[] = await loadProjectList()
  const projectNamesList: SelectProjectName[] = [];

  projList.forEach(p => {
    projectNamesList.push({ name: p?.projectName });
  });

  return projectNamesList;
}

export function getProjectIdByName(projectName: string) {
  const project = projectList.find(p => p?.projectName === projectName);
  return project?.projectId;
}
