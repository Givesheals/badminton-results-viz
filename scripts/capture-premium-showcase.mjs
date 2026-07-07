/**
 * Captures premium showcase screenshots from the live app loaded with showcase data.
 * Run: npm run showcase:capture  (starts dev server if needed)
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const OUT_DIR = path.join(root, 'public', 'premium-showcase')
const PORT = 5199
const BASE_URL = `http://localhost:${PORT}/?showcase=1`

const CAPTURES = [
  {
    file: 'tournament-recap.png',
  },
  {
    file: 'partner-chemistry.png',
    tab: 'People',
    section: '#partner-chemistry',
  },
  {
    file: 'category-milestones.png',
    tab: 'Player summary',
    section: '#category-milestones',
  },
]

function waitForServer(url, timeoutMs = 60_000) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) resolve()
        else retry()
      })
      req.on('error', retry)
    }
    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Dev server did not start within ${timeoutMs}ms`))
        return
      }
      setTimeout(tick, 400)
    }
    tick()
  })
}

async function startDevServer() {
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', '--port', String(PORT), '--strictPort'],
    {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    },
  )

  let output = ''
  child.stdout?.on('data', (chunk) => {
    output += String(chunk)
  })
  child.stderr?.on('data', (chunk) => {
    output += String(chunk)
  })

  await waitForServer(BASE_URL)

  return {
    child,
    async stop() {
      child.kill('SIGTERM')
      await new Promise((resolve) => child.on('close', resolve))
    },
    output: () => output,
  }
}

async function captureScreenshots() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const server = await startDevServer()
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1100, height: 820 },
    deviceScaleFactor: 2,
  })

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-showcase-ready="true"]', { timeout: 60_000 })
    await page.waitForTimeout(1200)

    for (const capture of CAPTURES) {
      if (capture.tab) {
        await page.getByRole('tab', { name: capture.tab }).click()
        await page.waitForTimeout(600)
      }

      if (capture.section) {
        await page.locator(capture.section).scrollIntoViewIfNeeded()
        await page.waitForTimeout(400)
        await page.locator(capture.section).screenshot({
          path: path.join(OUT_DIR, capture.file),
        })
      } else {
        await page.locator('#tournament-recap').scrollIntoViewIfNeeded()
        await page.waitForTimeout(400)
        await page.locator('#tournament-recap').screenshot({
          path: path.join(OUT_DIR, capture.file),
        })
      }

      console.log(`Captured ${capture.file}`)
    }
  } finally {
    await browser.close()
    await server.stop()
  }
}

captureScreenshots().catch((error) => {
  console.error(error)
  process.exit(1)
})
