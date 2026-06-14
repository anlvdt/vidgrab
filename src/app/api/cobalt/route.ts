import { NextRequest, NextResponse } from "next/server";
import { cobaltDownload } from "@/lib/cobalt";
import { assertPublicHttpUrl, consumeRateLimit } from "@/lib/request-guard";

export async function POST(req: NextRequest) {
  try {
    if (!consumeRateLimit(req, 8)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const { url, audioOnly } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const result = await cobaltDownload(await assertPublicHttpUrl(url.trim()), !!audioOnly);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Cobalt request failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
