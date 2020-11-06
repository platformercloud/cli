import endpoints from '../util/api-endpoints';
import fetch from 'node-fetch';
import { getAPIGateway, getAuthToken } from '../config/helpers';
import APIError from '../errors/api-error';

export interface Organization {
  organization_id: string;
  name: string;
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const url = `${getAPIGateway()}/${endpoints.AUTH_ORGANIZATION_LIST}`;
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

export async function getOrganizationIdByName(
  orgName: string
): Promise<Organization | undefined> {
  const orgList = await fetchOrganizations();
  return orgList.find((o) => o.name === orgName);
}
