# Schedule Page API Setup Guide

This guide explains how to connect your Google Sheet to the schedule page for automatic updates.

## Current Setup (CSV Export)

The page currently uses Google Sheets CSV export, which works if your sheet is publicly accessible. This method:
- ✅ Simple, no setup required
- ✅ Works immediately
- ❌ Requires sheet to be public
- ❌ Limited error handling

## Option 1: Google Sheets API (Recommended)

The most robust solution for automatic updates.

### Setup Steps:

1. **Enable Google Sheets API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Google Sheets API"
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy your API key

2. **Restrict API Key (Optional but Recommended)**
   - Click on your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API"
   - Under "Application restrictions", you can restrict by HTTP referrer (your domain)

3. **Update schedule.html**
   ```javascript
   const USE_CSV_EXPORT = false;
   const USE_SHEETS_API = true;
   const API_KEY = 'YOUR_API_KEY_HERE';
   ```

4. **Make Sheet Accessible**
   - Share your Google Sheet with the service account email (if using service account)
   - OR make it publicly viewable (if using API key)

### Advantages:
- ✅ Works with private sheets (with proper sharing)
- ✅ Better error handling
- ✅ More reliable
- ✅ Can handle larger datasets

---

## Option 2: Google Apps Script Web App (Free & Easy)

Create a free API endpoint using Google Apps Script.

### Setup Steps:

1. **Create Apps Script**
   - Open your Google Sheet
   - Go to Extensions → Apps Script
   - Delete the default code and paste this:

   ```javascript
   function doGet() {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     const data = sheet.getDataRange().getValues();
     
     // Convert to JSON
     const headers = data[0];
     const rows = data.slice(1);
     const jsonData = rows.map(row => {
       const obj = {};
       headers.forEach((header, index) => {
         obj[header] = row[index] || '';
       });
       return obj;
     });
     
     return ContentService.createTextOutput(JSON.stringify(jsonData))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

2. **Deploy as Web App**
   - Click "Deploy" → "New deployment"
   - Choose type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - Copy the Web App URL

3. **Update schedule.html**
   ```javascript
   const USE_CSV_EXPORT = false;
   const USE_APPS_SCRIPT = true;
   const APPS_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';
   ```

### Advantages:
- ✅ Completely free
- ✅ No API keys needed
- ✅ Can add custom logic/filtering
- ✅ Works with private sheets

---

## Option 3: Serverless Function (Vercel/Netlify)

Create a serverless function that acts as a proxy.

### Setup Steps:

1. **Create API Function** (example for Vercel)

   Create `api/schedule.js`:
   ```javascript
   export default async function handler(req, res) {
     const SHEET_ID = '1wERSs7wIpd1yDban4eZ6MONwZuYwPFLH8oh5JJaos2g';
     const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
     
     try {
       const response = await fetch(CSV_URL);
       const csv = await response.text();
       res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
       res.status(200).send(csv);
     } catch (error) {
       res.status(500).json({ error: 'Failed to fetch data' });
     }
   }
   ```

2. **Deploy to Vercel/Netlify**
   - Push to GitHub
   - Connect to Vercel/Netlify
   - Deploy

3. **Update schedule.html**
   ```javascript
   const USE_CSV_EXPORT = false;
   const USE_CUSTOM_API = true;
   const CUSTOM_API_URL = 'https://your-site.vercel.app/api/schedule';
   ```

### Advantages:
- ✅ Can add caching
- ✅ Can add authentication
- ✅ Can transform data
- ✅ Better error handling

---

## Option 4: Keep CSV Export + Auto-Refresh

The simplest option - just enable auto-refresh on the current setup.

### Setup:

1. **Make Sheet Public**
   - Right-click on sheet → Share
   - Change to "Anyone with the link can view"

2. **Auto-refresh is Already Enabled**
   - The page automatically refreshes every 5 minutes
   - Users can also click the "Refresh" button manually
   - Page refreshes when user returns to the tab

### Advantages:
- ✅ No additional setup
- ✅ Works immediately
- ✅ Automatic updates

---

## Auto-Refresh Configuration

The page includes automatic refresh functionality:

```javascript
const AUTO_REFRESH_ENABLED = true;  // Enable/disable auto-refresh
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes (in milliseconds)
```

You can adjust the interval:
- `1 * 60 * 1000` = 1 minute
- `5 * 60 * 1000` = 5 minutes (default)
- `15 * 60 * 1000` = 15 minutes
- `60 * 60 * 1000` = 1 hour

---

## Testing Your Setup

1. Open the schedule page
2. Open browser DevTools (F12)
3. Check Console for any errors
4. Check Network tab to see API calls
5. Make a change to your Google Sheet
6. Wait for auto-refresh or click "Refresh" button
7. Verify changes appear on the page

---

## Troubleshooting

### "Failed to fetch" Error
- Check if sheet is publicly accessible (for CSV method)
- Verify API key is correct (for Sheets API)
- Check CORS settings if using custom API

### Data Not Updating
- Check browser console for errors
- Verify sheet sharing settings
- Try manual refresh button
- Check if auto-refresh is enabled

### CORS Errors
- Use Google Sheets API or Apps Script (no CORS issues)
- Or use serverless function as proxy

---

## Recommended Setup

For production use, I recommend:
1. **Google Apps Script** (easiest, free, works with private sheets)
2. **Google Sheets API** (most robust, requires API key)
3. **Serverless Function** (if you need custom logic/caching)

For quick setup, use **Option 4** (CSV + Auto-refresh) which is already configured!







