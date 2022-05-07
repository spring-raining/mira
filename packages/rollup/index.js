import mdx from '@mdx-js/rollup';
import { remarkMira, rehypeMira, recmaMira } from '@mirajs/mdx-mira';

const rollup = ({
  remarkPlugins = [],
  rehypePlugins = [],
  recmaPlugins = [],
  ...other
} = {}) =>
  mdx({
    ...other,
    format: 'mdx',
    remarkPlugins: [remarkMira, ...remarkPlugins],
    rehypePlugins: [rehypeMira, ...rehypePlugins],
    recmaPlugins: [recmaMira, ...recmaPlugins],
  });

export { rollup };
export default rollup;
