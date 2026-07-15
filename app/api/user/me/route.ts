import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name || user.fullName?.split(" ")[0] || "",
      last_name: user.last_name || user.fullName?.split(" ")[1] || "",
      fullName: user.fullName || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      avatarUrl: user.avatarUrl || "",
      role: user.role || "user",
      createdAt: user.createdAt,
    }, { status: 200 });

  } catch (err: any) {
    console.error("Get Current User Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
