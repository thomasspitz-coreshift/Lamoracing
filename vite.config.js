import { defineConfig } from 'vite'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

// Shared header/footer/CTA blocks live in /partials and are injected with
// <!-- @include name {"key":"value"} --> ; {{key}} placeholders are replaced.
function htmlPartials() {
  const render = (html, depth = 0) =>
    html.replace(/<!--\s*@include\s+([\w-]+)\s*(\{.*?\})?\s*-->/g, (_, name, json) => {
      const vars = json ? JSON.parse(json) : {}
      const src = readFileSync(resolve(root, 'partials', `${name}.html`), 'utf8')
      const out = src.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '')
      return depth < 4 ? render(out, depth + 1) : out
    })
  return {
    name: 'html-partials',
    transformIndexHtml: { order: 'pre', handler: (html) => render(html) },
    handleHotUpdate({ file, server }) {
      if (file.includes(`${root}/partials/`)) server.ws.send({ type: 'full-reload' })
    },
  }
}

// Every index.html (and 404.html) outside node_modules/dist/public is a page.
function findPages(dir, acc = {}) {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', 'public', 'partials', '.git', 'src'].includes(entry)) continue
    const full = resolve(dir, entry)
    if (statSync(full).isDirectory()) findPages(full, acc)
    else if (entry === 'index.html' || entry === '404.html') {
      const key = relative(root, full).replace(/\/?index\.html$|\.html$/, '').replace(/\//g, '-') || 'home'
      acc[key] = full
    }
  }
  return acc
}

export default defineConfig({
  plugins: [htmlPartials()],
  build: {
    rollupOptions: { input: findPages(root) },
  },
})
