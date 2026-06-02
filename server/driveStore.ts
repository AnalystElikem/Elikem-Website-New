import type { Response } from "express";
import { listERPNextDocuments, makeERPNextRequest } from "./erpnextAuth.js";

export type DriveFileInfo = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  preview?: string;
};

/**
 * List all books from ERPNext Book doctype
 */
export async function listDriveFiles(): Promise<DriveFileInfo[]> {
  try {
    const result = await listERPNextDocuments(
      "Book",
      {},
      ["name", "title", "description", "file_url", "modified"]
    );

    const files: DriveFileInfo[] = [];
    if (result.data && Array.isArray(result.data)) {
      for (const doc of result.data) {
        const data = doc as any;
        files.push({
          id: data.name || "",
          name: data.title || data.name || "Untitled",
          mimeType: "application/pdf", // Default to PDF for books
          size: undefined,
          modifiedTime: data.modified || undefined,
          preview: data.description || undefined,
        });
      }
    }

    return files;
  } catch (error) {
    console.error("Failed to list drive files from ERPNext:", error);
    throw error;
  }
}

/**
 * List book previews with limit
 */
export async function listDrivePreviews(limit = 9): Promise<DriveFileInfo[]> {
  const all = await listDriveFiles();
  return all.slice(0, Math.max(0, limit));
}

/**
 * Stream a book file download from ERPNext
 * This assumes the file_url field contains a direct link to the downloadable file
 */
export async function streamDriveFileDownload(
  fileId: string,
  res: Response
): Promise<void> {
  try {
    // Get the book record from ERPNext
    const bookData = await makeERPNextRequest(`/Book/${fileId}`);

    const data = bookData as any;
    const fileUrl = data?.data?.file_url;
    const fileName = data?.data?.title || data?.data?.name || "download";

    if (!fileUrl) {
      res.status(404).json({ reason: "file_url_not_found" });
      return;
    }

    const mimeType = "application/pdf";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName.replace(/"/g, "")}.pdf"`
    );

    // Fetch the file from the file URL
    try {
      const fileResponse = await fetch(fileUrl);

      if (!fileResponse.ok) {
        if (!res.headersSent) {
          res.status(404).json({ reason: "file_not_found" });
        }
        return;
      }

      const buffer = await fileResponse.arrayBuffer();
      res.end(Buffer.from(buffer));
    } catch (error) {
      console.error("Failed to download file from URL:", error);
      if (!res.headersSent) {
        res.status(500).json({ reason: "download_failed" });
      }
    }
  } catch (error) {
    console.error("Failed to stream drive file download:", error);
    if (!res.headersSent) {
      res.status(500).json({ reason: "internal_error" });
    }
  }
}

