import React, {
  createContext,
  RefObject,
  useCallback,
  useContext,
  useState,
  useRef,
} from 'react';
import { container } from 'tsyringe';
import {
  FileSystemService,
  fileSystemServiceToken,
} from '../services/filesystem/fileSystem.trait';
import {
  WorkspaceService,
  workspaceServiceToken,
} from '../services/workspace/workspace.trait';

const serviceToken = {
  fileSystem: fileSystemServiceToken,
  workspace: workspaceServiceToken,
} as const;

type ServiceUpdateCallbacks = Record<string, (value: any) => void>;
export interface ServiceContextData {
  updateCallbacks?: RefObject<ServiceUpdateCallbacks>;
  fileSystem?: FileSystemService;
  workspace?: WorkspaceService;
}

export const ServiceContext = createContext<ServiceContextData>({});

export const useServiceContext = () => {
  const { updateCallbacks, ...ctx } = useContext(ServiceContext);
  const register = useCallback(
    <T extends keyof typeof serviceToken>(
      serviceName: T,
      value: ServiceContextData[T],
    ) => {
      container.register(serviceToken[serviceName], { useValue: value });
      updateCallbacks?.current?.[serviceToken[serviceName]]?.(value);
    },
    [updateCallbacks],
  );
  return { ...ctx, register };
};

const useServiceInterceptor = <
  T extends keyof typeof serviceToken,
  S = ServiceContextData[T],
>(
  serviceName: T,
) => {
  const token = serviceToken[serviceName];
  const [service, setService] = useState<S | undefined>(() => {
    if (container.isRegistered(token)) {
      return container.resolve<S>(token);
    }
  });
  return [service, setService] as const;
};

export const ServiceProvider: React.FC = ({ children }) => {
  const [fileSystem, setFileSystemService] =
    useServiceInterceptor<'fileSystem'>('fileSystem');
  const [workspace, setWorkspaceService] =
    useServiceInterceptor<'workspace'>('workspace');
  const updateCallbacks = useRef<ServiceUpdateCallbacks>({
    [fileSystemServiceToken]: setFileSystemService,
    [workspaceServiceToken]: setWorkspaceService,
  });
  return (
    <ServiceContext.Provider value={{ fileSystem, workspace, updateCallbacks }}>
      {children}
    </ServiceContext.Provider>
  );
};
