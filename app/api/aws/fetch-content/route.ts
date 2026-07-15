import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    // Get all media items for this user/workspace
    const media = await prisma.media.findMany({
      where: { userId: userPayload.id }
    });

    const formattedMedia = media.map(m => ({
      id: m.id,
      name: m.name,
      size: m.size,
      type: m.type,
      url: m.url,
      uploadedAt: m.uploadedAt,
    }));

    return NextResponse.json(formattedMedia, { status: 200 });

  } catch (err: any) {
    console.error("Fetch Content Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
