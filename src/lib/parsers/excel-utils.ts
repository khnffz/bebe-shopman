import * as XLSX from 'xlsx'

export function parseNumeric(value: any): number {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value
  
  let str = String(value).trim()
  
  // Handle parentheses for negative numbers (e.g. "(1,000)")
  if (str.startsWith('(') && str.endsWith(')')) {
    str = '-' + str.substring(1, str.length - 1)
  }

  const lastComma = str.lastIndexOf(',')
  const lastPeriod = str.lastIndexOf('.')

  if (lastPeriod > lastComma && lastComma !== -1) {
    // English format: 1,000,000.00
    str = str.replace(/,/g, '')
  } else if (lastComma > lastPeriod && lastPeriod !== -1) {
    // Indonesian format: 1.000.000,00
    str = str.replace(/\./g, '').replace(',', '.')
  } else {
    // Only one type of separator or neither
    if (lastPeriod !== -1) {
      if (str.split('.').length > 2) {
        // Multiple periods (e.g. 1.000.000)
        str = str.replace(/\./g, '')
      } else {
        // One period. Check if it's followed by exactly 3 digits (likely thousand separator)
        if (str.length - lastPeriod - 1 === 3) {
          str = str.replace(/\./g, '')
        }
        // Otherwise, it's a decimal (e.g. 100.50), let parseFloat handle it
      }
    } else if (lastComma !== -1) {
      if (str.split(',').length > 2) {
        // Multiple commas (e.g. 1,000,000)
        str = str.replace(/,/g, '')
      } else {
        // One comma. Check if it's followed by exactly 3 digits
        if (str.length - lastComma - 1 === 3) {
          str = str.replace(/,/g, '')
        } else {
          // Likely decimal (e.g. 100,50)
          str = str.replace(',', '.')
        }
      }
    }
  }

  // Remove any remaining whitespace (e.g., if formatted with spaces)
  str = str.replace(/\s/g, '')

  const parsed = parseFloat(str)
  return isNaN(parsed) ? 0 : parsed
}

export function parseDateString(dateStr: any): string | null {
  if (!dateStr) return null
  
  const str = String(dateStr).trim()
  
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10)
  }
  
  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}/.test(str)) {
    return str.substring(0, 10).replace(/\//g, '-')
  }
  
  // Handle Excel date serial numbers if needed, though usually read as strings if formatted
  if (typeof dateStr === 'number') {
    // Excel dates are days since 1900-01-01
    const date = new Date((dateStr - (25567 + 2)) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }

  return null
}
