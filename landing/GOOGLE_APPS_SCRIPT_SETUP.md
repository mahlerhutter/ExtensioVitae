# Google Apps Script Setup for Beta Signups

This guide explains how to set up a Google Apps Script Web App to collect beta signup data into a Google Sheet.

---

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: `ExtensioVitae Beta Signups`
4. In Row 1, add these headers:
   - A1: `Timestamp`
   - B1: `Email`
   - C1: `Name`
   - D1: `Source`

---

## Step 2: Create the Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Paste the following code:

```javascript
/**
 * ExtensioVitae Beta Signup Handler
 * Receives POST requests and writes to Google Sheets
 */

// Configuration
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

/**
 * Handles POST requests from the landing page
 */
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);

    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error('Sheet not found: ' + SHEET_NAME);
    }

    // Validate email
    if (!data.email || !data.email.includes('@')) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Invalid email address'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Check for duplicate email
    const emails = sheet.getRange('B:B').getValues().flat();
    if (emails.includes(data.email)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Email already registered'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Prepare row data
    const rowData = [
      data.timestamp || new Date().toISOString(),
      data.email,
      data.name || '',
      data.source || 'landing_page'
    ];

    // Append the row
    sheet.appendRow(rowData);

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Signup recorded successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log the error
    console.error('Error processing signup:', error);

    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (optional - for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'ExtensioVitae Signup API is running'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - run this to verify setup
 */
function testSignup() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        timestamp: new Date().toISOString(),
        source: 'test'
      })
    }
  };

  const result = doPost(testData);
  console.log(result.getContent());
}
```

---

## Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: `Beta Signup Handler v1`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` (this allows anonymous form submissions)
4. Click **Deploy**
5. **Important**: Click **Authorize access** and grant the necessary permissions
6. Copy the **Web app URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## Step 4: Update the Landing Page

1. Open `index.html`
2. Find this line near the top of the `<script>` section:
   ```javascript
   const SHEETS_WEBHOOK_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
   ```
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` with your actual Web App URL:
   ```javascript
   const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```

---

## Step 5: Test the Integration

1. Open the landing page in a browser
2. Scroll to the beta signup section
3. Enter a test email and click "Request beta access"
4. Check your Google Sheet - a new row should appear

---

## Troubleshooting

### "Something went wrong" error
- Verify the Web App URL is correct
- Check that the deployment has "Anyone" access
- Look at the Apps Script execution logs: **View → Logs**

### Data not appearing in sheet
- Verify the `SHEET_NAME` constant matches your sheet tab name
- Check that the sheet has the correct headers in Row 1

### CORS errors in console
- This is expected with `mode: 'no-cors'` - the form still works
- The landing page assumes success after sending the request

### Updating the script
- After making changes, you must **Deploy → New deployment** again
- Use the new URL, or choose "Manage deployments" to update existing

---

## Security Notes

- The Web App URL is public but only accepts specific JSON payloads
- Email validation happens on both client and server side
- Duplicate emails are detected and ignored
- No sensitive data is exposed in the sheet

---

## Optional: Email Notifications

Add this function to receive email notifications for new signups:

```javascript
/**
 * Sends email notification for new signup
 */
function sendNotification(email, name) {
  const recipient = 'your-email@example.com'; // Change this
  const subject = 'New ExtensioVitae Beta Signup';
  const body = `
New beta signup received:

Email: ${email}
Name: ${name || 'Not provided'}
Time: ${new Date().toLocaleString()}

View all signups: [Your Google Sheet URL]
  `;

  MailApp.sendEmail(recipient, subject, body);
}
```

Then add this line in `doPost()` after `sheet.appendRow(rowData);`:
```javascript
sendNotification(data.email, data.name);
```

---

## Data Structure

Each signup creates a row with:

| Column | Field | Example |
|--------|-------|---------|
| A | Timestamp | 2026-02-01T10:30:00.000Z |
| B | Email | user@example.com |
| C | Name | John Doe |
| D | Source | landing_page |

---

That's it! Your beta signup form is now connected to Google Sheets.
