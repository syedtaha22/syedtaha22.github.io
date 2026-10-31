export type SoundKind = 'start' | 'move' | 'capture' | 'check' | 'end'

const FILES: Record<SoundKind, URL> = {
  start: new URL('../assets/audio/GameStart.wav', import.meta.url),
  move: new URL('../assets/audio/ChessPiecePlaced.wav', import.meta.url),
  capture: new URL('../assets/audio/ChessPieceCaptured.wav', import.meta.url),
  check: new URL('../assets/audio/KingChecked.wav', import.meta.url),
  end: new URL('../assets/audio/GameEnd.wav', import.meta.url),
}

/** Seconds in which a sound that a newer one replaces fades out, so that the cut does not click. */
const FADE_SECONDS = 0.02

/** The events whose handlers a browser accepts as the gesture that allows audio to play. */
const GESTURES = ['pointerdown', 'touchend', 'click', 'keydown'] as const

let context: AudioContext | null = null
const buffers = new Map<SoundKind, Promise<AudioBuffer | null>>()
let current: { source: AudioBufferSourceNode; gain: GainNode } | null = null

/**
 * The one audio context of the page, created on first use. Null without the Web Audio API (server
 * rendering, tests).
 */
function audioContext(): AudioContext | null {
  if (context) return context
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null
  try {
    context = new window.AudioContext()
  } catch {
    return null
  }
  return context
}

/**
 * The decoded sound, fetched and decoded once and then kept, so that a move does not wait for the
 * file. A failed load is forgotten, so the next call tries again.
 */
function load(kind: SoundKind, audio: AudioContext): Promise<AudioBuffer | null> {
  let buffer = buffers.get(kind)
  if (!buffer) {
    buffer = fetch(FILES[kind].href)
      .then((response) => response.arrayBuffer())
      .then((data) => audio.decodeAudioData(data))
      .catch(() => {
        buffers.delete(kind)
        return null
      })
    buffers.set(kind, buffer)
  }
  return buffer
}

/**
 * Starts a sound and fades out the one that is still playing, so that two sounds never overlap.
 */
function start(audio: AudioContext, buffer: AudioBuffer): void {
  const now = audio.currentTime
  if (current) {
    const { source, gain } = current
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0, now + FADE_SECONDS)
    source.stop(now + FADE_SECONDS)
  }
  const source = audio.createBufferSource()
  const gain = audio.createGain()
  source.buffer = buffer
  source.connect(gain)
  gain.connect(audio.destination)
  source.onended = () => {
    if (current?.source === source) current = null
  }
  source.start(now)
  current = { source, gain }
}

/**
 * Decodes the sounds ahead of the first move and allows the page to play audio at its first
 * gesture, which a browser requires before it plays anything.
 */
export function preloadSounds(): void {
  const audio = audioContext()
  if (!audio) return
  for (const kind of Object.keys(FILES) as SoundKind[]) void load(kind, audio)
  const unlock = () => {
    for (const gesture of GESTURES) window.removeEventListener(gesture, unlock)
    void audio.resume().catch(() => {})
  }
  for (const gesture of GESTURES) window.addEventListener(gesture, unlock)
}

/**
 * Plays a short effect, and replaces the one that is playing. Silent without the Web Audio API,
 * and before the page has had a gesture, so a missing sound does not stop a move.
 *
 * @param kind The effect to play.
 */
export function playSound(kind: SoundKind): void {
  const audio = audioContext()
  if (!audio) return
  if (audio.state === 'suspended') void audio.resume().catch(() => {})
  void load(kind, audio).then((buffer) => {
    // A suspended context would hold the sound and play it late, once it is allowed to run.
    if (buffer && audio.state === 'running') start(audio, buffer)
  })
}
