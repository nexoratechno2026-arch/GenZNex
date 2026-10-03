import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL("/programs", request.url);
  return NextResponse.redirect(url, 307);
}
