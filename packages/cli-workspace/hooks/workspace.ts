import { selector, useRecoilValue, useRecoilState } from 'recoil';
import { asteroidFilesState, activeFilePathState } from './atoms';

const activeAsteroidFileState = selector({
  key: 'activeAsteroidFileState',
  get: ({ get }) => {
    const activeFilePath = get(activeFilePathState);
    return activeFilePath != null
        ? get(asteroidFilesState).find(({ path }) => path === activeFilePath) ??
          null
        : null;
  },
});

export const useAsteroidFiles = () => {
  const [asteroidFiles, setAsteroidFiles] = useRecoilState(asteroidFilesState);
  const [activeFilePath, setActiveFilePath] = useRecoilState(
    activeFilePathState
  );
  return { asteroidFiles, setAsteroidFiles, activeFilePath, setActiveFilePath };
};

export const useWorkspaceFile = () => {
  const activeAsteroidFile = useRecoilValue(activeAsteroidFileState);
  return { activeAsteroidFile };
};
