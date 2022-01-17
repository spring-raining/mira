declare module 'find-node-modules' {
  const findNodeModules: (args?: {
    cwd?: string;
    searchFor?: string;
    relative?: boolean;
  }) => string[];
  export default findNodeModules;
}
