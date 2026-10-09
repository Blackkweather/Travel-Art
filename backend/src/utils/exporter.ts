import ExcelJS from 'exceljs';

/**
 * One definition of a dataset, two ways to hand it over.
 *
 * The export used to be CSV strings assembled inline per type, which meant the
 * formula-injection guard had to be remembered at every call site and a new
 * format meant writing the whole thing again. A dataset is now columns and
 * rows; serialising it is somebody else's problem.
 */

export type Column = {
  header: string;
  /** Key into the row object. */
  key: string;
  width?: number;
};

export type Dataset = {
  /** Used for the filename and the worksheet tab. */
  name: string;
  columns: Column[];
  rows: Record<string, unknown>[];
};

export type ExportFormat = 'csv' | 'xlsx';

/**
 * Neutralise anything a spreadsheet would execute.
 *
 * A cell beginning =, +, -, @, tab or carriage return is a formula to Excel,
 * LibreOffice and Sheets alike, and an export of user-supplied names is
 * exactly how a hostile value reaches an administrator's machine. Prefixing an
 * apostrophe forces it to be read as text; the apostrophe itself is not
 * displayed.
 *
 * This matters more in XLSX than in CSV, not less: the file opens natively, so
 * nobody is even shown an import dialog to be suspicious of.
 */
export function neutralise(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
}

/** RFC 4180: quote everything, double the quotes inside. */
function csvCell(value: unknown): string {
  return `"${neutralise(value).replace(/"/g, '""')}"`;
}

export function toCsv(dataset: Dataset): string {
  const header = dataset.columns.map((c) => csvCell(c.header)).join(',');
  const body = dataset.rows.map((row) =>
    dataset.columns.map((c) => csvCell(row[c.key])).join(',')
  );
  /* A BOM, so Excel on Windows opens a UTF-8 file as UTF-8. Without it the
     accented names in this data - à, é, ô - arrive as mojibake, which is how
     most French CSV exports end up looking broken. */
  return '﻿' + [header, ...body].join('\r\n');
}

export async function toXlsx(dataset: Dataset): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Travel Art';
  workbook.created = new Date();

  // Worksheet names cannot exceed 31 characters or contain : \ / ? * [ ]
  const sheet = workbook.addWorksheet(dataset.name.replace(/[:\\/?*[\]]/g, '').slice(0, 31));

  sheet.columns = dataset.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? Math.max(12, Math.min(40, c.header.length + 6)),
  }));

  for (const row of dataset.rows) {
    const cells: Record<string, string> = {};
    for (const column of dataset.columns) {
      cells[column.key] = neutralise(row[column.key]);
    }
    sheet.addRow(cells);
  }

  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: 'middle' };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: dataset.columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Writes the dataset to the response in the requested format. */
export async function sendExport(
  res: {
    setHeader: (name: string, value: string) => void;
    send: (body: string | Buffer) => void;
  },
  dataset: Dataset,
  format: ExportFormat
): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `travel-art-${dataset.name}-${stamp}`;

  if (format === 'xlsx') {
    const buffer = await toXlsx(dataset);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${base}.xlsx"`);
    res.send(buffer);
    return;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${base}.csv"`);
  res.send(toCsv(dataset));
}
