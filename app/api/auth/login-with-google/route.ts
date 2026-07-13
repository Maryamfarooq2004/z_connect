import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendUrl = process.env.BACKEND_API_URL;

    // LoginWithGoogleDto: { token }
    const response = await fetch(`${backendUrl}/api/auth/login-with-google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    console.error("Google Login BFF Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
