/**
 * Filename sanitizer - prevents path traversal and invalid characters.
 */

/**
 * Sanitize a filename for use in Content-Disposition header.
 * - Removes/replaces characters unsafe for filesystems
 * - Prevents path traversal attacks
 * - Limits length to prevent buffer issues
 * - Handles Unicode properly
 */
export function sanitizeFilename(input: string, maxLength = 100): string {
  if (!input || typeof input !== "string") {
    return "video";
  }

  // Step 1: Remove null bytes and path traversal attempts
  let sanitized = input
    .replace(/\0/g, "") // Null bytes
    .replace(/\.\./g, "") // Path traversal
    .replace(/^[^a-zA-Z0-9]+/, "") // Leading non-alphanumeric
    .replace(/[^a-zA-Z0-9_\-\s]+/g, "_") // Replace unsafe chars with underscore
    .trim();

  // Step 2: Ensure not empty after sanitization
  if (!sanitized) {
    sanitized = "video";
  }

  // Step 3: Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  // Step 4: Final safety check - only allow alphanumeric, underscore, hyphen, space
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-\s]/g, "").slice(0, maxLength);

  return sanitized || "video";
}

/**
 * Get filename with extension for download.
 */
export function getDownloadFilename(
  title: string,
  extension: string,
  maxTitleLength = 100
): string {
  const safeTitle = sanitizeFilename(title, maxTitleLength);
  const ext = extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "mp4";
  return `${safeTitle}.${ext}`;
}
