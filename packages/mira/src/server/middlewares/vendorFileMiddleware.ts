import path from 'path';
import { fileURLToPath } from 'url';
import { Middleware } from '@web/dev-server-core';
import compose from 'koa-compose';
import send from 'koa-send';
import { VENDOR_PATH, CLIENT_PATH } from './../../constants';

const clientCodeRoot = path.resolve(
  fileURLToPath(import.meta.url),
  '../clientCode',
);
const vendorRoot = path.resolve(fileURLToPath(import.meta.url), '../vendor');

const handleFile =
  (handlePath: string, serveRootPath: string): Middleware =>
  async (ctx, next) => {
    if (
      ctx.path.startsWith(handlePath) &&
      (ctx.method === 'HEAD' || ctx.method === 'GET')
    ) {
      const locator = ctx.path.substring(handlePath.length);
      try {
        await send(ctx, locator, {
          root: serveRootPath,
        });
      } catch (err: any) {
        if (err.status !== 404) {
          throw err;
        }
      }
    }
    await next();
  };

export const vendorFileMiddleware = compose([
  handleFile(CLIENT_PATH, clientCodeRoot),
  handleFile(VENDOR_PATH, vendorRoot),
]);
