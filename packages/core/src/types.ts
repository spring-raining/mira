export interface MiraConfig {
  framework?: 'react';
  module?: string[];
}

export interface RuntimeScope {
  $run: (element: any) => void;
}
