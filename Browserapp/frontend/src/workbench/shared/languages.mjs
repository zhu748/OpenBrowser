import { fi as isSmallTouchScreen } from './utils-BIWenCnY.js';

const languages = [
  { label: isSmallTouchScreen() ? '中文' : '中文（简体）', locale: 'zh-CN', icon: 'country-code/CN' },
  { label: 'English', locale: 'en', icon: 'country-code/US' },
  { label: 'Русский', locale: 'ru', icon: 'country-code/RU' },
];

export { languages as t };
