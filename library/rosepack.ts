import { defineRosepack } from 'rosepack';

export default defineRosepack((config) => ({
  clean: config.mode === 'production',
  format: ['esm', 'cjs', 'dts'],
  input: {
    main: 'source/main.ts',
  },
}));
