import config from '../config';
import url from '../util/url';
import fetch from 'node-fetch'

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

export function loadOrganizationList() {
  fetch(url.AUTH_ORGANIZATION_LIST_URL,
    {
      method: 'GET',
      headers: { Authorization: config.get('auth.token') }
    }).then(res => {
    console.log(res.body);
  }).catch(err => console.error(err));
}
