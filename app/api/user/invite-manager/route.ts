import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    // Role check if needed, managers are invited by users or admins
    const body = await req.json();
    const { first_name, last_name, email, password } = body;

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if manager email already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (existing) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newManager = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email: email.toLowerCase(),
        username: email.split("@")[0],
        password: hashedPassword,
        role: "manager", // set role to manager
        status: "Pending", // initial state as pending
        invited_by: userPayload.id,
        invited_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        email_verified: false,
        avatarUrl: "",
      }
    });

    return NextResponse.json({
      id: newManager.id,
      first_name: newManager.first_name,
      last_name: newManager.last_name,
      email: newManager.email,
      role: newManager.role,
      status: newManager.status,
    }, { status: 201 });

  } catch (err: any) {
    console.error("Invite Manager Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
