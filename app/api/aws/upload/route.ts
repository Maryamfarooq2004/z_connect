import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { fileName, fileSize, fileType, fileUrl } = await req.json().catch(() => ({}));
    if (!fileName || !fileUrl) {
      return NextResponse.json({ error: "fileName and fileUrl are required" }, { status: 400 });
    }

    const mediaItem = await prisma.media.create({
      data: {
        name: fileName,
        size: fileSize || "Unknown size",
        type: fileType || "file",
        url: fileUrl,
        userId: userPayload.id,
        uploadedAt: new Date().toISOString().split("T")[0],
      }
    });

    return NextResponse.json({
      success: true,
      file: mediaItem
    }, { status: 201 });

  } catch (err: any) {
    console.error("AWS Upload Proxy Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
