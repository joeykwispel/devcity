/** Accepts owner/repo, github.com URLs (also /tree/branch/... and .git) and git@ remotes. */
export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const value = input.trim()
  const match =
    /^(?:https?:\/\/)?(?:www\.)?github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#].*)?$/i.exec(
      value,
    ) ??
    /^git@github\.com:([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i.exec(value) ??
    /^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/.exec(value)
  if (!match) return null
  return { owner: match[1]!, repo: match[2]! }
}
