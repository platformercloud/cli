import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';
import endpoints from '../util/api-endpoints';
import { fetch } from '../util/fetch';
import { Application, OrgId, ProjectId } from './app.interface';
import ValidationError from '../errors/validation-error';
import { Response } from 'node-fetch';

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

export async function getApp(data: GetApp): Promise<Application | null> {
  const { orgId, projectId, name } = data;
  const appList = await getApps(projectId, orgId);
  return appList.find(a =>
    a.name === name
  ) ?? null;
}

export async function getAppEnvId(app: Application, envId: string): Promise<string | undefined> {
  const appEnv = app.app_environments;
  const e = appEnv?.find(a =>
    a.environment_id === envId
  );
  return e?.ID;
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

export interface AppPort {
  port: number;
  protocol: string;
  service_port: number;
}

export interface AppCreateContainer {
  ID: string;
  name: string;
  orgId: OrgId;
  projectId: ProjectId;
  appEnvId: string;
  type: string;
  cpu: number;
  memory: number;
  port: AppPort[];
}

export async function createAppContainer(data: AppCreateContainer) {
  const {
    ID,
    orgId,
    projectId,
    appEnvId,
    name,
    type,
    cpu,
    memory,
    port
  } = data;
  const url = `${getAPIGateway()}/${
    endpoints.RUDDER_APP
  }/${ID}/environment/${appEnvId}/container`;
  const reqBody = {
    app_environment_id: appEnvId,
    name: name,
    metadata: {},
    type: type,
    image_registry_id: null,
    image_id: null,
    custom_image: null,
    ports: port,
    cpu: cpu,
    memory: memory,
    cpu_limit: 0,
    memory_limit: 0,
    limit_disabled: true,
    args: [],
    command: [],
    image_pull_policy: 'Always'
  };
  let response: Response;
  try {
    response = await fetch(url, {
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
    const res = await response.json();
    if (res.errors.message) {
      throw new ValidationError(res.errors.message);
    }
  } catch (e) {
    if (e instanceof ValidationError) {
      throw e;
    }
    throw new APIError('Failed to create container for app', response!);
  }
}
