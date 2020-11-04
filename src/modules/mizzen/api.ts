import fetch from 'node-fetch';
import config from '../../modules/config';

export async function registerCluster(
  organization_id: string,
  project_id: string,
  cluster_name: string
) {
  const context = config.get('currentContext');
  const url = `${config.get(
    `contexts.${context}.platformerAPIGateway`
  )}/mizzen/api/v1/cluster`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': organization_id,
      'x-project-id': project_id,
      Authorization: config.get('auth.token') as string,
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
  return json;
}
