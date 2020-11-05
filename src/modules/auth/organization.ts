import { getAuthToken } from '../config';
import url from '../util/url';
import fetch from 'node-fetch';

export interface Organization {
  organization_id: string;
  name: string;
  user_name: string;
  uid: string;
  id: string;
  user_email: string;
  pending: boolean;
  owner: string;
  created_date: {
    _seconds: number;
    nano_seconds: number;
  };
}

export async function fetchOrganizations() {
  const response = await fetch(url.AUTH_ORGANIZATION_LIST_URL, {
    method: 'GET',
    headers: { Authorization: getAuthToken() },
  });
  const json = await response.json();
  if (response.status > 300) {
    throw new Error(json);
  }
  const orgs: Organization[] = json?.data ?? [];
  return orgs;
}
