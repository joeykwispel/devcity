import raw from '@/data/cv.json'
import { cvSchema } from './schema'

/** Validated at build time: a broken cv.json fails `next build` instead of shipping. */
export const cv = cvSchema.parse(raw)

export * from './schema'
