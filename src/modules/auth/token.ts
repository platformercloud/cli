import fetch from 'node-fetch';
import url from '../util/url';

export async function fetchPermanentToken(token: string): Promise<string> {
  const resp = await fetch(url.AUTH_TOKEN_CREATE_URL, {
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
  if (!json.success || !Boolean(json?.data?.token)) {
    throw new Error('Failed to get a service account token for the CLI');
  }

  return json.data.token;
}
