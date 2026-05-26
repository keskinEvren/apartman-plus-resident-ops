import React from "react";
import type { Metadata } from "next";
import { PackagesClient } from "./PackagesClient";

export const metadata: Metadata = {
  title: "Kargo Takip | komşu.site",
  description: "Paket ve kargo teslimat takip sistemi",
};

export default function PackagesPage() {
  return <PackagesClient />;
}
