"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}

export function SessionWatcher() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const expStr = getCookieValue("token_exp");
    if (!expStr) {
      router.replace("/login");
      return;
    }

    const expTimestamp = parseInt(expStr, 10) * 1000; // konversi ke ms
    const now = Date.now();
    const remainingMs = expTimestamp - now;

    if (remainingMs <= 0) {
      // Sudah expired, langsung logout
      doLogout();
      return;
    }

    setSecondsLeft(Math.ceil(remainingMs / 1000));

    // Hitung mundur per detik
    const interval = setInterval(() => {
      const left = Math.ceil((expTimestamp - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(interval);
        doLogout();
      } else {
        setSecondsLeft(left);
      }
    }, 1000);

    // Auto logout tepat waktu
    timerRef.current = setTimeout(() => {
      clearInterval(interval);
      doLogout();
    }, remainingMs);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doLogout() {
    // Hapus cookie dari sisi client (non-httpOnly)
    document.cookie =
      "token_exp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Token httpOnly akan dihapus oleh middleware saat redirect
    router.replace("/login");
  }

  if (secondsLeft === null) return null;

  // Tampilkan peringatan jika sesi hampir habis (≤ 15 detik)
  if (secondsLeft > 15) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-md bg-amber-50 border border-amber-300 px-4 py-3 text-sm text-amber-800 shadow-md">
      ⚠️ Sesi Anda akan berakhir dalam{" "}
      <span className="font-bold">{secondsLeft} detik</span>
    </div>
  );
}
