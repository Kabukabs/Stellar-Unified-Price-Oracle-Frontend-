import { useCallback } from 'react'
import type { PriceData } from '../types'
import {
  toCsv,
  priceDataToCsvRows,
  priceDataToXlsx,
  downloadFile,
  downloadBinaryFile,
  exportFilename,
} from '../utils/export'

export type ExportFormat = 'csv' | 'json' | 'xlsx'

export function useExport() {
  const exportCSV = useCallback((items: PriceData[]) => {
    const { rows, headers } = priceDataToCsvRows(items)
    const csv = toCsv(rows, headers)
    downloadFile(csv, exportFilename('oracle-prices', 'csv'), 'text/csv')
  }, [])

  const exportJSON = useCallback((items: PriceData[]) => {
    const json = JSON.stringify(items, null, 2)
    downloadFile(json, exportFilename('oracle-prices', 'json'), 'application/json')
  }, [])

  const exportXLSX = useCallback((items: PriceData[]) => {
    const xlsx = priceDataToXlsx(items)
    downloadBinaryFile(
      xlsx,
      exportFilename('oracle-prices', 'xlsx'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
  }, [])

  const exportData = useCallback(
    (format: ExportFormat, items: PriceData[]) => {
      if (format === 'json') {
        exportJSON(items)
      } else if (format === 'xlsx') {
        exportXLSX(items)
      } else {
        exportCSV(items)
      }
    },
    [exportCSV, exportJSON, exportXLSX],
  )

  return { exportCSV, exportJSON, exportXLSX, exportData }
}
