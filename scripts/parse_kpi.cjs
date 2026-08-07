const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../src/assets/Files/BALIWAG CITY_PERFORMANCE INDICATORS.xlsx');
const OUTPUT_PATH = path.join(__dirname, '../src/assets/Files/baliwag_kpi_data.json');

function parseExcel() {
  console.log('Loading Excel file...');
  const wb = xlsx.readFile(FILE_PATH);
  const result = {};

  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    // Read raw data with headers as row arrays
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    let baliwagTotalRowIdx = -1;
    let headers1 = [];
    let headers2 = [];

    // Identify header rows
    let headerIdx = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (row && row[0] && (row[0].toString().includes('Division') || row[0].toString().includes('City') || row[0].toString().includes('Region'))) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx !== -1) {
      headers1 = rawData[headerIdx] || [];
      headers2 = rawData[headerIdx + 1] || [];
    }

    // Find the row for City of Baliwag
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (row && row[0] && row[0].toString().toLowerCase().includes('baliwag')) {
        baliwagTotalRowIdx = i;
        break;
      }
    }

    if (baliwagTotalRowIdx !== -1) {
      const totalRow = rawData[baliwagTotalRowIdx] || [];
      const maleRow = rawData[baliwagTotalRowIdx + 1] || [];
      const femaleRow = rawData[baliwagTotalRowIdx + 2] || [];

      result[sheetName] = {
        headersMain: headers1,
        headersSub: headers2,
        totalRow,
        maleRow,
        femaleRow
      };
    } else {
      console.log(`Warning: 'City of Baliwag' not found in sheet '${sheetName}'`);
    }
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Successfully parsed ${Object.keys(result).length} sheets.`);
  console.log(`Output saved to ${OUTPUT_PATH}`);
}

parseExcel();
