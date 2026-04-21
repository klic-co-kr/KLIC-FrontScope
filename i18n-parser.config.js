module.exports = {
  context: 'src',
  createOldCatalogs: true,
  defaultNamespace: 'translation',
  defaultValue: '',
  indentation: 2,
  keySeparator: '.',
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
  },
  locales: ['ko', 'en'],
  namespaceSeparator: ':',
  output: 'src/i18n/locales/{{locale}}.json',
  input: ['src/**/*.{ts,tsx}'],
  sort: true,
  useKeysAsDefaultValue: true,
  keepRemoved: false,
};
