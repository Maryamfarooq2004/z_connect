import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const backendUrl = process.env.BACKEND_API_URL;

    // /api/auth/resend-verification has NO request body (confirmed from OpenAPI spec).
    // Forward the Authorization header so the backend can identify the user.
    const authHeader = req.headers.get("authorization") || "";

    const response = await fetch(`${backendUrl}/api/auth/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    console.error("Resend Verification BFF Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
