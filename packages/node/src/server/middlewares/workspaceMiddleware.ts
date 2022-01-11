import createApp, { WorkspaceRepository } from '@mirajs/workspace';
import { Middleware } from '@web/dev-server-core';

export async function workspaceMiddleware({
  workspaceRepository,
}: {
  workspaceRepository: WorkspaceRepository;
}): Promise<Middleware> {
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
  const handle = app.getRequestHandler();
  await app.prepare();
  return async (ctx, next) => {
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
}