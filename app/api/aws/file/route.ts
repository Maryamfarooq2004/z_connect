import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
    }

    const result = await prisma.media.deleteMany({
      where: {
        id: id,
        userId: userPayload.id
      }
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "File not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "File deleted successfully" }, { status: 200 });

  } catch (err: any) {
    console.error("Delete AWS File Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
