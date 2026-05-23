Verdiğiniz mimari kararlar ve modül detayları doğrultusunda, Apartman Plus Resident Ops projesinin veritabanı şemasını **Prisma (Schema)** yapısında aşağıda hazırladım. Bu şema; multi-tenant izolasyonu, esnek rol yönetimi, OTP'li paket teslimatı ve seans bazlı rezervasyon mantığını tam olarak karşılayacak şekilde kurgulanmıştır.

### <a name="_kqxjd8frq5ul"></a>**Apartman Plus Resident Ops - Veritabanı Şeması (Prisma)**

Bu şema, sorgu güvenliği için siteId kullanımını ve kullanıcıların farklı sitelerde farklı rollere sahip olabilmesini sağlayan "Membership" modelini temel alır.

// --- TEMEL ALTYAPI VE MULTI-TENANCY ---

model Site {

`  `id String @id @default(cuid())

`  `name String

`  `address String?

`  `blocks Block[]

`  `memberships Membership[]

`  `announcements Announcement[]

`  `amenities Amenity[]

`  `auditLogs AuditLog[]

`  `createdAt DateTime @default(now())

}

model Block {

`  `id String @id @default(cuid())

`  `siteId String

`  `site Site @relation(fields: [siteId], references: [id])

`  `name String // Örn: A Blok

`  `units Unit[]

`  `tickets Ticket[] // Blok bazlı staff ataması için

}

model Unit {

`  `id String @id @default(cuid())

`  `blockId String

`  `block Block @relation(fields: [blockId], references: [id])

`  `unitNumber String // Örn: No: 42

`  `memberships Membership[]

`  `tickets Ticket[]

`  `visitors VisitorPass[]

`  `packages PackageDelivery[]

`  `reservations AmenityReservation[]

}

model User {

`  `id String @id @default(cuid())

`  `email String @unique

`  `fullName String

`  `passwordHash String

`  `memberships Membership[] // Kullanıcının farklı sitelerdeki rolleri

`  `auditLogs AuditLog[] // Aksiyon logları

}

// --- ESNEK ROL VE YETKİ YÖNETİMİ ---

model Membership {

`  `id String @id @default(cuid())

`  `userId String

`  `user User @relation(fields: [userId], references: [id])

`  `siteId String

`  `site Site @relation(fields: [siteId], references: [id])

`  `unitId String? // Resident ise dairesi

`  `unit Unit? @relation(fields: [unitId], references: [id])

`  `roleId String

`  `role Role @relation(fields: [roleId], references: [id])

`  `isActive Boolean @default(true)

}

model Role {

`  `id String @id @default(cuid())

`  `siteId String? // NULL ise sistem rolü, dolu ise siteye özel rol

`  `name String // Örn: Gece Güvenliği

`  `permissions String[] // Örn: ["VIEW\_VISITORS", "CREATE\_PACKAGES"]

`  `memberships Membership[]

}

// --- OPERASYONEL MODÜLLER ---

model Announcement {

`  `id String @id @default(cuid())

`  `siteId String

`  `site Site @relation(fields: [siteId], references: [id])

`  `title String

`  `content String

`  `priority String @default("NORMAL") // NORMAL, IMPORTANT, URGENT

`  `publishedAt DateTime @default(now())

`  `readReceipts ReadReceipt[]

}

model Ticket {

`  `id String @id @default(cuid())

`  `siteId String

`  `unitId String

`  `unit Unit @relation(fields: [unitId], references: [id])

`  `blockId String // Staff'ın yetkili olduğu blok kontrolü için

`  `block Block @relation(fields: [blockId], references: [id])

`  `category String // Teknik, Temizlik vb.

`  `status String @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED

`  `assignedStaffId String?

`  `activities TicketActivity[]

`  `attachments Attachment[]

`  `createdAt DateTime @default(now())

}

model VisitorPass {

`  `id String @id @default(cuid())

`  `unitId String

`  `unit Unit @relation(fields: [unitId], references: [id])

`  `visitorName String

`  `status String @default("EXPECTED") // EXPECTED, CHECKED_IN, CANCELLED

`  `visitDate DateTime

`  `otpCode String? // İsteğe bağlı hızlı giriş için

`  `checkedInAt DateTime?

}

model PackageDelivery {

`  `id String @id @default(cuid())

`  `unitId String

`  `unit Unit @relation(fields: [unitId], references: [id])

`  `otpCode String // Teslimat için zorunlu OTP

`  `status String @default("RECEIVED") // RECEIVED, DELIVERED

`  `carrierName String?

`  `receivedAt DateTime @default(now())

`  `deliveredAt DateTime?

}

model Amenity {

`  `id String @id @default(cuid())

`  `siteId String

`  `site Site @relation(fields: [siteId], references: [id])

`  `name String

`  `sessions AmenitySession[]

}

model AmenitySession {

`  `id String @id @default(cuid())

`  `amenityId String

`  `amenity Amenity @relation(fields: [amenityId], references: [id])

`  `startTime DateTime

`  `endTime DateTime

`  `capacity Int // O seansın maksimum kişi sayısı

`  `reservations AmenityReservation[]

}

model AmenityReservation {

`  `id String @id @default(cuid())

`  `sessionId String

`  `session AmenitySession @relation(fields: [sessionId], references: [id])

`  `unitId String

`  `unit Unit @relation(fields: [unitId], references: [id])

`  `status String @default("CONFIRMED")

}

// --- İZLENEBİLİRLİK VE SİSTEM ---

model AuditLog {

`  `id String @id @default(cuid())

`  `siteId String

`  `site Site @relation(fields: [siteId], references: [id])

`  `actorId String

`  `actor User @relation(fields: [actorId], references: [id])

`  `action String // CREATE, UPDATE, DELETE, etc.

`  `entity String // Ticket, Package, etc.

`  `oldValue Json?

`  `newValue Json?

`  `timestamp DateTime @default(now())

}

### <a name="_3x20uu2fmo64"></a>**Kritik Mimari Detaylar:**

1. **Staff ve Blok Ataması:** Ticket modelinde blockId tutularak, Staff rolündeki personelin sadece kendi assignedBlocks listesindeki talepleri görmesi backend seviyesinde filtrelenebilir.
1. **Seans ve Kapasite Mantığı:** Rezervasyonlar doğrudan Amenity yerine AmenitySession üzerinden yapılır. Böylece her saat dilimi için (örn. 09:00-10:00) ayrı bir kapasite ve doluluk kontrolü sağlanır.
1. **Audit Log (Detaylı):** oldValue ve newValue alanları sayesinde JSON formatında tam değişim geçmişi tutulur.
1. **OTP Güvenliği:** PackageDelivery tablosundaki otpCode alanı, güvenlik personeli paketi teslim ederken sakinden alacağı kodla doğrulanacaktır.

Veri modeli bu şekilde. **Bir sonraki adım olarak bu modelleri besleyecek olan "API Action Listesi" ve OTP/Rezervasyon akışlarını detaylandıralım mı?**
