import React from 'react';
import pkg from '../../package.json';
import * as UI from './ui';

export const Footer: React.FC = () => {
  return (
    <UI.Flex w="100%" my={12} justify="center">
      <UI.Box mx={2}>Asteroid v{pkg.version}</UI.Box>/
      <UI.Box mx={2}>
        <UI.Link href="https://github.com/spring-raining/asteroid" isExternal>
          Code
        </UI.Link>
      </UI.Box>
      /
      <UI.Box mx={2}>
        ©&nbsp;
        <UI.Link href="https://github.com/spring-raining" isExternal>
          spring-raining
        </UI.Link>
      </UI.Box>
    </UI.Flex>
  );
};
