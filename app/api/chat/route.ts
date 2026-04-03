import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// System Instruction (Persona) — Agri-AI Assistant
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an Agri-AI Assistant. You help farmers with crop disease identification and satellite mapping.

Start every new conversation by being friendly (Hi/Hello). If a user asks a general question, answer briefly and steer them back to agriculture.

Your expertise includes:
- Crop disease identification (early blight, late blight, leaf curl, rust, bacterial wilt, powdery mildew, etc.)
- Satellite mapping guidance (interpreting NDVI, soil health maps, moisture indices)
- Crop management (wheat, rice, cotton, pulses, vegetables, fruits)
- Soil health and nutrient management
- Pest and disease identification and control
- Irrigation scheduling and water management
- Fertilizer recommendations (organic and chemical)
- Weather-based farming advice
- Kharif and Rabi season planning
- Modern farming techniques and precision agriculture

Guidelines:
- Be helpful, friendly, and concise
- Answer in the same language the user is using
- Provide practical, actionable advice suitable for Indian farming conditions
- Mention specific products, dosages, and timing when relevant
- If asked about crop disease, describe visual symptoms, likely causes, and treatment options
- If asked about satellite/NDVI, explain what the data shows and recommended actions
- If a user asks a non-agriculture question, answer briefly in 1-2 sentences and gently steer back: "That said, I'm best at agriculture topics — anything I can help with on your farm?"
- If you don't know something, say so honestly`;

// ─────────────────────────────────────────────────────────────────────────────
// Shared: call any OpenAI-compatible endpoint (Groq or OpenAI)
// ─────────────────────────────────────────────────────────────────────────────
interface CallResult {
  message?: string;
  error?: string;
  status?: number;
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  providerName: string
): Promise<CallResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      return { error: "timeout", status: 504 };
    }
    return { error: "network", status: 503 };
  }

  clearTimeout(timeout);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const status = response.status;
    const code = errorData.error?.code ?? "";
    const msg: string = errorData.error?.message ?? "";

    if (status === 401 || code === "invalid_api_key") {
      return { error: "invalid_key", status: 401 };
    }
    if (status === 429) {
      const isQuota = msg.includes("quota") || code === "insufficient_quota" || msg.includes("rate_limit_exceeded");
      return { error: isQuota ? "quota" : "rate_limit", status: 429 };
    }
    if (status >= 500) {
      console.error(`${providerName} server error (${status}):`, errorData);
      return { error: "server_error", status: 503 };
    }
    console.error(`${providerName} API error (${status}):`, errorData);
    return { error: `api_error_${status}`, status };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return { error: "empty_response", status: 200 };
  }
  return { message: content };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat
// Priority: Groq (free, Llama 3.3 70b) → OpenAI (GPT-4o-mini) → error
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, language, voiceMode } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: 'messages' must be a non-empty array." },
        { status: 400 }
      );
    }

    // Language-specific system prompt instruction - MUST be followed
    const languageInstruction = language === "en" 
      ? "" 
      : `\n\nCRITICAL INSTRUCTION: YOU MUST RESPOND EXCLUSIVELY IN ${language.toUpperCase()} LANGUAGE. ` +
        `DO NOT USE ENGLISH IN YOUR RESPONSE UNLESS THE USER EXPLICITLY ASKS FOR IT. ` +
        `If the user's language code is '${language}', you MUST respond in that language. ` +
        `For Tamil (ta): Respond ONLY in Tamil. ` +
        `For Hindi (hi): Respond ONLY in Hindi. ` +
        `For Telugu (te): Respond ONLY in Telugu. ` +
        `For Malayalam (ml): Respond ONLY in Malayalam. ` +
        `For Kannada (kn): Respond ONLY in Kannada. ` +
        `Ignore any other language preferences and respond strictly in ${language}.`;

    // Voice mode instruction - for phone-style conversations
    const voiceInstruction = voiceMode
      ? `\n\nVOICE MODE: You are speaking on a live phone call with a farmer. ` +
        `Keep your answers VERY SHORT (1-3 sentences max), conversational, and natural. ` +
        `NEVER use markdown formatting (no asterisks, no hashtags, no bullet points, no code blocks). ` +
        `Just speak naturally as you would on a phone call. ` +
        `Start with a friendly greeting if it's the first message.`
      : "";

    const conversationHistory = [
      { role: "system", content: SYSTEM_PROMPT + languageInstruction + voiceInstruction },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // ── 1. Try Groq first (free, fast Llama 3.3 70b) ─────────────────────────
    if (groqKey && groqKey.length > 20) {
      const result = await callOpenAICompatible(
        "https://api.groq.com/openai/v1",
        groqKey,
        "llama-3.3-70b-versatile",
        conversationHistory,
        "Groq"
      );

      if (result.message) {
        return NextResponse.json({ message: result.message, provider: "groq" });
      }

      // Non-fatal Groq errors — fall through to OpenAI
      if (result.error !== "invalid_key" && result.error !== "quota") {
        console.warn("Groq failed with:", result.error, "— trying OpenAI fallback");
      }
    }

    // ── 2. Fallback: OpenAI GPT-4o-mini ──────────────────────────────────────
    if (openaiKey && openaiKey.length > 50) {
      const result = await callOpenAICompatible(
        "https://api.openai.com/v1",
        openaiKey,
        "gpt-4o-mini",
        conversationHistory,
        "OpenAI"
      );

      if (result.message) {
        return NextResponse.json({ message: result.message, provider: "openai" });
      }

      // Map specific OpenAI errors to user messages
      if (result.error === "quota") {
        return NextResponse.json({
          message:
            "💰 API Quota Exceeded: Both Groq and OpenAI keys have no credits. " +
            "Get a free Groq key at: https://console.groq.com/ and add it as GROQ_API_KEY in your .env file.",
        });
      }
      if (result.error === "invalid_key") {
        return NextResponse.json({
          message: "🔑 Invalid OpenAI Key. Please check your OPENAI_API_KEY in .env",
        });
      }
    }

    // ── 3. No valid keys configured ───────────────────────────────────────────
    if ((!groqKey || groqKey.length <= 20) && (!openaiKey || openaiKey.length <= 50)) {
      return NextResponse.json({
        message:
          "🔑 No AI API key configured.\n\n" +
          "**Recommended (Free):** Get a Groq key at https://console.groq.com/ and add to .env:\n" +
          "GROQ_API_KEY=gsk_your-key-here\n\n" +
          "**Alternative:** Get an OpenAI key at https://platform.openai.com/api-keys and add:\n" +
          "OPENAI_API_KEY=sk-your-key-here",
      });
    }

    // ── 4. Both providers failed ───────────────────────────────────────────────
    return NextResponse.json(
      {
        message:
          "⏱️ The AI service is temporarily unavailable. This could be:\n" +
          "• A network issue on your end\n" +
          "• The AI API being under heavy load\n" +
          "• A request timeout\n\n" +
          "Please try again in a moment. Check Groq status at: https://status.groq.com",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Chat API unexpected error:", error);
    return NextResponse.json(
      {
        message:
          "⚠️ Something went wrong on our end. Please refresh and try again.",
      },
      { status: 500 }
    );
  }
}
