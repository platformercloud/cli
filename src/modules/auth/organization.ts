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

function loadOrganizationList() {

}
