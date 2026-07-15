import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    
    const manager = await prisma.user.findUnique({
      where: { id: id }
    });

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: manager.id,
      first_name: manager.first_name || manager.fullName?.split(" ")[0] || "",
      last_name: manager.last_name || manager.fullName?.split(" ")[1] || "",
      fullName: manager.fullName || `${manager.first_name || ""} ${manager.last_name || ""}`.trim(),
      email: manager.email,
      role: manager.role || "manager",
      status: manager.status || "Active",
      createdAt: manager.createdAt,
    }, { status: 200 });

  } catch (err: any) {
    console.error("Get Manager Detail Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
