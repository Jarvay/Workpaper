import { TranslationFunc } from '../cross/interface';

export * from 'react-i18next';

declare module 'react-i18next' {
  export const useTranslation: () => {
    i18n: i18n;
    ready: boolean;
    t: TranslationFunc;
  };
}

declare module 'i18next' {
  export type TFunction = TranslationFunc;
}
