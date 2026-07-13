import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
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
    const { first_name, last_name, bio } = body;

    const { db } = await connectToDatabase();
    
    let userQuery = {};
    try {
      userQuery = { _id: new ObjectId(payload.id) };
    } catch (e) {
      userQuery = { id: payload.id };
    }

    const updateFields: any = {};
    if (first_name !== undefined) updateFields.first_name = first_name;
    if (last_name !== undefined) updateFields.last_name = last_name;
    if (bio !== undefined) updateFields.bio = bio;

    if (Object.keys(updateFields).length > 0) {
      await db.collection("users").updateOne(userQuery, { $set: updateFields });
    }

    const updatedUser = await db.collection("users").findOne(userQuery);

    return NextResponse.json({
      id: updatedUser?._id.toString(),
      email: updatedUser?.email,
      username: updatedUser?.username,
      first_name: updatedUser?.first_name,
      last_name: updatedUser?.last_name,
      fullName: `${updatedUser?.first_name} ${updatedUser?.last_name}`,
      bio: updatedUser?.bio || "",
      avatarUrl: updatedUser?.avatarUrl || "",
      createdAt: updatedUser?.createdAt,
    }, { status: 201 });
  } catch (err: any) {
    console.error("Update Profile Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
