import type { Response } from "express";
import { google } from "googleapis";
import mammoth from "mammoth";
import { getGoogleAuth } from "./googleAuth.js";

export type DriveFileInfo = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  preview?: string;
};

function getDriveFolderId(): string {
  const folderId = process.env.DRIVE_DOWNLOADS_FOLDER_ID;
  if (!folderId) {
    throw new Error(
      "Missing env var DRIVE_DOWNLOADS_FOLDER_ID (Google Drive folder id containing downloadable files)",
    );
  }
  return folderId;
}

async function getDriveClient() {
  const auth = getGoogleAuth();
  return google.drive({ version: "v3", auth });
}

export async function listDriveFiles(): Promise<DriveFileInfo[]> {
  const folderId = getDriveFolderId();
  const drive = await getDriveClient();

  const files: DriveFileInfo[] = [];

  let pageToken: string | undefined = undefined;
  do {
    // googleapis types can be complex; we only need the `data` payload here.
    const listRes: any = await (drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, size, modifiedTime)",
      pageSize: 1000,
      pageToken,
      orderBy: "modifiedTime desc",
    }) as any);

    const items = ((listRes.data as any).files || []) as any[];
    for (const f of items) {
      files.push({
        id: String(f.id),
        name: String(f.name),
        mimeType: String(f.mimeType || "application/octet-stream"),
        size: f.size ? String(f.size) : undefined,
        modifiedTime: f.modifiedTime ? String(f.modifiedTime) : undefined,
      });
    }

    pageToken = (listRes.data as any).nextPageToken || undefined;
  } while (pageToken);

  // Fetch short content previews for the first few files.
  const previewCount = Math.min(files.length, 8);
  for (let i = 0; i < previewCount; i++) {
    const file = files[i];
    file.preview = await getDriveFilePreview(file.id, file.mimeType).catch(
      () => undefined,
    );
  }

  return files;
}

export async function listDrivePreviews(limit = 9): Promise<DriveFileInfo[]> {
  const all = await listDriveFiles();
  return all.slice(0, Math.max(0, limit));
}

export async function streamDriveFileDownload(
  fileId: string,
  res: Response,
) {
  const folderId = getDriveFolderId();
  const drive = await getDriveClient();

  // Verify the file is inside the allowed folder.
  const metaRes = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, parents",
  });

  const meta = metaRes.data as any;
  const parents = (meta.parents || []) as string[];
  if (!parents.includes(folderId)) {
    res.status(404).json({ reason: "file_not_in_allowed_folder" });
    return;
  }

  const name = String(meta.name || "download");
  const mimeType = String(meta.mimeType || "application/octet-stream");

  res.setHeader("Content-Type", mimeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${name.replace(/"/g, "")}"`,
  );

  // Stream the raw bytes to the client.
  const downloadRes = await drive.files.get(
    { fileId, alt: "media" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { responseType: "stream" as any },
  );

  const stream = (downloadRes.data as any) as NodeJS.ReadableStream;
  stream.on("error", () => {
    // If streaming fails mid-way, status code might already be sent.
    if (!res.headersSent) res.status(500).json({ reason: "download_failed" });
  });

  stream.pipe(res);
}

async function getDriveFilePreview(
  fileId: string,
  mimeType: string,
): Promise<string | undefined> {
  const drive = await getDriveClient();

  let rawText = "";

  if (mimeType === "application/vnd.google-apps.document") {
    const exportRes: any = await (drive.files.export(
      {
        fileId,
        mimeType: "text/plain",
      },
      { responseType: "text" as any },
    ) as any);
    rawText = String(exportRes?.data || "");
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const fileRes: any = await (drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" as any },
    ) as any);
    const stream = fileRes?.data as NodeJS.ReadableStream;
    const buffer = await streamToBuffer(stream);
    const docxText = await mammoth.extractRawText({ buffer });
    rawText = String(docxText?.value || "");
  } else if (isTextLikeMime(mimeType)) {
    const textRes: any = await (drive.files.get(
      { fileId, alt: "media" },
      { responseType: "text" as any },
    ) as any);
    rawText = String(textRes?.data || "");
  } else {
    return undefined;
  }

  return firstSentences(rawText, 4);
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

function isTextLikeMime(mimeType: string): boolean {
  return (
    mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("markdown") ||
    mimeType.includes("csv")
  );
}

function firstSentences(text: string, maxSentences = 4): string | undefined {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/\u0000/g, "")
    .trim();
  if (!cleaned) return undefined;

  const parts = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const sentenceCount = Math.min(parts.length, maxSentences);
  if (sentenceCount === 0) return cleaned.slice(0, 180);

  const preview = parts.slice(0, sentenceCount).join(" ").trim();
  if (preview.length <= 520) return preview;
  return preview.slice(0, 520).trimEnd() + "...";
}

