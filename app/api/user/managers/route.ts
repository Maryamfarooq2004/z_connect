import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const userPayload = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    const { db } = await connectToDatabase();
    
    // Find all users who are managers or have role: manager
    const managers = await db.collection("users").find({
      $or: [
        { role: "manager" },
        { status: { $exists: true } }
      ]
    }).toArray();

    const formattedManagers = managers.map(m => ({
      id: m._id.toString(),
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
