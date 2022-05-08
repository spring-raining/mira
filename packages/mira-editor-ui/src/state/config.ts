import { useRecoilValue } from 'recoil';
import { wuiConfigState } from './atoms';

export const useConfig = () => {
  const config = useRecoilValue(wuiConfigState);

  return config;
};
