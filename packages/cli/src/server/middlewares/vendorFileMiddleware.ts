import { createRequire } from 'module';
import path from 'path';
import { Middleware } from '@web/dev-server-core';
import send from 'koa-send';
import { VENDOR_PATH } from './../../constants';

const require = createRequire(import.meta.url);
let serveRoot = path.dirname(require.resolve('@mirajs/cli/package.json'));
if (process.env.DEV) {
  // Relocate to workspace root
  serveRoot = path.resolve(serveRoot, '../..');
}

export const vendorFileMiddleware: Middleware = async (ctx, next) => {
  if (
    ctx.path.startsWith(VENDOR_PATH) &&
    (ctx.method === 'HEAD' || ctx.method === 'GET')
  ) {
    const locator = ctx.path.substring(VENDOR_PATH.length);

    let resolved: string;
    try {
      resolved = require.resolve(locator);
    } catch {
      // not resolved
      return await next();
    }

    let done;
    try {
      done = await send(ctx, path.relative(serveRoot, resolved), {
        root: serveRoot,
      });
    } catch (err: any) {
      if (err.status !== 404) {
        throw err;
      }
    }
    if (done) {
      return;
    }
  }
  await next();
};
