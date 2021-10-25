import React from 'react';

const XIcon: React.VFC<React.HTMLAttributes<SVGElement>> = (props) => (
  <svg
    width="16"
    height="18"
    viewBox="0 0 16 18"
    fill="none"
    stroke="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6.33333 8.16667V13.1667M9.66666 8.16667V13.1667M1.33333 4.83333H14.6667M13.8333 4.83333L13.1108 14.9517C13.0809 15.3722 12.8927 15.7657 12.5843 16.053C12.2758 16.3403 11.8699 16.5 11.4483 16.5H4.55166C4.13011 16.5 3.72422 16.3403 3.41573 16.053C3.10725 15.7657 2.91909 15.3722 2.88916 14.9517L2.16666 4.83333H13.8333ZM10.5 4.83333V2.33333C10.5 2.11232 10.4122 1.90036 10.2559 1.74408C10.0996 1.5878 9.88767 1.5 9.66666 1.5H6.33333C6.11231 1.5 5.90035 1.5878 5.74407 1.74408C5.58779 1.90036 5.49999 2.11232 5.49999 2.33333V4.83333H10.5Z"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export default XIcon;
