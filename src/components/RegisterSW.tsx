"use client";

import { useEffect } from "react";

// Registra o service worker (necessário para o PWA ser instalável).
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
