import React from 'react';

const FunctionIcon: React.VFC<React.HTMLAttributes<SVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.26,4.31c-.36-2.57-4.14-2.09-4.45.56C8.36,8.7,8.13,15.57,7.2,19.62a2.24,2.24,0,0,1-4.42-.25M4.61,9.18h6.81M19.59,19c-2.78-.94-2.67-6.09-5.61-7m6.85,0c-3.27.94-5,6.09-8.08,7"
    />
  </svg>
);

export default FunctionIcon;
