import fetch from 'node-fetch';
import { getAPIGateway } from '../config/helpers';
import APIError from '../errors/api-error';
import endpoints from '../util/api-endpoints';

export async function fetchPermanentToken(token: string): Promise<string> {
  const url = `${getAPIGateway()}/${endpoints.AUTH_CREATE_TOKEN}`;
  const response = await fetch(url, {
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

  const json = await response.json();
  if (!response.ok || !Boolean(json?.data?.token)) {
    throw new APIError(
      'Failed to fetch a service account token for the CLI',
      response
    );
  }

  return json.data.token;
}
