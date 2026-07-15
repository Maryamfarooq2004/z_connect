import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resetOtp = "123456"; // Default/mock OTP
    await prisma.user.update({
      where: { id: user.id },
      data: { resetOtp }
    });

    return NextResponse.json({ otpSent: true, message: "Reset code sent" }, { status: 201 });
  } catch (err: any) {
    console.error("Forgot Password Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
