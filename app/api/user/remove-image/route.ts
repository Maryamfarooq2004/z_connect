import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    await prisma.user.update({
      where: { id: userPayload.id },
      data: { profileImage: "" }
    });

    return NextResponse.json({ success: true, message: "Avatar image removed" }, { status: 200 });

  } catch (err: any) {
    console.error("Remove Image Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
