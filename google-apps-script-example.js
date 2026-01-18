/**
 * Google Apps Script for Bitcoin Park Schedule API
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete default code and paste this
 * 4. Click "Deploy" → "New deployment"
 * 5. Choose "Web app"
 * 6. Execute as: "Me"
 * 7. Who has access: "Anyone"
 * 8. Click "Deploy" and copy the URL
 * 9. Use that URL in schedule.html (APPS_SCRIPT_URL)
 */

function doGet() {
  try {
    // Get the active sheet (or specify sheet name: getSheetByName('Sheet1'))
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get headers from row 1 - preserve original names
    const headers = data[0].map((h, index) => {
      const header = String(h).trim();
      // If header is empty, use column letter as fallback
      if (!header || header === '') {
        const letter = String.fromCharCode(65 + index); // A, B, C, etc.
        return `column_${letter}`;
      }
      return header;
    });
    
    const rows = data.slice(1);
    
    const jsonData = rows
      .filter(row => row.some(cell => cell !== '')) // Filter empty rows
      .map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          const value = row[index] !== undefined && row[index] !== null ? String(row[index]).trim() : '';
          // Store with original header name
          obj[header] = value;
          // Also store with lowercase key for easier lookup
          obj[header.toLowerCase()] = value;
          // Also store by column letter (A, B, C, etc.) for direct access
          const letter = String.fromCharCode(65 + index);
          obj[`col_${letter}`] = value;
        });
        return obj;
      });
    
    // Return as JSON
    return ContentService.createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error as JSON
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      message: 'Failed to fetch schedule data'
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Optional: Also support POST requests
 */
function doPost(e) {
  return doGet();
}

/**
 * Optional: Test function to verify it works
 * Run this in the Apps Script editor to test
 */
function test() {
  const result = doGet();
  Logger.log(result.getContent());
}







