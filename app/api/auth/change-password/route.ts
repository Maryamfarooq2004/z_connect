import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendUrl = process.env.BACKEND_API_URL;

    // ChangePasswordDto: { oldPassword, newPassword }
    // Forward the Authorization header from the client
    const authHeader = req.headers.get("authorization") || "";

    const response = await fetch(`${backendUrl}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    console.error("Change Password BFF Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
