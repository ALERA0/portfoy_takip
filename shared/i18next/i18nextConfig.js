const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const i18nextMiddleware = require('i18next-http-middleware');

const i18nConfig = {
  fallbackLng: 'tr',
  preload: ['en', 'tr'],
  ns: ['error', 'success'],
  backend: {
    loadPath: __dirname + '/locale/{{lng}}/{{ns}}.json',
  },
};

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init(i18nConfig, (err) => {
    if (err) {
      console.error('Locale files not loaded:', err);
    } else {
      console.log('Locale files successfully load.', i18next.languages);
    }
  });

module.exports = i18next;
