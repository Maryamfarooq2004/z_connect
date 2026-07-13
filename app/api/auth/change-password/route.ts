import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload: any = verifyAccessToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    let userQuery = {};
    try {
      userQuery = { _id: new ObjectId(payload.id) };
    } catch (e) {
      userQuery = { id: payload.id };
    }

    const user = await db.collection("users").findOne(userQuery);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid old password" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection("users").updateOne(userQuery, { $set: { password: hashedPassword } });

    return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 201 });
  } catch (err: any) {
    console.error("Change Password Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
