import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import next from 'eslint-config-next/core-web-vitals'

// Flat-config equivalent of the old .eslintrc.yml: base JS + TS + React + Next
// rules. eslint-config-next already supplies react/recommended and
// react-hooks/recommended; core-web-vitals adds Next's stricter checks.
const config = [
  { ignores: ['.next/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next,
]

export default config
