import React, { useContext, useCallback } from 'react';
import { UniverseContext } from '../../contexts/universe';
import { exportMdx } from '../../mdx/io';
import * as UI from '../ui';

export const ToolBar: React.FC<{ title?: string }> = ({ title }) => {
  const { state, dispatch } = useContext(UniverseContext);

  const onRunButtonClick = useCallback(() => {
    const { providence } = state;
    dispatch({
      providence: {
        ...providence,
        asteroid: Object.entries(providence.asteroid).reduce(
          (acc, [k, asteroid]) => {
            return {
              ...acc,
              [k]: {
                ...asteroid,
                result: null,
                status: 'init',
                scope: {},
              },
            };
          },
          {}
        ),
      },
    });
  }, [state, dispatch]);

  const onExportButtonClick = useCallback(() => {
    const mdx = exportMdx(state);
    console.log(mdx);

    // download file
    const blob = new Blob([mdx], { type: 'text/plain' });
    const a = window.document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'export.mdx';
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  }, [state]);

  return (
    <UI.Flex
      w="100%"
      px={6}
      py={4}
      position="sticky"
      top={0}
      bg="white"
      boxShadow="md"
      zIndex={100 /* override monaco-editor z-index */}
      justify="space-between"
      align="center"
    >
      {title}
      <UI.Flex align="center">
        <UI.Button
          mx={2}
          rounded="full"
          variant="outline"
          variantColor="purple"
          onClick={onRunButtonClick}
        >
          <UI.Icon name="chevron-right" size="1.5rem" />
          Run
        </UI.Button>
        <UI.Button
          mx={2}
          rounded="full"
          variant="outline"
          variantColor="purple"
          onClick={onExportButtonClick}
        >
          <UI.Icon name="download" mr={1} />
          Export
        </UI.Button>
      </UI.Flex>
    </UI.Flex>
  );
};
