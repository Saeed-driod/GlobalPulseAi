import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
