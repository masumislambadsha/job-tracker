import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;

  const credentialsB64 = process.env.GOOGLE_SHEETS_CREDENTIALS_JSON;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!credentialsB64) {
    throw new Error("GOOGLE_SHEETS_CREDENTIALS_JSON not set");
  }
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID not set");
  }

  const credentials = JSON.parse(Buffer.from(credentialsB64, "base64").toString("utf-8"));

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:S";

// Must match the user's sheet header row, in exact order (columns A through S).
// User order: Date, Company, Position, Job Link, Job Nature, Job Type,
// Company Location, Job Status, Comments, Source / Portal, How Applied,
// Resume Version, Resume URL, Salary Min, Salary Max, Currency, Priority,
// Follow-up Date, Tags.
const HEADER_ROW = [
  "Date", // A
  "Company", // B
  "Position", // C
  "Job Link", // D
  "Job Nature", // E
  "Job Type", // F
  "Company Location", // G
  "Job Status", // H
  "Comments", // I
  "Source / Portal", // J
  "How Applied", // K
  "Resume Version", // L
  "Resume URL", // M
  "Salary Min", // N
  "Salary Max", // O
  "Currency", // P
  "Priority", // Q
  "Follow-up Date", // R
  "Tags", // S
];

async function ensureHeaderRow(sheets: sheets_v4.Sheets) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "A1:S1",
    });

    if (!res.data.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "A1:S1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [HEADER_ROW] },
      });
      console.log("[Sheets] Header row initialized");
    }
  } catch (err) {
    console.error("[Sheets] Header check failed:", (err as Error).message);
  }
}

function mapApplicationToRow(app: any): (string | number | null)[] {
  const tags = app.tags?.map((t: any) => t.tag?.name).filter(Boolean).join(", ") || "";
  const portalName = app.portal?.name ?? "";
  const resumeLabel = app.resumeVersion?.label ?? "";
  const resumeUrl = app.resumeVersion?.url ?? "";
  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return "";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  };

  // IMPORTANT: Order MUST match the sheet header row exactly (columns A:S).
  // User order: Date, Company, Position, Job Link, Job Nature, Job Type,
  // Company Location, Job Status, Comments, Source / Portal, How Applied,
  // Resume Version, Resume URL, Salary Min, Salary Max, Currency, Priority,
  // Follow-up Date, Tags. Do NOT rely on Object.values() or object key order.
  return [
    formatDate(app.dateApplied), // A: Date
    app.company || "", // B: Company
    app.position || "", // C: Position
    app.jobLink || "", // D: Job Link
    app.jobNature || "", // E: Job Nature
    app.jobType || "", // F: Job Type
    app.companyLocation || "", // G: Company Location
    app.status || "", // H: Job Status
    app.comments || "", // I: Comments
    portalName, // J: Source / Portal
    app.howApplied || "", // K: How Applied
    resumeLabel, // L: Resume Version
    resumeUrl, // M: Resume URL
    app.salaryMin ?? "", // N: Salary Min
    app.salaryMax ?? "", // O: Salary Max
    app.currency || "USD", // P: Currency
    app.priority ?? "", // Q: Priority
    formatDate(app.followUpDate), // R: Follow-up Date
    tags, // S: Tags
  ];
}

export async function appendApplication(app: any): Promise<void> {
  try {
    const sheets = getSheetsClient();
    await ensureHeaderRow(sheets);

    const row = mapApplicationToRow(app);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    console.log(`[Sheets] Synced application: ${app.company} - ${app.position}`);
  } catch (err) {
    console.error("[Sheets] Append failed:", (err as Error).message);
    throw err;
  }
}