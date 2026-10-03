import { NextResponse } from "next/server";

export async function GET() {
  const startTime = Date.now();

  try {
    return NextResponse.json(
      {
        status: "healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        version: "1.0.0-phase7",
        environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
        checks: {
          webServer: "ok",
          latencyMs: Date.now() - startTime,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "degraded",
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
