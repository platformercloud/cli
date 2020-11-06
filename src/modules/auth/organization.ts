import endpoints from '../util/api-endpoints';
import fetch from 'node-fetch';
import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';

export interface Organization {
  organization_id: string;
  name: string;
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const url = `${getAPIGateway()}/${endpoints.AUTH_ORGANIZATION_LIST_URL}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: getAuthToken() },
  });
  if (!response.ok) {
    throw new APIError('Failed to fetch organization list', response);
  }
  const json = await response.json();
  return json?.data ?? [];
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
