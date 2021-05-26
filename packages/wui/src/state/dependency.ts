import {
  useRecoilCallback,
  useRecoilValue,
  selector,
  selectorFamily,
} from 'recoil';
import { collectImports, loadModule } from '../mdx/dependency';
import { Brick, ParsedImportStatement } from '../types';
import {
  asteroidImportDefinitionDictState,
  asteroidImportedValueByStatementDictState,
  asteroidImportErrorDictState,
} from './atoms';

const asteroidImportedValueFamily = selectorFamily<
  Record<string, unknown> | null,
  string
>({
  key: 'asteroidImportedValueFamily',
  get: (statement) => ({ get }) =>
    get(asteroidImportedValueByStatementDictState)[statement] ?? null,
});

const asteroidImportedValues = selector<Record<string, unknown>>({
  key: 'asteroidImportedValues',
  get: ({ get }) => {
    return Object.values(get(asteroidImportedValueByStatementDictState)).reduce(
      (acc, values) => ({ ...acc, ...values }),
      {}
    );
  },
});

export const useDependency = ({
  path,
  depsRootPath,
  moduleLoader,
}: {
  path: string;
  depsRootPath: string;
  moduleLoader: (specifier: string) => Promise<any>;
}) => {
  const updateDependency = useRecoilCallback(
    ({ set, snapshot }) => async (bricks: Brick[]) => {
      const imported = (
        await Promise.all(
          bricks.map(async (brick) => {
            try {
              const importDefinitions = await collectImports({
                brick,
                path,
                depsRootPath,
              });
              const result = await Promise.all(
                importDefinitions.map(async (definition) => ({
                  definition,
                  values:
                    (await snapshot.getPromise(
                      asteroidImportedValueFamily(definition.statement)
                    )) || (await loadModule({ definition, moduleLoader })),
                }))
              );
              return [
                {
                  brick,
                  result,
                },
              ];
            } catch (error) {
              set(asteroidImportErrorDictState, (val) => ({
                ...val,
                [brick.brickId]: error,
              }));
              return [];
            }
          })
        )
      ).flatMap((_) => _);
      set(asteroidImportErrorDictState, (val) =>
        imported.reduce((acc, { brick }) => {
          delete acc[brick.brickId];
          return acc;
        }, val)
      );
      set(
        asteroidImportDefinitionDictState,
        imported.reduce(
          (acc, { result }) =>
            result.reduce((acc, { definition }) => {
              acc[definition.statement] = definition;
              return acc;
            }, acc),
          {} as Record<string, ParsedImportStatement>
        )
      );
      set(
        asteroidImportedValueByStatementDictState,
        imported.reduce(
          (acc, { result }) =>
            result.reduce((acc, { definition, values }) => {
              acc[definition.specifier] = values;
              return acc;
            }, acc),
          {} as Record<string, Record<string, any>>
        )
      );
    },
    [path, depsRootPath, moduleLoader]
  );

  return { updateDependency };
};

export const useImportedValues = () => {
  const importedValues = useRecoilValue(asteroidImportedValues);
  return { importedValues };
};
