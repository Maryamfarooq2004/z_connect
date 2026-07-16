import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const { id, first_name, last_name } = body;

    if (!id) {
      return NextResponse.json({ error: "Manager ID is required" }, { status: 400 });
    }

    let updates: any = {};
    if (first_name !== undefined || last_name !== undefined) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) {
        const currentFullName = user.fullName || "";
        const finalFirstName = first_name !== undefined ? first_name : currentFullName.split(" ")[0] || "";
        const finalLastName = last_name !== undefined ? last_name : currentFullName.split(" ")[1] || "";
        updates.fullName = `${finalFirstName} ${finalLastName}`.trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No update parameters provided" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: id },
      data: updates
    });

    return NextResponse.json({
      id: updated.id,
      first_name: updated.fullName?.split(" ")[0] || "",
      last_name: updated.fullName?.split(" ")[1] || "",
      email: updated.email,
      role: "Editor",
      status: "Active",
    }, { status: 200 });

  } catch (err: any) {
    console.error("Update Manager Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
