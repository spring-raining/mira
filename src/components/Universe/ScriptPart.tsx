import React, { useState, useCallback, useContext, useMemo } from 'react';
import Linkify from 'react-linkify';
import { Formik, Field, FormikConfig } from 'formik';
import { keyframes } from '@emotion/core';
import { nanoid } from 'nanoid';
import { parseImportClause } from '@asteroid-pkg/mdx';
import { UniverseContext, ScriptBrick } from '../../contexts/universe';
import { loadModule } from '../../mdx/module';
import { randomInt } from '../../utils';
import * as UI from '../ui';
import { useRuler } from './useRuler';

const Link = (href: string, text: string, key: number) => (
  <UI.Link href={href} key={key} isExternal>
    {text}
  </UI.Link>
);

const ScriptToolButtonSet: React.FC<{ id: string }> = ({ id }) => {
  const { state, dispatch } = useContext(UniverseContext);
  const { resetAsteroidResult } = useRuler(state);

  const onDeleteButtonClick = useCallback(() => {
    const { imports } = state.providence;
    const bricks = state.bricks
      .map((brick) =>
        brick.children?.some((c) => c.id === id)
          ? {
              ...brick,
              children: brick.children.filter((c) => c.id !== id),
            }
          : brick
      )
      .filter(({ children }) => !children || children.length > 0);
    dispatch({
      bricks,
      providence: {
        ...resetAsteroidResult(),
        imports: imports.filter((def) => def.id !== id),
      },
      userScript: {
        ...state.userScript,
        children: (state.userScript.children || []).filter((c) => c.id !== id),
      },
    });
  }, [resetAsteroidResult, state, dispatch, id]);

  return (
    <UI.IconButton
      aria-label="Delete"
      rounded="full"
      variant="ghost"
      variantColor="red"
      icon="close"
      onClick={onDeleteButtonClick}
    />
  );
};

export const ScriptPart: React.FC<{ note: Omit<ScriptBrick, 'text'> }> = ({
  note,
}) => {
  const { state } = useContext(UniverseContext);
  const importMap = useMemo(
    () =>
      state.providence.imports.reduce((acc, mod) => {
        acc[mod.id] = mod;
        return acc;
      }, {} as { [id: string]: any }),
    [state.providence.imports]
  );

  const [hover, setHover] = useState(false);
  const blockCallbacks = {
    onMouseOver: useCallback(() => setHover(true), []),
    onMouseOut: useCallback(() => setHover(false), []),
  };
  return (
    <UI.Box {...blockCallbacks} my="-1rem" px={4} py={4} w="100%" fontSize="sm">
      {(note.children || []).map((ast, index) => {
        if (ast.type === 'import') {
          return (
            <UI.Box key={index} w="100%">
              <UI.Flex align="center">
                <UI.Box flexBasis="5rem">
                  <UI.Tag
                    size="sm"
                    variant="outline"
                    variantColor="purple"
                    rounded="full"
                  >
                    Module
                  </UI.Tag>
                </UI.Box>
                <UI.Box flex={1} overflowX="auto" my={2}>
                  <pre>
                    <Linkify componentDecorator={Link}>{ast.value}</Linkify>
                  </pre>
                </UI.Box>
                <UI.Box
                  flex={0}
                  opacity={hover ? 1 : 0}
                  pointerEvents={hover ? 'auto' : 'none'}
                  transition="all ease-out 80ms"
                >
                  <ScriptToolButtonSet id={ast.id} />
                </UI.Box>
              </UI.Flex>
              {importMap[ast.id]?.importError && (
                <UI.Box
                  mb={2}
                  ml="5rem"
                  p={2}
                  rounded="md"
                  fontSize="70%"
                  lineHeight="1.25"
                  color="white"
                  bg="red.600"
                >
                  <pre>{importMap[ast.id].importError.toString()}</pre>
                </UI.Box>
              )}
            </UI.Box>
          );
        }
        return (
          <UI.Box key={index} pl="5rem">
            <pre>{ast.value}</pre>
          </UI.Box>
        );
      })}
    </UI.Box>
  );
};

const importPlaceholders: [string, string][] = [
  ['* as THREE', 'https://cdn.pika.dev/three'],
  ['* as d3', 'https://cdn.pika.dev/d3'],
  ['{ map, throttle }', 'https://cdn.pika.dev/lodash-es'],
  ['$', 'https://cdn.pika.dev/jquery'],
];

const importEditorAnim = keyframes({
  from: { opacity: 0, transform: 'translateY(-10px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

const ImportModuleForm: React.FC<{
  importPlaceholderIdx: number;
  onClose: () => void;
  onSubmit: (e: { importClause: string; moduleSpecifier: string }) => void;
}> = ({ importPlaceholderIdx, onClose, onSubmit }) => {
  const formValue: FormikConfig<{
    importClause: string;
    moduleSpecifier: string;
  }> = {
    initialValues: {
      importClause: '',
      moduleSpecifier: '',
    },
    onSubmit,
  };

  const importClauseValidate = (value: string) => {
    if (value.trim().length > 0) {
      const ret = parseImportClause(value.trim());
      if (!ret) {
        return 'invalid import format';
      }
    }
  };
  const moduleSpecifierValidate = (value: string) => {
    if (value.trim().length === 0) {
      return 'module specifier required';
    } else if (value.includes("'") || value.includes('"')) {
      return 'invalid import format';
    }
  };

  return (
    <Formik {...formValue}>
      {({ handleSubmit, errors }) => {
        return (
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
          >
            <UI.Flex
              w="100%"
              px={4}
              my={4}
              justify="space-between"
              align="center"
              animation={`${importEditorAnim} 80ms ease-out`}
            >
              <UI.Flex
                align="center"
                pl="5rem"
                fontFamily="mono"
                fontSize="sm"
                flex={1}
              >
                import
                <Field name="importClause" validate={importClauseValidate}>
                  {({ field }: any) => (
                    <UI.Input
                      {...field}
                      size="sm"
                      variant="flushed"
                      focusBorderColor="purple.500"
                      mx={2}
                      flex={1}
                      placeholder={importPlaceholders[importPlaceholderIdx][0]}
                      isInvalid={!!errors.importClause}
                    />
                  )}
                </Field>
                from
                <Field
                  name="moduleSpecifier"
                  validate={moduleSpecifierValidate}
                >
                  {({ field }: any) => (
                    <UI.Input
                      {...field}
                      size="sm"
                      variant="flushed"
                      focusBorderColor="purple.500"
                      mx={2}
                      flex={3}
                      placeholder={importPlaceholders[importPlaceholderIdx][1]}
                      isInvalid={!!errors.moduleSpecifier}
                    />
                  )}
                </Field>
              </UI.Flex>
              <UI.Flex align="center">
                <UI.IconButton
                  aria-label="Delete"
                  rounded="full"
                  variant="ghost"
                  variantColor="red"
                  icon="close"
                  onClick={onClose}
                />
              </UI.Flex>
            </UI.Flex>
          </form>
        );
      }}
    </Formik>
  );
};

export const UserScriptPart = () => {
  const { state, dispatch } = useContext(UniverseContext);
  const { userScript } = state;
  const { resetAsteroidResult } = useRuler(state);

  const [showImportEditor, setShowImportEditor] = useState(false);
  const [importPlaceholderIdx, setImportPlaceholderIdx] = useState(() =>
    randomInt(importPlaceholders.length)
  );

  const onAddModuleButtonClick = useCallback(() => {
    setShowImportEditor(false);
    window.requestAnimationFrame(() => {
      setImportPlaceholderIdx(randomInt(importPlaceholders.length));
      setShowImportEditor(true);
    });
  }, []);
  const onCloseImportEditor = useCallback(() => {
    setShowImportEditor(false);
  }, []);

  const onSubmitImportEditor = useCallback(
    (ret: { importClause: string; moduleSpecifier: string }) => {
      const importClause = ret.importClause.trim();
      const moduleSpecifier = ret.moduleSpecifier.trim();
      const id = nanoid();
      const importDef = !!importClause
        ? {
            moduleSpecifier,
            ...parseImportClause(importClause)!,
          }
        : {
            moduleSpecifier,
            importBinding: {},
            namespaceImport: null,
          };
      const value = !!importClause
        ? `import ${importClause} from "${moduleSpecifier}"`
        : `import "${moduleSpecifier}"`;
      const newImportPart = { id, definitions: [importDef], text: value };
      const newState = {
        providence: {
          ...resetAsteroidResult(),
          imports: [...state.providence.imports, newImportPart],
        },
        userScript: {
          ...state.userScript,
          children: [
            ...(state.userScript.children || []),
            { id, type: 'import', value },
          ],
        },
      };
      dispatch(newState);
      setShowImportEditor(false);

      (async () => {
        const loaded = await loadModule(newImportPart);
        dispatch({
          providence: {
            ...newState.providence,
            imports: newState.providence.imports.map((mod) =>
              mod.id === id ? loaded : mod
            ),
          },
        });
      })();
    },
    [state, dispatch, resetAsteroidResult]
  );

  return (
    <UI.Box w="100%" py={4}>
      <UI.Flex
        w="100%"
        px={4}
        mt={6}
        mb={4}
        justify="space-between"
        align="center"
      >
        <UI.Flex align="center" pl="5rem">
          <UI.Heading size="md">Module Imports</UI.Heading>
        </UI.Flex>
        <UI.Flex align="center">
          <UI.Button
            rounded="full"
            variant="ghost"
            variantColor="purple"
            onClick={onAddModuleButtonClick}
          >
            Add module
          </UI.Button>
        </UI.Flex>
      </UI.Flex>
      <ScriptPart note={userScript} />
      {showImportEditor && (
        <ImportModuleForm
          importPlaceholderIdx={importPlaceholderIdx}
          onClose={onCloseImportEditor}
          onSubmit={onSubmitImportEditor}
        />
      )}
    </UI.Box>
  );
};
