import React from "react";
import type { Metadata } from "next";
import { TicketsClient } from "./TicketsClient";

export const metadata: Metadata = {
  title: "Destek Talepleri | Apartman Plus",
  description: "Talep ve arıza bildirim takip sistemi",
};

export default function TicketsPage() {
  return <TicketsClient />;
}
