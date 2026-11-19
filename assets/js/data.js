/* Bağlantı · Etkinlik Portalı — demo verisi
   Tüm veriler örnek amaçlıdır; gerçek kişi ve kurumları temsil etmez. */
(function () {
  const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  window.SEED = function () {
    const now = Date.now();
    const ago = (m) => now - m * MIN;
    const inDays = (d, h = 10, mm = 0) => {
      const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, mm, 0, 0); return t.getTime();
    };

    return {
      version: 1,
      onboarded: false,
      role: 'uye', // uye | moderator | yonetici | marka
      theme: 'light', themeV: 2,
      me: 'u0',

      users: {
        u0: { id: 'u0', name: 'Selin Koç', handle: 'selinkoc', city: 'Bursa', hue: 0, bio: 'Doğa yürüyüşü, fotoğraf ve iyi kahve. Hafta sonları rotadayım.', joined: '2024', dept: 'Uludağ Üni. · İşletme', tags: ['tg5', 'tg6'] },
        u1: { id: 'u1', name: 'Deniz Yılmaz', handle: 'denizy', city: 'Bursa', hue: 1, bio: 'Kod & Kahve topluluk yöneticisi.', dept: 'Bursa Teknik Üni. · Bilgisayar Müh.', tags: ['tg1', 'tg2'] },
        u2: { id: 'u2', name: 'Ece Demir', handle: 'ecedemir', city: 'Bursa', hue: 2, bio: 'Doğa fotoğrafçısı.', dept: 'Uludağ Üni. · Biyoloji' },
        u3: { id: 'u3', name: 'Ayşe Kaya', handle: 'aysekaya', city: 'Bursa', hue: 3, bio: 'Doğa ve Kamp grubu moderatörü.', title: 'X Topluluğu Moderatörü', dept: 'Uludağ Üni. · Orman Müh.', tags: ['tg5'] },
        u4: { id: 'u4', name: 'Mert Arslan', handle: 'mertarslan', city: 'İstanbul', hue: 4, bio: 'Bisiklet ve şehir rotaları.', dept: 'Uludağ Üni. · Bilgisayar Müh.', tags: ['tg1'] },
        u5: { id: 'u5', name: 'Can Öztürk', handle: 'canozturk', city: 'Bursa', hue: 5, bio: 'Müzik atölyesi gitaristi.', dept: 'Uludağ Üni. · Müzik Öğretmenliği' },
        u6: { id: 'u6', name: 'Zeynep Aydın', handle: 'zeynepaydin', city: 'İzmir', hue: 1, bio: 'Gönüllü Eller koordinatörü.', dept: 'Ege Üni. · Sosyal Hizmet' },
        u7: { id: 'u7', name: 'Burak Şahin', handle: 'buraksahin', city: 'Bursa', hue: 2, bio: 'Kampçı, ekipman meraklısı.', dept: 'Bursa Teknik Üni. · Makine Müh.', tags: ['tg5', 'tg6', 'tg1', 'tg2', 'tg4'] },
        u8: { id: 'u8', name: 'Elif Çelik', handle: 'elifcelik', city: 'Ankara', hue: 3, bio: 'Fotoğraf kulübü üyesi.', dept: 'Bursa Teknik Üni. · Peyzaj Mimarlığı' },
        u9: { id: 'u9', name: 'Kaan Erdem', handle: 'kaanerdem', city: 'Bursa', hue: 4, bio: 'Yazılım geliştirici.', dept: 'Uludağ Üni. · Yazılım Müh.', tags: ['tg1'] }
      },

      communities: {
        doga: {
          id: 'doga', name: 'Doğa ve Kamp', kind: 'grup', type: 'Herkese açık', members: 18400, city: 'Bursa',
          category: 'Kamp', scene: 'camp', hue: 2, joined: true, requested: false,
          desc: 'Haftalık rota önerileri, ekipman sohbetleri ve ortak kamp etkinlikleri.',
          rules: ['Rota paylaşırken güvenlik notlarını ekleyin.', 'Doğaya iz bırakmayın; çöpünüzü geri getirin.', 'Satış ve reklam yalnızca sponsor duyurularında.', 'Saygılı dil; nefret ve taciz yasaktır.'],
          tags: ['rota', 'ekipman', 'kamp', 'uludağ'],
          pinned: 'Kasım ayı kamp takvimi yayınlandı. Kayıtlar etkinlik sayfasından yapılır.',
          moderators: ['u3', 'u7'], admins: ['u3'],
          departments: [
            { id: 'd1', name: 'Rota & Planlama', topics: [{ t: 'Uludağ kış rotaları', open: true }, { t: 'Kazdağları 3 günlük plan', open: true }] },
            { id: 'd2', name: 'Ekipman', topics: [{ t: 'Uyku tulumu önerileri', open: true }, { t: 'İkinci el ekipman takası', open: false }] },
            { id: 'd3', name: 'Güvenlik', topics: [{ t: 'İlk yardım eğitimi', open: true }] }
          ],
          sponsors: ['zirve', 'kuzey'], created: '2019'
        },
        kodkahve: {
          id: 'kodkahve', name: 'Kod & Kahve Topluluğu', kind: 'topluluk', type: 'Herkese açık', members: 248, city: 'Bursa',
          category: 'Teknoloji', scene: 'code', hue: 1, joined: true, requested: false,
          desc: 'Yazılım geliştiricilerin buluştuğu, atölye ve meetup düzenleyen yerel topluluk.',
          rules: ['Soru sorarken kod örneği paylaşın.', 'İş ilanları yalnızca #kariyer etiketiyle.', 'Kişisel veri paylaşmayın.'],
          tags: ['yazılım', 'meetup', 'atölye', 'kariyer'],
          pinned: 'Aralık meetup konuşmacı başvuruları açık.',
          moderators: ['u1', 'u9'], admins: ['u1'],
          departments: [
            { id: 'd1', name: 'Etkinlik ekibi', topics: [{ t: 'Aralık meetup programı', open: true }] },
            { id: 'd2', name: 'İçerik', topics: [{ t: 'Blog yazı sırası', open: true }, { t: 'Podcast fikirleri', open: false }] }
          ],
          sponsors: ['kuzey'], created: '2021'
        },
        foto: {
          id: 'foto', name: 'Bursa Fotoğraf Kulübü', kind: 'topluluk', type: 'Özel', members: 1260, city: 'Bursa',
          category: 'Sanat', scene: 'photo', hue: 3, joined: false, requested: false,
          desc: 'Foto yürüyüşleri, sergiler ve teknik paylaşımlar.',
          rules: ['Paylaşılan fotoğraflar size ait olmalı.', 'Eleştiri yapıcı olmalı.'],
          tags: ['fotoğraf', 'sergi', 'fotoyürüyüşü'],
          pinned: 'Kış sergisi için eser teslimi 10 Aralık.', moderators: ['u8'], admins: ['u8'],
          departments: [{ id: 'd1', name: 'Sergi', topics: [{ t: 'Kış sergisi seçkisi', open: true }] }],
          sponsors: ['kitabevi'], created: '2016'
        },
        bisiklet: {
          id: 'bisiklet', name: 'Uludağ Bisiklet Topluluğu', kind: 'topluluk', type: 'Herkese açık', members: 3420, city: 'Bursa',
          category: 'Spor', scene: 'bike', hue: 4, joined: false, requested: false,
          desc: 'Şehir içi ve dağ bisikleti turları, bakım atölyeleri.',
          rules: ['Kask zorunludur.', 'Tur sırasında grup liderini takip edin.'],
          tags: ['bisiklet', 'tur', 'bakım'], pinned: 'Pazar sabahı Mudanya turu 08:00’de.',
          moderators: ['u4'], admins: ['u4'], departments: [{ id: 'd1', name: 'Turlar', topics: [{ t: 'Mudanya sahil turu', open: true }] }],
          sponsors: ['pedal'], created: '2018'
        },
        muzik: {
          id: 'muzik', name: 'Müzik Atölyesi', kind: 'grup', type: 'Herkese açık', members: 940, city: 'Bursa',
          category: 'Müzik', scene: 'music', hue: 5, joined: true, requested: false,
          desc: 'Jam session’lar, açık sahne geceleri ve enstrüman dersleri.',
          rules: ['Telifli içerik paylaşırken kaynak belirtin.'], tags: ['jam', 'açıksahne', 'gitar'],
          pinned: 'Açık sahne gecesi için sıra listesi etkinlik sayfasında.', moderators: ['u5'], admins: ['u5'],
          departments: [{ id: 'd1', name: 'Sahne', topics: [{ t: 'Ses sistemi ihtiyaçları', open: true }] }],
          sponsors: ['kuzey'], created: '2022'
        },
        gonullu: {
          id: 'gonullu', name: 'Gönüllü Eller', kind: 'topluluk', type: 'Gizli', members: 610, city: 'İzmir',
          category: 'Gönüllülük', scene: 'volunteer', hue: 1, joined: false, requested: false,
          desc: 'Sosyal sorumluluk projeleri ve yardım kampanyaları.',
          rules: ['Bağış kampanyaları yönetici onayıyla yayınlanır.'], tags: ['gönüllülük', 'yardım'],
          pinned: 'Kışlık mont kampanyası devam ediyor.', moderators: ['u6'], admins: ['u6'],
          departments: [{ id: 'd1', name: 'Kampanyalar', topics: [{ t: 'Kışlık mont', open: true }] }],
          sponsors: [], created: '2020'
        }
      },

      pages: {
        kuzey: { id: 'kuzey', name: 'Kuzey Kahve', category: 'Kafe & mekân', verified: true, followers: 12500, following: false, scene: 'coffee', hue: 3, desc: 'Kahve, topluluk ve etkinlik duyuruları. Topluluk buluşmalarına mekân sponsoru.', city: 'Bursa', stats: { reach: 48200, engagement: 6.4, growth: 312 } },
        zirve: { id: 'zirve', name: 'Zirve Outdoor', category: 'Outdoor ekipman', verified: true, followers: 8900, following: true, scene: 'mountain', hue: 2, desc: 'Kamp ve dağcılık ekipmanları. Doğa topluluklarına ekipman desteği.', city: 'Bursa', stats: { reach: 30100, engagement: 5.1, growth: 190 } },
        pedal: { id: 'pedal', name: 'Yeşil Pedal', category: 'Bisiklet mağazası', verified: false, followers: 2300, following: false, scene: 'bike', hue: 4, desc: 'Bisiklet satış, kiralama ve bakım.', city: 'Bursa', stats: { reach: 9100, engagement: 4.2, growth: 64 } },
        kitabevi: { id: 'kitabevi', name: 'Nilüfer Kitabevi', category: 'Kitabevi', verified: true, followers: 5400, following: false, scene: 'city', hue: 5, desc: 'Söyleşiler, imza günleri ve okuma kulüpleri.', city: 'Bursa', stats: { reach: 15800, engagement: 3.8, growth: 88 } }
      },

      events: [
        { id: 'e1', title: 'Uludağ Kış Kampı', communities: ['doga', 'bisiklet'], start: inDays(4, 9), location: 'Uludağ Milli Parkı, Bursa', category: 'Kamp', going: 64, capacity: 80, attending: true, interested: false, sponsors: ['zirve'], scene: 'camp', desc: 'İki günlük kış kampı. Ekipman listesi ve ulaşım planı etkinlik sohbetinde paylaşılacak. Doğa ve Kamp ile Uludağ Bisiklet Topluluğu ortak etkinliği.', form: { fields: ['phone', 'dept'], questions: [{ id: 'q1', label: 'Kamp deneyimin', type: 'choice', options: ['İlk kez', 'Birkaç kez', 'Deneyimliyim'], required: true }, { id: 'q2', label: 'Beslenme tercihi / alerji', type: 'text', required: false }] }, responses: [
          { id: 'r1', user: 'u1', ts: ago(300), a: { name: 'Deniz Yılmaz', email: 'deniz@ornek.com', phone: '0532 111 22 33', dept: 'Bursa Teknik Üni. · Bilgisayar Müh.', q1: 'Deneyimliyim', q2: '' } },
          { id: 'r2', user: 'u2', ts: ago(700), a: { name: 'Ece Demir', email: 'ece@ornek.com', phone: '0533 222 33 44', dept: 'Uludağ Üni. · Biyoloji', q1: 'Birkaç kez', q2: 'Vejetaryen' } },
          { id: 'r3', user: 'u4', ts: ago(1500), a: { name: 'Mert Arslan', email: 'mert@ornek.com', phone: '0535 333 44 55', dept: 'Uludağ Üni. · Bilgisayar Müh.', q1: 'İlk kez', q2: 'Fıstık alerjisi' } },
          { id: 'r4', user: 'u7', ts: ago(2600), a: { name: 'Burak Şahin', email: 'burak@ornek.com', phone: '0536 444 55 66', dept: 'Bursa Teknik Üni. · Makine Müh.', q1: 'Deneyimliyim', q2: '' } }
        ] },
        { id: 'e2', title: 'Aralık Meetup: Web’de Erişilebilirlik', communities: ['kodkahve'], start: inDays(9, 19), location: 'Kuzey Kahve, Nilüfer', category: 'Teknoloji', going: 41, capacity: 60, attending: false, interested: true, sponsors: ['kuzey'], scene: 'code', desc: 'Klavye ile gezinme, kontrast ve ekran okuyucu testleri üzerine iki kısa konuşma ve soru-cevap.', form: { fields: ['studentNo', 'dept'], questions: [{ id: 'q1', label: 'En çok hangi konuşmayı merak ediyorsun?', type: 'choice', options: ['Klavye ile gezinme', 'Kontrast ve renk', 'Ekran okuyucu testleri'], required: true }] }, responses: [
          { id: 'r5', user: 'u9', ts: ago(400), a: { name: 'Kaan Erdem', email: 'kaan@ornek.com', studentNo: '21360859', dept: 'Uludağ Üni. · Yazılım Müh.', q1: 'Ekran okuyucu testleri' } },
          { id: 'r6', user: 'u4', ts: ago(1900), a: { name: 'Mert Arslan', email: 'mert@ornek.com', studentNo: '032190045', dept: 'Uludağ Üni. · Bilgisayar Müh.', q1: 'Klavye ile gezinme' } }
        ] },
        { id: 'e3', title: 'Açık Sahne Gecesi', communities: ['muzik'], start: inDays(2, 20, 30), location: 'Kuzey Kahve, Nilüfer', category: 'Müzik', going: 88, capacity: 120, attending: false, interested: false, sponsors: ['kuzey'], scene: 'music', desc: 'Herkesin 10 dakikalık sahne hakkı var. Sıra listesi etkinlik günü 19:00’da açılır.' },
        { id: 'e4', title: 'Mudanya Sahil Turu', communities: ['bisiklet'], start: inDays(6, 8), location: 'Mudanya İskele', category: 'Spor', going: 35, capacity: 50, attending: false, interested: false, sponsors: ['pedal'], scene: 'sea', desc: '42 km’lik sahil turu. Orta seviye kondisyon gerektirir. Kask zorunlu.' },
        { id: 'e5', title: 'Foto Yürüyüşü: Tarihi Çarşı', communities: ['foto', 'kodkahve'], start: inDays(12, 11), location: 'Koza Han, Osmangazi', category: 'Sanat', going: 22, capacity: 30, attending: false, interested: false, sponsors: ['kitabevi'], scene: 'city', desc: 'Tarihi çarşıda sokak fotoğrafçılığı yürüyüşü ve kahve molası. Ortak etkinlik.' },
        { id: 'e6', title: 'Kışlık Mont Toplama Günü', communities: ['gonullu'], start: inDays(15, 10), location: 'Konak Meydanı, İzmir', category: 'Gönüllülük', going: 57, capacity: 100, attending: false, interested: false, sponsors: [], scene: 'volunteer', desc: 'Toplanan montlar köy okullarına ulaştırılacak.' },
        { id: 'e7', title: 'Ekim Gece Yürüyüşü', communities: ['doga'], start: inDays(-20, 21), location: 'Saitabat Şelalesi', category: 'Kamp', going: 46, capacity: 50, attending: true, interested: false, sponsors: [], scene: 'forest', desc: 'Geçmiş etkinlik.' }
      ],

      posts: [
        { id: 'p1', author: { kind: 'user', id: 'u1' }, community: 'kodkahve', ts: ago(120), visibility: 'Herkese açık', type: 'post', text: 'Bugün toplulukla yeni bir projeye başladık. Etkinlik takvimini herkesin düzenleyebileceği açık kaynak bir araca dönüştürüyoruz. Fikirlerinizi bekliyoruz! #açıkkaynak', media: [{ scene: 'code' }], likes: 42, liked: false, saved: false, shares: 3, comments: [{ user: 'u9', text: 'Harika fikir, ilk issue’ları ben açabilirim.', ts: ago(90) }, { user: 'u0', text: 'Tasarım tarafında yardım ederim.', ts: ago(60) }] },
        { id: 'p2', author: { kind: 'community', id: 'doga' }, community: 'doga', ts: ago(180), visibility: 'Herkese açık', type: 'event', event: 'e1', text: 'Kış kampı kayıtları açıldı! Bu yıl Uludağ Bisiklet Topluluğu ile ortak düzenliyoruz. Ekipman desteği Zirve Outdoor’dan. #kamp #uludağ', media: [], likes: 128, liked: true, saved: true, shares: 21, comments: [{ user: 'u7', text: 'Geçen yılki rota mı olacak?', ts: ago(150) }, { user: 'u3', text: 'Rota biraz değişti, etkinlik sayfasına ekledik.', ts: ago(140) }] },
        { id: 'p3', author: { kind: 'user', id: 'u2' }, community: 'doga', ts: ago(300), visibility: 'Herkese açık', type: 'post', text: 'Hafta sonu doğa yürüyüşünden birkaç kare. Siz en çok hangi rotayı seviyorsunuz?', media: [{ scene: 'mountain' }, { scene: 'forest' }, { scene: 'sea' }], likes: 86, liked: false, saved: false, shares: 5, comments: [{ user: 'u8', text: 'Işık çok güzel yakalanmış!', ts: ago(250) }] },
        { id: 'p4', author: { kind: 'community', id: 'muzik' }, community: 'muzik', ts: ago(420), visibility: 'Herkese açık', type: 'sponsor', need: 'n2', text: 'Açık sahne gecelerimiz için taşınabilir ses sistemi arıyoruz. Destek olmak isteyen sponsorlar sayfamızdan ulaşabilir.', media: [], likes: 34, liked: false, saved: false, shares: 9, comments: [] },
        { id: 'p5', author: { kind: 'page', id: 'kuzey' }, community: null, ts: ago(600), visibility: 'Herkese açık', type: 'post', text: 'Bu ay Kod & Kahve ve Müzik Atölyesi buluşmalarına ev sahipliği yapıyoruz. Topluluk üyelerine filtre kahvede %20 indirim. ☕', media: [{ scene: 'coffee' }], likes: 211, liked: false, saved: false, shares: 14, comments: [{ user: 'u5', text: 'Teşekkürler Kuzey Kahve!', ts: ago(500) }] },
        { id: 'p6', author: { kind: 'community', id: 'kodkahve' }, community: 'kodkahve', ts: ago(1440), visibility: 'Topluluk üyeleri', type: 'announcement', text: 'Duyuru: Aralık meetup konuşmacı başvuruları 1 Aralık’a kadar açık. Başvuru formu sabitlenmiş gönderide.', media: [], likes: 19, liked: false, saved: false, shares: 2, comments: [] },
        { id: 'p7', author: { kind: 'user', id: 'u4' }, community: 'bisiklet', ts: ago(2000), visibility: 'Herkese açık', type: 'post', text: 'Pazar sabahı Mudanya sahil turu için rota hazır. 42 km, iki mola noktası. Katılacaklar etkinliğe kayıt olsun! 🚲', media: [{ scene: 'bike' }], likes: 57, liked: false, saved: false, shares: 6, comments: [] },
        { id: 'p8', author: { kind: 'user', id: 'u0' }, community: 'doga', ts: ago(3200), visibility: 'Arkadaşlar', type: 'post', text: 'Saitabat gece yürüyüşü harikaydı, organizasyon için teşekkürler!', media: [{ scene: 'forest' }], likes: 23, liked: false, saved: false, shares: 0, comments: [] }
      ],

      stories: [
        { id: 's1', community: 'doga', label: 'Kamp', seen: false, muted: false, items: [{ scene: 'camp', caption: 'Kamp alanı hazırlanıyor 🔥', ts: ago(60), views: 412 }, { scene: 'mountain', caption: 'Sabah 07:00 · Zirve yolu', ts: ago(40), views: 380 }] },
        { id: 's2', community: 'muzik', label: 'Müzik', seen: false, muted: false, items: [{ scene: 'music', caption: 'Ses provası · Açık sahne cumartesi', ts: ago(200), views: 210 }] },
        { id: 's3', community: 'kodkahve', label: 'Kod & Kahve', seen: false, muted: false, items: [{ scene: 'code', caption: 'Atölye: ilk PR’ını aç', ts: ago(300), views: 96 }] },
        { id: 's4', community: 'bisiklet', label: 'Bisiklet', seen: true, muted: false, items: [{ scene: 'bike', caption: 'Rota keşfi tamam ✔', ts: ago(500), views: 150 }] },
        { id: 's5', community: 'foto', label: 'Fotoğraf', seen: true, muted: false, items: [{ scene: 'photo', caption: 'Kış sergisi hazırlıkları', ts: ago(700), views: 88 }] }
      ],

      needs: [
        { id: 'n1', community: 'doga', title: '40 adet uyku tulumu', category: 'Ürün', desc: 'Kış kampına ilk kez katılacak üyeler için -10°C konforlu uyku tulumu.', goal: 40, progress: 26, deadline: inDays(10), supporters: ['zirve'] },
        { id: 'n2', community: 'muzik', title: 'Taşınabilir ses sistemi', category: 'Ekipman', desc: 'Açık sahne gecelerinde kullanılacak 2 hoparlör ve mikser.', goal: 1, progress: 0, deadline: inDays(14), supporters: [] },
        { id: 'n3', community: 'kodkahve', title: 'Meetup mekânı ve ikram', category: 'Mekân', desc: 'Ayda bir 60 kişilik buluşma için mekân ve kahve ikramı.', goal: 12, progress: 9, deadline: inDays(30), supporters: ['kuzey'] },
        { id: 'n4', community: 'gonullu', title: '300 kışlık mont', category: 'Ürün', desc: 'Köy okullarındaki öğrenciler için kışlık mont.', goal: 300, progress: 184, deadline: inDays(20), supporters: [] },
        { id: 'n5', community: 'foto', title: 'Sergi baskı desteği', category: 'Baskı', desc: 'Kış sergisi için 30 adet 50×70 fine-art baskı.', goal: 30, progress: 12, deadline: inDays(18), supporters: ['kitabevi'] }
      ],

      conversations: [
        { id: 'c1', kind: 'user', with: 'u3', title: 'Ayşe Kaya', subtitle: 'X Topluluğu Moderatörü', online: true, unread: 1, messages: [{ from: 'u3', text: 'Merhaba, nasılsın?', ts: ago(30) }, { from: 'me', text: 'İyiyim, teşekkür ederim!', ts: ago(28) }, { from: 'u3', text: 'Kış kampı için gönüllü listesine seni de ekleyebilir miyim?', ts: ago(5) }] },
        { id: 'c2', kind: 'group', community: 'doga', title: 'Doğa ve Kamp', subtitle: '18.400 üye · grup sohbeti', online: false, unread: 3, messages: [{ from: 'u7', text: 'Ekipman listesini güncelledim.', ts: ago(90) }, { from: 'u2', text: 'Fotoğrafları galeriye yükledim 📷', ts: ago(70) }, { from: 'u3', text: 'Toplanma noktası Teleferik alt istasyonu.', ts: ago(20) }] },
        { id: 'c3', kind: 'group', community: 'kodkahve', title: 'Kod & Kahve Topluluğu', subtitle: '248 üye · grup sohbeti', online: false, unread: 0, messages: [{ from: 'u1', text: 'Meetup sunumlarını klasöre ekledim.', ts: ago(400) }] },
        { id: 'c4', kind: 'group', community: 'muzik', title: 'Kamp Grubu', subtitle: '12 üye', online: false, unread: 0, messages: [{ from: 'u5', text: 'Gitarı ben getiriyorum 🎸', ts: ago(1500) }] },
        { id: 'c5', kind: 'user', with: 'u1', title: 'Deniz Yılmaz', subtitle: 'Kod & Kahve yöneticisi', online: false, unread: 0, messages: [{ from: 'u1', text: 'Tasarım desteğin için teşekkürler!', ts: ago(2400) }] }
      ],

      notifications: [
        { id: 'nt1', type: 'like', text: '<b>Ayşe Kaya</b> gönderini beğendi', ts: ago(2), read: false, link: '#/profil', who: 'u3' },
        { id: 'nt2', type: 'community', text: '<b>Doğa ve Kamp</b> grubuna yeni gönderi eklendi', ts: ago(15), read: false, link: '#/topluluk/doga', community: 'doga' },
        { id: 'nt3', type: 'request', text: '<b>Mert Arslan</b> üyelik isteği gönderdi', ts: ago(60), read: false, link: '#/uyeler', who: 'u4' },
        { id: 'nt4', type: 'event', text: 'Etkinlik hatırlatması: <b>Açık Sahne Gecesi</b> yaklaşıyor', ts: ago(1440), read: true, link: '#/etkinlik/e3' },
        { id: 'nt5', type: 'sponsor', text: '<b>Zirve Outdoor</b> “40 adet uyku tulumu” ihtiyacına destek oldu', ts: ago(2000), read: true, link: '#/sponsorlar' },
        { id: 'nt7', type: 'event', text: '<b>Uludağ Kış Kampı</b> ortak etkinliğine katılımın onaylandı', ts: ago(4300), read: true, link: '#/etkinlik/e1' }
      ],
      // Etiketler: topluluk yöneticileri oluşturur, sponsorlar ilan verirken seçer, üyeler bunlarla filtreler
      tags: [
        { id: 'tg1', name: 'Yazılım', color: '#437EF5', community: 'kodkahve', ts: ago(90000) },
        { id: 'tg2', name: 'Veri bilimi', color: '#9970F5', community: 'kodkahve', ts: ago(80000) },
        { id: 'tg3', name: 'Tasarım', color: '#E0579A', community: 'foto', ts: ago(70000) },
        { id: 'tg4', name: 'Pazarlama', color: '#F08A24', community: 'muzik', ts: ago(60000) },
        { id: 'tg5', name: 'Outdoor', color: '#2FA36B', community: 'doga', ts: ago(50000) },
        { id: 'tg6', name: 'Etkinlik yönetimi', color: '#14A3B8', community: 'doga', ts: ago(40000) }
      ],
      followedTags: ['tg1', 'tg5'],
      // Bir kişide çok fazla etiket birikirse site yöneticisine uyarı düşer
      tagLimit: 4,
      tagAlerts: [{ id: 'ta1', user: 'u7', count: 5, ts: ago(240), status: 'open' }],
      listings: [
        { id: 'l1', page: 'kuzey', title: 'Web geliştirici stajyeri', type: 'Staj', mode: 'Hibrit', city: 'Bursa', tags: ['tg1'], deadline: inDays(14, 23), ts: ago(180), applicants: 23, applied: false, saved: false, desc: 'Sipariş ve sadakat uygulamamızın web arayüzünde çalışacak, HTML, CSS ve JavaScript bilen stajyer arıyoruz. Haftada 3 gün ofiste.' },
        { id: 'l2', page: 'zirve', title: 'Veri analisti stajyeri', type: 'Staj', mode: 'Uzaktan', city: 'İstanbul', tags: ['tg2', 'tg1'], deadline: inDays(9, 23), ts: ago(900), applicants: 41, applied: false, saved: true, desc: 'Satış ve stok verilerini Python ile analiz edip haftalık rapor hazırlayacak öğrenci arkadaş arıyoruz.' },
        { id: 'l3', page: 'kitabevi', title: 'Sosyal medya içerik asistanı', type: 'Yarı zamanlı', mode: 'Uzaktan', city: 'Bursa', tags: ['tg4', 'tg3'], deadline: inDays(20, 23), ts: ago(2400), applicants: 12, applied: false, saved: false, desc: 'Kitap önerileri ve söyleşi duyuruları için kısa video ve görsel içerik hazırlayacak, haftada 15 saat.' },
        { id: 'l4', page: 'zirve', title: 'Kamp ekipmanı tanıtım gönüllüsü', type: 'Gönüllü', mode: 'Yerinde', city: 'Bursa', tags: ['tg5', 'tg6'], deadline: inDays(6, 23), ts: ago(3000), applicants: 8, applied: false, saved: false, desc: 'Uludağ Kış Kampı’nda ekipman standında katılımcılara ürünleri tanıtacak gönüllüler. Yemek ve ulaşım bizden.' },
        { id: 'l5', page: 'pedal', title: 'Mağaza satış danışmanı', type: 'İş', mode: 'Yerinde', city: 'Bursa', tags: ['tg5'], deadline: inDays(30, 23), ts: ago(5000), applicants: 17, applied: false, saved: false, desc: 'Bisiklet ve ekipman satışı, servis kabulü. Bisiklete ilgi duyan, hafta sonu çalışabilecek tam zamanlı ekip arkadaşı.' },
        { id: 'l6', page: 'kuzey', title: 'Etkinlik ve topluluk koordinatörü', type: 'Yarı zamanlı', mode: 'Yerinde', city: 'Bursa', tags: ['tg6', 'tg4'], deadline: inDays(11, 23), ts: ago(7000), applicants: 9, applied: false, saved: false, desc: 'Mekânımızdaki açık sahne ve atölye gecelerini topluluklarla birlikte planlayacak, akşamları müsait öğrenci.' }
      ],
      docs: [
        { id: 'd1', owner: 'u0', cat: 'cv', title: 'Özgeçmiş', name: 'selin-koc-cv.pdf', size: 184320, ts: ago(9000) },
        { id: 'd2', owner: 'u0', cat: 'sertifika', title: 'İlk Yardım Sertifikası', name: 'ilk-yardim.pdf', size: 352256, ts: ago(30000) },
        { id: 'd3', owner: 'u1', cat: 'proje', title: 'Kampüs Etkinlik Botu', name: 'etkinlik-botu-rapor.pdf', size: 512000, ts: ago(12000) },
        { id: 'd4', owner: 'u1', cat: 'sertifika', title: 'Bulut Bilişime Giriş', name: 'bulut-sertifika.pdf', size: 204800, ts: ago(50000) },
        { id: 'd5', owner: 'u3', cat: 'sertifika', title: 'Doğa Rehberliği Eğitimi', name: 'doga-rehberligi.pdf', size: 296960, ts: ago(70000) },
        { id: 'd6', owner: 'u2', cat: 'proje', title: 'Sokak Fotoğrafçılığı Seçkisi', name: 'portfolyo.pdf', size: 768000, ts: ago(20000) }
      ],
      notifSettings: { like: true, community: true, event: true, request: true, sponsor: true, frequency: 'Anında', quiet: false },

      connections: {
        incoming: [{ kind: 'community', id: 'foto', mutual: 12, note: 'Topluluk davetiyesi' }, { kind: 'user', id: 'u4', mutual: 5, note: 'Bağlantı isteği' }, { kind: 'user', id: 'u3', mutual: 8, note: 'X Topluluğu Moderatörü' }],
        sent: [{ kind: 'user', id: 'u8', mutual: 3 }, { kind: 'community', id: 'gonullu', mutual: 2 }],
        suggestions: [{ id: 'u5', mutual: 9 }, { id: 'u6', mutual: 4 }, { id: 'u7', mutual: 11 }, { id: 'u9', mutual: 6 }],
        friends: ['u1', 'u2']
      },

      reports: [
        { id: 'r1', target: 'Gönderi · Doğa ve Kamp', preview: '“Bu rotayı bilmeyen …” (hakaret içeren gönderi)', reason: 'Taciz / hakaret', reporter: 'u7', priority: 'Yüksek', risk: 'Taciz', community: 'doga', ts: ago(25), status: 'Bekliyor' },
        { id: 'r2', target: 'Gönderi · Kod & Kahve', preview: '“Ucuz takipçi satın almak için …”', reason: 'Spam', reporter: 'u9', priority: 'Orta', risk: 'Spam', community: 'kodkahve', ts: ago(140), status: 'Bekliyor' },
        { id: 'r3', target: 'Profil · yeni hesap', preview: 'Sahte olduğu düşünülen kurum hesabı', reason: 'Sahte hesap', reporter: 'u3', priority: 'Orta', risk: 'Sahte hesap', community: 'doga', ts: ago(600), status: 'Bekliyor' },
        { id: 'r4', target: 'Fotoğraf · Müzik Atölyesi', preview: 'İzinsiz kullanılan konser fotoğrafı', reason: 'Telif', reporter: 'u5', priority: 'Düşük', risk: 'Telif', community: 'muzik', ts: ago(1600), status: 'Bekliyor' }
      ],
      audit: [
        { ts: ago(300), who: 'u3', text: 'Spam içerikli gönderi kaldırıldı (Doğa ve Kamp)' },
        { ts: ago(900), who: 'u1', text: 'Kaan Erdem moderatör olarak atandı (Kod & Kahve)' },
        { ts: ago(2400), who: 'u3', text: 'Kullanıcıya uyarı gönderildi: kural 4 ihlali' }
      ],

      privacy: { visibility: 'Herkes', tagApprove: true, tagTimeline: false, twoFactor: false, blocked: ['Spam Hesap 23', 'reklam.bot'] },
      devices: [{ id: 'dv1', name: 'Chrome · Windows', place: 'Bursa · şu an aktif', current: true }, { id: 'dv2', name: 'Safari · iPhone', place: 'Bursa · 2 saat önce', current: false }, { id: 'dv3', name: 'Firefox · macOS', place: 'İstanbul · 12 gün önce', current: false }],
      drafts: [],
      hiddenPosts: [],
      gallery: [
        { scene: 'camp', community: 'doga', caption: 'Ekim kampı · çadır alanı', kind: 'Fotoğraf' },
        { scene: 'mountain', community: 'doga', caption: 'Uludağ zirve yolu', kind: 'Fotoğraf' },
        { scene: 'forest', community: 'doga', caption: 'Saitabat gece yürüyüşü', kind: 'Video' },
        { scene: 'code', community: 'kodkahve', caption: 'Kasım meetup sahnesi', kind: 'Fotoğraf' },
        { scene: 'music', community: 'muzik', caption: 'Açık sahne · ilk performans', kind: 'Video' },
        { scene: 'coffee', community: 'kodkahve', caption: 'Kuzey Kahve buluşması', kind: 'Fotoğraf' },
        { scene: 'bike', community: 'bisiklet', caption: 'Mudanya turu molası', kind: 'Fotoğraf' },
        { scene: 'sea', community: 'bisiklet', caption: 'Sahil yolu', kind: 'Video' },
        { scene: 'photo', community: 'foto', caption: 'Sergi hazırlığı', kind: 'Fotoğraf' },
        { scene: 'city', community: 'foto', caption: 'Koza Han detayları', kind: 'Fotoğraf' },
        { scene: 'volunteer', community: 'gonullu', caption: 'Mont toplama standı', kind: 'Fotoğraf' },
        { scene: 'music', community: 'muzik', caption: 'Jam session', kind: 'Fotoğraf' }
      ],
      schedule: [
        { page: 'kuzey', when: inDays(1, 9), text: 'Açık Sahne Gecesi hatırlatması' },
        { page: 'kuzey', when: inDays(3, 12), text: 'Kış menüsü tanıtımı' },
        { page: 'kuzey', when: inDays(8, 18), text: 'Meetup sponsorluk duyurusu' }
      ],
      activity: [
        { d: 'Pzt', posts: 42, comments: 160 }, { d: 'Sal', posts: 38, comments: 141 }, { d: 'Çar', posts: 51, comments: 188 },
        { d: 'Per', posts: 47, comments: 172 }, { d: 'Cum', posts: 63, comments: 230 }, { d: 'Cmt', posts: 78, comments: 296 }, { d: 'Paz', posts: 70, comments: 251 }
      ]
    };
  };
})();
