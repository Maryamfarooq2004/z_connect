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
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No update parameters provided" }, { status: 400 });
    }

    if (first_name !== undefined || last_name !== undefined) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) {
        const finalFirstName = first_name !== undefined ? first_name : user.first_name;
        const finalLastName = last_name !== undefined ? last_name : user.last_name;
        updates.fullName = `${finalFirstName} ${finalLastName}`;
      }
    }

    const updated = await prisma.user.update({
      where: { id: id },
      data: updates
    });

    return NextResponse.json({
      id: updated.id,
      first_name: updated.first_name,
      last_name: updated.last_name,
      email: updated.email,
      role: updated.role,
      status: updated.status || "Active",
    }, { status: 200 });

  } catch (err: any) {
    console.error("Update Manager Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
