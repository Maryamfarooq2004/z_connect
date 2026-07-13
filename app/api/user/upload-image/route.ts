import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

    const { db } = await connectToDatabase();
    let query = {};
    try {
      query = { _id: new ObjectId(userPayload.id) };
    } catch (e) {
      query = { id: userPayload.id };
    }

    await db.collection("users").updateOne(query, { $set: { avatarUrl: imageUrl } });

    return NextResponse.json({ success: true, imageUrl }, { status: 200 });

  } catch (err: any) {
    console.error("Upload Image Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
