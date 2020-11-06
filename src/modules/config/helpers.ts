import config from '.';

export function getAuthToken(): string {
  const currentContext: string = config.get('currentContext');
  return config.get(`contexts.${currentContext}.auth.token`);
}

export function getAPIGateway(): string {
  const currentContext: string = config.get('currentContext');
  return config.get(`contexts.${currentContext}.platformerAPIGateway`);
}

export function getDefaultOrganization(): { name: string; id: string } {
  const currentContext: string = config.get('currentContext');
  return config.get(`contexts.${currentContext}.organization`);
}

export function getDefaultProject(): { name: string; id: string } {
  const currentContext: string = config.get('currentContext');
  return config.get(`contexts.${currentContext}.project`);
}

export function getDefaultEnvironment(): { name: string } {
  const currentContext: string = config.get('currentContext');
  return config.get(`contexts.${currentContext}.environment`);
}
