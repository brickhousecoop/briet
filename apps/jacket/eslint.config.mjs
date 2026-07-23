import next from 'eslint-config-next/core-web-vitals'

const config = [
  { ignores: ['.next/**'] },
  ...next,
]

export default config
