import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useExport } from './useExport'
import type { PriceData } from '../types'

const mockPrices: PriceData[] = [
  { assetPair: 'BTC/USD', price: 50000, timestamp: 0, confidence: 0.99, sources: ['chainlink'] },
  { assetPair: 'ETH/USD', price: 3000, timestamp: 0, confidence: 0.95, sources: ['redstone', 'band'] },
]

describe('useExport', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.fn>
  let originalCreateElement: typeof document.createElement

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:test')
    revokeObjectURLSpy = vi.fn()
    clickSpy = vi.fn()
    URL.createObjectURL = createObjectURLSpy
    URL.revokeObjectURL = revokeObjectURLSpy

    originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement
      }
      return originalCreateElement(tag)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportCSV', () => {
    it('returns an exportCSV function', () => {
      const { result } = renderHook(() => useExport())
      expect(typeof result.current.exportCSV).toBe('function')
    })

    it('triggers a file download when exportCSV is called', () => {
      const { result } = renderHook(() => useExport())
      result.current.exportCSV(mockPrices)
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test')
    })

    it('exports correct CSV content with price data fields', () => {
      let capturedContent = ''
      vi.spyOn(global, 'Blob').mockImplementation((parts) => {
        capturedContent = (parts as string[])[0]
        return { type: 'text/csv' } as Blob
      })

      const { result } = renderHook(() => useExport())
      result.current.exportCSV(mockPrices)

      expect(capturedContent).toContain('assetPair')
      expect(capturedContent).toContain('BTC/USD')
      expect(capturedContent).toContain('ETH/USD')
    })

    it('exports empty CSV with only headers when given no items', () => {
      let capturedContent = ''
      vi.spyOn(global, 'Blob').mockImplementation((parts) => {
        capturedContent = (parts as string[])[0]
        return { type: 'text/csv' } as Blob
      })

      const { result } = renderHook(() => useExport())
      result.current.exportCSV([])

      expect(capturedContent).toContain('assetPair')
      const lines = capturedContent.split('\n')
      expect(lines).toHaveLength(1)
    })

    it('returns a stable exportCSV reference across renders', () => {
      const { result, rerender } = renderHook(() => useExport())
      const first = result.current.exportCSV
      rerender()
      expect(result.current.exportCSV).toBe(first)
    })
  })

  describe('exportJSON', () => {
    it('triggers a file download when exportJSON is called', () => {
      const { result } = renderHook(() => useExport())
      result.current.exportJSON(mockPrices)
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
    })

    it('exports valid JSON with all price data fields', () => {
      let capturedContent = ''
      vi.spyOn(global, 'Blob').mockImplementation((parts) => {
        capturedContent = (parts as string[])[0]
        return { type: 'application/json' } as Blob
      })

      const { result } = renderHook(() => useExport())
      result.current.exportJSON(mockPrices)

      const parsed = JSON.parse(capturedContent)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].assetPair).toBe('BTC/USD')
      expect(parsed[0].price).toBe(50000)
      expect(parsed[1].assetPair).toBe('ETH/USD')
    })

    it('exports empty array when given no items', () => {
      let capturedContent = ''
      vi.spyOn(global, 'Blob').mockImplementation((parts) => {
        capturedContent = (parts as string[])[0]
        return { type: 'application/json' } as Blob
      })

      const { result } = renderHook(() => useExport())
      result.current.exportJSON([])

      const parsed = JSON.parse(capturedContent)
      expect(parsed).toEqual([])
    })

    it('formats JSON with indentation', () => {
      let capturedContent = ''
      vi.spyOn(global, 'Blob').mockImplementation((parts) => {
        capturedContent = (parts as string[])[0]
        return { type: 'application/json' } as Blob
      })

      const { result } = renderHook(() => useExport())
      result.current.exportJSON(mockPrices)

      expect(capturedContent).toContain('\n  ')
    })

    it('returns a stable exportJSON reference across renders', () => {
      const { result, rerender } = renderHook(() => useExport())
      const first = result.current.exportJSON
      rerender()
      expect(result.current.exportJSON).toBe(first)
    })
  })

  describe('exportData', () => {
    it('exports CSV when format is csv', () => {
      let capturedType = ''
      vi.spyOn(global, 'Blob').mockImplementation((_parts, opts) => {
        capturedType = (opts as { type: string }).type
        return { type: capturedType } as Blob
      })

      const { result } = renderHook(() => useExport())
      result.current.exportData('csv', mockPrices)

      expect(capturedType).toBe('text/csv')
    })

    it('exports JSON when format is json', () => {
      let capturedType = ''
      vi.spyOn(global, 'Blob').mockImplementation((_parts, opts) => {
        capturedType = (opts as { type: string }).type
        return { type: capturedType } as Blob
      })

      const { result } = renderHook(() => useExport())
      result.current.exportData('json', mockPrices)

      expect(capturedType).toBe('application/json')
    })

    it('returns a stable exportData reference across renders', () => {
      const { result, rerender } = renderHook(() => useExport())
      const first = result.current.exportData
      rerender()
      expect(result.current.exportData).toBe(first)
    })
  })
})
