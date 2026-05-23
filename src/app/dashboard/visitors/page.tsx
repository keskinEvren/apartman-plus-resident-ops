import React from "react";
import type { Metadata } from "next";
import { VisitorsClient } from "./VisitorsClient";

export const metadata: Metadata = {
  title: "Ziyaretçi Ön Kayıt | Apartman Plus",
  description: "Ziyaretçileriniz için ön kayıt oluşturun ve yönetin",
};

export default function VisitorsPage() {
  return <VisitorsClient />;
}
