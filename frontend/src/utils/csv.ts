/**
 * Quotes one CSV field and neutralises it against both CSV-structure and
 * spreadsheet-formula injection.
 *
 * Every export below interpolates user-controlled text - names, emails,
 * actions logged from open self-registration - with no login required to
 * set them. Unescaped, a value containing a `"` breaks out of its quoted
 * field and lets that user forge extra columns or rows into an admin's
 * export; a value starting with `=`, `+`, `-` or `@` is a live formula the
 * moment the admin opens the file in Excel/Sheets/LibreOffice (CWE-1236).
 * Doubling embedded quotes is standard CSV escaping; prefixing a leading
 * trigger character with a straight quote is OWASP's mitigation and keeps
 * the visible value intact. Mirrors csvCell() in backend/src/routes/admin.ts.
 */
export function csvCell(value: unknown): string {
  let str = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }
  return `"${str.replace(/"/g, '""')}"`
}

/** Builds a full CSV document from a header row and data rows. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(csvCell).join(','), ...rows.map(row => row.map(csvCell).join(','))].join('\n')
}

/** Triggers a browser download of a CSV string. */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
