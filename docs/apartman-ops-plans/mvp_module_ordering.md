# <a name="_h0wn7313b09d"></a>**MVP Modül Sıralaması**

Bence geliştirme sırası şöyle olmalı:

1. **Site / Apartman Yapısı ve Rol-Yetki Altyapısı**
1. **Bildirim Merkezi**
1. **Duyuru ve Acil Bildirim Modülü**
1. **Talep / Arıza Takip Modülü**
1. **Ziyaretçi Yönetimi Modülü**
1. **Paket / Kargo Takip Modülü**
1. **Ortak Alan Rezervasyonu Modülü**
1. **Resident App + Security Panel + Yönetici Paneli Birleştirme**

Asıl satış değeri 5 operasyon akışında: **duyuru, talep, ziyaretçi, paket, rezervasyon**. Ama bunların düzgün çalışması için önce **rol-yetki** ve **bildirim altyapısı** şart.

---

# <a name="_k5ik8xcpioo7"></a>**Agent’a Önce Verilecek Master Prompt**

Bunu geliştirme agent’ına en başta ver:

Sen kıdemli bir Product Engineer ve Full-Stack SaaS geliştirme agentısın.

Proje adı: Apartman Plus Resident Ops.

Ürün konumlandırması:

Bu ürün bir aidat, muhasebe, ERP veya finans sistemi değildir. Mevcut site yönetim/muhasebe sisteminin yerine geçmeyecek; onun yanında çalışan bir resident operations katmanı olacaktır.

Ana hedef:

Rezidans ve büyük sitelerde ziyaretçi, paket/kargo, ortak alan rezervasyonu, duyuru ve talep/arıza süreçlerini tek uygulamada toplayarak güvenlik, resepsiyon, yönetim ve sakin tarafındaki günlük operasyon kaosunu azaltmak.

Hedef kullanıcılar:

1\. Sakin

2\. Güvenlik / Resepsiyon

3\. Yönetici / Site Operasyon Ekibi

4\. Süper Admin / Sistem Yöneticisi

MVP dışı bırakılacaklar:

\- Aidat / finans / muhasebe

\- POS / ödeme

\- Sosyal feed

\- Komşular arası pazar yeri

\- Ürün içi AI asistan

\- IoT, plaka tanıma, akıllı kapı

\- E-devlet / kimlik doğrulama entegrasyonu

\- Kargo firması API entegrasyonu

\- Gelişmiş BI dashboard

\- QR check-in

\- Bekleme listesi, karmaşık rezervasyon kuralları

Genel geliştirme prensipleri:

\- Multi-tenant yapı olmalı: her site/apartman verisi birbirinden izole edilmeli.

\- Rol bazlı yetkilendirme sıkı uygulanmalı.

\- Sakin sadece kendi dairesi ve kendi işlemleriyle ilgili verileri görmeli.

\- Güvenlik sadece ziyaretçi ve paket/kargo operasyon ekranlarını görmeli.

\- Yönetici kendi sitesindeki tüm operasyon akışlarını yönetebilmeli.

\- Her kritik işlem audit/log mantığıyla kayıt altına alınmalı.

\- MVP sade, hızlı kullanılabilir ve operasyon personelinin anlayacağı kadar basit olmalı.

\- Her modül için backend, frontend, veri modeli, validasyon, yetki kontrolü ve temel testler hazırlanmalı.

Çıktı formatın:

1\. Kısa teknik analiz

2\. Veri modeli önerisi

3\. API / action listesi

4\. Ekranlar

5\. Yetki kuralları

6\. Edge case’ler

7\. Acceptance criteria

8\. Geliştirme planı

---

# <a name="_igkhy1uu9reo"></a>**1. Site / Apartman Yapısı ve Rol-Yetki Altyapısı Promptu**

Apartman Plus Resident Ops MVP için Site / Apartman Yapısı ve Rol-Yetki Altyapısı modülünü tasarla ve geliştir.

Amaç:

MVP’deki tüm modüllerin güvenli ve site bazlı çalışmasını sağlayacak temel yapıyı kurmak. Her site/rezidans kendi kullanıcılarını, bloklarını, dairelerini, güvenlik personelini ve yöneticilerini yönetebilmeli.

Kapsam:

\- Site / rezidans kaydı

\- Blok tanımlama

\- Daire / bağımsız bölüm tanımlama

\- Kullanıcı oluşturma

\- Kullanıcıyı daireye bağlama

\- Rol atama

\- Site bazlı veri izolasyonu

\- Basit davet / aktivasyon mantığı

\- Kullanıcı aktif/pasif durumu

\- Temel audit log

Roller:

\- SUPER_ADMIN: Tüm sistemleri görür.

\- SITE_ADMIN: Sadece kendi sitesini yönetir.

\- RESIDENT: Sadece kendi dairesi ve kendi işlemlerini görür.

\- SECURITY_RECEPTION: Ziyaretçi ve paket ekranlarını görür.

\- STAFF: Talep/arıza süreçlerinde atanmış işleri görebilir.

Önerilen veri modelleri:

\- Site

\- Block

\- Unit

\- User

\- UserProfile

\- Membership

\- Role

\- Invitation

\- AuditLog

Minimum ekranlar:

1\. Süper Admin site listesi

2\. Yönetici site ayarları

3\. Blok ve daire yönetimi

4\. Kullanıcı listesi

5\. Kullanıcı rol atama

6\. Basit davet ekranı

Yetki kuralları:

\- Resident başka dairenin verisini göremez.

\- Security finans, duyuru oluşturma veya kullanıcı yönetimine erişemez.

\- Site Admin başka sitenin verisini göremez.

\- Tüm sorgularda siteId zorunlu filtre olmalı.

Acceptance criteria:

\- Bir sitedeki kullanıcı başka sitenin verisine erişememeli.

\- Sakin sadece kendi dairesine bağlı kayıtları görebilmeli.

\- Güvenlik sadece ziyaretçi ve paket operasyonlarına erişebilmeli.

\- Yönetici kendi sitesindeki kullanıcı, blok ve daireleri yönetebilmeli.

\- Rol kontrolü backend tarafında zorunlu uygulanmalı.

\- Frontend sadece yetkili menüleri göstermeli.

MVP dışı:

\- Gelişmiş organizasyon hiyerarşisi

\- Muhasebe rolleri

\- Ödeme yetkileri

\- SSO

\- E-devlet doğrulama

---

# <a name="_sigyp4sa5dhu"></a>**2. Bildirim Merkezi Promptu**

Apartman Plus Resident Ops MVP için Bildirim Merkezi modülünü tasarla ve geliştir.

Amaç:

Duyuru, talep, ziyaretçi, paket ve rezervasyon modüllerinde oluşan önemli olayları kullanıcılara uygulama içi bildirim olarak göstermek. Bildirim merkezi, ürünün yaşayan bir operasyon aracı gibi hissedilmesini sağlamalı.

Kapsam:

\- Uygulama içi bildirim listesi

\- Okundu / okunmadı durumu

\- Okunmamış bildirim badge’i

\- Bildirime tıklayınca ilgili akışa yönlendirme

\- Bildirim tipi

\- Bildirim başlığı ve açıklaması

\- İlgili kayıt referansı

\- Kullanıcı bazlı bildirim görünürlüğü

Bildirim tipleri:

\- ANNOUNCEMENT_CREATED

\- URGENT_ANNOUNCEMENT

\- TICKET_CREATED

\- TICKET_STATUS_UPDATED

\- VISITOR_CREATED

\- VISITOR_CHECKED_IN

\- PACKAGE_RECEIVED

\- PACKAGE_DELIVERED

\- RESERVATION_CREATED

\- RESERVATION_CANCELLED

Önerilen veri modeli:

\- Notification

` `- id

` `- siteId

` `- recipientUserId

` `- type

` `- title

` `- message

` `- relatedEntityType

` `- relatedEntityId

` `- isRead

` `- readAt

` `- createdAt

Minimum ekranlar:

1\. Bildirim listesi

2\. Okunmamış bildirim rozeti

3\. Bildirim detayına yönlendirme

4\. Tümünü okundu işaretle

Yetki kuralları:

\- Kullanıcı sadece kendi bildirimlerini görür.

\- Site Admin kendi sitesindeki operasyon bildirimlerini görebilir.

\- Bildirimler siteId ile izole edilmelidir.

Acceptance criteria:

\- Yeni duyuru yayınlandığında sakinlere bildirim oluşmalı.

\- Talep durumu değiştiğinde talep sahibine bildirim gitmeli.

\- Paket kaydı açıldığında ilgili sakine bildirim gitmeli.

\- Bildirime tıklanınca ilgili modül detayına gidilmeli.

\- Okundu/okunmadı durumu doğru çalışmalı.

MVP dışı:

\- SMS

\- E-posta

\- WhatsApp entegrasyonu

\- Push notification provider entegrasyonu zorunlu değil; altyapı hazır bırakılabilir.

\- Gelişmiş bildirim tercihleri

---

# <a name="_qgweycv12fbt"></a>**3. Duyuru ve Acil Bildirim Modülü Promptu**

Apartman Plus Resident Ops MVP için Duyuru ve Acil Bildirim modülünü tasarla ve geliştir.

Amaç:

Site yönetiminin sakinlere tek merkezden duyuru yapmasını sağlamak. Duyurular dağınık WhatsApp mesajları yerine uygulamada kayıtlı, görünür ve takip edilebilir olmalı.

Kapsam:

\- Yönetici duyuru oluşturur.

\- Başlık, içerik, tarih, öncelik bilgisi girilir.

\- Duyuru tüm sakinlere yayınlanır.

\- Sakin duyuruları tarih sırasına göre görür.

\- Sakin duyuru detayına girince okundu bilgisi oluşur.

\- Kritik duyurular öncelikli işaretlenir.

\- Bildirim merkezine kayıt düşer.

Duyuru tipleri:

\- NORMAL

\- IMPORTANT

\- URGENT

Önerilen veri modeli:

\- Announcement

` `- id

` `- siteId

` `- title

` `- content

` `- priority

` `- status

` `- publishedAt

` `- createdByUserId

` `- createdAt

` `- updatedAt

\- AnnouncementReadReceipt

` `- id

` `- announcementId

` `- userId

` `- readAt

Minimum ekranlar:

1\. Yönetici duyuru listesi

2\. Yönetici duyuru oluşturma

3\. Yönetici duyuru detay ve okunma özeti

4\. Sakin duyuru listesi

5\. Sakin duyuru detay ekranı

Yetki kuralları:

\- Duyuru sadece Site Admin tarafından oluşturulur.

\- Resident sadece kendi sitesinin duyurularını görür.

\- Security duyuruları görüntüleyebilir ama oluşturamaz.

\- Başka siteye ait duyurular görünmez.

Acceptance criteria:

\- Yönetici duyuru oluşturup yayınlayabilmeli.

\- Sakin duyuruyu uygulamada görebilmeli.

\- Duyuru okununca read receipt oluşmalı.

\- Kritik duyuru listede görsel olarak ayrışmalı.

\- Duyuru yayınlandığında ilgili sakinlere bildirim oluşmalı.

\- Duyurular en yeniden eskiye sıralanmalı.

MVP dışı:

\- Hedef kitle segmentasyonu

\- Blok bazlı duyuru

\- Zamanlanmış yayın

\- Dosya eki

\- Yorum sistemi

\- Anket/oylama

---

# <a name="_lwi1psri7sb1"></a>**4. Talep / Arıza Takip Modülü Promptu**

Apartman Plus Resident Ops MVP için Talep / Arıza Takip modülünü tasarla ve geliştir.

Amaç:

Sakinlerin arıza, şikâyet ve taleplerini WhatsApp/telefon yerine kayıtlı ve takip edilebilir bir sisteme almasını sağlamak. Yönetim açık, işlemde ve çözülen talepleri net şekilde görebilmeli.

Kapsam:

\- Sakin yeni talep açar.

\- Kategori seçer.

\- Açıklama yazar.

\- Fotoğraf ekleyebilir.

\- Yönetici tüm talepleri listeler.

\- Yönetici talep durumunu günceller.

\- Talep sahibine durum bildirimi gider.

\- Sakin kendi geçmiş taleplerini görür.

\- Basit yorum/güncelleme geçmişi tutulur.

Talep durumları:

\- OPEN

\- IN_PROGRESS

\- RESOLVED

\- CANCELLED

Talep kategorileri MVP:

\- Teknik arıza

\- Temizlik

\- Güvenlik

\- Ortak alan

\- Gürültü / şikâyet

\- Diğer

Önerilen veri modeli:

\- Ticket

` `- id

` `- siteId

` `- unitId

` `- createdByUserId

` `- category

` `- title

` `- description

` `- status

` `- assignedToUserId

` `- createdAt

` `- updatedAt

` `- resolvedAt

\- TicketAttachment

` `- id

` `- ticketId

` `- fileUrl

` `- fileType

` `- createdAt

\- TicketActivity

` `- id

` `- ticketId

` `- actorUserId

` `- oldStatus

` `- newStatus

` `- note

` `- createdAt

Minimum ekranlar:

1\. Sakin talep oluşturma

2\. Sakin kendi taleplerim listesi

3\. Sakin talep detay

4\. Yönetici tüm talepler listesi

5\. Yönetici talep detay ve durum güncelleme

6\. Basit filtreler: durum, kategori, tarih

Yetki kuralları:

\- Resident sadece kendi taleplerini görür.

\- Site Admin kendi sitesindeki tüm talepleri görür.

\- Staff kendisine atanmış talepleri görebilir.

\- Security sadece yetki verilirse güvenlik kategorili talepleri görebilir.

\- Başka siteye ait talepler görünmez.

Acceptance criteria:

\- Sakin talep açabilmeli.

\- Talep açıldığında yönetici ekranında görünmeli.

\- Yönetici durumu Açık / İşlemde / Çözüldü olarak güncelleyebilmeli.

\- Durum değişince sakin bildirim almalı.

\- Sakin talep geçmişini görebilmeli.

\- Fotoğraf ekleme basit dosya URL mantığıyla çalışmalı.

\- Talep aktiviteleri kayıt altına alınmalı.

MVP dışı:

\- Gelişmiş SLA

\- Otomatik personel atama

\- Chat sistemi

\- Öncelik algoritması

\- Bakım planlama

\- Tekrarlayan iş emirleri

---

# <a name="_92xdkc5o2zu0"></a>**5. Ziyaretçi Yönetimi Modülü Promptu**

Apartman Plus Resident Ops MVP için Ziyaretçi Yönetimi modülünü tasarla ve geliştir.

Amaç:

Sakinin beklenen ziyaretçisini önceden sisteme girmesini, güvenlik/resepsiyon ekibinin girişte bu listeyi görmesini ve giriş kaydını tutmasını sağlamak. Telefonla “misafirim gelecek” akışı dijital ve kayıtlı hale gelmeli.

Kapsam:

\- Sakin beklenen ziyaretçi oluşturur.

\- Ziyaretçi adı, ziyaret tarihi, tahmini saat ve not girilir.

\- Güvenlik bugünkü beklenen ziyaretçileri listeler.

\- Güvenlik ziyaretçiyi “giriş yaptı” olarak işaretler.

\- Ziyaretçi gelmezse “gelmedi” veya “iptal” durumu oluşabilir.

\- Giriş logu tutulur.

\- Sakin ziyaretçi geçmişini görür.

Ziyaretçi durumları:

\- EXPECTED

\- CHECKED_IN

\- NO_SHOW

\- CANCELLED

Önerilen veri modeli:

\- VisitorPass

` `- id

` `- siteId

` `- unitId

` `- residentUserId

` `- visitorName

` `- visitDate

` `- expectedTime

` `- note

` `- status

` `- checkedInAt

` `- checkedInByUserId

` `- createdAt

` `- updatedAt

Minimum ekranlar:

1\. Sakin ziyaretçi oluşturma

2\. Sakin ziyaretçi listesi

3\. Güvenlik bugünkü beklenen ziyaretçiler ekranı

4\. Güvenlik ziyaretçi arama

5\. Güvenlik giriş işaretleme

6\. Yönetici ziyaretçi log ekranı

Yetki kuralları:

\- Resident sadece kendi dairesi adına ziyaretçi oluşturur.

\- Security kendi sitesindeki beklenen ziyaretçileri görür.

\- Security ziyaretçiyi check-in yapabilir.

\- Site Admin tüm ziyaretçi loglarını görebilir.

\- Başka sitenin ziyaretçileri görünmez.

Acceptance criteria:

\- Sakin ziyaretçi ön kaydı oluşturabilmeli.

\- Güvenlik bugünün ziyaretçilerini hızlıca görebilmeli.

\- Güvenlik ziyaretçiyi giriş yaptı olarak işaretleyebilmeli.

\- Check-in zamanı ve işlemi yapan güvenlik kullanıcısı kaydedilmeli.

\- Yönetici ziyaretçi geçmişini filtreleyebilmeli.

\- Ziyaretçi oluşturulduğunda istenirse güvenlik panelinde görünür olmalı.

MVP dışı:

\- QR kod

\- Plaka tanıma

\- Kimlik tarama

\- Turnike entegrasyonu

\- Misafir uygulaması

\- Otomatik geçiş izni

---

# <a name="_nz7g5pgofcpi"></a>**6. Paket / Kargo Takip Modülü Promptu**

Apartman Plus Resident Ops MVP için Paket / Kargo Takip modülünü tasarla ve geliştir.

Amaç:

Güvenlik/resepsiyonun teslim aldığı paketleri sisteme kaydetmesini, ilgili sakine bildirim gitmesini ve teslim alındığında kayıtlı şekilde kapatılmasını sağlamak. Kayıp paket tartışmaları ve sözlü koordinasyon yükü azaltılmalı.

Kapsam:

\- Güvenlik/resepsiyon gelen paketi sisteme girer.

\- Paket ilgili site, blok, daire ve sakine bağlanır.

\- Kargo firması adı opsiyonel girilir.

\- Paket açıklaması/notu opsiyonel girilir.

\- Sakin paket geldi bildirimi alır.

\- Paket teslim edilince güvenlik teslim edildi işaretler.

\- Teslim eden, teslim alan ve zaman kaydı tutulur.

\- Sakin paket geçmişini görür.

Paket durumları:

\- RECEIVED

\- NOTIFIED

\- DELIVERED

\- CANCELLED

Önerilen veri modeli:

\- PackageDelivery

` `- id

` `- siteId

` `- unitId

` `- residentUserId

` `- carrierName

` `- packageDescription

` `- status

` `- receivedByUserId

` `- receivedAt

` `- deliveredByUserId

` `- deliveredToName

` `- deliveredAt

` `- note

` `- createdAt

` `- updatedAt

Minimum ekranlar:

1\. Güvenlik paket kayıt ekranı

2\. Güvenlik bekleyen paketler listesi

3\. Güvenlik teslim edildi işaretleme

4\. Sakin paket bildirimleri

5\. Sakin paket geçmişi

6\. Yönetici paket log ekranı

Yetki kuralları:

\- Security paket oluşturabilir ve teslim edildi işaretleyebilir.

\- Resident sadece kendi dairesine ait paketleri görür.

\- Site Admin tüm paket kayıtlarını görür.

\- Başka siteye ait paketler görünmez.

Acceptance criteria:

\- Güvenlik paketi manuel kaydedebilmeli.

\- Paket kaydı oluşunca ilgili sakine bildirim gitmeli.

\- Paket teslim edildiğinde durum güncellenmeli.

\- Teslim zamanı ve işlemi yapan kullanıcı kaydedilmeli.

\- Sakin kendi paket geçmişini görebilmeli.

\- Yönetici paket kayıtlarını filtreleyebilmeli.

MVP dışı:

\- Barkod okuma

\- Kargo firması API entegrasyonu

\- Fotoğraflı teslim

\- Dijital imza

\- Dolap/locker entegrasyonu

---

# <a name="_k5kn9yfqxj2i"></a>**7. Ortak Alan Rezervasyonu Modülü Promptu**

Apartman Plus Resident Ops MVP için Ortak Alan Rezervasyonu modülünü tasarla ve geliştir.

Amaç:

Spor salonu, toplantı odası, havuz, misafir odası gibi ortak alanların basit ve çakışmasız şekilde rezerve edilmesini sağlamak. WhatsApp, Excel veya kapıdaki liste mantığı yerine görünür ve adil bir rezervasyon akışı kurulmalı.

Kapsam:

\- Yönetici rezervasyona açılacak ortak alanları tanımlar.

\- Sakin uygun gün/saatleri görür.

\- Sakin rezervasyon oluşturur.

\- Sistem aynı alan için zaman çakışmasını engeller.

\- Sakin kendi rezervasyonlarını görür.

\- Sakin rezervasyonu iptal edebilir.

\- Yönetici tüm rezervasyonları listeler.

\- Yönetici gerektiğinde rezervasyonu iptal edebilir.

MVP ortak alan örnekleri:

\- Toplantı odası

\- Spor alanı

\- Misafir odası

Önerilen veri modeli:

\- Amenity

` `- id

` `- siteId

` `- name

` `- description

` `- isActive

` `- openingTime

` `- closingTime

` `- slotDurationMinutes

` `- createdAt

` `- updatedAt

\- AmenityReservation

` `- id

` `- siteId

` `- amenityId

` `- unitId

` `- residentUserId

` `- startTime

` `- endTime

` `- status

` `- cancelledByUserId

` `- cancelledAt

` `- createdAt

` `- updatedAt

Rezervasyon durumları:

\- RESERVED

\- CANCELLED

\- COMPLETED

Minimum ekranlar:

1\. Yönetici ortak alan listesi

2\. Yönetici ortak alan oluşturma/düzenleme

3\. Sakin uygun saatleri görme

4\. Sakin rezervasyon oluşturma

5\. Sakin rezervasyonlarım

6\. Yönetici rezervasyon takvimi/listesi

Yetki kuralları:

\- Resident sadece kendi rezervasyonlarını oluşturur/görür.

\- Site Admin tüm rezervasyonları görür ve iptal edebilir.

\- Security sadece görüntüleme yetkisi verilirse görebilir.

\- Başka sitenin ortak alanları görünmez.

Çakışma kuralı:

Aynı amenityId için startTime-endTime aralığı başka aktif rezervasyonla kesişiyorsa rezervasyon oluşturulamaz.

Acceptance criteria:

\- Yönetici ortak alan tanımlayabilmeli.

\- Sakin uygun saatleri görebilmeli.

\- Sakin rezervasyon oluşturabilmeli.

\- Aynı alanda aynı zaman diliminde ikinci rezervasyon engellenmeli.

\- Sakin kendi rezervasyonunu iptal edebilmeli.

\- Yönetici tüm rezervasyonları listeleyip iptal edebilmeli.

\- Rezervasyon oluşunca bildirim merkezi kaydı oluşmalı.

MVP dışı:

\- Ödeme

\- Depozito

\- Onay akışı zorunluluğu

\- Bekleme listesi

\- Karmaşık kural motoru

\- Kapasite bazlı grup rezervasyonu

\- Tekrarlayan rezervasyon

---

# <a name="_5dksdmrfn2bz"></a>**8. Resident App + Security Panel + Yönetici Paneli Birleştirme Promptu**

Apartman Plus Resident Ops MVP için üç ana kullanıcı yüzeyini birleştir: Resident App, Security / Reception Panel ve Yönetici Paneli.

Amaç:

MVP modüllerini ayrı ayrı özellikler gibi değil, kullanıcı rollerine göre anlamlı bir ürün deneyimi olarak sunmak.

Resident App kapsamı:

\- Duyurular

\- Bildirimler

\- Talep açma

\- Taleplerim

\- Ziyaretçi oluşturma

\- Ziyaretçilerim

\- Rezervasyon yapma

\- Rezervasyonlarım

\- Paket bildirimleri

\- Paket geçmişi

Security / Reception Panel kapsamı:

\- Bugünkü beklenen ziyaretçiler

\- Ziyaretçi arama

\- Ziyaretçi check-in

\- Gelen paket kaydı

\- Bekleyen paketler

\- Paket teslim edildi işaretleme

\- Temel ziyaretçi/paket log görünümü

Yönetici Paneli kapsamı:

\- Duyuru yayınlama

\- Talepleri görüntüleme ve durum güncelleme

\- Rezervasyon alanlarını tanımlama

\- Rezervasyonları izleme

\- Ziyaretçi kayıtlarını izleme

\- Paket akışını izleme

\- Kullanıcı/rol yönetimi

\- Blok/daire yönetimi

Genel UX prensipleri:

\- Operasyon personeli için sade ve hızlı ekranlar tasarla.

\- Güvenlik ekranında büyük butonlar, hızlı arama ve bugünün işleri öncelikli olmalı.

\- Resident tarafında fazla teknik terim kullanma.

\- Yönetici tarafında liste, filtre ve durum görünürlüğü öne çıkmalı.

\- Mobil öncelikli düşün; ama yönetici paneli web/tablet kullanımına uygun olmalı.

Acceptance criteria:

\- Her rol giriş yaptığında sadece kendi menüsünü görmeli.

\- Resident, Security ve Site Admin deneyimleri birbirinden net ayrılmalı.

\- Tüm modüllerden gelen bildirimler tek merkezde görünmeli.

\- Kullanıcı yanlışlıkla yetkisiz ekrana erişmeye çalışırsa engellenmeli.

\- MVP demo akışı uçtan uca çalışmalı:

` `1. Yönetici duyuru yayınlar.

` `2. Sakin duyuruyu görür.

` `3. Sakin talep açar.

` `4. Yönetici talebi işlemde/çözüldü yapar.

` `5. Sakin ziyaretçi oluşturur.

` `6. Güvenlik ziyaretçiyi giriş yaptı işaretler.

` `7. Güvenlik paket kaydeder.

` `8. Sakin paket bildirimi alır.

` `9. Sakin ortak alan rezervasyonu yapar.

` `10. Yönetici rezervasyonları görür.

MVP dışı:

\- Gelişmiş dashboard

\- Grafik analitik

\- Tema sistemi

\- Sosyal akış

\- Chat

\- Finans ekranları

---

# <a name="_87r1db34dske"></a>**Agent’a Vereceğin En Mantıklı Geliştirme Sırası**

Bunu da direkt iş planı olarak verebilirsin:

Apartman Plus Resident Ops MVP geliştirme sırası:

Sprint 1:

\- Site / blok / daire / kullanıcı / rol altyapısı

\- Site bazlı veri izolasyonu

\- Auth ve rol bazlı menü yapısı

Sprint 2:

\- Bildirim merkezi

\- Duyuru ve acil bildirim modülü

Sprint 3:

\- Talep / arıza takip modülü

\- Talep durum güncelleme ve bildirim akışı

Sprint 4:

\- Ziyaretçi yönetimi

\- Security / Reception ziyaretçi ekranı

Sprint 5:

\- Paket / kargo takip modülü

\- Security / Reception paket ekranı

Sprint 6:

\- Ortak alan rezervasyonu

\- Çakışma engelleme

\- Yönetici rezervasyon listesi

Sprint 7:

\- Resident App, Security Panel ve Yönetici Paneli uçtan uca toparlama

\- Demo senaryosu

\- Yetki testleri

\- Temel hata düzeltmeleri
