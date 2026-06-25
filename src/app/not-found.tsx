import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Sayfa bulunamadı</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
