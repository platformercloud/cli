import config from '../config';

const CONTEXT_URL = config.get('contexts.default.platformerAPIGateway');

export default {
  AUTH_TOKEN_CREATE_URL: `${CONTEXT_URL}/auth/api/v1/serviceaccount/token/create`,
  AUTH_VALID_TOKEN_URL: `${CONTEXT_URL}/auth/api/v1/user/logintime`,
  AUTH_ORGANIZATION_LIST_URL: `${CONTEXT_URL}/auth/api/v1/organization/list`,
  AUTH_PROJECT_LIST_URL: `${CONTEXT_URL}/auth/api/v1/organization/project/view/list`,
  MIZZEN_CLUSTER_REGISTRATION_URL: `${CONTEXT_URL}/mizzen/api/v1/cluster`,
  MIZZEN_YAML_GENERATION_URL: `${CONTEXT_URL}/mizzen/generate/v1/agent/`,
};
