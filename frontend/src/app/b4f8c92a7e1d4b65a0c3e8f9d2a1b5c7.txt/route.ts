export const dynamic = "force-static";

export function GET() {
  return new Response("b4f8c92a7e1d4b65a0c3e8f9d2a1b5c7", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

