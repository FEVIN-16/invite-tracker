import * as XLSX from 'xlsx';

/**
 * Reads a file and returns the data as JSON.
 */
export async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Header: 1 returns array of arrays
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

/**
 * Map raw row data to our system's dynamic fields based on mapping config.
 */
export function mapExcelData(rows, mapping, columns) {
  const [header, ...dataRows] = rows;
  
  return dataRows.map(row => {
    const dynamicFields = {};
    let name = '';

    Object.entries(mapping).forEach(([colId, excelColIndex]) => {
      if (excelColIndex === -1) return;
      const value = row[excelColIndex];
      
      if (colId === 'name') {
        name = String(value || '').trim();
      } else {
        dynamicFields[colId] = String(value || '').trim();
      }
    });

    return { name, dynamicFields };
  }).filter(p => p.name); // Ignore rows with no name
}

/**
 * Exports data to an Excel file.
 */
export function exportToExcel(people, columns, fileName) {
  // 1. Prepare data rows
  const headers = ['Name', ...columns.map(c => c.label)];
  
  // Filter out people who are excluded from export
  const exportablePeople = people.filter(p => !p.excludeFromExport);

  const data = exportablePeople.map(p => [
    p.name,
    ...columns.map(c => (p.dynamicFields ? p.dynamicFields[c.id] : '') || '')
  ]);

  // 2. Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // 3. Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Guest List');

  // 4. Trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
