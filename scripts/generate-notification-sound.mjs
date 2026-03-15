/**
 * Génère un fichier WAV de notification simple.
 * Usage: node scripts/generate-notification-sound.mjs
 * 
 * Crée un son de "ding" de 0.5 seconde à 880Hz (La5).
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const sampleRate = 44100
const duration = 0.5
const frequency = 880
const numSamples = Math.floor(sampleRate * duration)

// Générer les samples (sine wave avec fade out)
const samples = new Int16Array(numSamples)
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate
  const fadeOut = 1 - (i / numSamples)
  const amplitude = 0.5 * fadeOut * fadeOut
  samples[i] = Math.floor(amplitude * 32767 * Math.sin(2 * Math.PI * frequency * t))
}

// Construire le fichier WAV
const dataSize = numSamples * 2
const buffer = Buffer.alloc(44 + dataSize)

// RIFF header
buffer.write('RIFF', 0)
buffer.writeUInt32LE(36 + dataSize, 4)
buffer.write('WAVE', 8)

// fmt chunk
buffer.write('fmt ', 12)
buffer.writeUInt32LE(16, 16)       // chunk size
buffer.writeUInt16LE(1, 20)        // PCM format
buffer.writeUInt16LE(1, 22)        // mono
buffer.writeUInt32LE(sampleRate, 24)
buffer.writeUInt32LE(sampleRate * 2, 28) // byte rate
buffer.writeUInt16LE(2, 32)        // block align
buffer.writeUInt16LE(16, 34)       // bits per sample

// data chunk
buffer.write('data', 36)
buffer.writeUInt32LE(dataSize, 40)

for (let i = 0; i < numSamples; i++) {
  buffer.writeInt16LE(samples[i], 44 + i * 2)
}

const outputPath = join(__dirname, '..', 'public', 'sounds', 'notification.wav')
writeFileSync(outputPath, buffer)
console.log(`✅ Son de notification généré: ${outputPath}`)
