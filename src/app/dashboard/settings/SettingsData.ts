import {
  User,
  Shield,
  Users,
  Building,
  Mail,
  CalendarDays,
  Sparkles,
  Heart,
  Bell,
  Lock,
} from "lucide-react";

export function getGroupedTabs(isAdmin: boolean) {
  return [
    {
      title: "Benim Hesabım",
      items: [
        { id: "PROFILE", label: "Profil Bilgileri", icon: Sparkles },
        { id: "NOTIFICATIONS", label: "Bildirimlerim", icon: Bell },
        { id: "SECURITY", label: "Güvenlik", icon: Lock },
      ],
    },
    {
      title: "Dairem & Katılım",
      items: [
        { id: "ACCOUNT", label: "Üyelik Detayları", icon: User },
        { id: "PETS", label: "Evcil Hayvanlarım", icon: Heart },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Yönetici Paneli",
            items: [
              { id: "PROPERTIES", label: "Mülk Yönetimi", icon: Building },
              { id: "ROLES", label: "Rol Tanımlama", icon: Shield },
              { id: "AMENITIES", label: "Tesis Yönetimi", icon: CalendarDays },
              { id: "MEMBERS", label: "Üye Yönetimi", icon: Users },
              { id: "INVITE", label: "Üye Davet Et", icon: Mail },
            ],
          },
        ]
      : []),
  ];
}
