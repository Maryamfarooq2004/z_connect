import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { imageUrl } = await req.json().catch(() => ({ imageUrl: "" }));
    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userPayload.id },
      data: { profileImage: imageUrl }
    });

    return NextResponse.json({ success: true, imageUrl }, { status: 200 });

  } catch (err: any) {
    console.error("Upload Image Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
