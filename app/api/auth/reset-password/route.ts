import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetOtp: otp
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid reset session or OTP code" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtp: null
      }
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 201 });
  } catch (err: any) {
    console.error("Reset Password Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
