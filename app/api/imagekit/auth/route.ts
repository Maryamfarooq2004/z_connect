import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import { verifyAuthRequest } from "@/lib/auth-middleware";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export async function GET(req: Request) {
  try {
    const user = await verifyAuthRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authParams = imagekit.getAuthenticationParameters();
    return NextResponse.json(authParams, { status: 200 });
  } catch (err: any) {
    console.error("ImageKit Auth Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
