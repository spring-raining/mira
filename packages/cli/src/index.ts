import path from 'path';

export const a = () => {
  console.log('hello world');
};
export default () => {
  console.log(path.resolve(__dirname));
};
