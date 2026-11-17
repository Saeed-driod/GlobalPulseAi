import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backendUrl";

export const dynamic = "force-dynamic";

async function proxyRequest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const cleanPath = path[0] === "api" ? path.slice(1).join("/") : path.join("/");
  const targetPath = `/api/${cleanPath}`;
  const search = request.nextUrl.search;
  const targetUrl = `${getBackendBaseUrl()}${targetPath}${search}`;

  const allowedHeaders = ["content-type", "accept", "x-admin-secret", "authorization"];
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (allowedHeaders.includes(lowerKey)) {
      headers[lowerKey] = value;
    }
  });

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (["POST", "PUT"].includes(request.method)) {
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

