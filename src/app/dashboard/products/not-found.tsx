import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-semibold mb-2">
        404 — Halaman Tidak Ditemukan
      </h1>
      <p className="text-muted-foreground mb-6 max-w-xl">
        Maaf, halaman yang Anda cari tidak ditemukan atau Anda tidak memiliki
        izin untuk mengaksesnya.
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:opacity-90"
        >
          Kembali ke Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 border rounded-md"
        >
          Beranda
        </Link>
      </div>
    </div>
  );
}
