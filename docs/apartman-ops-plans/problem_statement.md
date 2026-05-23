# <a name="_rj8eyzuk4o51"></a>**Problem Statement**

## <a name="_j5zta1hjxu6m"></a>**Ürün**

**Apartman Plus Resident Ops**

## <a name="_e3algu7qkb20"></a>**Problem Tanımı**

Büyük siteler ve rezidanslarda günlük yaşam operasyonları çoğu zaman merkezi, izlenebilir ve standart bir sistem üzerinden değil; güvenlik masası, resepsiyon, telefon aramaları, WhatsApp grupları, Excel tabloları ve sözlü iletişim üzerinden yürütülüyor. Bu da özellikle ziyaretçi yönetimi, kargo teslimi, ortak alan rezervasyonu, duyuru paylaşımı ve arıza/talep takibi gibi sık tekrarlanan süreçlerde sürekli sürtünme yaratıyor.

Sorun teknik olarak “uygulama eksikliği” değil.\
` `Sorun, **resident-facing operasyonların parçalı, kayıt dışı ve kişiye bağlı ilerlemesi**.

Bu nedenle site içinde yaşanan temel deneyim sorunu şudur:

**Sakinin günlük temas ettiği operasyonel akışlar dijital olarak birleşik değil; yönetim, güvenlik ve sakin aynı süreçleri farklı kanallardan yürütmeye çalışıyor.**

Bu problem, mevcut proje omurgasındaki duyuru, talep, bildirim ve rol bazlı yapı ihtiyacını zaten doğrulayan bir zemine oturuyor. Dokümantasyonda duyurular, ticket sistemi, bildirim merkezi, kullanıcı rolleri ve rezervasyon mantığı bu operasyonel soruna cevap verecek çekirdek alanlar olarak tanımlanmış durumda.

---

## <a name="_na13ymlp0ktr"></a>**1. Mevcut Durum**

Bugün birçok büyük site ve rezidansta şu tablo var:

### <a name="_fin2tcupy5rs"></a>**Ziyaretçi Yönetimi**

- Sakin güvenliği telefonla arıyor veya mesaj atıyor
- Güvenlik bilgiyi manuel not alıyor
- Önceden kayıtlı ziyaretçi akışı yok
- Giriş yetkisi kişiye göre değişiyor
- Kayıt tutulsa bile standart değil

### <a name="_6r7fd7g8ayq"></a>**Paket / Kargo Süreci**

- Paketler resepsiyon veya güvenliğe bırakılıyor
- Teslim bilgisi bazen sözlü aktarılıyor
- Sakin paketi geldi mi gelmedi mi anlamıyor
- Teslim edildiğine dair net dijital kayıt oluşmuyor
- Kargo kaybolduğunda sorumluluk belirsizleşiyor

### <a name="_ddslmq2kho7k"></a>**Ortak Alan Rezervasyonu**

- Havuz, spor salonu, toplantı odası, misafir odası gibi alanlar için rezervasyon süreci dağınık
- Rezervasyonlar WhatsApp, telefon veya kağıt listeler üzerinden yönetiliyor
- Çakışmalar ve adaletsizlik hissi oluşuyor
- Yönetim tarafı rezervasyon geçmişini ve kullanım yoğunluğunu net göremiyor

### <a name="_75q8jqhy2jcy"></a>**Duyuru ve Bilgilendirme**

- Duyurular farklı kanallardan yapılıyor
- Sakinlerin hangisinin duyuruyu gördüğü bilinmiyor
- Acil bilgilendirmeler zamanında ulaşmayabiliyor
- Kritik mesajlar kalabalık iletişim kanallarında kayboluyor

### <a name="_xd4qivi1sisi"></a>**Talep / Arıza Süreci**

- Sakin arıza veya şikâyeti telefonla, sözlü veya WhatsApp ile iletiyor
- Talep kayıt altına alınmadığı için süreç görünmez kalıyor
- Yönetim neyin açık, neyin kapalı olduğunu net takip edemiyor
- Aynı konu için tekrar tekrar iletişim kuruluyor
- Çözüm süresi ve hizmet kalitesi ölçülemiyor

Bu durum, dokümanlarda detaylandırılmış olan duyuru merkezi, arıza/ticket sistemi, bildirim merkezi ve rezervasyon modülü ihtiyacıyla birebir örtüşüyor.

---

## <a name="_8kw5bgw19gy9"></a>**2. Sorunun Etkisi**

Bu problemin etkisi sadece “işler biraz dağınık” seviyesinde değil.\
` `Doğrudan operasyon kalitesini, sakin memnuniyetini ve yönetimin algılanan profesyonelliğini etkiliyor.

### <a name="_hfl2hbziaiu0"></a>**A. Sakin Tarafındaki Etki**

- Duyurular kaçırılıyor
- Taleplerin akıbeti belirsiz kalıyor
- Paket teslimleri stres yaratıyor
- Rezervasyonlarda adaletsizlik hissi oluşuyor
- Yönetimle iletişim yorucu hale geliyor
- Sakin, yaşadığı yerde düzen değil karmaşa hissediyor

### <a name="_c6emtm98hq4r"></a>**B. Güvenlik / Resepsiyon Tarafındaki Etki**

- Aynı bilgi defalarca alınıyor
- Telefon ve mesaj trafiği artıyor
- İş yükü kişisel hafıza ve manuel takibe dayanıyor
- Hata yapma ihtimali yükseliyor
- Operasyon personeli sürekli “anlık yangın söndürme” modunda çalışıyor

### <a name="_x2zgmq1t9m4k"></a>**C. Yönetim Tarafındaki Etki**

- Süreçler görünmez hale geliyor
- Şikâyetler arttıkça yönetim baskı altında kalıyor
- Veriye dayalı değil, olay bazlı reaktif yönetim oluşuyor
- Yönetimin profesyonel algısı zayıflıyor
- Standart hizmet seviyesi sağlanamıyor
- Aynı işler farklı kişiler tarafından farklı şekilde yürütülüyor

### <a name="_8nqr5athn7zq"></a>**D. Ticari Etki**

Bu ürün finans çekirdeğine oynamasa da problem yine ekonomik sonuç üretir:

- personel zamanı boşa harcanır
- operasyonel verimsizlik büyür
- sakin memnuniyetsizliği artar
- yönetim şirketi için hizmet kalitesi düşer
- rezidans markası zarar görebilir
- yüksek servis beklentisi olan yapılarda itibar kaybı oluşur

Yani burada çözülen şey “konfor” değil;\
` `**operasyonel sürtünme, görünürlük eksikliği ve hizmet standardı sorunu**.

---

## <a name="_gjcg27xm95bp"></a>**3. Mevcut Alternatifler Neden Yetersiz**

Bugün bu sorunu çözmek için kullanılan alternatifler var.\
` `Ama çoğu ya dağınık ya da bu kullanım senaryosu için yeterince güçlü değil.

### <a name="_t5lstpkxram9"></a>**1. WhatsApp Grupları**

En yaygın geçici çözüm bu.

**Neden yetersiz?**

- süreç takibi yok
- kayıtlı iş akışı yok
- durum yönetimi yok
- geçmişe dönük görünürlük zayıf
- görev, rezervasyon ve teslim mantığı için uygun değil
- kalabalık mesaj trafiğinde kritik bilgi kaybolur

WhatsApp iletişim sağlar, operasyon yönetmez.

### <a name="_52cq7xnzatpa"></a>**2. Telefon + Sözlü İletişim**

Özellikle güvenlik ve resepsiyon tarafında hâlâ yoğun kullanılır.

**Neden yetersiz?**

- bilgi kişiye bağlı kalır
- kayıt oluşmaz
- vardiya değişimlerinde bilgi kaybı yaşanır
- geriye dönük doğrulama yapılamaz
- aynı konu tekrar tekrar anlatılır

### <a name="_tgu1we8y9rxc"></a>**3. Excel / Kağıt Defter / Manuel Listeler**

Rezervasyon, teslim, ziyaretçi kayıtları için sık kullanılan yöntemler.

**Neden yetersiz?**

- gerçek zamanlı değildir
- tüm paydaşlar erişemez
- sakin tarafına görünürlük vermez
- mobil kullanım zayıftır
- raporlama ve analiz imkânı sınırlıdır
- güvenlik ve erişim disiplini düşüktür

### <a name="_8bm4bsltv7u"></a>**4. Genel Muhasebe / Aidat Yazılımları**

Bazı sitelerde mevcut sistemler zaten vardır.

**Neden yetersiz?**

- bu sistemler çoğu zaman finans ve yönetim çekirdeğine odaklıdır
- resident-facing günlük yaşam operasyonları ikinci planda kalır
- kullanıcı deneyimi sakin yerine yönetim odaklıdır
- ziyaretçi, paket, concierge ve rezervasyon gibi akışlarda yeterince güçlü olmayabilir
- mevcut sistemler olsa bile operasyonel boşluk devam eder

Bu yüzden pazar fırsatı “mevcut sistemi söküp yerine geçmek” değil;\
` `**o sistemlerin yanında çalışan, günlük yaşam operasyonunu yöneten katman olmaktır**.

---

## <a name="_imilzwb6yxkd"></a>**4. Kimin Problemi**

### <a name="_8p09yfj55spr"></a>**Birincil Problem Sahibi**

- Site müdürü
- Tesis müdürü
- Operasyon yöneticisi
- Güvenlik / resepsiyon ekipleri

### <a name="_vfhl8st4j5o2"></a>**İkincil Problem Sahibi**

- Sakinler
- Yönetim firmaları
- Yönetim kurulları

### <a name="_i3lo55ikqyux"></a>**En Çok Acı Çeken Segment**

- 150+ bağımsız bölümlü siteler
- resepsiyon veya güvenlikli rezidanslar
- yoğun ziyaretçi ve paket trafiği olan yapılar
- ortak alan rezervasyonu kullanılan yaşam alanları
- hâlâ parçalı iletişim araçlarıyla yönetilen siteler

---

## <a name="_h9tn8ewk1g5t"></a>**5. Bu Problemin Çözülmesiyle Ne Değişir**

Sorun çözüldüğünde ortaya çıkan kazanım “insanlar biraz daha mutlu olur” kadar yumuşak bırakılmamalı. Somut çıktı şu olmalı:

- ziyaretçi süreçleri hızlanır
- kargo teslimi kayıtlı ve şeffaf hale gelir
- rezervasyonlar adil ve görünür olur
- duyurular tek merkezden ve ölçülebilir şekilde gider
- talepler kayıt altında ilerler
- güvenlik ve resepsiyon yükü azalır
- yönetim süreçleri daha profesyonel görünür
- sakin tarafında sürtünme ve belirsizlik azalır

---

## <a name="_avg1lv3l5q4e"></a>**6. Problem Statement Özeti**

**Büyük site ve rezidanslarda sakinlerin günlük yaşamını etkileyen operasyonel süreçler hâlâ parçalı araçlarla, manuel yöntemlerle ve kişiye bağlı şekilde yürütülüyor. Bu durum ziyaretçi, kargo, rezervasyon, duyuru ve talep yönetiminde kaos, görünmezlik ve memnuniyetsizlik yaratıyor. Mevcut çözümler iletişim sağlıyor ama operasyonu standartlaştırmıyor; mevcut yönetim yazılımları ise çoğu zaman resident-facing günlük akışları merkeze almıyor. Bu nedenle mevcut sistemi değiştirmeden devreye girebilen, site içi yaşam operasyonlarını tek merkezde toplayan bir resident operations katmanına ihtiyaç var.**

---

## <a name="_6mnh0so8xy6f"></a>**7. Kısa Acımasız Özet**

Asıl problem “site sakinleri daha mutlu olsun” değil.\
` `Asıl problem şu:

**Site içi günlük operasyonlar dağınık, görünmez ve kişiye bağlı yürüyor.**

Ürünün görevi de “topluluk hissi yaratmak” değil.\
` `Ürünün görevi:

**operasyonel sürtünmeyi azaltmak, görünürlük yaratmak ve günlük yaşam akışını düzenlemek.**

Bu netlik korunursa ürün satılır.\
` `Yumuşatılırsa tekrar nice-to-have kategoriye düşer.
