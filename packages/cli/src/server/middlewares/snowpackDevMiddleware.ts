import { Middleware } from '@web/dev-server-core';
import { createConfiguration, startServer } from 'snowpack';
import { CliArgs } from '../../commands';

const MIDDLEWARE_PREFIX = '/_asteroid';

export async function snowpackDevMiddleware(
  args: CliArgs
): Promise<Middleware> {
  const snowpackConfig = createConfiguration({
    root: args.rootDir,
    mode: 'development',
    mount: {},
    alias: {},
    plugins: [],
    dependencies: {},
    devOptions: {
      port: 0, // stop starting dev server
    },
  });
  const snowpack = await startServer(
    { config: snowpackConfig },
    { isDev: true, isWatch: true }
  );
  return async (ctx, next) => {
    if (!ctx.url.startsWith(MIDDLEWARE_PREFIX)) {
      await next();
      return;
    }
    if (ctx.url.startsWith(`${MIDDLEWARE_PREFIX}/resolve/`)) {
      const locator = ctx.url.substring(`${MIDDLEWARE_PREFIX}/resolve/`.length);
      try {
        const nextUrl = await snowpack.getUrlForPackage(locator);
        const tmpl = `export * from '${MIDDLEWARE_PREFIX}${nextUrl}';
export {default} from '${MIDDLEWARE_PREFIX}${nextUrl}';`;
        ctx.body = tmpl;
        ctx.set('Content-Type', 'application/javascript; charset=utf-8');
        return;
      } catch {
        snowpack.sendResponseError(ctx.req, ctx.res, 404);
      }
      ctx.respond = false;
      return;
    }
    const orgUrl = ctx.url;
    ctx.url = orgUrl.replace(/^\/_asteroid\//, '/');
    await snowpack.handleRequest(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.url = orgUrl;
    return;
  };
}
