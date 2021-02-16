export interface AsteroidConfig {
  framework?: 'react';
  module?: string[];
}

export interface RuntimeScope {
  $run: (element: any) => void;
}
