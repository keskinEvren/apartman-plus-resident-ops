import React from "react";
import type { Metadata } from "next";
import { AnnouncementsClient } from "./AnnouncementsClient";

export const metadata: Metadata = {
  title: "Duyurular | Apartman Plus",
  description: "Duyuru ve toplu sakin iletişim sistemi",
};

export default function AnnouncementsPage() {
  return <AnnouncementsClient />;
}
