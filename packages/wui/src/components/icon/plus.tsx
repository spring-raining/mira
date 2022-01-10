import React from 'react';
import { Icon } from '../atomic/icon';

export const PlusIcon: React.VFC = () => (
  <Icon fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="butt"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </Icon>
);
