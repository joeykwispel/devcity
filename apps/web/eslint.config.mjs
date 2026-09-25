import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const config = [
  ...nextVitals,
  ...nextTs,
  // components/jo is the design kit, copied unchanged from joeykwispel/Portfolio.
  { ignores: ['.next/**', 'out/**', 'storybook-static/**', 'next-env.d.ts', 'components/jo/**'] },
]

export default config
