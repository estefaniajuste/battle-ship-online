/**
 * Game sound effects – realistic style (no metallic, no arcade).
 * Explosion: bomb-blast style impact + dark reverb (sine only).
 * Water: natural plop / shell-into-sea (sine only).
 * Run: node frontend/scripts/generateSounds.js
 * Output: frontend/public/sounds/*.wav
 *
 * To use real recordings: replace explosion.wav and water-splash.wav
 * with WAV or MP3 from Pixabay/Freesound (see public/sounds/README.md).
 */

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, "..", "public", "sounds");
const TWO_PI = 2 * Math.PI;

function writeWav(filePath, samplesFloat) {
  const numSamples = samplesFloat.length;
  const dataSize = numSamples * 2;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const buf = Buffer.alloc(headerSize + dataSize);
  let pos = 0;
  function writeU32(v) { buf.writeUInt32LE(v, pos); pos += 4; }
  function writeU16(v) { buf.writeUInt16LE(v, pos); pos += 2; }
  function writeStr(s) { buf.write(s, pos); pos += s.length; }
  writeStr("RIFF");
  writeU32(totalSize - 8);
  writeStr("WAVE");
  writeStr("fmt ");
  writeU32(16);
  writeU16(1);
  writeU16(1);
  writeU32(SAMPLE_RATE);
  writeU32(SAMPLE_RATE * 2);
  writeU16(2);
  writeU16(16);
  writeStr("data");
  writeU32(dataSize);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samplesFloat[i]));
    const int16 = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
    buf.writeInt16LE(int16, pos);
    pos += 2;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
  console.log("Wrote", path.basename(filePath), `(${numSamples} samples, ${(numSamples / SAMPLE_RATE).toFixed(2)}s)`);
}

function lowpass(samples, cutoffHz) {
  const alpha = 1 - Math.exp(-TWO_PI * cutoffHz / SAMPLE_RATE);
  const out = new Float32Array(samples.length);
  out[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    out[i] = out[i - 1] + alpha * (samples[i] - out[i - 1]);
  }
  return out;
}

function normalize(samples, target = 0.95) {
  let max = 0;
  for (let i = 0; i < samples.length; i++) max = Math.max(max, Math.abs(samples[i]));
  if (max > 0.001) {
    for (let i = 0; i < samples.length; i++) samples[i] *= target / max;
  }
  return samples;
}

// ========== HIT: realistic war explosion – deep bass, cinematic, 1–1.5 s ==========
function generateExplosion() {
  const impactLen = Math.floor(SAMPLE_RATE * 0.12);
  const duration = 1.38;
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);

  for (let i = 0; i < impactLen; i++) {
    const t = i / SAMPLE_RATE;
    const env = (1 - Math.exp(-t * 160)) * Math.exp(-t * 28);
    out[i] = 0.92 * Math.sin(TWO_PI * 38 * t) * env;
    out[i] += 0.58 * Math.sin(TWO_PI * 24 * t) * env;
    out[i] += 0.35 * Math.sin(TWO_PI * 48 * t) * env;
  }

  let mixed = lowpass(out, 88);

  const delays = [0.06, 0.13, 0.21, 0.31, 0.43, 0.56];
  const gains = [0.48, 0.24, 0.12, 0.06, 0.03, 0.015];
  const wet = new Float32Array(len);
  for (let d = 0; d < delays.length; d++) {
    const offset = Math.floor(SAMPLE_RATE * delays[d]);
    const g = gains[d];
    for (let i = 0; i < impactLen && i + offset < len; i++) {
      wet[i + offset] += mixed[i] * g;
    }
  }
  wet.set(lowpass(wet, 62));
  for (let i = 0; i < len; i++) mixed[i] = mixed[i] + wet[i];

  normalize(mixed, 0.95);
  writeWav(path.join(OUT_DIR, "explosion.wav"), mixed);
}

// ========== MISS: natural water – shell-into-sea plop, soft and clean ==========
function generateWaterSplash() {
  const duration = 0.88;
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);

  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const env = (1 - Math.exp(-t * 280)) * Math.exp(-t * 5.5);
    out[i] = 0.78 * Math.sin(TWO_PI * 88 * t) * env;
    out[i] += 0.22 * Math.sin(TWO_PI * 176 * t) * env;
  }

  normalize(out, 0.7);
  writeWav(path.join(OUT_DIR, "water-splash.wav"), out);
}

// ========== SHIP SUNK: longer bomb-style explosion ==========
function generateShipSunk() {
  const impactLen = Math.floor(SAMPLE_RATE * 0.14);
  const duration = 1.9;
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(len);

  for (let i = 0; i < impactLen; i++) {
    const t = i / SAMPLE_RATE;
    const env = (1 - Math.exp(-t * 140)) * Math.exp(-t * 22);
    out[i] = 0.9 * Math.sin(TWO_PI * 35 * t) * env;
    out[i] += 0.52 * Math.sin(TWO_PI * 22 * t) * env;
  }

  let mixed = lowpass(out, 82);
  const delays = [0.08, 0.18, 0.30, 0.46, 0.64];
  const gains = [0.44, 0.21, 0.10, 0.05, 0.025];
  const wet = new Float32Array(len);
  for (let d = 0; d < delays.length; d++) {
    const offset = Math.floor(SAMPLE_RATE * delays[d]);
    for (let i = 0; i < impactLen && i + offset < len; i++) {
      wet[i + offset] += mixed[i] * gains[d];
    }
  }
  wet.set(lowpass(wet, 58));
  for (let i = 0; i < len; i++) mixed[i] = mixed[i] + wet[i];

  normalize(mixed, 0.95);
  writeWav(path.join(OUT_DIR, "ship-sunk.wav"), mixed);
}

generateExplosion();
generateWaterSplash();
generateShipSunk();
console.log("Done. Hit = bomb-style explosion. Miss = natural water plop. Replace with real WAV/MP3 for best results – see public/sounds/README.md");
