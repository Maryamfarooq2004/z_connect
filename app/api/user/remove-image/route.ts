import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { db } = await connectToDatabase();
    let query = {};
    try {
      query = { _id: new ObjectId(userPayload.id) };
    } catch (e) {
      query = { id: userPayload.id };
    }

    await db.collection("users").updateOne(query, { $set: { avatarUrl: "" } });

    return NextResponse.json({ success: true, message: "Avatar image removed" }, { status: 200 });

  } catch (err: any) {
    console.error("Remove Image Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
