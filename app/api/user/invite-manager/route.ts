import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { createClerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const { first_name, last_name, email, password } = body;

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if manager email already exists in local DB
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existing) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    // Initialize Clerk Backend Client
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // Create user inside Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [normalizedEmail],
      password: password,
      firstName: first_name,
      lastName: last_name,
      username: normalizedEmail.split("@")[0],
    });

    // Create local user profile record linked to the new Clerk User ID
    const newManager = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: normalizedEmail,
        username: clerkUser.username || normalizedEmail.split("@")[0],
        fullName: `${first_name} ${last_name}`.trim(),
        profileImage: clerkUser.imageUrl || "",
        bio: "",
      }
    });

    return NextResponse.json({
      id: newManager.id,
      first_name,
      last_name,
      email: newManager.email,
      role: "Editor",
      status: "Active",
    }, { status: 201 });

  } catch (err: any) {
    console.error("Invite Manager Error:", err);
    return NextResponse.json({ error: err.message || "Failed to invite manager" }, { status: 500 });
  }
}
