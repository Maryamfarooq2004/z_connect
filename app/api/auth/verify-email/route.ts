import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_API_URL;

    // GET /api/auth/verify-email?token=...
    const response = await fetch(
      `${backendUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
      { method: "GET" }
    );

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    console.error("Verify Email BFF Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
