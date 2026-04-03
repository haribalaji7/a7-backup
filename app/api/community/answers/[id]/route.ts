import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/services/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, user_id } = body;

    if (action === "upvote") {
      const { data: answer, error: fetchError } = await supabase
        .from("answers")
        .select("upvotes")
        .eq("id", id)
        .single();

      if (fetchError || !answer) {
        return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      }

      const { error } = await supabase
        .from("answers")
        .update({ upvotes: (answer.upvotes || 0) + 1 })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "accept") {
      const { data: answer, error: fetchError } = await supabase
        .from("answers")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !answer) {
        return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      }

      await supabase
        .from("answers")
        .update({ is_accepted: false })
        .eq("question_id", answer.question_id);

      const { error } = await supabase
        .from("answers")
        .update({ is_accepted: true })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating answer:", error);
    return NextResponse.json({ error: "Failed to update answer" }, { status: 500 });
  }
}