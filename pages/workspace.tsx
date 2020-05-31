import { useContext, useEffect, useState } from 'react';
import Head from 'next/head';
import { setProjects } from '../src/actions/workspace';
import { Footer } from '../src/components/Footer';
import { Universe } from '../src/components/Universe';
import { WorkspaceContext } from '../src/contexts/workspace';

const defaultProjectName = 'index';

export default () => {
  const {
    state: { fs },
    dispatch,
  } = useContext(WorkspaceContext);
  const [initialMdx, setInitialMdx] = useState<string | null>(null);
  useEffect(() => {
    if (!fs || !dispatch) {
      return;
    }
    fs.listProjects()
      .then((projects) =>
        Promise.all(
          projects.map(async (project) => ({
            ...project,
            mdx: await fs.loadProject(project.name),
          }))
        )
      )
      .then((projects) => {
        const asteroidPrj = projects.find(
          ({ name }) => name === defaultProjectName
        );
        if (asteroidPrj) {
          setInitialMdx(asteroidPrj.mdx);
          dispatch(setProjects(projects));
        }
      });
  }, [fs, dispatch]);

  return (
    <div>
      <Head>
        <title>Asteroid</title>
      </Head>

      {initialMdx != null && (
        <Universe projectName={defaultProjectName} mdx={initialMdx} />
      )}
      <Footer />
    </div>
  );
};
