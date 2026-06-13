import * as XLSX from 'xlsx';

export type CmsExcelSheet = Record<string, unknown>[];
export type CmsExcelWorkbook = Record<string, CmsExcelSheet>;

function safeSheetName(name: string) {
  return name.replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31) || 'Sheet';
}

function columnWidths(rows: CmsExcelSheet) {
  const keys = Object.keys(rows[0] ?? {});
  return keys.map((key) => {
    const maxValueLength = rows.reduce((max, row) => Math.max(max, String(row[key] ?? '').length), key.length);
    return { wch: Math.min(Math.max(maxValueLength + 2, 12), 42) };
  });
}

export function exportCmsExcel(fileName: string, sheets: CmsExcelWorkbook) {
  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    const normalizedRows = rows.length ? rows : [{}];
    const worksheet = XLSX.utils.json_to_sheet(normalizedRows);
    worksheet['!cols'] = columnWidths(normalizedRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(name));
  });
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

export async function importCmsExcel(file: File): Promise<CmsExcelWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  return workbook.SheetNames.reduce<CmsExcelWorkbook>((result, sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return result;
    result[sheetName] = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    return result;
  }, {});
}

export function textCell(row: Record<string, unknown>, key: string, fallback = '') {
  const value = row[key];
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

export function numberCell(row: Record<string, unknown>, key: string, fallback = 0) {
  const value = row[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function booleanCell(row: Record<string, unknown>, key: string, fallback = false) {
  const value = row[key];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const text = String(value ?? '').trim().toLowerCase();
  if (['true', 'yes', 'y', '1', 'active'].includes(text)) return true;
  if (['false', 'no', 'n', '0', 'inactive'].includes(text)) return false;
  return fallback;
}

export function sheetRows(workbook: CmsExcelWorkbook, sheetName: string) {
  return workbook[sheetName] ?? [];
}
