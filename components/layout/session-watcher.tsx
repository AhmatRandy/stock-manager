"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const getCookieValue = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
};

export const SessionWatcher = () => {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const expStr = getCookieValue("token_exp");
    if (!expStr) {
      router.replace("/login");
      return;
    }

    const expTimestamp = parseInt(expStr, 10) * 1000;
    const now = Date.now();
    const remainingMs = expTimestamp - now;

    if (remainingMs <= 0) {
      doLogout();
      return;
    }

    setSecondsLeft(Math.ceil(remainingMs / 1000));

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
  }, []);

  const doLogout = () => {
    document.cookie =
      "token_exp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    router.replace("/login");
  };

  if (secondsLeft === null) return null;

  if (secondsLeft > 15) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-md bg-amber-50 border border-amber-300 px-4 py-3 text-sm text-amber-800 shadow-md">
      ⚠️ Sesi Anda akan berakhir dalam{" "}
      <span className="font-bold">{secondsLeft} detik</span>
    </div>
  );
};
