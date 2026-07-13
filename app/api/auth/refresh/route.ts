import { NextResponse } from "next/server";
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let currentRefreshToken = body.refreshToken || body.refresh_token;

    if (!currentRefreshToken) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/zconnect_refresh_token=([^;]+)/);
      if (match) {
        currentRefreshToken = match[1];
      }
    }

    if (!currentRefreshToken) {
      return NextResponse.json({ error: "No session active" }, { status: 401 });
    }

    const payload = verifyRefreshToken(currentRefreshToken);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    let user;
    try {
      user = await db.collection("users").findOne({ _id: new ObjectId(payload.id) });
    } catch (e) {
      user = await db.collection("users").findOne({ id: payload.id });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const userId = user._id.toString();
    const userPayload = {
      id: userId,
      email: user.email,
      first_name: user.first_name || user.fullName?.split(" ")[0] || "",
      last_name: user.last_name || user.fullName?.split(" ")[1] || "",
      username: user.username,
      role: user.role || "user",
    };

    const accessToken = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken({ id: userId });

    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: userId,
        email: user.email,
        username: user.username,
        first_name: userPayload.first_name,
        last_name: userPayload.last_name,
        fullName: user.fullName || `${userPayload.first_name} ${userPayload.last_name}`,
        avatarUrl: user.avatarUrl || "",
        createdAt: user.createdAt,
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error("Refresh Token Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
