/**
 * Game sounds – realistic explosion (hit) and natural water (miss).
 * Uses WAV files from public/sounds/. Preloaded for instant playback.
 * To use real recordings: replace those files with WAV or MP3 (same names;
 * if using MP3, change extension in SOUND_URLS below).
 */

const SOUND_URLS = {
  explosion: "/sounds/hit.mp3",
  waterSplash: "/sounds/miss.mp3",
  shipSunk: "/sounds/sunk.mp3"
} as const;

// Volume: explosion louder and more intense; water softer and pleasant
const GAIN_EXPLOSION = 0.8;
const GAIN_WATER = 0.46;
const GAIN_SUNK = 0.84;

let audioContext: AudioContext | null = null;
let buffers: Record<keyof typeof SOUND_URLS, AudioBuffer | null> = {
  explosion: null,
  waterSplash: null,
  shipSunk: null
};
let preloadPromise: Promise<void> | null = null;
let lastMissTime = 0;
let lastHitTime = 0;
let lastSunkTime = 0;
const MIN_INTERVAL_MS = 80;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

/** Load and decode a single WAV file. */
async function loadSound(ctx: AudioContext, key: keyof typeof SOUND_URLS): Promise<AudioBuffer> {
  const url = SOUND_URLS[key];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

/** Preload all sounds so playback has no delay. Call once on app init. */
export function preloadGameSounds(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  if (preloadPromise) return;
  preloadPromise = (async () => {
    try {
      const [explosion, waterSplash, shipSunk] = await Promise.all([
        loadSound(ctx, "explosion"),
        loadSound(ctx, "waterSplash"),
        loadSound(ctx, "shipSunk")
      ]);
      buffers.explosion = explosion;
      buffers.waterSplash = waterSplash;
      buffers.shipSunk = shipSunk;
    } catch (e) {
      console.warn("Game sounds failed to preload:", e);
    }
  })();
}

/** Play a decoded buffer with gain; no delay if preloaded. */
function playBuffer(buffer: AudioBuffer | null, gain: number): void {
  const ctx = getContext();
  if (!ctx || !buffer) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gainNode = ctx.createGain();
  gainNode.gain.value = gain;
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(0);
}

function playOnceLoaded(key: keyof typeof SOUND_URLS, gain: number): void {
  preloadPromise?.then(() => {
    const buffer = buffers[key];
    if (buffer) playBuffer(buffer, gain);
  });
}

/** Real water splash (miss) – natural "plooosh", clear and pleasant. */
export function playMiss(): void {
  const now = Date.now();
  if (now - lastMissTime < MIN_INTERVAL_MS) return;
  lastMissTime = now;
  if (buffers.waterSplash) {
    playBuffer(buffers.waterSplash, GAIN_WATER);
  } else {
    playOnceLoaded("waterSplash", GAIN_WATER);
  }
}

/** Cinematic explosion (hit) – strong, dramatic, with reverb. */
export function playHit(): void {
  const now = Date.now();
  if (now - lastHitTime < MIN_INTERVAL_MS) return;
  lastHitTime = now;
  if (buffers.explosion) {
    playBuffer(buffers.explosion, GAIN_EXPLOSION);
  } else {
    playOnceLoaded("explosion", GAIN_EXPLOSION);
  }
}

/** Ship sunk – longer explosion + heavy rumble. */
export function playSunk(): void {
  const now = Date.now();
  if (now - lastSunkTime < MIN_INTERVAL_MS) return;
  lastSunkTime = now;
  if (buffers.shipSunk) {
    playBuffer(buffers.shipSunk, GAIN_SUNK);
  } else {
    playOnceLoaded("shipSunk", GAIN_SUNK);
  }
}
