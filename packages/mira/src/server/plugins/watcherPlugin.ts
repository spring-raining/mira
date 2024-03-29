import path from 'path';
import { DevServerEvent } from '@mirajs/mira-workspace';
import { Plugin, WebSocketsManager } from '@web/dev-server-core';
import chokidar, { FSWatcher } from 'chokidar';
import debounce from 'debounce';
import { gitignore } from 'globby';
import picomatch from 'picomatch';
import { ProjectConfig } from '../../config';
import { readProjectFileObject } from '../../file';
import { globFiles, DEFAULT_IGNORE } from '../../util';

export function watcherPlugin({ config }: { config: ProjectConfig }): Plugin {
  let gitignoreFileWatcher: FSWatcher;
  let workDirWatcher: FSWatcher;

  const workDir = process.cwd();
  const rehashTargetFiles = async ({
    webSockets,
  }: {
    webSockets: WebSocketsManager;
  }) => {
    workDirWatcher?.close();
    gitignoreFileWatcher?.close();

    const excludeMatch = picomatch([...DEFAULT_IGNORE], {
      dot: true,
    });
    const isIgnored = await gitignore();
    const gitignorePaths = await globFiles({
      includes: ['**/.gitignore'],
      cwd: workDir,
    });
    gitignoreFileWatcher = chokidar.watch(gitignorePaths);
    workDirWatcher = chokidar.watch(workDir, {
      persistent: true,
      ignoreInitial: true,
      disableGlobbing: false,
    });

    const reload = debounce(() => {
      rehashTargetFiles({ webSockets });
    }, 200);
    const handleEvent = async (
      event: 'add' | 'unlink' | 'change',
      pathname: string,
    ) => {
      const relPath = path.relative(config.mira.workspace, pathname);
      if (relPath.includes('..')) {
        return; // File changes outside of workspace
      }
      if (excludeMatch(pathname) || isIgnored(pathname)) {
        return;
      }
      if (
        path.basename(pathname) === '.gitignore' &&
        !gitignorePaths.includes(pathname)
      ) {
        reload();
        return;
      }
      const data: DevServerEvent = {
        type: 'watcher',
        data: {
          event,
          file: await readProjectFileObject({ pathname, config }),
        },
      };
      webSockets.send(JSON.stringify(data));
    };
    gitignoreFileWatcher.on('change', reload).on('unlink', reload);
    workDirWatcher.on('add', (pathname) => {
      handleEvent('add', pathname);
    });
    workDirWatcher.on('unlink', (pathname) => {
      handleEvent('unlink', pathname);
    });
    workDirWatcher.on('change', (pathname) => {
      handleEvent('change', pathname);
    });
  };

  return {
    name: 'watcher',
    injectWebSocket: true,
    async serverStart({ webSockets }) {
      if (!webSockets) {
        throw new Error('webSockets is not enabled');
      }
      rehashTargetFiles({ webSockets });
    },
    serverStop() {
      workDirWatcher?.close();
      gitignoreFileWatcher?.close();
    },
  };
}
