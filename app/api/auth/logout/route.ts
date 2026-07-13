import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const backendUrl = process.env.BACKEND_API_URL;

    // /api/auth/logout has NO request body (confirmed from OpenAPI spec).
    const authHeader = req.headers.get("authorization") || "";

    const response = await fetch(`${backendUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    console.error("Logout BFF Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
