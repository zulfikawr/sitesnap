import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { url, width, height, delay, fullPage } = await req.json();

    // Validate inputs
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing URL" },
        { status: 400 },
      );
    }
    if (!width || typeof width !== "number" || width < 320 || width > 3840) {
      return NextResponse.json(
        { error: "Invalid width (must be 320–3840)" },
        { status: 400 },
      );
    }
    if (
      !height ||
      typeof height !== "number" ||
      height < 480 ||
      height > 2160
    ) {
      return NextResponse.json(
        { error: "Invalid height (must be 480–2160)" },
        { status: 400 },
      );
    }
    if (
      delay !== undefined &&
      (typeof delay !== "number" || delay < 0 || delay > 10)
    ) {
      return NextResponse.json(
        { error: "Invalid delay (must be 0–10)" },
        { status: 400 },
      );
    }
    if (fullPage !== undefined && typeof fullPage !== "boolean") {
      return NextResponse.json(
        { error: "Invalid fullPage value" },
        { status: 400 },
      );
    }

    // Validate API key
    const apiKey = process.env.SCREENSHOTONE_API_KEY;
    if (!apiKey) {
      console.error("SCREENSHOTONE_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Construct ScreenshotOne URL
    const screenshotUrl = new URL("https://api.screenshotone.com/take");
    screenshotUrl.searchParams.append("access_key", apiKey);
    screenshotUrl.searchParams.append("url", url);
    screenshotUrl.searchParams.append(
      "full_page",
      fullPage !== false ? "true" : "false",
    );
    screenshotUrl.searchParams.append("viewport_width", width.toString());
    screenshotUrl.searchParams.append("viewport_height", height.toString());
    screenshotUrl.searchParams.append("format", "png");
    if (delay) {
      screenshotUrl.searchParams.append("delay", delay.toString());
    }

    // Make the request
    const res = await fetch(screenshotUrl.toString(), {
      headers: {
        Accept: "image/png",
      },
    });

    // Log response for debugging
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`ScreenshotOne API error: ${res.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Failed to fetch screenshot: ${errorText}` },
        { status: res.status },
      );
    }

    // Process the response
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const image = `data:image/png;base64,${base64}`;

    return NextResponse.json({ image });
  } catch (error) {
    console.error("Screenshot API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
