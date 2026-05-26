import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("file") as File | null;
    const language = formData.get("language") as string || "en";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const sendToWhisper = async (url: string, apiKey: string, model: string): Promise<string | null> => {
      const body = new FormData();
      body.append("file", audioFile);
      body.append("model", model);
      if (language !== "en") {
        body.append("language", language);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body,
      });

      if (!response.ok) {
        console.warn(`Whisper ${model} failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.text?.trim() || null;
    };

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.length > 20) {
      const text = await sendToWhisper(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        groqKey,
        "whisper-large-v3",
      );
      if (text) {
        return NextResponse.json({ text, source: "groq" });
      }
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey.length > 50) {
      const text = await sendToWhisper(
        "https://api.openai.com/v1/audio/transcriptions",
        openaiKey,
        "whisper-1",
      );
      if (text) {
        return NextResponse.json({ text, source: "openai" });
      }
    }

    return NextResponse.json(
      { error: "All transcription services failed", text: "" },
      { status: 503 },
    );
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed", text: "" },
      { status: 500 },
    );
  }
}
