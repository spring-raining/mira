import { css, style } from '../styles/system.css';

export const universeContainer = style(
  css({
    w: 'full',
    d: 'flex',
  }),
);
// const UniverseContainer = styled.div`
//   width: 100%;
//   display: flex;
// `;

export const planetarySystemPane = style(
  css({
    w: '12rem',
  }),
);
// const PlanetarySystemPane = styled.div`
//   width: 12rem;
// `;

export const planetarySystemSticky = style(
  css({
    top: 0,
    pos: 'sticky',
    py: 70,
  }),
);
// const PlanetarySystemSticky = styled.div`
//   top: 0;
//   position: sticky;
//   padding: 70px 0;
// `;

export const mainPane = style(
  css({
    flex: 1,
  }),
);
// const MainPane = styled.div`
//   flex: 1;
// `;

export const mainSticky = style(
  css({
    w: 'full',
    pos: 'sticky',
    top: 0,
    py: 70,
    ms: 4,
  }),
);
// const MainSticky = styled.div`
//   width: '100%';
//   position: sticky;
//   top: 0;
//   padding: 70px 0;
//   margin-inline-start: 1rem;
// `;
