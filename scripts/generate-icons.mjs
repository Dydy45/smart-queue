/**
 * Script de génération des icônes PWA à partir du SVG source.
 * Utilise sharp pour convertir le SVG en PNG de différentes tailles.
 * 
 * Usage: node scripts/generate-icons.mjs
 * Prérequis: npm install sharp (dev dependency)
 */

import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ICONS_DIR = join(ROOT, 'public', 'icons')
const SVG_PATH = join(ICONS_DIR, 'icon.svg')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

async function generateIcons() {
  mkdirSync(ICONS_DIR, { recursive: true })

  const svgBuffer = readFileSync(SVG_PATH)

  console.log('🎨 Génération des icônes PWA...\n')

  for (const size of SIZES) {
    const filename = `icon-${size}x${size}.png`
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(ICONS_DIR, filename))
    console.log(`  ✅ ${filename}`)
  }

  // Maskable icons (avec padding de 10% pour la safe zone)
  for (const size of [192, 512]) {
    const filename = `icon-maskable-${size}x${size}.png`
    const padding = Math.round(size * 0.1)
    const innerSize = size - padding * 2

    await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 87, g: 13, b: 248, alpha: 1 },
      })
      .png()
      .toFile(join(ICONS_DIR, filename))
    console.log(`  ✅ ${filename} (maskable)`)
  }

  // Apple touch icon (180x180)
  const appleTouchFilename = 'apple-touch-icon.png'
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(ROOT, 'public', appleTouchFilename))
  console.log(`  ✅ ${appleTouchFilename}`)

  // Favicon (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(ROOT, 'public', 'favicon.png'))
  console.log(`  ✅ favicon.png`)

  console.log('\n🎉 Toutes les icônes ont été générées !')
}

generateIcons().catch(console.error)
