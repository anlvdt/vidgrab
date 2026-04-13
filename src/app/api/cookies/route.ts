import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, access } from "fs/promises";
import { join } from "path";

const COOKIES_PATH = join(process.cwd(), "cookies.txt");

// Upload cookies.txt
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();

    // Basic validation: Netscape cookie format starts with comments or domain lines
    if (!text.includes("\t") || text.length < 20) {
      return NextResponse.json(
        { error: "Invalid cookies.txt format. Use Netscape/Mozilla cookie format." },
        { status: 400 }
      );
    }

    await writeFile(COOKIES_PATH, text, "utf-8");
    return NextResponse.json({ ok: true, message: "Cookies saved successfully" });
  } catch (error) {
    console.error("Cookie upload error:", error);
    return NextResponse.json({ error: "Failed to save cookies" }, { status: 500 });
  }
}

// Check if cookies exist
export async function GET() {
  try {
    await access(COOKIES_PATH);
    return NextResponse.json({ exists: true });
  } catch {
    return NextResponse.json({ exists: false });
  }
}

// Delete cookies
export async function DELETE() {
  try {
    await unlink(COOKIES_PATH);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Already deleted
  }
}
