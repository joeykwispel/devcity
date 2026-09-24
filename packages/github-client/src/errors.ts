import type { RateLimit } from './rate-limit.ts'

export class GitHubError extends Error {
  readonly status: number
  readonly rateLimit: RateLimit | null

  constructor(message: string, status: number, rateLimit: RateLimit | null) {
    super(message)
    this.name = 'GitHubError'
    this.status = status
    this.rateLimit = rateLimit
  }
}

/** The request was refused because the rate limit budget is used up. */
export class RateLimitError extends GitHubError {
  constructor(rateLimit: RateLimit | null, status = 403) {
    super('GitHub API rate limit exceeded', status, rateLimit)
    this.name = 'RateLimitError'
  }
}

export class NotFoundError extends GitHubError {
  constructor(path: string, rateLimit: RateLimit | null) {
    super(`Not found: ${path}`, 404, rateLimit)
    this.name = 'NotFoundError'
  }
}
