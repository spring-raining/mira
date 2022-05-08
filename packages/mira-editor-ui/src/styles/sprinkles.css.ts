import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';

const displayProperties = defineProperties({
  properties: {
    display: ['none', 'block', 'flex'],
    visibility: ['hidden', 'visible'],
    flexDirection: ['row', 'column'],
    alignItems: ['stretch', 'flex-start', 'center', 'flex-end'],
    alignSelf: ['stretch', 'flex-start', 'center', 'flex-end'],
    justifyContent: ['stretch', 'flex-start', 'center', 'flex-end'],
    opacity: [0, 1],
  },
});

export const sprinkles = createSprinkles(displayProperties);
