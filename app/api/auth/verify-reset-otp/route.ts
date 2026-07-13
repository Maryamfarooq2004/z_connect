import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email: email.toLowerCase(), resetOtp: otp });

    if (!user) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    return NextResponse.json({ token: otp, success: true }, { status: 201 });
  } catch (err: any) {
    console.error("Verify Reset OTP Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
