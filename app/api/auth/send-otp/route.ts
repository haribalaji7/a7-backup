import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/services/supabase-admin";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || "mock_user",
    pass: process.env.SMTP_PASS || "mock_pass",
  },
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const { error: dbError } = await supabaseAdmin
      .from("email_verifications")
      .insert({
        email,
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      return NextResponse.json({ error: "Database error saving OTP" }, { status: 500 });
    }

    const mailOptions = {
      from: '"Agri Nova" <no-reply@agrinova.com>',
      to: email,
      subject: "Verify Your Email - Agri Nova OTP Code",
      text: `Your Agri Nova verification code is ${otp}. This code is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #166534; text-align: center; margin-bottom: 24px;">Verify Your Email</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">Welcome to Agri Nova! Please use the following One-Time Password (OTP) to complete your registration:</p>
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #15803d; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 13px; text-align: center;">This code is active for <strong>10 minutes</strong>. If you did not request this, please disregard this email.</p>
        </div>
      `,
    };

    const isMock = !process.env.SMTP_USER || process.env.SMTP_USER === "mock_user";

    if (isMock) {
      console.log(`\n============================================\n[LOCAL OTP BYPASS] Email: ${email} | OTP Code: ${otp}\n============================================\n`);
    } else {
      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      ...(isMock && { devOtp: otp }),
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
  }
}
