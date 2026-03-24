import { google } from "googleapis";
import { getGoogleAuth } from "./googleAuth.js";

let cachedSubscribedEmails: Set<string> | null = null;
let cachedAtMs = 0;

const CACHE_TTL_MS = parseInt(
  process.env.NEWSLETTER_CACHE_TTL_MS || "300000",
  10,
); // default 5 minutes

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function loadSubscribedEmails(): Promise<Set<string>> {
  const spreadsheetId = process.env.NEWSLETTER_RESPONSES_SPREADSHEET_ID;
  const sheetNameFromEnv = process.env.NEWSLETTER_RESPONSES_SHEET_NAME;

  if (!spreadsheetId) {
    throw new Error(
      "Missing env var NEWSLETTER_RESPONSES_SPREADSHEET_ID (Google Form response sheet id)",
    );
  }

  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  let sheetName = sheetNameFromEnv;
  if (!sheetName) {
    // If tab name isn't set, automatically use the first tab in the spreadsheet.
    const metaRes = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties.title",
    });
    const firstTitle = (metaRes.data.sheets || [])[0]?.properties?.title;
    if (!firstTitle) throw new Error("Could not determine response sheet tab name");
    sheetName = firstTitle;
  }

  // Read a reasonable column range; most form response sheets are within A:Z.
  const range = `${sheetName}!A:Z`;
  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const values = valuesRes.data.values || [];
  if (values.length === 0) return new Set();

  const headers = (values[0] || []).map((h) => String(h).trim());
  const emailHeaderEnv = (process.env.NEWSLETTER_EMAIL_COLUMN || "Email")
    .trim()
    .toLowerCase();

  let emailColIndex = headers.findIndex(
    (h) => h.toLowerCase() === emailHeaderEnv,
  );

  // Fallback: try any header that looks like email.
  if (emailColIndex === -1) {
    emailColIndex = headers.findIndex((h) => h.toLowerCase().includes("mail"));
  }

  if (emailColIndex === -1) {
    throw new Error(
      "Could not determine email column in the Google Form responses sheet. Set NEWSLETTER_EMAIL_COLUMN to the exact header name (case-insensitive).",
    );
  }

  const emails = new Set<string>();
  for (let i = 1; i < values.length; i++) {
    const row = values[i] || [];
    const raw = row[emailColIndex];
    if (!raw) continue;
    emails.add(normalizeEmail(String(raw)));
  }

  return emails;
}

export async function isEmailSubscribed(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const now = Date.now();
  if (cachedSubscribedEmails && now - cachedAtMs < CACHE_TTL_MS) {
    return cachedSubscribedEmails.has(normalized);
  }

  const emails = await loadSubscribedEmails();
  cachedSubscribedEmails = emails;
  cachedAtMs = now;
  return emails.has(normalized);
}

export async function subscribeEmailToNewsletter(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  // Avoid writing duplicates.
  const alreadySubscribed = await isEmailSubscribed(normalized);
  if (alreadySubscribed) return;

  const spreadsheetId = process.env.NEWSLETTER_RESPONSES_SPREADSHEET_ID;
  const sheetNameFromEnv = process.env.NEWSLETTER_RESPONSES_SHEET_NAME;
  if (!spreadsheetId) {
    throw new Error(
      "Missing env var NEWSLETTER_RESPONSES_SPREADSHEET_ID (Google Form response sheet id)",
    );
  }

  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  let sheetName = sheetNameFromEnv;
  if (!sheetName) {
    const metaRes = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties.title",
    });
    const firstTitle = (metaRes.data.sheets || [])[0]?.properties?.title;
    if (!firstTitle) throw new Error("Could not determine response sheet tab name");
    sheetName = firstTitle;
  }

  const range = `${sheetName}!A:Z`;
  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const values = valuesRes.data.values || [];
  let headers = (values[0] || []).map((h) => String(h).trim());

  // If the tab is empty, initialize it with a default Email header.
  if (values.length === 0 || headers.length === 0) {
    headers = [process.env.NEWSLETTER_EMAIL_COLUMN || "Email"];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }

  const emailHeaderEnv = (process.env.NEWSLETTER_EMAIL_COLUMN || "Email")
    .trim()
    .toLowerCase();

  let emailColIndex = headers.findIndex(
    (h) => h.toLowerCase() === emailHeaderEnv,
  );

  if (emailColIndex === -1) {
    emailColIndex = headers.findIndex((h) =>
      h.toLowerCase().includes("mail"),
    );
  }

  if (emailColIndex === -1) {
    throw new Error(
      "Could not determine email column in the Google Form responses sheet. Set NEWSLETTER_EMAIL_COLUMN to the exact header name (case-insensitive).",
    );
  }

  const row = new Array(headers.length).fill("");
  row[emailColIndex] = normalized;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  // Invalidate cache so journal preview updates instantly.
  cachedSubscribedEmails = null;
  cachedAtMs = 0;
}

