import React from 'react';
import Linkify from 'react-linkify';
import { ScriptBrick } from '../../contexts/universe';
import * as UI from '../ui';

const Link = (href, text, key) => (
  <UI.Link href={href} key={key} isExternal>
    {text}
  </UI.Link>
);

export const ScriptPart: React.FC<{ note: ScriptBrick }> = ({ note }) => {
  return (
    <UI.Box my={8} px={4} w="100%" fontSize="sm">
      {note.children.map((ast, i) => {
        if (ast.type === 'import') {
          return (
            <UI.Flex key={i} align="center" overflow="auto">
              <UI.Box flexBasis="6rem">
                <UI.Tag
                  size="sm"
                  variant="outline"
                  variantColor="purple"
                  rounded="full"
                >
                  Module
                </UI.Tag>
              </UI.Box>
              <UI.Box flex={1}>
                <pre key={i}>
                  <Linkify componentDecorator={Link}>{ast.value}</Linkify>
                </pre>
              </UI.Box>
            </UI.Flex>
          );
        }
        return (
          <UI.Box pl="6rem">
            <pre key={i}>{ast.value}</pre>
          </UI.Box>
        );
      })}
    </UI.Box>
  );
};
