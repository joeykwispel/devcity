// Minimal static server for the exported site (apps/web/out), used by the Playwright tests.
// Mirrors GitHub Pages: /path/ serves /path/index.html and unknown paths get 404.html.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const [root = 'apps/web/out', port = '4173'] = process.argv.slice(2)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

async function resolveFile(urlPath) {
  const path = normalize(join(root, decodeURIComponent(urlPath.split('?')[0])))
  if (!path.startsWith(normalize(root))) return null
  try {
    const info = await stat(path)
    return info.isDirectory() ? join(path, 'index.html') : path
  } catch {
    return null
  }
}

createServer(async (req, res) => {
  const file = await resolveFile(req.url ?? '/')
  try {
    const body = await readFile(file ?? '')
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'content-type': types['.html'] })
    res.end(await readFile(join(root, '404.html')).catch(() => 'Not found'))
  }
}).listen(Number(port), () => console.log(`serving ${root} on http://localhost:${port}`))
