import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')

const routes = [
  'overview',
  'assess',
  'risk-analysis',
  'intelligence',
  'insights',
]

const indexPath = path.join(distDir, 'index.html')
if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.html not found! Run vite build first.')
  process.exit(1)
}

const html = fs.readFileSync(indexPath, 'utf-8')

for (const route of routes) {
  const routeDir = path.join(distDir, route)
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true })
  }
  fs.writeFileSync(path.join(routeDir, 'index.html'), html)
  fs.writeFileSync(path.join(distDir, `${route}.html`), html)
}

fs.writeFileSync(path.join(distDir, '404.html'), html)
console.log('Successfully generated static route files for /assess, /risk-analysis, /intelligence, /insights, /overview, and /404.html')
