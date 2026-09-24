import { describe, expect, it } from 'vitest'
import { parseRepoInput } from './repo-input'

describe('parseRepoInput', () => {
  it.each([
    ['joeykwispel/devcity', 'joeykwispel', 'devcity'],
    ['  facebook/react  ', 'facebook', 'react'],
    ['https://github.com/vercel/next.js', 'vercel', 'next.js'],
    ['github.com/pmndrs/zustand/tree/main/src', 'pmndrs', 'zustand'],
    ['https://github.com/sveltejs/svelte.git', 'sveltejs', 'svelte'],
    ['git@github.com:joeykwispel/Portfolio.git', 'joeykwispel', 'Portfolio'],
    ['https://www.github.com/a-b/c_d?tab=readme', 'a-b', 'c_d'],
  ])('parses %s', (input, owner, repo) => {
    expect(parseRepoInput(input)).toEqual({ owner, repo })
  })

  it.each(['', 'react', 'https://gitlab.com/a/b', 'a/b/c', 'owner/repo name'])(
    'rejects %s',
    (input) => {
      expect(parseRepoInput(input)).toBeNull()
    },
  )
})
