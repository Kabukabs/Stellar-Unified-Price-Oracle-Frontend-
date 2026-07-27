import { useCallback } from 'react'
import type { PriceData } from '../types'
import { toCsv, priceDataToCsvRows, downloadFile, exportFilename } from '../utils/export'

export type ExportFormat = 'csv' | 'json'

interface UseExportReturn {
  exportCSV: (items: PriceData[]) => void
}

export function useExport(): UseExportReturn {
  const exportCSV = useCallback((items: PriceData[]) => {
    const { rows, headers } = priceDataToCsvRows(items)
    const csv = toCsv(rows, headers)
    downloadFile(csv, exportFilename('oracle-prices', 'csv'), 'text/csv')
  }, [])

  const exportJSON = useCallback((items: PriceData[]) => {
    const json = JSON.stringify(items, null, 2)
    downloadFile(json, exportFilename('oracle-prices', 'json'), 'application/json')
  }, [])

  const exportData = useCallback(
    (format: ExportFormat, items: PriceData[]) => {
      if (format === 'json') {
        exportJSON(items)
      } else {
        exportCSV(items)
      }
    },
    [exportCSV, exportJSON],
  )

  return { exportCSV, exportJSON, exportData }
}
