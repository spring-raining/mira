import path from 'path';
import { Plugin } from '@web/dev-server-core';
import chokidar, { FSWatcher } from 'chokidar';
import debounce from 'debounce';
import { gitignore } from 'globby';
import { globFiles } from '../../util';

export function proactiveWatchPlugin(): Plugin {
  let gitignoreFileWatcher: FSWatcher;
  let workDirWatcher: FSWatcher;

  const workDir = process.cwd();
  const rehashTargetFiles = async () => {
    workDirWatcher?.close();
    gitignoreFileWatcher?.close();

    const isIgnored = await gitignore();
    const gitignorePaths = await globFiles({
      patterns: '**/.gitignore',
      cwd: workDir,
      absolute: true,
    });
    gitignoreFileWatcher = chokidar.watch(gitignorePaths);
    workDirWatcher = chokidar.watch(workDir);

    const reload = debounce(() => {
      rehashTargetFiles();
    }, 200);
    gitignoreFileWatcher.on('change', reload).on('unlink', reload);
    workDirWatcher.on('add', (pathname) => {
      if (isIgnored(pathname)) {
        return;
      }
      if (
        path.basename(pathname) === '.gitignore' &&
        !gitignorePaths.includes(pathname)
      ) {
        reload();
      }
    });
  };

  return {
    name: 'watch',
    injectWebSocket: true,
    async serverStart({ fileWatcher, webSockets, logger }) {
      if (!webSockets) {
        throw new Error('webSockets is not enabled');
      }
      rehashTargetFiles();

      const onChange = (path: string) => {
        logger.log(path);
      };
      fileWatcher.addListener('change', onChange);
      fileWatcher.addListener('unlink', onChange);
    },
    serverStop() {
      workDirWatcher?.close();
      gitignoreFileWatcher?.close();
    },
  };
}
