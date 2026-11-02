// Prints QR codes for the scanner as an A4 SVG in millimetres (print at 100%, "actual size", no fit to page).
//
//   Size test: how small can a code be?
//     node scripts/qr-sheet.mjs --ids 01,22 --out sheet.svg
//     Every id at 25, 20, 16, 13 and 10 mm, at error correction H and L (`--sizes` and `--levels` change that).
//
//   The codes of the cards:
//     node scripts/qr-sheet.mjs --ids 01,02,03,04,05,06,07,08,09 --size 15 --out cards.svg
//     Every id once at that size, at error correction H (`--levels` changes that).
//
//   Other options: `--margin <modules>` quiet zone around each code (default 2, the spec asks for 4 but phones read
//   2), `--ink <color>` and `--paper <color>` for dark-brown-on-parchment style tests (default black on white).
//
// A size is the side of the code itself, finder pattern edge to edge.
// The quiet zone comes on top. Every code must be QR version 1 (21x21 modules): short digit ids are, longer ones are not.
import { writeFileSync } from 'node:fs'
import QRCode from 'qrcode'

const PAGE = { width: 210, height: 297, margin: 10 }
const GAP = 4
const LABEL_HEIGHT = 7

function parseArgs(argv) {
  const options = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`)
    const value = argv[i + 1]
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${arg}`)
    options[arg.slice(2)] = value
    i++
  }
  return options
}

function numbers(text) {
  return text.split(',').map((part) => {
    const n = Number(part)
    if (!Number.isFinite(n) || n <= 0) throw new Error(`Not a size in mm: ${part}`)
    return n
  })
}

const options = parseArgs(process.argv.slice(2))
const ids = (options.ids ?? '01,22').split(',').map((id) => id.trim())
const ink = options.ink ?? '#000000'
const paper = options.paper ?? '#ffffff'
const margin = Number(options.margin ?? 2)
const out = options.out ?? 'qr-sheet.svg'
const isTest = options.size === undefined
const sizes = isTest ? numbers(options.sizes ?? '25,20,16,13,10') : numbers(options.size)
const levels = (options.levels ?? (isTest ? 'H,L' : 'H')).split(',')

/** The dark modules of a code as one SVG path, in module units, runs of a row joined. */
function pathOf(qr) {
  const n = qr.modules.size
  let d = ''
  for (let row = 0; row < n; row++) {
    let col = 0
    while (col < n) {
      if (!qr.modules.get(row, col)) {
        col++
        continue
      }
      const start = col
      while (col < n && qr.modules.get(row, col)) col++
      d += `M${start} ${row}h${col - start}v1h-${col - start}z`
    }
  }
  return d
}

const cells = []
for (const size of sizes) {
  for (const id of ids) {
    for (const level of levels) {
      const qr = QRCode.create(id, { errorCorrectionLevel: level })
      if (qr.version !== 1) {
        throw new Error(`"${id}" at level ${level} is QR version ${qr.version}, not 1: use a shorter id`)
      }
      cells.push({ id, level, size, qr })
    }
  }
}

// Flow the cells left to right, row by row. In the size test each size starts a new row.
const moduleCount = 21
const body = []
let x = PAGE.margin
let y = PAGE.margin
let rowHeight = 0
let lastSize = null
for (const { id, level, size, qr } of cells) {
  const moduleMm = size / moduleCount
  const side = size + 2 * margin * moduleMm
  const width = Math.max(side, 24)
  if (x > PAGE.margin && (x + width > PAGE.width - PAGE.margin || (isTest && size !== lastSize))) {
    x = PAGE.margin
    y += rowHeight + GAP
    rowHeight = 0
  }
  lastSize = size
  const label = `${id}  ${size} mm  ${level}  (${moduleMm.toFixed(2)} mm/module)`
  body.push(
    `<g transform="translate(${x} ${y})">` +
      `<rect width="${side}" height="${side}" fill="${paper}"/>` +
      `<path transform="translate(${margin * moduleMm} ${margin * moduleMm}) scale(${moduleMm})" fill="${ink}" d="${pathOf(qr)}"/>` +
      `<text x="0" y="${side + 3.2}" font-family="monospace" font-size="2.4" fill="#000">${label}</text>` +
      `</g>`
  )
  console.log(label)
  rowHeight = Math.max(rowHeight, side + LABEL_HEIGHT)
  x += width + GAP
}
const bottom = y + rowHeight
if (bottom > PAGE.height - PAGE.margin) {
  throw new Error(
    `The codes need ${Math.ceil(bottom)} mm of an ${PAGE.height} mm page: use fewer ids, sizes or levels`
  )
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.width}mm" height="${PAGE.height}mm" ` +
  `viewBox="0 0 ${PAGE.width} ${PAGE.height}" shape-rendering="crispEdges">` +
  `<rect width="${PAGE.width}" height="${PAGE.height}" fill="#fff"/>` +
  body.join('') +
  `</svg>\n`
writeFileSync(out, svg)
console.log(`\n${cells.length} codes written to ${out}: print at 100% (actual size).`)
