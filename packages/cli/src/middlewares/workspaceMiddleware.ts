import createApp from '@asteroid-mdx/cli-workspace'
import { Middleware } from '@web/dev-server-core';

export async function workspaceMiddleware(): Promise<Middleware> {
  const app = createApp({
    dev: process.env.NODE_ENV === 'development',
  });
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
