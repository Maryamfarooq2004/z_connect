import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Find user by email or username
    const user = await db.collection("users").findOne({
      $or: [
        { email: username.toLowerCase() },
        { username: username }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
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
    const refreshToken = generateRefreshToken({ id: userId });

    const response = NextResponse.json({
      user: {
        id: userId,
        email: user.email,
        username: user.username,
        first_name: userPayload.first_name,
        last_name: userPayload.last_name,
        fullName: user.fullName || `${userPayload.first_name} ${userPayload.last_name}`,
        avatarUrl: user.avatarUrl || "",
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    }, { status: 200 });

    // Set zconnect_refresh_token cookie so proxy.ts middleware allows dashboard access
    response.cookies.set({
      name: "zconnect_refresh_token",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;

  } catch (err: any) {
    console.error("Login Route Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
