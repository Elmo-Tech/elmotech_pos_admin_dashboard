import { resolveDataProvider } from "@/shared/config/backend";
import { NextResponse, type NextRequest } from "next/server";

/** Forward the requested pathname; Laravel identity/RBAC runs at server entry points. */
export async function proxy(request: NextRequest) {
  resolveDataProvider(process.env.DATA_PROVIDER);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
