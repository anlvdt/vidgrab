import { NextRequest, NextResponse } from "next/server";
import { appendFile } from "fs/promises";
import { consumeRateLimit } from "@/lib/request-guard";

const LOG_PATH =
  process.env.VIDGRAB_REPORT_LOG_PATH || "/tmp/vidgrab-error-reports.log";

export async function POST(req: NextRequest) {
  try {
    if (!consumeRateLimit(req, 5)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const { url, error, description, userAgent, timestamp } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const entry = [
      `[${new Date(timestamp || Date.now()).toISOString()}]`,
      `URL: ${redactUrl(url)}`,
      `Error: ${clean(error, 500) || "N/A"}`,
      `Description: ${clean(description, 1000) || "N/A"}`,
      `UA: ${clean(userAgent, 300) || "N/A"}`,
      "---",
    ].join("\n");

    await appendFile(LOG_PATH, entry + "\n", "utf-8");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Report save error:", err);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.replace(/[\r\n]+/g, " ").slice(0, maxLength)
    : "";
}

function redactUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const parsed = new URL(value);
    parsed.search = parsed.search ? "?[redacted]" : "";
    parsed.hash = "";
    return clean(parsed.toString(), 500);
  } catch {
    return clean(value, 500);
  }
}
