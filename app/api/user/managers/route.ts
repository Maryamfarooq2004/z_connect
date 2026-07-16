import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    // Retrieve all users from local database
    const users = await prisma.user.findMany();

    const formattedManagers = users.map((m: any) => ({
      id: m.id,
      first_name: m.fullName?.split(" ")[0] || "",
      last_name: m.fullName?.split(" ")[1] || "",
      fullName: m.fullName || "",
      email: m.email,
      role: "Editor", // default fallback role for UI expectations
      status: "Active", // all synced Clerk users are active
    }));

    return NextResponse.json(formattedManagers, { status: 200 });

  } catch (err: any) {
    console.error("List Managers Error:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message || err }, { status: 500 });
  }
}
