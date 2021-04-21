import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';
import endpoints from '../util/api-endpoints';
import { fetch } from '../util/fetch';
import { Application, OrgId, ProjectId } from './app.interface';

interface AppCreate {
  name: string;
  orgId: OrgId;
  projectId: ProjectId;
  type: string;
}

export async function createApp(data: AppCreate) {
  const { orgId, projectId, name, type } = data;
  const url = `${getAPIGateway()}/${
    endpoints.RUDDER_APP
  }`;
  const reqBody = {
    organization_id: orgId,
    project_id: projectId,
    name: name,
    metadata: {},
    type: type
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken()
    },
    body: JSON.stringify(reqBody)
  });
  if (response.ok) {
    return;
  }
  throw new APIError('Failed to create app', response);
}

export async function getApps(projectId: ProjectId, orgId: OrgId): Promise<Application[]> {
  const url = new URL(
    `${getAPIGateway()}/${
      endpoints.RUDDER_APP
    }`
  );
  url.searchParams.append('project_id', projectId);

  const response = await fetch(url.href, {
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken()
    }
  });
  if (!response.ok) {
    throw new APIError('Failed to get app list', response);
  }
  return (await response.json())?.data ?? [];
}

interface GetApp {
  name: string;
  orgId: OrgId;
  projectId: ProjectId;
}

export async function getApp(data: GetApp): Promise<Application[]> {
  const { orgId, projectId, name } = data;
  const appList = await getApps(projectId, orgId);
  return appList.filter(a =>
    a.name === name
  );
}

export async function getAppId(data: GetApp): Promise<string> {
  const app = await getApp(data);
  return app[0].ID;
}

export async function getAppEnvId(data: GetApp, envId: string): Promise<string> {
  const app: Application[] | null = await getApp(data);

  if (app) {
    const appEnv = app[0].app_environments;
    if (appEnv) {
      const e = appEnv.filter(a =>
        a.environment_id === envId
      );
      return e[0].ID;
    }
  }
  throw new Error('Please Set App Environment');
}

export interface SetAppEnv {
  ID: string;
  orgId: OrgId;
  projectId: ProjectId;
  envId: string;
  auto_deploy: boolean;
  service_account_name: string;
  graceful_termination_seconds: number;
  replicas: number;
  namespace: string;
  name: string;
  type: string;
}

export async function setAppEnv(data: SetAppEnv) {
  const {
    ID,
    orgId,
    projectId,
    envId,
    auto_deploy,
    service_account_name,
    graceful_termination_seconds,
    replicas,
    namespace,
    name,
    type
  } = data;
  const url = `${getAPIGateway()}/${
    endpoints.RUDDER_APP
  }/${ID}/environment`;
  const reqBody = {
    auto_deploy: auto_deploy,
    environment_id: envId,
    metadata: null,
    service_account_name: service_account_name,
    graceful_termination_seconds: graceful_termination_seconds,
    replicas: replicas,
    node_selector: {},
    app_id: ID,
    namespace: namespace,
    kubernetes_name: name,
    cronjob_frequency: '',
    service_type: type
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken()
    },
    body: JSON.stringify(reqBody)
  });
  if (response.ok) {
    return;
  }
  throw new APIError('Failed to set app environment', response);
}

export interface AppCreateContainer {
  ID: string;
  name: string;
  orgId: OrgId;
  projectId: ProjectId;
  envId: string;
  type: string;
  cpu: number;
  memory: number;
  port: number;
}

export async function createAppContainer(data: AppCreateContainer) {
  const {
    ID,
    orgId,
    projectId,
    envId,
    name,
    type,
    cpu,
    memory,
    port
  } = data;
  const url = `${getAPIGateway()}/${
    endpoints.RUDDER_APP
  }/${ID}/environment/${envId}/container`;
  const reqBody = {
    app_environment_id: envId,
    name: name,
    metadata: {},
    type: type,
    image_registry_id: null,
    image_id: null,
    custom_image: null,
    ports: [
      {
        port: port,
        protocol: 'TCP',
        service_port: port
      }
    ],
    cpu: cpu,
    memory: memory,
    cpu_limit: 0,
    memory_limit: 0,
    limit_disabled: true,
    args: [],
    command: [],
    image_pull_policy: 'Always'
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken()
    },
    body: JSON.stringify(reqBody)
  });
  if (response.ok) {
    return;
  }
  throw new APIError('Failed to create container for app', response);
}
