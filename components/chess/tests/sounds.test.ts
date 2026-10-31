// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Source = { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }

let sources: Source[]
let decoded: number
let allowed: boolean

class FakeContext {
  state = 'suspended'
  currentTime = 0
  destination = {}

  resume() {
    if (allowed) this.state = 'running'
    return Promise.resolve()
  }

  decodeAudioData() {
    decoded += 1
    return Promise.resolve({})
  }

  createBufferSource() {
    const source = { buffer: null, connect() {}, start: vi.fn(), stop: vi.fn(), onended: null }
    sources.push(source)
    return source
  }

  createGain() {
    return {
      gain: {
        value: 1,
        cancelScheduledValues() {},
        setValueAtTime() {},
        linearRampToValueAtTime() {},
      },
      connect() {},
    }
  }
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

async function load() {
  vi.resetModules()
  return import('../lib/sounds')
}

beforeEach(() => {
  sources = []
  decoded = 0
  allowed = false
  vi.stubGlobal('AudioContext', FakeContext)
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ arrayBuffer: async () => new ArrayBuffer(1) })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('sounds', () => {
  it('decodes each sound once, however often it plays', async () => {
    const { preloadSounds, playSound } = await load()
    allowed = true
    preloadSounds()
    window.dispatchEvent(new Event('pointerdown'))
    await settle()
    playSound('move')
    playSound('move')
    playSound('capture')
    await settle()

    expect(decoded).toBe(5)
  })

  it('plays a sound after the first gesture', async () => {
    const { preloadSounds, playSound } = await load()
    preloadSounds()
    allowed = true
    window.dispatchEvent(new Event('pointerdown'))
    await settle()
    playSound('move')
    await settle()

    expect(sources).toHaveLength(1)
    expect(sources[0].start).toHaveBeenCalledTimes(1)
  })

  it('replaces the sound that is playing, so that two never overlap', async () => {
    const { preloadSounds, playSound } = await load()
    preloadSounds()
    allowed = true
    window.dispatchEvent(new Event('pointerdown'))
    await settle()
    playSound('move')
    await settle()
    playSound('capture')
    await settle()

    expect(sources).toHaveLength(2)
    expect(sources[0].stop).toHaveBeenCalledTimes(1)
    expect(sources[1].start).toHaveBeenCalledTimes(1)
  })

  it('stays silent, and does not queue the sound, before a gesture allows audio', async () => {
    const { playSound } = await load()
    playSound('start')
    await settle()

    expect(sources).toHaveLength(0)
  })

  it('stays silent without the Web Audio API', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const { preloadSounds, playSound } = await load()

    expect(() => {
      preloadSounds()
      playSound('move')
    }).not.toThrow()
  })
})
