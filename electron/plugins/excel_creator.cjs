// Pure Node Excel generator (exceljs) — no Python dependency.
'use strict';
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function createExcel(payload = {}) {
  const { file_path, sheet_name, headers = [], data = [], formatting = {} } = payload;
  if (!file_path) return { success: false, message: 'file_path is required' };

  const { header_color = '4472C4', alternating_rows = true, auto_width = true } = formatting || {};

  try {
    fs.mkdirSync(path.dirname(file_path), { recursive: true });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheet_name || 'Sheet1');

    sheet.addRow(headers);
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${String(header_color).replace('#', '')}` } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    data.forEach((row, i) => {
      const excelRow = sheet.addRow(row);
      if (alternating_rows && i % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        });
      }
    });

    if (auto_width) {
      sheet.columns.forEach((col, i) => {
        const headerLen = String(headers[i] ?? '').length;
        const maxDataLen = data.reduce((m, row) => Math.max(m, String(row[i] ?? '').length), 0);
        col.width = Math.min(Math.max(headerLen, maxDataLen, 8) + 4, 60);
      });
    }

    await workbook.xlsx.writeFile(file_path);
    return { success: true, message: `Excel file created with ${data.length} rows`, file_path };
  } catch (err) {
    return { success: false, message: err.message || 'Failed to create Excel file' };
  }
}

module.exports = { createExcel };

if (require.main === module) {
  const payload = JSON.parse(process.argv[2] || '{}');
  createExcel(payload).then((r) => {
    console.log(JSON.stringify(r));
    process.exitCode = r.success ? 0 : 1;
  });
}
