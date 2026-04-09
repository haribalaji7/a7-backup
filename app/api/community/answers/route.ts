import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/services/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const question_id = searchParams.get("question_id");

    if (!question_id) {
      return NextResponse.json({ error: "question_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("answers")
      .select("*")
      .eq("question_id", question_id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ answers: data || [] });
  } catch (error) {
    console.error("Error fetching answers:", error);
    return NextResponse.json({ error: "Failed to fetch answers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question_id, content, user_id, user_name } = body;

    if (!question_id || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("answers")
      .insert([
        {
          question_id,
          content,
          user_id: user_id || null,
          user_name: user_name || "Anonymous Farmer",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ answer: data });
  } catch (error) {
    console.error("Error creating answer:", error);
    return NextResponse.json({ error: "Failed to create answer" }, { status: 500 });
  }
}