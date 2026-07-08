// Rasterise the app's "add notes" icon (FileCirclePlusIcon) into light and
// dark PNG variants and embed them into capture-notes.html. Email clients
// can't be trusted to render inline SVG (Gmail strips it), so we ship the icon
// as an image just like the logo.
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const PATH_D =
  'M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384v38.6C310.1 219.5 256 287.4 256 368c0 59.1 29.1 111.3 73.7 143.3c-3.2.5-6.4.7-9.7.7H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128zm48 384c-79.5 0-144-64.5-144-144s64.5-144 144-144 144 64.5 144 144s-64.5 144-144 144zm16-208c0-8.8-7.2-16-16-16s-16 7.2-16 16v48H368c-8.8 0-16 7.2-16 16s7.2 16 16 16h48v48c0 8.8 7.2 16 16 16s16-7.2 16-16V384h48c8.8 0 16-7.2 16-16s-7.2-16-16-16H448V304z'

const RENDER_H = 160 // rendered at high res, displayed at 16px in the email

async function renderIcon(page, color) {
  const w = Math.round((RENDER_H * 576) / 512)
  await page.setContent(
    `<!doctype html><html><body style="margin:0"><svg id="i" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="${w}" height="${RENDER_H}" fill="${color}"><path d="${PATH_D}"/></svg></body></html>`,
  )
  const el = await page.$('#i')
  const buf = await el.screenshot({ omitBackground: true })
  return 'data:image/png;base64,' + buf.toString('base64')
}

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ deviceScaleFactor: 2 })
const light = await renderIcon(page, '#35015b')
const dark = await renderIcon(page, '#ecdcff')
await browser.close()

const p = new URL('capture-notes.html', import.meta.url)
let html = readFileSync(p, 'utf8')
html = html.replace('__ICON_LIGHT__', light).replace('__ICON_DARK__', dark)
writeFileSync(p, html)
console.log('injected add-notes icons')
