import fetch from 'node-fetch';
import config from '../../modules/config';
import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';
import endpoints from '../util/api-endpoints';

export interface AgentCredentials {
  clientID: string;
  clientSecret: string;
}

export interface ConnectedCluster {
  id: string;
  name: string;
  isActive: boolean;
  lastConnected: string;
  lastDisconnected: string;
  createdOn: string;
  upgradeInProgress?: boolean;
  upgradeAvailable?: string;
}

export async function registerCluster(
  organization_id: string,
  project_id: string,
  cluster_name: string
): Promise<AgentCredentials> {
  const url = `${getAPIGateway()}/${endpoints.MIZZEN_REGISTER_CLUSTER}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': organization_id,
      'x-project-id': project_id,
      Authorization: getAuthToken(),
    },
    body: JSON.stringify({
      cluster_name,
      organization_id,
      project_id,
      whitelist_ips: [],
    }),
  });
  if (!response.ok) {
    throw new APIError('Failed to register (connect) new cluster', response);
  }

  const { clientID, clientSecret } = await response.json();
  return {
    clientID,
    clientSecret,
  };
}

export function generateAgentInstallationLink({
  clientID,
  clientSecret,
}: AgentCredentials) {
  const encodedToken = Buffer.from(`${clientID};${clientSecret}`).toString(
    'base64'
  );
  const currentContext = config.get('currentContext');
  const url = `${config.get(
    `contexts.${currentContext}.platformerAPIGateway`
  )}/mizzen/generate/v1/agent/${encodedToken}`;
  return url;
}

export async function listClusters(
  orgId: string,
  projectId: string
): Promise<ConnectedCluster[]> {
  const url = new URL(`${getAPIGateway()}/${endpoints.MIZZEN_LIST_CLUSTERS}`);
  url.searchParams.append('project_id', projectId);
  url.searchParams.append('organization_id', orgId);

  const response = await fetch(url.href, {
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken(),
    },
  });
  if (!response.ok) {
    throw new APIError('Failed to fetch connected cluster list', response);
  }
  return await response.json();
}
