import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Google token is required" }, { status: 400 });
    }

    // Simulate user lookup or creation from Google OAuth details
    const email = "google.user@zconnect.design";
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          first_name: "Google",
          last_name: "User",
          email: email,
          username: "google_user" + Math.floor(Math.random() * 1000),
          password: "social-oauth-stub-password",
          email_verified: true,
          role: "user",
          createdAt: new Date().toISOString(),
          avatarUrl: "",
        }
      });
    }

    const userId = user.id;
    const userPayload = {
      id: userId,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      role: user.role,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userId });

    const response = NextResponse.json({
      user: {
        id: userId,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        avatarUrl: user.avatarUrl,
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
    console.error("Google Login Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
