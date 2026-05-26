import { NextRequest, NextResponse } from "next/server";
import { synthesize, getEdgeTTSVoice } from "@/lib/edge-tts";

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const voiceName = getEdgeTTSVoice(language);

    if (!voiceName) {
      return NextResponse.json(
        { error: `TTS not supported for language: ${language}`, unsupported: true },
        { status: 501 },
      );
    }

    const audioData = await synthesize(text, voiceName);

    if (!audioData || audioData.byteLength === 0) {
      return NextResponse.json({ error: "Empty audio generated" }, { status: 500 });
    }

    return new Response(audioData, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
