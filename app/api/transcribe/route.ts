import { NextRequest, NextResponse } from "next/server";

const LANGUAGE_CODES: Record<string, string> = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
  te: "te-IN",
  ml: "ml-IN",
  kn: "kn-IN",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("file") as File | null;
    const language = formData.get("language") as string || "en";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const bcp47Lang = LANGUAGE_CODES[language] || "en-IN";

    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    try {
      const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: `data:audio/wav;base64,${base64Audio}`,
          model: "whisper-1",
          language: language === "en" ? undefined : language,
          response_format: "text",
        }),
      });

      if (whisperResponse.ok) {
        const text = await whisperResponse.text();
        return NextResponse.json({ text: text.trim(), source: "openai" });
      }
    } catch (e) {
      console.warn("OpenAI Whisper failed:", e);
    }

    try {
      const groqResponse = await fetch("https://api.groq.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: `data:audio/wav;base64,${base64Audio}`,
          model: "whisper-large-v3",
          language: language === "en" ? undefined : language,
        }),
      });

      if (groqResponse.ok) {
        const data = await groqResponse.json();
        return NextResponse.json({ text: data.text?.trim() || "", source: "groq" });
      }
    } catch (e) {
      console.warn("Groq Whisper failed:", e);
    }

    try {
      const assemblyResponse = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
          "Authorization": process.env.ASSEMBLYAI_API_KEY || "",
          "Content-Type": "application/octet-stream",
        },
        body: audioBuffer,
      });

      if (assemblyResponse.ok) {
        const { upload_url } = await assemblyResponse.json();
        
        const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
          method: "POST",
          headers: {
            "Authorization": process.env.ASSEMBLYAI_API_KEY || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio_url: upload_url,
            language_code: bcp47Lang,
          }),
        });

        if (transcriptResponse.ok) {
          const { id } = await transcriptResponse.json();
          
          for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
              headers: {
                "Authorization": process.env.ASSEMBLYAI_API_KEY || "",
              },
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.status === "completed") {
                return NextResponse.json({ 
                  text: statusData.text?.trim() || "", 
                  source: "assemblyai" 
                });
              } else if (statusData.status === "error") {
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("AssemblyAI failed:", e);
    }

    return NextResponse.json(
      { error: "All transcription services failed", text: "" },
      { status: 503 }
    );

  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed", text: "" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
