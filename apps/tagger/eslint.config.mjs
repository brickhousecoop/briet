import studio from '@sanity/eslint-config-studio'

const config = [
  { ignores: ['dist/**', 'static/**'] },
  ...studio,
  {
    // Node-context files (build config + scripts), not studio browser code.
    files: ['sanity.config.js', 'sanity.cli.js', 'scripts/**'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },
]

export default config
