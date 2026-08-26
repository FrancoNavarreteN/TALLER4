import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "Invitado";

  return NextResponse.json({
    status: "success",
    message: `¡Hola, ${name}! Tu endpoint en Next.js está funcionando correctamente.`,
    router: "App Router (Next.js)",
    language: "JavaScript",
    timestamp: new Date().toISOString(),
    details: {
      location: "src/app/api/hello/route.js",
      method: "GET",
      environment: process.env.NODE_ENV || "development",
    },
  });
}
