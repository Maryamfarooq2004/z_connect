import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { oldPassword, newPassword } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: userPayload.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOldValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldValid) {
      return NextResponse.json({ error: "Incorrect old password" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userPayload.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err: any) {
    console.error("User Change Password Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
