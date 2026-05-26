import {
  LayoutDashboard,
  CalendarDays,
  UserPlus,
  Package,
  LifeBuoy,
  Megaphone,
  Settings,
  Building,
  Shield,
  Users,
  Mail,
} from "lucide-react";

export function getNavSections(isAdmin: boolean) {
  return [
    {
      title: "Ana Sayfa",
      items: [
        { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
      ],
    },
    {
      title: "Operasyonlar",
      items: [
        {
          href: "/dashboard/bookings",
          label: "Rezervasyonlar",
          icon: CalendarDays,
        },
        { href: "/dashboard/visitors", label: "Ziyaretçiler", icon: UserPlus },
        { href: "/dashboard/packages", label: "Kargo", icon: Package },
        { href: "/dashboard/tickets", label: "Talepler", icon: LifeBuoy },
      ],
    },
    {
      title: "Topluluk",
      items: [
        {
          href: "/dashboard/announcements",
          label: "Duyurular",
          icon: Megaphone,
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Yönetim",
            items: [
              {
                href: "/dashboard/settings?tab=PROPERTIES",
                label: "Mülkler",
                icon: Building,
                isTab: "PROPERTIES",
              },
              {
                href: "/dashboard/settings?tab=ROLES",
                label: "Roller",
                icon: Shield,
                isTab: "ROLES",
              },
              {
                href: "/dashboard/settings?tab=AMENITIES",
                label: "Tesisler",
                icon: CalendarDays,
                isTab: "AMENITIES",
              },
              {
                href: "/dashboard/settings?tab=MEMBERS",
                label: "Üyeler",
                icon: Users,
                isTab: "MEMBERS",
              },
              {
                href: "/dashboard/settings?tab=INVITE",
                label: "Davetler",
                icon: Mail,
                isTab: "INVITE",
              },
            ],
          },
        ]
      : []),
    {
      title: "Sistem",
      items: [
        {
          href: "/dashboard/settings?tab=ACCOUNT",
          label: "Ayarlar",
          icon: Settings,
          isTab: "ACCOUNT",
        },
      ],
    },
  ];
}
