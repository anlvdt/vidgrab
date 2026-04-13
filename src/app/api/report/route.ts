import { NextRequest, NextResponse } from "next/server";
import { appendFile } from "fs/promises";
import { join } from "path";

const LOG_PATH = join(process.cwd(), "error-reports.log");

export async function POST(req: NextRequest) {
  try {
    const { url, error, description, userAgent, timestamp } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const entry = [
      `[${new Date(timestamp || Date.now()).toISOString()}]`,
      `URL: ${url}`,
      `Error: ${error || "N/A"}`,
      `Description: ${description || "N/A"}`,
      `UA: ${userAgent || "N/A"}`,
      "---",
    ].join("\n");

    await appendFile(LOG_PATH, entry + "\n", "utf-8");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Report save error:", err);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
