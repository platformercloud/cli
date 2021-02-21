import Conf from 'conf';

export const defaultPlatformerAPIGateway = 'https://beta.api.platformer.com';
export const defaultConsoleURL = 'https://beta.console.platformer.com';

export interface Config {
  currentContext: string;
  contexts: Record<string, Context>;
}

export interface Context {
  platformerAPIGateway: string;
  platformerConsoleURL: string;
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
const initialConfigs = config.get('contexts');
if (!Boolean(initialConfigs) || Object.keys(initialConfigs).length === 0) {
  config.set({
    currentContext: 'default',
    contexts: {
      default: {
        platformerAPIGateway: defaultPlatformerAPIGateway,
        platformerConsoleURL: defaultConsoleURL,
      },
    },
  });
}

export default config;
