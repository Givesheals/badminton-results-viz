/**
 * Records looping premium-signup preview videos (phone + desktop).
 *
 * Approach: load each slide, wait until data is ready, start animations, then
 * capture a frame sequence and encode WebM + MP4 + poster via ffmpeg.
 * This avoids Playwright's continuous recorder including "Loading preview…"
 * at the start of every clip.
 *
 * Run: npm run showcase:record
 * Requires: npm run showcase:prepare first
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const OUT_DIR = path.join(root, 'public', 'premium-showcase')
const TMP_DIR = path.join(root, '.tmp-showcase-record')
const PORT = 5199
const BASE = `http://localhost:${PORT}`
/** Smooth enough for scroll pans; 12fps looked janky on product slides. */
const FPS = 24

const BUCKETS = [
  { id: 'phone', width: 390, height: 320 },
  { id: 'desktop', width: 720, height: 360 },
]

const SLIDES = [
  { id: 'notes', durationMs: 8500 },
  { id: 'recap', durationMs: 8000 },
  { id: 'summary', durationMs: 8000 },
  { id: 'people', durationMs: 8000 },
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

  await waitForServer(`${BASE}/`)

  return {
    async stop() {
      child.kill('SIGTERM')
      await new Promise((resolve) => child.on('close', resolve))
    },
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath.path, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg failed (${code}): ${stderr.slice(-800)}`))
    })
  })
}

async function encodeFromFrames(framePattern, outWebm, outMp4, outPoster) {
  await runFfmpeg([
    '-y',
    '-framerate',
    String(FPS),
    '-i',
    framePattern,
    '-c:v',
    'libvpx-vp9',
    '-b:v',
    '0',
    '-crf',
    '34',
    '-an',
    outWebm,
  ])

  await runFfmpeg([
    '-y',
    '-framerate',
    String(FPS),
    '-i',
    framePattern,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-an',
    outMp4,
  ])

  // Poster after the opening hold so it shows real content, not the empty start frame.
  await runFfmpeg(['-y', '-ss', '1.2', '-i', outMp4, '-frames:v', '1', '-q:v', '3', outPoster])
}

async function recordAll() {
  const datasetPath = path.join(OUT_DIR, 'dataset.json')
  if (!fs.existsSync(datasetPath)) {
    throw new Error('Missing public/premium-showcase/dataset.json — run npm run showcase:prepare first.')
  }

  fs.rmSync(TMP_DIR, { recursive: true, force: true })
  fs.mkdirSync(TMP_DIR, { recursive: true })
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const server = await startDevServer()
  const browser = await chromium.launch({ channel: 'chrome' })

  try {
    for (const bucket of BUCKETS) {
      for (const slide of SLIDES) {
        const label = `${slide.id}-${bucket.id}`
        console.log(`Recording ${label}…`)

        const frameDir = path.join(TMP_DIR, label)
        fs.mkdirSync(frameDir, { recursive: true })

        const context = await browser.newContext({
          viewport: { width: bucket.width, height: bucket.height },
          deviceScaleFactor: 2,
        })
        const page = await context.newPage()

        await page.goto(`${BASE}/?showcase-record=${slide.id}`, { waitUntil: 'networkidle' })
        await page.waitForSelector('[data-showcase-record-ready="true"]', { timeout: 90_000 })
        // Charts/layout settle after data arrives.
        await page.waitForTimeout(900)

        await page.evaluate(() => {
          window.__startShowcaseRecord?.()
        })

        // Pace captures to wall-clock so screenshot overhead does not leave
        // trailing freeze frames after the CSS scroll has already finished.
        const frameCount = Math.max(8, Math.round((slide.durationMs / 1000) * FPS))
        const frameIntervalMs = 1000 / FPS
        const timelineStart = Date.now()

        for (let index = 0; index < frameCount; index += 1) {
          const targetTime = timelineStart + index * frameIntervalMs
          const waitMs = targetTime - Date.now()
          if (waitMs > 1) await page.waitForTimeout(waitMs)

          const framePath = path.join(frameDir, `frame-${String(index).padStart(4, '0')}.jpg`)
          await page.screenshot({ path: framePath, type: 'jpeg', quality: 82 })
        }

        await context.close()

        const framePattern = path.join(frameDir, 'frame-%04d.jpg')
        const outWebm = path.join(OUT_DIR, `${label}.webm`)
        const outMp4 = path.join(OUT_DIR, `${label}.mp4`)
        const outPoster = path.join(OUT_DIR, `${label}.jpg`)

        await encodeFromFrames(framePattern, outWebm, outMp4, outPoster)
        console.log(`Wrote ${path.basename(outWebm)}, ${path.basename(outMp4)}, ${path.basename(outPoster)}`)
      }
    }
  } finally {
    await browser.close()
    await server.stop()
    fs.rmSync(TMP_DIR, { recursive: true, force: true })
  }
}

recordAll().catch((error) => {
  console.error(error)
  process.exit(1)
})
