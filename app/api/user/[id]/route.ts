import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    
    // Check privileges: users can delete their own accounts, or admins can delete any
    if (userPayload.id !== id && userPayload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    
    let query = {};
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { id: id };
    }

    await db.collection("users").deleteOne(query);

    return NextResponse.json({ success: true, message: "User deleted successfully" }, { status: 200 });

  } catch (err: any) {
    console.error("Delete User Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
