import { NextRequest, NextResponse } from "next/server";
import { cobaltDownload } from "@/lib/cobalt";

export async function POST(req: NextRequest) {
  try {
    const { url, audioOnly } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const result = await cobaltDownload(url.trim(), !!audioOnly);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Cobalt request failed" },
      { status: 500 }
    );
  }
}
