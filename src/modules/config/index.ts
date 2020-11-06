import Conf from 'conf';

export const defaultPlatformerAPIGateway = 'https://beta.api.platformer.com';

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
  environment?: {
    name: string;
  };
}

const config = new Conf<Config>({});

if (!Boolean(config.get('contexts'))) {
  config.set({
    currentContext: 'default',
    contexts: {
      default: {
        platformerAPIGateway: defaultPlatformerAPIGateway,
      },
    },
  });
}

export default config;
