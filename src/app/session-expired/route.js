import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

// Server Components can't modify cookies, so an expired session is bounced here to drop the dead token.
export async function GET(request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login?expired=1", request.url));
}
