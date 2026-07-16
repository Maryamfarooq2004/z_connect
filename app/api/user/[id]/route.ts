import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    
    // Check privileges: users can delete their own accounts
    if (userPayload.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" }, { status: 200 });

  } catch (err: any) {
    console.error("Delete User Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
