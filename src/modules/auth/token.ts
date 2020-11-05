import fetch from 'node-fetch';
import { getAPIGateway } from '../config/helpers';
import endpoints from '../util/api-endpoints';

export async function fetchPermanentToken(token: string): Promise<string> {
  const url = `${getAPIGateway()}/${endpoints.AUTH_TOKEN_CREATE_URL}`;
  const resp = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      name: 'CLI service account',
      description: 'Service account token for the Platformer CLI',
      expired_in: null,
    }),
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  });

  const json = await resp.json();
  if (!json.success || !json?.data?.token) {
    throw new Error('Failed to get a service account token for the CLI');
  }

  return json.data.token;
}
