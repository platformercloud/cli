import Conf from 'conf';

interface Config {
  currentContext: string;
  contexts: Record<
    string,
    {
      platformerAPIGateway: string;
      organization?: {
        id: string;
        name: string;
      };
      project?: {
        id: string;
        name: string;
      };
    }
  >;
}

const config = new Conf<Config>({});

if (!Boolean(config.get('contexts'))) {
  config.set({
    currentContext: 'default',
    contexts: {
      default: {
        platformerAPIGateway: 'https://beta.api.platformer.com',
      },
    },
  });
}

export default config;
