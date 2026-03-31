import { google } from "googleapis";

const SHEET_HEADERS = [
  "Submitted At", "Invoice No.", "Invoice Date", "Vendor",
  "Item Name", "Manufacturer", "Qty", "Unit",
  "Rate (₹)", "GST %", "Tax Cost (₹)", "Total (₹)",
  "Scratched Out", "Modified", "Modification Note",
];

async function getSheets() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function ensureHeaders(sheets) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Bills!A1:O1",
  });
  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Bills!A1",
      valueInputOption: "RAW",
      requestBody: { values: [SHEET_HEADERS] },
    });
  }
}

export async function appendToSheet(submission) {
  if (process.env.ENABLE_SHEETS !== "true") return;
  try {
    const sheets = await getSheets();
    await ensureHeaders(sheets);
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const submittedAt = new Date(submission.submitted_at).toLocaleString("en-IN");

    const rows = (submission.items || []).map((item) => [
      submittedAt,
      submission.invoice_no || "",
      submission.invoice_date || "",
      submission.vendor || "",
      item.item_name || "",
      item.manufacturer || "",
      item.qty ?? "",
      item.unit || "",
      item.rate ?? "",
      item.tax_pct != null ? `${Math.round(item.tax_pct * 100)}%` : "",
      item.tax_cost ?? "",
      item.total ?? "",
      item.scratched_out ? "Yes" : "No",
      item.modified ? "Yes" : "No",
      item.modification_note || "",
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Bills!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  } catch (err) {
    // Non-fatal — log but don't fail the submission
    console.error("Google Sheets append error:", err.message);
  }
}
