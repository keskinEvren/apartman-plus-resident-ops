Apartman Plus Resident Ops projesinin veritabanı şemasını (Prisma) ve modül detaylarını netleştirdik. Şimdi, bu modelleri işletecek olan **API Action Listesi** ve sistemin en kritik iki akışı olan **OTP'li Paket Teslimat** ile **Seans Bazlı Rezervasyon** süreçlerini detaylandırıyoruz.

### **1. API Action Listesi (Modül Bazlı)**

Her modül için gerekli olan temel backend aksiyonları şunlardır:

#### **A. Altyapı ve Rol Yönetimi**

- POST /sites/:id/roles: Siteye özel yeni rol oluşturma (örn. "Gece Güvenliği").
- GET /sites/:id/memberships: Sitedeki tüm üyeleri ve rollerini listeleme.
- PATCH /memberships/:id: Kullanıcının rolünü veya aktiflik durumunu güncelleme.
- GET /users/me/sites: Kullanıcının bağlı olduğu siteleri listeleme (Site değiştirme için).

#### **B. Paket / Kargo (OTP Odaklı)**

- POST /packages: Güvenlik paketi sisteme girer (Sistem anlık otpCode üretir).
- GET /packages/pending: Teslim edilmeyi bekleyen paketleri listeleme.
- POST /packages/:id/verify-otp: Sakinden alınan OTP kodunu doğrulama ve paketi teslim etme (status -> DELIVERED).
- GET /units/:id/packages: Sakinin kendi paket geçmişini görmesi.

#### **C. Rezervasyon (Seans Odaklı)**

- POST /amenities/:id/sessions: Yönetici tarafından kapasite ve zaman dilimi (seans) tanımlama.
- GET /amenities/:id/availability: Belirli bir tarihteki boş seansları ve kalan kapasiteyi listeleme.
- POST /reservations: Sakin seçtiği seans için rezervasyon oluşturur (Kapasite kontrolü backend'de yapılır).
- DELETE /reservations/:id: Rezervasyon iptali (Yönetici veya Sakin tarafından).

#### **D. Ziyaretçi ve Talep**

- POST /visitors: Sakin beklenen ziyaretçi kaydı açar.
- PATCH /visitors/:id/check-in: Güvenlik ziyaretçinin girişini onaylar.
- POST /tickets: Sakin fotoğraf ekiyle birlikte talep/arıza açar.
- PATCH /tickets/:id/status: Staff veya Admin talebin durumunu günceller.

### -----**2. Kritik İş Akış Şemaları**

#### **Akış A: Paket Teslimat ve OTP Doğrulama**

Bu akış, teslimat güvenliğini ve "teslim almadım" tartışmalarını bitirmeyi amaçlar.

1. **Kayıt:** Güvenlik/Resepsiyon paketi teslim alır; Site, Blok ve Daire bilgisini seçerek sisteme girer.
1. **Üretim:** Sistem arka planda 4-6 haneli benzersiz bir otpCode üretir.
1. **Bildirim:** Sakine "Paketiniz teslim alındı. Teslimat kodunuz: [OTP]" şeklinde anlık bildirim gider.
1. **Doğrulama:** Sakin paketi almaya geldiğinde kodu güvenliğe söyler. Güvenlik kodu sisteme girer; kod eşleşirse paket DELIVERED olarak işaretlenir ve işlem loglanır.

#### **Akış B: Seans Bazlı Rezervasyon ve Çakışma Kontrolü**

Havuz, Gym gibi alanlarda "kişi sınırı" ve "zaman dilimi" kontrolü sağlar.

1. **Tanımlama:** Yönetici bir alan (örn. Havuz) için seanslar oluşturur (Örn: 09:00-10:00, Kapasite: 10 kişi).
1. **Sorgulama:** Sakin tarihi seçer; sistem o günkü seansları ve "Kalan Kontenjan" bilgisini döner.
1. **Kayıt:** Sakin rezervasyon isteği gönderdiğinde, backend AmenityReservation tablosunda o seans için count >= capacity kontrolü yapar.
1. **Onay:** Kontenjan varsa kayıt oluşturulur; yoksa "Kapasite dolu" hatası döner.

### -----**3. Audit Log Stratejisi**

Hangi tablo değişirse değişsin, AuditLog tablosuna şu formatta kayıt düşülmelidir:

- **Actor:** İşlemi yapan kullanıcı.
- **Action:** CREATE_TICKET, DELIVER_PACKAGE, UPDATE_ROLE.
- **Payload:** Yapılan değişikliğin oldValue ve newValue JSON verisi.

Bu API listesi ve akışlar, projenin backend katmanını kodlamak için tam bir kılavuz niteliğindedir.

Projenin kullanıcı arayüzü tarafına geçip **Güvenlik Paneli** veya **Resident App** için ekran tasarımlarını (wireframe/layout) detaylandırmamı ister misiniz?

Kaynaklar:

- [MVP Kapsamı](https://drive.google.com/open?id=11MpNOWV33Rf842MkzPH6ehKXnsuWMXtmwHLyb4baZZI)
- [MVP Modül Sıralaması](https://drive.google.com/open?id=1vDX7ztGNiW4sd-x0ZoD_Z0sCsRNuU5n5as-LzAbAVyw)
