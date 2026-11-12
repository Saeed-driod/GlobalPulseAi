import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = "http://150.136.214.192";

async function proxyRequest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const cleanPath = path[0] === "api" ? path.slice(1).join("/") : path.join("/");
  const targetPath = `/api/${cleanPath}`;
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}${targetPath}${search}`;

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    try {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    } catch {
      // no body
    }
  }

  try {
    const res = await fetch(targetUrl, fetchOptions);
    const contentType = res.headers.get("content-type") || "application/json";
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (err: any) {
    console.error(`[Backend Proxy Error] ${targetUrl}:`, err);
    return NextResponse.json(
      { error: "Failed to connect to backend", detail: err?.message },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;

