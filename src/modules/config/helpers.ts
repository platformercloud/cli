import config, { defaultConsoleURL } from '.';

export function getAuthToken(): string {
  const currentContext: string = config.get('currentContext');
  return config.get(`contexts.${currentContext}.auth.token`);
}

export function getAPIGateway(): string {
  const currentContext: string = config.get('currentContext');
  const url = config.get(`contexts.${currentContext}.platformerAPIGateway`);
  if (typeof url !== 'string' || url === '') {
    throw new Error('Invalid API Gateway url');
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getConsoleURL(): string {
  const currentContext: string = config.get('currentContext');
  const url = config.get(`contexts.${currentContext}.platformerConsoleURL`);
  if (typeof url !== 'string' || url === '') return defaultConsoleURL;
  return url.endsWith('/') ? url.slice(0, -1) : url;
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
