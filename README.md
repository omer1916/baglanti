# Bağlantı · Etkinlik Portalı (tıklanabilir prototip)

“Proje ön sunum” dosyasındaki 22 slaytta anlatılan sosyal içerik ve topluluk platformunun çalışan web prototipi.
Telefonda, tablette ve bilgisayarda çalışır. Kurulum ya da derleme adımı gerektirmez.

**Canlı demo:** [https://omer1916.github.io/baglanti/](https://omer1916.github.io/baglanti/)

## Yerelde nasıl açılır?

- **En kolayı:** `index.html` dosyasına çift tıklayın.
- **Yerel sunucuyla** (telefondan aynı ağ üzerinden açmak için):
  ```bash
  python -m http.server 5173
  ```
  Ardından `http://localhost:5173` adresine gidin. Telefondan açmak için `http://<bilgisayarın-IP-adresi>:5173` adresini kullanın; bunun için sunucuyu `--bind 0.0.0.0` ile başlatın.

İlk açılışta tanıtım sayfası gelir. Platforma iki yoldan girilir:

- **Hesapsız demo:** “Hesapsız dene” ile rol kartlarına inip “Bu rolle dene”yi seçin. Rol, sonradan sağ üstteki profil fotoğrafı menüsünden değiştirilebilir (mobilde de aynı yerde).
- **Hesapla giriş:** “Kayıt ol” ile hesap açın ya da “Giriş yap” ekranındaki **“Örnek hesabın bilgilerini doldur”** düğmesiyle hazır örnek hesaba girin.

Hesap ve demo verileri birbirinden ayrı saklanır. **Ayarlar › Hesabım** bölümünde saklanan kayıt görüntülenebilir, şifre değiştirilebilir ve hesap kalıcı olarak silinebilir.

## Hesap sistemi ve güvenlik

Arka uç olmadığı için sistem tek hesaplıdır ve tüm veriler yalnızca tarayıcının yerel deposunda (localStorage) tutulur; hiçbir sunucuya gönderilmez.

- Şifre düz metin saklanmaz: WebCrypto **PBKDF2-SHA256, 210.000 tur**, 16 baytlık rastgele tuz. Karşılaştırma sabit sürelidir.
- 5 hatalı denemede giriş kilitlenir; her yeni kilitte süre ikiye katlanır (30 sn → en fazla 15 dk). Hata mesajı hangi alanın yanlış olduğunu söylemez.
- Oturumlar rastgele bir belirteçle tutulur ve süresi dolar (sekme oturumu 12 saat, “Beni hatırla” 30 gün; varsayılan kapalı). Çıkış ya da şifre değişikliği diğer sekmelerdeki oturumları da kapatır.
- Bağlantıdan (URL) gelen değerler beyaz listeyle sınırlanır, ekrana yazılan tüm içerik kaçışlanır (XSS koruması).
- İçerik Güvenliği Politikası (CSP) yalnızca sitenin kendi betiklerine izin verir; dış ağ isteği, eklenti ve form gönderimi kapalıdır.
- Yüklenen fotoğraflar yeniden çizilerek **EXIF/GPS konum bilgisi silinir**; yalnızca izinli görsel ve video türleri kabul edilir.

> Bu bir istemci tarafı prototiptir. Tarayıcı deposuna erişebilen biri kayıtları değiştirebilir. Gerçek üründe kimlik doğrulama, kilitleme ve oturum yönetimi sunucuda yapılmalı; site HTTPS ve güvenlik başlıklarıyla (CSP, `frame-ancestors`, HSTS) sunulmalıdır.

## Sunumdaki başlıklar ve sitedeki karşılıkları

| Slayt | Konu | Sitede nerede |
|---|---|---|
| 1, 3 | Vizyon ve değer önerisi | Tanıtım sayfası (`#/hosgeldin`) |
| 4 | Hedef kullanıcılar (üye, moderatör, yönetici, marka) | Rol seçimi; her rolün menüsü ve yetkileri farklı |
| 5 | Site haritası | Sol menü: akış, keşfet, topluluklar, etkinlikler, sponsorlar, medya, üyeler. Mesajlar ve bildirimler üst çubukta; hesapla ilgili her şey profil fotoğrafı menüsünde |
| 6 | Haber akışı (3 kolon) | Ana sayfa: sol menü, ortada akış, sağda “Senin için” |
| 7 | Gönderi kartı | Beğen, yorum, paylaş, kaydet, gizle, bildir; kendi gönderinde düzenle ve sil |
| 8 | Gönderi oluşturma | “Oluştur” penceresi: karakter sınırı, medya önizleme, konum, duygu, görünürlük, taslak |
| 9 | Topluluk profili | `#/topluluk/doga`: kapak, sekmeler, sabitlenmiş duyuru |
| 10 | Üyeler ve bağlantılar | `#/uyeler`: gelen istekler, gönderilen istekler, öneriler, üye listesi |
| 11 | Gruplar | Herkese açık, özel ve gizli grup; üyelik isteği; kurallar; departmanlar |
| 12 | Sayfalar ve işletmeler | `#/sayfa/kuzey`: marka rolünde istatistik, yayın takvimi ve sayfa rolleri |
| 13 | Hikâyeler / dikey video | Akışın üstündeki topluluk hikâyeleri (24 saat, sessize al, gizle) |
| 14 | Mesajlaşma | `#/mesajlar`: bire bir ve grup sohbetleri, dosya veya görsel gönderme |
| 15 | Bildirim merkezi | Okundu/okunmadı, tür filtresi, sıklık ve sessiz saat ayarları |
| 16 | Arama ve keşfet | Sekmeli sonuçlar; tarih, konum, içerik türü ve gizlilik filtreleri |
| 17 | Gizlilik ve hesap | `#/ayarlar`: görünürlük, etiketleme, engelleme, veri indirme, 2FA, cihazlar |
| 18 | Güvenlik ve moderasyon | `#/yonetim` › Moderasyon: kuyruk, öncelik, uyar/kaldır/itiraz, denetim kayıtları |
| 19 | Mobil uyum ve erişilebilirlik | Mobilde alt menü, tablette ikon menü, klavye ile gezinme, kontrast, alt metin |
| 21 | KPI'lar | Yönetim paneli › Genel bakış |
| — | Sponsor ihtiyaçları, ortak etkinlik, medya arşivi, SSS | `#/sponsorlar`, `#/etkinlikler?tab=ortak`, `#/medya`, tanıtım sayfasındaki SSS bölümü (`#/sss`) |

## Dosyalar

```
index.html              uygulama kabuğu
assets/css/styles.css   tasarım sistemi (koyu ve açık tema, duyarlı yerleşim)
assets/js/data.js       örnek veri
assets/js/core.js       durum, ikonlar, çizimler, yardımcılar
assets/js/auth.js       hesap, kayıt, giriş ve oturum (göstermelik)
assets/js/views.js      ekranlar
assets/js/app.js        yönlendirme ve etkileşimler
```

Not: Bu bir konsept prototiptir. Arka uç yoktur ve tüm kişi, kurum ve içerikler örnektir.
