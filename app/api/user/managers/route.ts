import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    // Find all users who are managers or have role: manager
    const managers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "manager" },
          { status: "Pending" } // Pending status applies mostly to invited managers
        ]
      }
    });

    const formattedManagers = managers.map(m => ({
      id: m.id,
      first_name: m.first_name || m.fullName?.split(" ")[0] || "",
      last_name: m.last_name || m.fullName?.split(" ")[1] || "",
      fullName: m.fullName || `${m.first_name || ""} ${m.last_name || ""}`.trim(),
      email: m.email,
      role: m.role === "manager" ? "Editor" : m.role || "Editor", // map to default role UI expectations
      status: m.status || "Active",
    }));

    return NextResponse.json(formattedManagers, { status: 200 });

  } catch (err: any) {
    console.error("List Managers Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
