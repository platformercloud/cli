import config from '.';
import { Organization } from '../auth/organization';

export function getAuthToken(): string {
  const currentContext: string = config.get('currentContext');
  return config.get(`contexts.${currentContext}.auth.token`);
}

export function getDefaultOrganization(): Organization {
  const currentContext: string = config.get('currentContext');
  return config.get(`contexts.${currentContext}.organization`);
}

export function getAPIGateway(): string {
  const currentContext: string = config.get('currentContext');
  return config.get(`contexts.${currentContext}.platformerAPIGateway`);
}
