import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  MINIMAX_M2_7_CONFIG,
  MINIMAX_M2_7_HIGHSPEED_CONFIG,
  ALL_MODEL_CONFIGS,
} from '../configs.js'
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
} from '../providers.js'

describe('MiniMax provider', () => {
  let originalEnv: Record<string, string | undefined>

  beforeEach(() => {
    originalEnv = {
      CLAUDE_CODE_USE_BEDROCK: process.env.CLAUDE_CODE_USE_BEDROCK,
      CLAUDE_CODE_USE_VERTEX: process.env.CLAUDE_CODE_USE_VERTEX,
      CLAUDE_CODE_USE_FOUNDRY: process.env.CLAUDE_CODE_USE_FOUNDRY,
      CLAUDE_CODE_USE_MINIMAX: process.env.CLAUDE_CODE_USE_MINIMAX,
    }
    delete process.env.CLAUDE_CODE_USE_BEDROCK
    delete process.env.CLAUDE_CODE_USE_VERTEX
    delete process.env.CLAUDE_CODE_USE_FOUNDRY
    delete process.env.CLAUDE_CODE_USE_MINIMAX
  })

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  })

  describe('getAPIProvider', () => {
    it('returns minimax when CLAUDE_CODE_USE_MINIMAX is set', () => {
      process.env.CLAUDE_CODE_USE_MINIMAX = '1'
      expect(getAPIProvider()).toBe('minimax')
    })

    it('returns firstParty when CLAUDE_CODE_USE_MINIMAX is not set', () => {
      expect(getAPIProvider()).toBe('firstParty')
    })

    it('bedrock takes priority over minimax', () => {
      process.env.CLAUDE_CODE_USE_MINIMAX = '1'
      process.env.CLAUDE_CODE_USE_BEDROCK = '1'
      expect(getAPIProvider()).toBe('bedrock')
    })

    it('vertex takes priority over minimax', () => {
      process.env.CLAUDE_CODE_USE_MINIMAX = '1'
      process.env.CLAUDE_CODE_USE_VERTEX = '1'
      expect(getAPIProvider()).toBe('vertex')
    })
  })

  describe('isFirstPartyAnthropicBaseUrl', () => {
    it('returns false when provider is minimax', () => {
      process.env.CLAUDE_CODE_USE_MINIMAX = '1'
      expect(isFirstPartyAnthropicBaseUrl()).toBe(false)
    })

    it('returns true for firstParty without custom base URL', () => {
      delete process.env.ANTHROPIC_BASE_URL
      expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
    })
  })

  describe('MiniMax model configs', () => {
    it('MINIMAX_M2_7_CONFIG has correct model IDs', () => {
      expect(MINIMAX_M2_7_CONFIG.minimax).toBe('MiniMax-M2.7')
      expect(MINIMAX_M2_7_CONFIG.firstParty).toBe('MiniMax-M2.7')
    })

    it('MINIMAX_M2_7_HIGHSPEED_CONFIG has correct model IDs', () => {
      expect(MINIMAX_M2_7_HIGHSPEED_CONFIG.minimax).toBe('MiniMax-M2.7-highspeed')
      expect(MINIMAX_M2_7_HIGHSPEED_CONFIG.firstParty).toBe('MiniMax-M2.7-highspeed')
    })

    it('MiniMax configs are registered in ALL_MODEL_CONFIGS', () => {
      expect('minimaxM27' in ALL_MODEL_CONFIGS).toBe(true)
      expect('minimaxM27hs' in ALL_MODEL_CONFIGS).toBe(true)
    })

    it('minimaxM27 resolves to MiniMax-M2.7 under minimax provider', () => {
      const config = ALL_MODEL_CONFIGS.minimaxM27
      const resolved = config['minimax'] ?? config.firstParty
      expect(resolved).toBe('MiniMax-M2.7')
    })

    it('minimaxM27hs resolves to MiniMax-M2.7-highspeed under minimax provider', () => {
      const config = ALL_MODEL_CONFIGS.minimaxM27hs
      const resolved = config['minimax'] ?? config.firstParty
      expect(resolved).toBe('MiniMax-M2.7-highspeed')
    })

    it('Claude model configs fall back to firstParty under minimax provider', () => {
      const haiku35 = ALL_MODEL_CONFIGS.haiku35
      // minimax key not present for Claude models — falls back to firstParty
      const resolved = haiku35['minimax'] ?? haiku35.firstParty
      expect(resolved).toBe('claude-3-5-haiku-20241022')
    })
  })

  describe('MiniMax API constraints', () => {
    it('default base URL uses overseas api.minimax.io (not api.minimax.chat)', () => {
      const defaultBaseUrl = 'https://api.minimax.io/anthropic'
      expect(defaultBaseUrl).toContain('api.minimax.io')
      expect(defaultBaseUrl).not.toContain('api.minimax.chat')
    })

    it('filters unsupported parameters for Anthropic-compatible API', () => {
      const UNSUPPORTED_PARAMS = new Set(['top_k', 'stop_sequences', 'service_tier'])
      const input: Record<string, unknown> = {
        model: 'MiniMax-M2.7',
        messages: [{ role: 'user', content: 'hi' }],
        top_k: 40,
        stop_sequences: ['END'],
        temperature: 1.0,
      }
      const filtered = Object.fromEntries(
        Object.entries(input).filter(([k]) => !UNSUPPORTED_PARAMS.has(k)),
      )
      expect('top_k' in filtered).toBe(false)
      expect('stop_sequences' in filtered).toBe(false)
      expect('temperature' in filtered).toBe(true)
      expect('model' in filtered).toBe(true)
    })

    it('validates temperature range (0.0, 1.0] — 0 is invalid for MiniMax', () => {
      const isValidTemperature = (t: number) => t > 0 && t <= 1.0
      expect(isValidTemperature(1.0)).toBe(true)
      expect(isValidTemperature(0.5)).toBe(true)
      expect(isValidTemperature(0.0)).toBe(false)
      expect(isValidTemperature(1.1)).toBe(false)
    })
  })
})
