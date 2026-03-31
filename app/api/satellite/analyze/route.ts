import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bbox, crop_type, field_name } = body;

    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return NextResponse.json(
        { error: "bbox must be [min_lon, min_lat, max_lon, max_lat]" },
        { status: 400 }
      );
    }

    const response = await fetch("http://localhost:8000/analyze/ndvi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bbox,
        crop_type: crop_type || "Unknown",
        field_name: field_name || "Field",
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, detail: err },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to reach ML backend. Is it running on port 8000?", detail: msg },
      { status: 503 }
    );
  }
}
