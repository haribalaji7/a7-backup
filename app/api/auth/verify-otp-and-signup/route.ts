import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/services/supabase-admin";

export async function POST(req: Request) {
  try {
    const { email, password, fullName, otp } = await req.json();

    if (!email || !password || !fullName || !otp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const inputHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");

    const { data: records, error: fetchError } = await supabaseAdmin
      .from("email_verifications")
      .select("*")
      .eq("email", email)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError || !records || records.length === 0) {
      return NextResponse.json({ error: "No pending verification found for this email" }, { status: 400 });
    }

    const verificationRecord = records[0];

    if (new Date() > new Date(verificationRecord.expires_at)) {
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    if (verificationRecord.otp_hash !== inputHash) {
      return NextResponse.json({ error: "Incorrect verification code. Please try again." }, { status: 400 });
    }

    await supabaseAdmin
      .from("email_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verificationRecord.id);

    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Account verified and created successfully!",
      user: userData.user,
    });
  } catch (error: any) {
    console.error("Verification signup error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify OTP" }, { status: 500 });
  }
}
