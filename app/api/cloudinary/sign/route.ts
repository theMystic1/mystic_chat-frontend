import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const sha1 = (input: string) => {
  return crypto.createHash("sha1").update(input).digest("hex");
};

export const POST = async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const folder = String(
      body?.folder || process.env.CLOUDINARY_FOLDER || "mystchat",
    );
    const resourceType = String(body?.resourceType || "image");
    const timestamp = Math.floor(Date.now() / 1000);

    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!apiKey || !apiSecret || !cloudName) {
      return NextResponse.json(
        { message: "Missing Cloudinary env vars" },
        { status: 500 },
      );
    }

    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    // build sorted param string
    const paramString = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&");

    const signature = sha1(paramString + apiSecret);

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
      resourceType,
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "Failed to sign upload" },
      { status: 500 },
    );
  }
};
