import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { first_name, last_name, email, password } = body;

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      first_name,
      last_name,
      email: email.toLowerCase(),
      username: email.split("@")[0] + Math.floor(Math.random() * 1000),
      password: hashedPassword,
      email_verified: false,
      role: "user",
      createdAt: new Date().toISOString(),
      avatarUrl: "",
    };

    const result = await db.collection("users").insertOne(newUser);
    const userId = result.insertedId.toString();

    // Generate access & refresh tokens
    const userPayload = {
      id: userId,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      username: newUser.username,
      role: newUser.role,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userId });

    const response = NextResponse.json({
      user: {
        id: userId,
        email: newUser.email,
        username: newUser.username,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        avatarUrl: newUser.avatarUrl,
        createdAt: newUser.createdAt,
      },
      accessToken,
      refreshToken,
      verificationRequired: true,
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
    console.error("Signup Route Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
