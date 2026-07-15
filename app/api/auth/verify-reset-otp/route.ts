import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetOtp: otp
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    return NextResponse.json({ token: otp, success: true }, { status: 201 });
  } catch (err: any) {
    console.error("Verify Reset OTP Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
