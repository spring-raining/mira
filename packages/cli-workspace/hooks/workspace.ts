import { selector, useRecoilValue, useRecoilState } from 'recoil';
import { miraFilesState, activeFilePathState } from './atoms';

const activeMiraFileState = selector({
  key: 'activeMiraFileState',
  get: ({ get }) => {
    const activeFilePath = get(activeFilePathState);
    return activeFilePath != null
      ? get(miraFilesState).find(({ path }) => path === activeFilePath) ?? null
      : null;
  },
});

export const useMiraFiles = () => {
  const [miraFiles, setMiraFiles] = useRecoilState(miraFilesState);
  const [activeFilePath, setActiveFilePath] = useRecoilState(
    activeFilePathState
  );
  return { miraFiles, setMiraFiles, activeFilePath, setActiveFilePath };
};

export const useWorkspaceFile = () => {
  const activeMiraFile = useRecoilValue(activeMiraFileState);
  return { activeMiraFile };
};
