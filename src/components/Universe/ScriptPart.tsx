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
  console.log(note);
  const importNode = (note.children || []).filter(
    (ast) => ast.type === 'import'
  );

  return (
    <UI.Box my={8} px={4} w="100%" fontSize="sm">
      {importNode.map((ast, i) => (
        <UI.Flex key={i} align="center">
          <UI.Box flex={0} mr={6}>
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
      ))}
    </UI.Box>
  );
};
