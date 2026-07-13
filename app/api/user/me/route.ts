import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { db } = await connectToDatabase();
    
    let userQuery = {};
    try {
      userQuery = { _id: new ObjectId(userPayload.id) };
    } catch (e) {
      userQuery = { id: userPayload.id };
    }

    const user = await db.collection("users").findOne(userQuery);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      first_name: user.first_name || user.fullName?.split(" ")[0] || "",
      last_name: user.last_name || user.fullName?.split(" ")[1] || "",
      fullName: user.fullName || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      role: user.role || "user",
      createdAt: user.createdAt,
    }, { status: 200 });

  } catch (err: any) {
    console.error("Get Current User Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
