import React from "react";
import type { Metadata } from "next";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Apartman Plus",
  description: "Site yönetimi genel bakış paneli",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
