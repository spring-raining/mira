import path from 'path';
import createApp, { WorkspaceRepository } from '@mirajs/mira-workspace';
import { Plugin, Middleware } from '@web/dev-server-core';
import { ProjectConfig } from '../../config';

export async function workspaceServerPluginFactory({
  config,
  workspaceRepository,
}: {
  config: ProjectConfig;
  workspaceRepository: WorkspaceRepository;
}): Promise<{
  workspaceServerPlugin: Plugin;
  workspaceServerMiddleware: Middleware;
}> {
  const rootDir = path.join(config.server.rootDir, '/');
  const { app } = createApp(
    {
      rootDir,
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
  const handle = app.getRequestHandler();
  await app.prepare();

  const workspaceServerPlugin: Plugin = {
    name: 'workspaceServer',
    injectWebSocket: true,
    async serverStop() {
      await app.close();
    },
  };

  const workspaceServerMiddleware: Middleware = async (ctx, next) => {
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
