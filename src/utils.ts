export const randomInt = (d: number): number => Math.floor(Math.random() * d);

const alphabet = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
export const genAsteroidId = (): string => {
  const _1 = randomInt(100) + 1920;
  const _2 = alphabet[randomInt(alphabet.length - 1)];
  const _3 = alphabet[randomInt(alphabet.length)];
  const _4 = randomInt(200);
  return `${_1}${_2}${_3}${_4 || ''}`;
};
