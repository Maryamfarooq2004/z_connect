import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resetOtp = "123456"; // Default/mock OTP
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { resetOtp } }
    );

    return NextResponse.json({ otpSent: true, message: "Reset code sent" }, { status: 201 });
  } catch (err: any) {
    console.error("Forgot Password Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
