# <a name="_mtiznbz5xugi"></a>**MVP Kapsamı**

## <a name="_bgj5oi9xak7x"></a>**Ürün**

**Apartman Plus Resident Ops**

## <a name="_usx07xbk317k"></a>**MVP Amacı**

İlk versiyonun amacı, rezidans ve büyük sitelerde günlük yaşam operasyonlarını tek bir akışta toplamak ve şu soruya net cevap vermektir:

**“Mevcut muhasebe sistemine dokunmadan, ziyaretçi, paket, rezervasyon, duyuru ve talep süreçlerini gerçekten daha düzenli hale getirebiliyor muyuz?”**

Bu MVP’nin amacı “tam özellikli site uygulaması” çıkarmak değil.\
Amaç, operasyonel sürtünmeyi azaltan dar ama güçlü bir çekirdek oluşturmaktır.

Mevcut proje tabanında rol yapısı, duyurular, talepler, bildirim merkezi ve operasyon mantığı zaten bulunuyor. Bu yüzden MVP tamamen sıfırdan değil; bazı modüller hazır tabana yakın, bazıları ise yeni eklenecek.

---

## <a name="_o22dzka579r4"></a>**1. MVP’nin Temel Prensibi**

Bu MVP şu 3 ilkeye göre şekillenmeli:

### <a name="_8wopjgbob2fn"></a>**1. Mevcut sistemi söktürmeye çalışma**

Ürün, mevcut aidat/muhasebe yazılımının yerine geçmeyecek.\
Yanına kurulacak.

### <a name="_k8hazd5xxd58"></a>**2. Günlük kullanım sıklığı yüksek akışlara odaklan**

Her gün veya haftada çok sık yaşanan işler MVP’ye girmeli.

### <a name="_omldi791fhlj"></a>**3. Operasyonel netlik üretmeyen özellikleri dışarıda bırak**

“Güzel görünür” ama günlük acıyı çözmeyen modüller ilk sürüme girmemeli.

---

## <a name="_8ovl8qgvsvcd"></a>**2. Hedef Kullanıcılar**

MVP’de aktif kullanıcı tipleri:

- **Sakin**
- **Güvenlik / Resepsiyon**
- **Yönetici / Site Operasyon Ekibi**

İlk sürümde bu üç rolün tek bir operasyon akışında buluşması gerekir.\
Zaten mevcut dokümanlarda rol tabanlı yapı tanımlanmış durumda; Süper Admin, Apartman Yöneticisi, Kat Sakini ve Güvenlik/Görevli ayrımı var.

---

## <a name="_oqpcz2fcla44"></a>**3. Olmazsa Olmaz Özellikler**

## <a name="_t4mr6l37vxui"></a>**A. Duyuru ve Acil Bildirim Modülü**

Bu modül MVP’ye kesin girmeli.

### <a name="_lxmdpsvyqe1v"></a>**Neden gerekli?**

Duyuru, resident ops ürününde en temel ortak iletişim katmanıdır.\
Mevcut projede de duyurular ve bildirim merkezi zaten aktif omurganın içinde yer alıyor.

### <a name="_bymlc6dbyc6l"></a>**Minimum kapsam**

- Yönetici duyuru oluşturur
- Duyurular tarih sırasına göre listelenir
- Sakin duyuruyu uygulamada görür
- Okunma durumu basit seviyede izlenir
- Kritik duyurular “öncelikli” olarak işaretlenir
- Push/app içi bildirim gider

### <a name="_3ycpi9y8v1rt"></a>**MVP’de yeterli olan seviye**

- Başlık
- içerik
- tarih
- hedef kitle: tüm sakinler
- okunma bilgisi
- bildirim

### <a name="_mim9lax23yn"></a>**İlk değer**

Bu modül hemen görünür fayda üretir ve kullanıcıyı uygulamaya çekmek için temel giriş noktası olur.

---

## <a name="_vmywh3m27q1i"></a>**B. Talep / Arıza Takip Modülü**

Bu modül de MVP’ye kesin girmeli.

### <a name="_rofd03zcovsd"></a>**Neden gerekli?**

Talep yönetimi resident operations tarafında en somut değer üreten modüllerden biri.\
Mevcut projede ticket sistemi ve durum güncelleme altyapısı zaten düşünülmüş ve geliştirme tarafında aktif modül olarak yer alıyor.

### <a name="_s9rnz0qnynly"></a>**Minimum kapsam**

- Sakin yeni talep açar
- Kategori seçer
- Açıklama yazar
- Gerekirse fotoğraf ekler
- Yönetici veya operasyon ekibi talebi görür
- Durum günceller: Açık / İşlemde / Çözüldü
- Talep sahibine bildirim gider
- Sakin geçmiş taleplerini görür

### <a name="_3ha192yiz351"></a>**MVP’de yeterli olan seviye**

- Kategori
- açıklama
- fotoğraf URL veya basit dosya yükleme
- durum güncelleme
- zaman damgası
- rol bazlı görünürlük

### <a name="_4wg8vj1pfyou"></a>**İlk değer**

WhatsApp ve telefonla yürüyen talep trafiğini kayıt altına alır.

---

## <a name="_8dpfrti2gful"></a>**C. Ziyaretçi Yönetimi Modülü**

Bu modül MVP’nin ana ayrıştırıcılarından biri olmalı.

### <a name="_tdrmdijrrndf"></a>**Neden gerekli?**

Bu pivotun en güçlü satış alanlarından biri güvenlik ve resepsiyon akışı.\
Eğer ziyaretçi yönetimi olmazsa ürün “duyuru + talep uygulaması” gibi görünür ve resident ops tarafı eksik kalır.

### <a name="_jm6ftu9bmwoj"></a>**Minimum kapsam**

- Sakin beklenen ziyaretçiyi önceden oluşturur
- Ziyaretçi adı, tarih, saat, not girilir
- Güvenlik beklenen ziyaretçi listesini görür
- Giriş yapıldı / gelmedi bilgisi işaretlenir
- Giriş kaydı tutulur

### <a name="_uz3uhjh8lvc"></a>**MVP’de yeterli olan seviye**

- QR veya plaka tanıma gerekmez
- Kimlik tarama gerekmez
- Sadece ön kayıt + güvenlik ekranı + giriş logu yeterlidir

### <a name="_1kenx4tmgdzn"></a>**İlk değer**

Telefonla “misafirim gelecek” akışını sistemli hale getirir ve güvenlik masasına anlık pratik değer üretir.

---

## <a name="_loekx71v6vvk"></a>**D. Paket / Kargo Takip Modülü**

Bu modül MVP’de olmalı.

### <a name="_hlm3ruf7g37a"></a>**Neden gerekli?**

Özellikle rezidans ve concierge’li yapılarda günlük kullanım frekansı yüksektir.\
Ayrıca sakin tarafında en görünür sürtünmelerden biri budur.

### <a name="_v9jblqesg1z1"></a>**Minimum kapsam**

- Güvenlik / resepsiyon gelen paketi sisteme girer
- Paket hangi daire/sakin için kaydedilir
- Sakin bildirim alır
- Paket teslim alındığında işaretlenir
- Basit teslim geçmişi tutulur

### <a name="_2zcs8huzokfa"></a>**MVP’de yeterli olan seviye**

- barkod entegrasyonu gerekmez
- kargo firması API entegrasyonu gerekmez
- fotoğraflı teslim şart değil
- manuel kayıt + bildirim + teslim işaretleme yeterli

### <a name="_7n39kucrmnpd"></a>**İlk değer**

Kayıp paket tartışmalarını ve sözlü koordinasyon yükünü azaltır.

---

## <a name="_8iu84fsbqkxu"></a>**E. Ortak Alan Rezervasyonu Modülü**

Bu modül MVP’de olmalı, ama dar tutulmalı.

### <a name="_hfzczbcq5kjs"></a>**Neden gerekli?**

Rezervasyon çatışmaları resident-facing ürünlerde net acı noktalarından biridir.\
Mevcut teknik dokümanlarda rezervasyon sistemi zaten çekirdek modüllerden biri olarak tanımlanmış.

### <a name="_ipi8r5k4wc3o"></a>**Minimum kapsam**

- Yönetici rezervasyona açık alanları tanımlar
- Sakin uygun saatleri görür
- Rezervasyon oluşturur
- Çakışma engellenir
- Yönetici rezervasyonları listeler
- Gerekirse iptal edebilir

### <a name="_of7m1vo1owyf"></a>**MVP’de yeterli olan seviye**

- 1–3 ortak alanla başla
- onay akışı opsiyonel olabilir
- karmaşık kurallar olmasın
- bekleme listesi olmasın

### <a name="_n5mtkhezv8fi"></a>**İlk değer**

WhatsApp, Excel veya kapıdaki liste mantığını temizler.

---

## <a name="_fn5nzqw5sgdc"></a>**F. Bildirim Merkezi**

Bu modül MVP’de temel altyapı olarak yer almalı.

### <a name="_x0ektt82ves8"></a>**Neden gerekli?**

MVP’deki bütün modüllerin görünür çalışması için bildirim gerekir.\
Mevcut projede bildirim merkezi zaten aktif modül olarak tanımlanmış.

### <a name="_za83t5sr2v2x"></a>**Minimum kapsam**

- Uygulama içi bildirim listesi
- okunmamış badge
- ilgili akışa yönlendirme
- temel okunma/okundu işaretleme

### <a name="_g9p1e9gu8fmr"></a>**İlk değer**

Ürünün “gerçekten yaşayan bir operasyon aracı” gibi hissettirmesini sağlar.

---

## <a name="_v7d47w2bh5ti"></a>**G. Rol ve Yetkilendirme Altyapısı**

Bu modül ürünün görünmeyen ama kritik çekirdeği.

### <a name="_7oli0vd69dli"></a>**Minimum kapsam**

- Sakin sadece kendi akışlarını görür
- Güvenlik ziyaretçi ve paket ekranlarını görür
- Yönetici tüm operasyon ekranlarını görür
- Site bazlı veri ayrımı yapılır

Mevcut rol yapısı ve güvenlik mimarisi dokümanlarda tanımlanmış durumda; bu yüzden MVP’de bundan taviz verilmemeli.

---

## <a name="_r41wxocswb91"></a>**4. Sonra Eklenebilecek Özellikler**

Bunlar mantıklı ama MVP için şart değil.

### <a name="_ruemuo9lhbt"></a>**A. Anket ve Oylama**

Yönetim kararları için yararlı olabilir ama ilk sürümde gerekli değil.

### <a name="_yc30lzkvg18y"></a>**B. Etkinlik Takvimi**

Topluluk etkileşimini artırır ama resident ops’un çekirdek problemi değil.

### <a name="_vecl6uskc7mp"></a>**C. Taşınma Slot Yönetimi**

Değerli bir modül olabilir, özellikle büyük rezidanslarda. Ama ikinci faz daha doğru.

### <a name="_tetfdgesz03a"></a>**D. Ziyaretçi için QR Kod / Hızlı Check-in**

İyi özellik, ama ilk sürüm için gereksiz karmaşıklık.

### <a name="_4he38xnyhf95"></a>**E. Paket Fotoğrafı / İmza Teslimi**

Değerli ama ilk sürümde manuel teslim yeterli.

### <a name="_s0jrzd9o5j5l"></a>**F. Gelişmiş SLA ve Operasyon Analitiği**

İkinci faz için güçlü olabilir.

### <a name="_8wmt6sigvhvs"></a>**G. Çoklu Dil Desteği**

Bazı rezidanslarda gerekebilir ama ilk sürümün çekirdeği değil.

---

## <a name="_m5gkyeyqsse9"></a>**5. MVP Dışı Bırakılacaklar**

Aşağıdakiler özellikle ilk sürümde dışarıda kalmalı:

### <a name="_2km75rvhtfjy"></a>**1. Finans / Aidat / Muhasebe**

Bu yeni konumlandırmanın dışında.

### <a name="_b1skc89f67rt"></a>**2. Komşular Arası Pazar Yeri**

Dokümanlarda var, ama bu ürünün çekirdeği değil.

### <a name="_v6oxus1kgv5f"></a>**3. Sosyal Feed / Topluluk Akışı**

Kullanışlı olabilir ama “nice-to-have” riski taşır.

### <a name="_e5sks67allkr"></a>**4. AI Asistan**

Gösterişli ama erken.

### <a name="_9jxssylwhtfy"></a>**5. IoT ve Akıllı Donanım Entegrasyonları**

Plaka tanıma, akıllı kapı, sensör vb. ilk sürüm için gereksiz yük.

### <a name="_yepew7h815nz"></a>**6. E-devlet / kimlik doğrulama entegrasyonu**

Ağır operasyon ve hukuki karmaşıklık yaratır. İlk sürümde gerekmez.

### <a name="_loqcm7jifqzg"></a>**7. Gelişmiş POS / ödeme akışları**

Bu pivotta dışarıda.

### <a name="_bozy1n9bepwu"></a>**8. Detaylı raporlama ve dashboard analitiği**

Basit panel olabilir; ama kurumsal BI seviyesi raporlama ilk sürüm için gereksiz.

---

## <a name="_l8i8im9sgmai"></a>**6. Elle Çözülebilecek Süreçler**

MVP’nin hızlı çıkması için bazı süreçler başta manuel yönetilmeli.

### <a name="_wcyoiz74t37n"></a>**A. Site Kurulumu**

- bloklar
- daireler
- ortak alanlar
- güvenlik kullanıcıları
- yönetici hesapları

Başta admin panelinden veya kurulum desteğiyle manuel girilebilir.

### <a name="_35yzneblo0wv"></a>**B. Sakin Daveti / Onboarding**

İlk müşterilerde davet ve aktivasyon yarı manuel yapılabilir.

### <a name="_fuf9k7nqazjg"></a>**C. Paket Kayıt Akışı**

İlk aşamada güvenlik paketi elle girer.\
Kargo entegrasyonu gerekmez.

### <a name="_egdu80b82305"></a>**D. Ziyaretçi Oluşturma Kuralları**

Özel kurallar müşteri bazlı manuel konfigüre edilebilir.

### <a name="_aogq1u1bzwul"></a>**E. Rezervasyon Kuralları**

Alan başına saat sınırları, iptal kuralları gibi detaylar ilk müşterilerde manuel ayarlanabilir.

### <a name="_324yua5hezp8"></a>**F. Raporlama**

İlk sürümde kapsamlı dashboard yerine yöneticiye basit liste ve filtre ekranları yeterlidir.

---

## <a name="_1ju07h9896sv"></a>**7. MVP Başarı Kriterleri**

MVP canlıya alındığında aşağıdaki sonuçları üretebilmeli:

- Sakin duyuruları uygulama içinden düzenli görüyor mu?
- Talepler kayıtlı ve takip edilebilir hale geliyor mu?
- Güvenlik beklenen ziyaretçiyi sistemden kontrol edebiliyor mu?
- Paket teslim akışı kayıtlı çalışıyor mu?
- Ortak alan rezervasyon çatışmaları azalıyor mu?
- Yönetim “telefon ve WhatsApp trafiği azaldı” diyebiliyor mu?

Bunlar varsa MVP işlevsel demektir.\
Yoksa ürün hâlâ sadece özellik toplamıdır.

---

## <a name="_axsbhknl5kgi"></a>**8. Önerilen İlk Sürüm Paketi**

MVP’yi tek pakette şu şekilde özetle:

### <a name="_xq800v3ufdr4"></a>**Resident App**

- duyurular
- bildirimler
- talep açma
- ziyaretçi oluşturma
- rezervasyon yapma
- paket bildirimlerini görme

### <a name="_mxrs80tnzgua"></a>**Security / Reception Panel**

- beklenen ziyaretçi listesi
- paket giriş/teslim ekranı
- temel log görünümü

### <a name="_2nxo8xsgjj4f"></a>**Yönetici Paneli**

- duyuru yayınlama
- talepleri görüntüleme ve durum güncelleme
- rezervasyon alanlarını tanımlama
- ziyaretçi ve paket akışını izleme
- temel kullanıcı/rol yönetimi

---

## <a name="_dsgoq63z7i5l"></a>**9. Kısa Acımasız Özet**

MVP’nin amacı “çok özellikli görünmek” değil.\
Amaç şu 5 sorunu çözmek:

1. Duyuru karmaşası
1. Talep takipsizliği
1. Ziyaretçi düzensizliği
1. Paket teslim belirsizliği
1. Rezervasyon çatışması

Bunun dışına çıkarsan ürün yine genişler.\
Bu 5 akışı temiz çözersen ürün satılabilir hale gelir.

---

## <a name="_ed7pvw1vvbwf"></a>**10. Sonuç**

### <a name="_l3mtg9bmv5ct"></a>**MVP’ye girecek çekirdek modüller**

- Duyuru ve acil bildirim
- Talep / arıza takibi
- Ziyaretçi yönetimi
- Paket / kargo takibi
- Ortak alan rezervasyonu
- Bildirim merkezi
- Rol ve yetki altyapısı

### <a name="_qth2rax16t4"></a>**İkinci faz**

- anket
- etkinlik
- taşınma akışı
- QR check-in
- gelişmiş analitik
- çoklu dil
- sosyal katman

### <a name="_io0sz33bt5r8"></a>**MVP dışı**

- finans
- muhasebe
- pazar yeri
- topluluk feed’i
- AI
- IoT
- ağır entegrasyonlar

---

Bir sonraki mantıklı doküman **Value Proposition** ya da **Gelir Modeli** olur.
