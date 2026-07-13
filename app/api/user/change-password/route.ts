import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function PATCH(req: Request) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { oldPassword, newPassword } = await req.json();

    const { db } = await connectToDatabase();
    
    let query = {};
    try {
      query = { _id: new ObjectId(userPayload.id) };
    } catch (e) {
      query = { id: userPayload.id };
    }

    const user = await db.collection("users").findOne(query);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOldValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldValid) {
      return NextResponse.json({ error: "Incorrect old password" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection("users").updateOne(query, { $set: { password: hashedPassword } });

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err: any) {
    console.error("User Change Password Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
