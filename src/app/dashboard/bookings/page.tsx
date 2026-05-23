import React from "react";
import type { Metadata } from "next";
import { BookingsClient } from "./BookingsClient";

export const metadata: Metadata = {
  title: "Tesis Rezervasyonları | Apartman Plus",
  description: "Ortak alan tesislerini görüntüleyin ve seans rezervasyonu yapın",
};

export default function BookingsPage() {
  return <BookingsClient />;
}
