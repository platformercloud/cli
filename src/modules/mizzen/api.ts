import fetch from 'node-fetch';
import config from '../../modules/config';

export interface AgentCredentials {
  clientID: string;
  clientSecret: string;
}

export async function registerCluster(
  organization_id: string,
  project_id: string,
  cluster_name: string
): Promise<AgentCredentials> {
  const currentContext = config.get('currentContext');
  const url = `${config.get(
    `contexts.${currentContext}.platformerAPIGateway`
  )}/mizzen/api/v1/cluster`;
  const token: string = config.get(`contexts.${currentContext}.auth.token`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': organization_id,
      'x-project-id': project_id,
      Authorization: token,
    },
    body: JSON.stringify({
      cluster_name,
      organization_id,
      project_id,
      whitelist_ips: [],
    }),
  });

  const json = await response.json();
  if (response.status > 300) {
    throw new Error(json);
  }
  return {
    clientID: json.clientID,
    clientSecret: json.clientSecret,
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
