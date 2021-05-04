import createApp, { CliRepository } from '@asteroid-mdx/cli-workspace';
import { Middleware } from '@web/dev-server-core';

export async function workspaceMiddleware({
  cliRepository,
}: {
  cliRepository: CliRepository;
}): Promise<Middleware> {
  const { app } = createApp(
    {
      cliRepository,
    },
    {
      dev: process.env.NODE_ENV === 'development',
    }
  );
  const handle = app.getRequestHandler();
  await app.prepare();
  return async (ctx, next) => {
    (ctx.req as any).foo = 'bar';
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
