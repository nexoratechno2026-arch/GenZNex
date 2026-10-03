import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL("/admin/courses", request.url);
  return NextResponse.redirect(url, 307);
}
