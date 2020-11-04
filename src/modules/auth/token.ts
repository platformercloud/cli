import fetch from 'node-fetch';
import url from '../util/url';

export async function fetchPermanentToken(token: string) {
  const resp = await fetch(url.AUTH_TOKEN_CREATE_URL, {
    method: 'POST',
    body: JSON.stringify({
      name: 'cli service account',
      description: 'Getting token for CLI use',
      expired_in: null
    }),
    headers: {
      Authorization: token,
      'Content-Type': 'application/json'
    }
  });

  const json = await resp.json();

  if (!json.success) {
    console.log('Error');
  }

  return json.data?.token;
}
