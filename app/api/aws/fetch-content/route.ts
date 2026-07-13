import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { db } = await connectToDatabase();
    
    // Get all media items for this user/workspace
    const media = await db.collection("media").find({ userId: userPayload.id }).toArray();

    const formattedMedia = media.map(m => ({
      id: m._id.toString(),
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
