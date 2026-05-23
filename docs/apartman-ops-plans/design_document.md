# <a name="_voc4o9tcgf3k"></a>**Design Document: Apartman Plus Resident Ops (MVP)**

## <a name="_ql4obs6vag9r"></a>**1. Giriş ve Vizyon**

Bu proje, büyük site ve rezidanslarda mevcut mali (aidat/muhasebe) sistemlere dokunmadan, günlük yaşam operasyonlarını (ziyaretçi, paket, rezervasyon, talep, duyuru) yöneten profesyonel bir operasyonel katman sağlamak amacıyla tasarlanmıştır.

### <a name="_3flk5d4gcc0v"></a>**Temel Mimari Prensipler**

- **Multi-Tenant İzolasyonu:** Veri güvenliği merkezi bir filtreleme mekanizmasıyla sağlanır.
- **Bağlamsal Kullanıcı Deneyimi:** Kullanıcılar tek hesapla birden fazla sitede işlem yapabilir.
- **Dinamik Yetkilendirme:** Site yöneticileri kendi iş akışlarına uygun roller tanımlayabilir.

---

## <a name="_xj9gmyyo5lgb"></a>**2. Sistem Mimarisi ve Güvenlik**

### <a name="_qdd13zrnwcu9"></a>**2.1. Multi-Tenancy ve Sorgu Güvenliği**

- **Global Query Filter:** Veritabanı seviyesinde veya ORM interceptor katmanında tüm sorgulara otomatik olarak siteId filtresi enjekte edilir. Hiçbir kullanıcı yetkisi olmayan bir sitenin verisine erişemez.
- **Context Switching:** Kullanıcı tablosu ve site üyeliği (Membership) ayrıştırılmıştır. Bir kullanıcı farklı sitelerde farklı rollere (örn. Site A'da Resident, Site B'de Admin) sahip olabilir.

### <a name="_5yxyozu8r6ls"></a>**2.2. Rol Tabanlı Erişim Kontrolü (Dinamik RBAC)**

Sabit roller yerine, yetki havuzundan beslenen esnek bir yapı kullanılır:

- **SUPER_ADMIN:** Sistem geneli yönetim.
- **SITE_ADMIN:** Kendi sitesi için özel roller (örn. "Gece Güvenliği", "Teknik Ekip") oluşturabilir ve yetki setlerini atayabilir.
- **STAFF:** Sadece kendisine atanan bloklar veya kategorilerle ilgili talepleri görebilir.
- **SECURITY_RECEPTION:** Ziyaretçi ve paket operasyonlarına odaklı kısıtlı erişim.
- **RESIDENT:** Sadece kendi dairesi ve kişisel verileri.

---

## <a name="_j1ltir4b2udx"></a>**3. Veri Modeli Tasarımı (Core Entities)**

|    **Modül**    |            **Temel Tablolar**             |             **Kritik Alanlar**             |
| :-------------: | :---------------------------------------: | :----------------------------------------: |
|   **Altyapı**   | Site, Block, Unit, User, Membership, Role |      siteId, unitId, rolePermissions       |
|   **Duyuru**    |         Announcement, ReadReceipt         |           priority, publishedAt            |
|    **Talep**    |    Ticket, TicketActivity, Attachment     |      status, assignedStaffId, blockId      |
|  **Ziyaretçi**  |                VisitorPass                |  visitDate, status (Expected, CheckedIn)   |
|    **Paket**    |              PackageDelivery              |   otpCode, status (Received, Delivered)    |
| **Rezervasyon** |   Amenity, AmenitySession, Reservation    | capacity, sessionLimit, startTime, endTime |
|   **Sistem**    |          AuditLog, Notification           |  actorId, actionType, timestamp, payload   |

---

## <a name="_4kf5l9h8ixzd"></a>**4. Modüler İş Akışları ve Mantıksal Kurallar**

### <a name="_16oe2zt95425"></a>**4.1. Paket ve Kargo (OTP Doğrulama)**

Güvenlik bir paket kaydettiğinde sistem otomatik olarak benzersiz bir **OTP kodu** üretir ve sakine bildirim gönderir. Teslimatın tamamlanması için güvenliğin bu kodu sisteme girmesi zorunludur.

### <a name="_xjchof91eelz"></a>**4.2. Rezervasyon ve Seans Yönetimi**

Ortak alanlarda (gym, havuz vb.) çakışmayı önlemek için:

- **Kapasite Sınırı:** Her seans için maksimum kişi sayısı tanımlanır.
- **Çakışma Kontrolü:** Aynı zaman dilimi için kapasite dolduğunda yeni rezervasyon engellenir.

### <a name="_ig9xkv2qm72r"></a>**4.3. Ziyaretçi Yönetimi**

Sakinler tarafından oluşturulan kayıtlar **Single Entry (Tekil Giriş)** mantığıyla çalışır. Güvenlik giriş işlemini (Check-in) onayladığında kayıt kapanır.

### <a name="_y6p0owjq0en1"></a>**4.4. Detaylı Audit Log**

Sistemde veri okuma (viewing) dışındaki tüm aksiyonlar (kim, neyi, ne zaman, hangi değerle değiştirdi) AuditLog tablosuna kaydedilir. Bu, operasyonel şeffaflık ve güvenlik için zorunludur.-----

## <a name="_n92b8jrwtdq"></a>**5. Teknik Altyapı Tercihleri**

- **Dosya Yönetimi:** Başlangıç maliyetlerini düşürmek için ücretsiz/uygun maliyetli nesne depolama servisleri (örn. AWS S3 Free Tier veya benzeri) kullanılacaktır.
- **Gerçek Zamanlı Bildirimler:** Anlık paket ve ziyaretçi haberleşmesi için WebSocket altyapısı (örn. Socket.io) entegre edilecektir.

---

## <a name="_8f0xpkh5bbws"></a>**6. MVP Kapsamı Dışı (Roadmap)**

- Aidat, finans ve muhasebe entegrasyonları.
- IoT, plaka tanıma ve akıllı kapı sistemleri.
- Komşular arası pazar yeri ve sosyal akışlar.
  -----Bu doküman, belirlediğin tüm kriterleri (OTP, seans yönetimi, dinamik roller, blok bazlı staff atama) kapsayacak şekilde hazırlanmıştır.
