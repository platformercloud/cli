import { getToken } from '../config';
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

interface SelectOrgName {
  name: string
}

let orgList: Organization[];

export async function loadOrganizationList() {
  const token: string = getToken() as string;

  const resp = await fetch(url.AUTH_ORGANIZATION_LIST_URL,
    {
      method: 'GET',
      headers: { Authorization: token }
    });

  const json = await resp.json();

  orgList = json?.data;

  return orgList;
}

export async function getOrganizationNamesList() {
  const organizationsList: Organization[] = await loadOrganizationList();
  const orgNameList: SelectOrgName[] = [];

  organizationsList.forEach(o => {
    orgNameList.push({ name: o?.name });
  });

  return orgNameList;
}

export function getOrganizationIdByName(orgName:string) {
  const org =  orgList.find(o => o.name === orgName)
  return org?.id
}
