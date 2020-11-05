import url from '../util/url';
import fetch from 'node-fetch';
import { getAuthToken } from '../config/helpers';

export interface Organization {
  organization_id: string;
  name: string;
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

export async function validateAndGetOrganizationId(
  orgName: string
): Promise<string> {
  const orgList = await fetchOrganizations();
  const org = orgList.find((o) => o.name === orgName);
  if (!org) {
    throw new Error(`Invalid organization name "${orgName}"`);
  }
  return org.organization_id;
}
