import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload: any = verifyAccessToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { first_name, last_name } = body;

    const updateFields: any = {};
    if (first_name !== undefined) updateFields.first_name = first_name;
    if (last_name !== undefined) updateFields.last_name = last_name;

    if (first_name !== undefined || last_name !== undefined) {
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (user) {
        const finalFirstName = first_name !== undefined ? first_name : user.first_name;
        const finalLastName = last_name !== undefined ? last_name : user.last_name;
        updateFields.fullName = `${finalFirstName} ${finalLastName}`;
      }
    }

    let updatedUser = await prisma.user.findUnique({
      where: { id: payload.id }
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (Object.keys(updateFields).length > 0) {
      updatedUser = await prisma.user.update({
        where: { id: payload.id },
        data: updateFields
      });
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      fullName: updatedUser.fullName || `${updatedUser.first_name} ${updatedUser.last_name}`,
      avatarUrl: updatedUser.avatarUrl || "",
      createdAt: updatedUser.createdAt,
    }, { status: 201 });
  } catch (err: any) {
    console.error("Update Profile Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
