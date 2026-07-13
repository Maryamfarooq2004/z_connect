import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

    const { db } = await connectToDatabase();
    
    let query = {};
    try {
      query = { _id: new ObjectId(id), userId: userPayload.id };
    } catch (e) {
      query = { id: id, userId: userPayload.id };
    }

    const result = await db.collection("media").deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "File not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "File deleted successfully" }, { status: 200 });

  } catch (err: any) {
    console.error("Delete AWS File Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
