import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, errors as joseErrors } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "super-secret-erp-key",
);

const PUBLIC_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const token = request.cookies.get("token")?.value;

  // Jika sudah login dan mencoba akses halaman publik → redirect ke dashboard
  if (isPublicRoute && token) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // Token tidak valid, biarkan akses halaman publik
    }
  }

  // Jika bukan halaman publik, verifikasi token
  if (!isPublicRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (err) {
      // Token expired atau tidak valid → hapus cookie dan redirect ke login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      response.cookies.delete("token_exp");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware pada semua route kecuali:
     * - _next/static (file statis)
     * - _next/image (optimasi gambar)
     * - favicon.ico
     * - file publik (ekstensi file umum)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
