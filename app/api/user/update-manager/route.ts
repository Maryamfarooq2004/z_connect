import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req: Request) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const { id, first_name, last_name } = body;

    if (!id) {
      return NextResponse.json({ error: "Manager ID is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    let query = {};
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { id: id };
    }

    let updates: any = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No update parameters provided" }, { status: 400 });
    }

    await db.collection("users").updateOne(query, { $set: updates });
    const updated = await db.collection("users").findOne(query);

    return NextResponse.json({
      id: updated?._id.toString(),
      first_name: updated?.first_name,
      last_name: updated?.last_name,
      email: updated?.email,
      role: updated?.role,
      status: updated?.status || "Active",
    }, { status: 200 });

  } catch (err: any) {
    console.error("Update Manager Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
