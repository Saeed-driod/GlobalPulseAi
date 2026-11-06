import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export async function GET() {
  const adsTxt = `# Google AdSense Authorized Digital Sellers (ads.txt) - GlobalPulse AI
google.com, pub-5380114680461998, DIRECT, f08c47fec0942fa0
`;

  return new NextResponse(adsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

