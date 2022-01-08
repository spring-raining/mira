import createApp, { WorkspaceRepository } from '@mirajs/workspace';
import { Plugin, Middleware } from '@web/dev-server-core';

export async function workspaceServerPluginFactory({
  workspaceRepository,
}: {
  workspaceRepository: WorkspaceRepository;
}): Promise<{
  workspaceServerPlugin: Plugin;
  workspaceServerMiddleware: Middleware;
}> {
  let workspaceApp: ReturnType<typeof createApp>['app'];
  let handle: ReturnType<typeof workspaceApp['getRequestHandler']>;

  const workspaceServerPlugin: Plugin = {
    name: 'workspaceServer',
    injectWebSocket: true,
    async serverStart({ webSockets, server, app: koaApp }) {
      if (!webSockets) {
        throw new Error('webSockets is not enabled');
      }

      const { app } = createApp(
        {
          workspaceRepository,
        },
        {
          // see the rollup config
          dev: process.env.DEV as unknown as boolean,
          customServer: true,
          conf: {
            serverRuntimeConfig: {
              disableStandaloneMode: true,
            },
          },
        },
      );
      workspaceApp = app;
      handle = app.getRequestHandler();
      await app.prepare();
    },
    async serverStop() {
      await workspaceApp?.close();
    },
  };

  const workspaceServerMiddleware: Middleware = async (ctx, next) => {
    if (!handle) {
      return;
    }
    if (ctx.path.startsWith('/_next')) {
      await handle(ctx.req, ctx.res);
      ctx.respond = false;
      return;
    }
    await next();
    if (ctx.response.status === 404) {
      await handle(ctx.req, ctx.res);
    }
  };

  return {
    workspaceServerPlugin,
    workspaceServerMiddleware,
  };
}
