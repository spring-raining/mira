let alphabet = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
let rand = (d: number): number => Math.floor(Math.random() * d);
export const genAsteroidId = (): string => {
  const _1 = rand(100) + 1920;
  const _2 = alphabet[rand(alphabet.length - 1)];
  const _3 = alphabet[rand(alphabet.length)];
  const _4 = rand(200);
  return `${_1}${_2}${_3}${_4 || ''}`;
};
