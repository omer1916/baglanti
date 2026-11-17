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

İlk açılışta tanıtım sayfası gelir. “Demoya gir” ya da bir rol kartındaki “Bu rolle dene” ile platforma geçilir.
Rol, sonradan hesap menüsünden (sağ üstteki avatar) ya da sol menünün altındaki “Demo rolü” seçiminden değiştirilebilir.
Yapılan her değişiklik tarayıcıda saklanır. **Ayarlar › Demo verisini sıfırla** ile demo ilk haline döner.

## Sunumdaki başlıklar ve sitedeki karşılıkları

| Slayt | Konu | Sitede nerede |
|---|---|---|
| 1, 3 | Vizyon ve değer önerisi | Tanıtım sayfası (`#/hosgeldin`) |
| 4 | Hedef kullanıcılar (üye, moderatör, yönetici, marka) | Rol seçimi; her rolün menüsü ve yetkileri farklı |
| 5 | Site haritası | Sol menü grupları: Keşfet, Topluluklar, Bağlantılar, İletişim, Hesabım |
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
| — | Sponsor ihtiyaçları, ortak etkinlik, medya arşivi, SSS | `#/sponsorlar`, `#/etkinlikler?tab=ortak`, `#/medya`, `#/sss` |

## Dosyalar

```
index.html              uygulama kabuğu
assets/css/styles.css   tasarım sistemi (koyu ve açık tema, duyarlı yerleşim)
assets/js/data.js       örnek veri
assets/js/core.js       durum, ikonlar, çizimler, yardımcılar
assets/js/views.js      ekranlar
assets/js/app.js        yönlendirme ve etkileşimler
```

Not: Bu bir konsept prototiptir. Arka uç yoktur ve tüm kişi, kurum ve içerikler örnektir.
