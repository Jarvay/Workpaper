import { TranslationFunc } from '../cross/interface';
export * from 'i18next';

declare module 'i18next' {
  export const t: TranslationFunc;
}
