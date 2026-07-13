import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const { db } = await connectToDatabase();
    
    let manager;
    try {
      manager = await db.collection("users").findOne({ _id: new ObjectId(id) });
    } catch (e) {
      manager = await db.collection("users").findOne({ id: id });
    }

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: manager._id.toString(),
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
