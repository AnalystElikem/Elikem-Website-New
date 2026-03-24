import { google } from "googleapis";

let cachedAuth: any | undefined = undefined;

export function getGoogleAuth() {
  if (cachedAuth) return cachedAuth;

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) {
    throw new Error(
      "Missing Google service account env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
    );
  }

  if (!privateKeyRaw.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is invalid. Use the full 'private_key' value from the service account JSON (including BEGIN/END PRIVATE KEY).",
    );
  }

  // Support both literal newlines and escaped `\n`.
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  cachedAuth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  return cachedAuth;
}

