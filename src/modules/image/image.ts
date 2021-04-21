import { getAPIGateway, getAuthToken } from '../config/helpers';
import endpoints from '../util/api-endpoints';
import { fetch } from '../util/fetch';
import APIError from '../errors/api-error';
import { OrgId, ProjectId } from '../apps/app.interface';

interface CollectionCreate {
  name: string;
  orgId: OrgId;
  projectId: ProjectId;
  type: boolean;
}

export async function createImageCollection(data: CollectionCreate) {
  const { orgId, projectId, name, type } = data;
  const url = `${getAPIGateway()}/${
    endpoints.RUDDER_DELIVERY
  }/image-registry`;
  const reqBody = {
    public: type,
    image_repository_name: name,
    cloud_connector_id: null,
    organization_id: orgId,
    project_id: projectId,
    metadata: {},
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
      'x-project-id': projectId,
      Authorization: getAuthToken(),
    },
    body: JSON.stringify(reqBody)
  });
  if (response.ok) {
    return;
  }
  throw new APIError('Failed to create image collection', response);
}
