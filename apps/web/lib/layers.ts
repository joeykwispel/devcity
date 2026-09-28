/** The city layers, in header order. `href` is locale-less; next-intl's Link adds the prefix. */
export const layers = [
  { id: 'skills', href: '/', label: 'skills' },
  { id: 'career', href: '/career', label: 'career' },
  { id: 'repos', href: '/repos', label: 'repos' },
  { id: 'city-builder', href: '/city-builder', label: 'cityBuilder' },
] as const

export type LayerId = (typeof layers)[number]['id']
