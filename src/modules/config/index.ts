import Conf from 'conf';

export interface Config {
  currentContext: string;
  contexts: Record<string, Context>;
}

export interface Context {
  platformerAPIGateway: string;
  auth?: {
    token?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

const config = new Conf<Config>({});

if (!Boolean(config.get('contexts'))) {
  config.set({
    currentContext: 'default',
    contexts: {
      default: {
        platformerAPIGateway: 'https://beta.api.platformer.com'
      }
    }
  });
}

export default config;

const currentContext: string = config.get('currentContext');

export function getToken() {
  return config.get(`contexts.${currentContext}.auth.token`);
}

export function getSavedOrganizationId() {
  return config.get(`contexts.${currentContext}.organization.id`);
}
