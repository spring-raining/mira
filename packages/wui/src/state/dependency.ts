import { nanoid } from 'nanoid/non-secure';
import {
  useRecoilCallback,
  useRecoilValue,
  selector,
  selectorFamily,
} from 'recoil';
import { RefreshModuleEvent } from '../context';
import {
  collectImports,
  loadModule,
  mapModuleValues,
  getRelativeSpecifier,
} from '../mdx/dependency';
import { Brick } from '../types';
import {
  importedModulesRefDictState,
  asteroidImportMappingState,
  asteroidImportErrorDictState,
} from './atoms';

// Reference of actual imported modules
// Storing them to recoil atoms directly may occurs errors
const moduleMap = new Map<string, Record<string, unknown>>();

const importedModulesRefFamily = selectorFamily<string | null, string>({
  key: 'importedModulesRefFamily',
  get: (specifier) => ({ get }) =>
    get(importedModulesRefDictState)[specifier] ?? null,
});

const asteroidImportedValues = selector<Record<string, unknown>>({
  key: 'asteroidImportedValues',
  get: ({ get }) => {
    return Object.entries(get(asteroidImportMappingState)).reduce(
      (acc, [name, mapping]) => {
        const key = get(importedModulesRefFamily(mapping.specifier));
        const mod = key && moduleMap.get(key);
        if (!mod) {
          return acc;
        }
        return {
          ...acc,
          [name]: mapping.name ? mod[mapping.name] : mod,
        };
      },
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
  const loadDependency = useRecoilCallback(
    ({ set, snapshot }) => async (bricks: Brick[]) => {
      const imported = (
        await Promise.all(
          bricks.map(async (brick) => {
            try {
              const importDefinitions = await collectImports({
                brick,
                path,
              });
              const result = await Promise.all(
                importDefinitions.map(async (definition) => {
                  const key = await snapshot.getPromise(
                    importedModulesRefFamily(definition.specifier)
                  );
                  const mod = key && moduleMap.get(key);
                  return {
                    definition,
                    mod:
                      mod ||
                      (await loadModule({
                        definition,
                        moduleLoader,
                        depsRootPath,
                      })),
                  };
                })
              );
              return [{ brick, result }];
            } catch (error) {
              set(asteroidImportErrorDictState, (val) => ({
                ...val,
                [brick.brickId]: error,
              }));
              return [];
            }
          })
        )
      ).flat();
      set(importedModulesRefDictState, (modRef) =>
        imported
          .flatMap(({ result }) =>
            result.map<[string, Record<string, unknown>]>((r) => [
              r.definition.specifier,
              r.mod,
            ])
          )
          .filter(
            ([specifier], i, arr) =>
              i === arr.findIndex(([s]) => s === specifier)
          )
          .reduce((acc, [specifier, mod]) => {
            if (modRef[specifier]) {
              moduleMap.delete(modRef[specifier]);
            }
            const key = nanoid();
            moduleMap.set(key, mod);
            acc[specifier] = key;
            return acc;
          }, {} as Record<string, string>)
      );
      const importSucceedBricks: Brick[] = [];
      let mapping: ReturnType<typeof mapModuleValues> = {};
      for (const { brick, result } of imported) {
        try {
          const localMapping = result.reduce(
            (acc, m) => ({
              ...acc,
              ...mapModuleValues(m),
            }),
            {} as ReturnType<typeof mapModuleValues>
          );
          mapping = { ...mapping, ...localMapping };
          importSucceedBricks.push(brick);
        } catch (error) {
          set(asteroidImportErrorDictState, (val) => ({
            ...val,
            [brick.brickId]: error,
          }));
        }
      }
      set(asteroidImportMappingState, mapping);
      set(asteroidImportErrorDictState, (val) =>
        importSucceedBricks.reduce((acc, brick) => {
          delete acc[brick.brickId];
          return acc;
        }, val)
      );
    },
    [path, depsRootPath, moduleLoader]
  );

  const refreshDependency = useRecoilCallback(
    ({ set }) => async ({ module, url }: RefreshModuleEvent) => {
      set(importedModulesRefDictState, (modRef) => {
        const specifier = getRelativeSpecifier({ url, depsRootPath });
        if (modRef[specifier]) {
          moduleMap.delete(modRef[specifier]);
        }
        const key = nanoid();
        moduleMap.set(key, module);
        return { ...modRef, [specifier]: key };
      });
    },
    [depsRootPath]
  );

  return { loadDependency, refreshDependency };
};

export const useImportedValues = () => {
  const importedValues = useRecoilValue(asteroidImportedValues);
  return { importedValues };
};
