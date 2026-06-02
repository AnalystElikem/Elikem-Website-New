import { makeERPNextRequest } from "./erpnextAuth.js";

/**
 * Website form → ERPNext **Feedback** DocType.
 *
 * Default field API names (override with env if Customize Form differs):
 * - Name / Organization → `name__organization` (Frappe often uses `__` when the label contains `/`)
 * - Email → `email`
 * - Phone Number → `phone_number`
 * - Feedback Type → `feedback_type` (Select; must match ERPNext options)
 * - Feedback (body) → `feedback` (override with `ERPNEXT_FEEDBACK_BODY_FIELD` if different)
 *
 * Contact rule: **at least one of email or phone** must be provided. If email is
 * present it must be a valid address.
 *
 * **Permissions:** inserts use `?ignore_permissions=1` by default so custom fields
 * (e.g. `name__organization`, long text) are not dropped for the integration user.
 * Set `ERPNEXT_FEEDBACK_RESPECT_PERMISSIONS=1` to enforce normal permissions instead.
 */
const DOCTYPE = (
  process.env.ERPNEXT_FEEDBACK_DOCTYPE ||
  process.env.ERPNEXT_ENQUIRY_DOCTYPE ||
  "Feedback"
).trim();
const FIELD_EMAIL = (process.env.ERPNEXT_FEEDBACK_EMAIL_FIELD || "email").trim();
const FIELD_PHONE = (process.env.ERPNEXT_FEEDBACK_PHONE_FIELD || "phone_number").trim();
const FIELD_FEEDBACK_TYPE = (
  process.env.ERPNEXT_FEEDBACK_TYPE_FIELD || "feedback_type"
).trim();
const FIELD_NAME_ORG = (
  process.env.ERPNEXT_FEEDBACK_NAME_ORG_FIELD || "name__organization"
).trim();
const FIELD_FEEDBACK = (
  process.env.ERPNEXT_FEEDBACK_BODY_FIELD || "feedback"
).trim();
const NAMING_SERIES =
  process.env.ERPNEXT_FEEDBACK_NAMING_SERIES?.trim() ||
  process.env.ERPNEXT_ENQUIRY_NAMING_SERIES?.trim();

export type EnquiryPayload = {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function extractCreatedName(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const o = result as Record<string, unknown>;
  if (o.data != null && typeof o.data === "object") {
    const n = (o.data as Record<string, unknown>).name;
    if (typeof n === "string" && n.trim()) return n.trim();
  }
  if (typeof o.name === "string" && o.name.trim()) return o.name.trim();
  return "";
}

const TOPIC_LABELS: Record<string, string> = {
  general: "General",
  pastor: "Pastoral / spiritual",
  "data-analyst": "Data & analytics",
  writer: "Writing / editorial",
};

function labelForTopic(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitWebsiteEnquiry(
  input: EnquiryPayload
): Promise<{ docName: string }> {
  const nameOrg = input.name.trim();
  const emailRaw = input.email.trim();
  const email = emailRaw ? normalizeEmail(emailRaw) : "";
  const phone = input.phone.trim();
  const topic = input.topic.trim() || "general";
  const feedbackBody = input.message.trim();

  if (!nameOrg) throw new Error("missing_name");

  const hasEmail = email.length > 0;
  const hasPhone = phone.length > 0;
  if (!hasEmail && !hasPhone) {
    throw new Error("missing_contact");
  }
  if (hasEmail && !EMAIL_RE.test(email)) {
    throw new Error("invalid_email");
  }

  if (!feedbackBody) throw new Error("missing_feedback");
  if (feedbackBody.length > 12000) throw new Error("feedback_too_long");

  const body: Record<string, unknown> = {
    docstatus: 0,
    [FIELD_NAME_ORG]: nameOrg,
    [FIELD_FEEDBACK_TYPE]: labelForTopic(topic),
    [FIELD_FEEDBACK]: feedbackBody,
  };

  if (hasEmail) {
    body[FIELD_EMAIL] = email;
  }
  if (hasPhone) {
    body[FIELD_PHONE] = phone;
  }

  if (NAMING_SERIES) {
    body.naming_series = NAMING_SERIES;
  }

  const respectPerms =
    process.env.ERPNEXT_FEEDBACK_RESPECT_PERMISSIONS === "1";
  const path = `/${encodeURIComponent(DOCTYPE)}${
    respectPerms ? "" : "?ignore_permissions=1"
  }`;

  console.log("[enquiryStore] Feedback POST", {
    path,
    keys: Object.keys(body),
    nameOrgLen: String(body[FIELD_NAME_ORG] ?? "").length,
    feedbackLen: String(body[FIELD_FEEDBACK] ?? "").length,
    hasEmail: hasEmail,
    hasPhone: hasPhone,
  });

  const result = await makeERPNextRequest(path, {
    method: "POST",
    body,
  });
  const docName = extractCreatedName(result);
  if (!docName) {
    console.error(
      "[enquiryStore] Feedback create returned no name; raw (truncated):",
      JSON.stringify(result).slice(0, 800)
    );
    throw new Error("erpnext_create_no_name");
  }

  return { docName };
}
