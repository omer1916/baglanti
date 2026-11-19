/* Bağlantı · çekirdek: durum, yardımcılar, ikonlar, illüstrasyonlar, ortak bileşenler */
(function () {
  'use strict';
  /* İki ayrı çalışma alanı var:
     - demo:    hesapsız göz atma (rol seçerek)
     - account: kayıtlı tek hesabın verileri
     Hangisinin açık olduğu `baglanti-active` anahtarında tutulur. */
  const KEYS = { active: 'baglanti-active', auth: 'baglanti-auth-v1', session: 'baglanti-session', flash: 'baglanti-flash', demo: 'baglanti-demo-v1', account: 'baglanti-account-v1', apps: 'baglanti-applications-v1' };
  const mode = (() => { try { return localStorage.getItem(KEYS.active) === 'account' ? 'account' : 'demo'; } catch (e) { return 'demo'; } })();
  const KEY = KEYS[mode];

  /* Bir hesap için başlangıç verisi: örnek dünya + hesabın kendi profili */
  function buildWorkspace(acc) {
    const s = window.SEED();
    s.onboarded = true;
    s.role = (acc && acc.role) || 'uye';
    if (acc && !acc.seeded) {
      Object.assign(s.users.u0, { name: acc.name, handle: acc.username, city: acc.city || 'Bursa', bio: 'Bağlantı’ya yeni katıldım.', joined: String(new Date(acc.created).getFullYear()) });
      s.posts = s.posts.filter((p) => !(p.author.kind === 'user' && p.author.id === 'u0'));
      s.posts.forEach((p) => { p.comments = p.comments.filter((c) => c.user !== 'u0'); });
      s.docs = s.docs.filter((d) => d.owner !== 'u0');
      s.notifications.unshift({ id: 'nt-welcome', type: 'community', text: '<b>Bağlantı</b>’ya hoş geldin! Profilini tamamla; sertifika, proje ve CV’ni Belgeler sekmesine ekle.', ts: Date.now(), read: false, link: '#/profil?tab=belgeler' });
      const club = acc.club && s.communities[acc.club];
      if (club) {
        club.joined = false; club.requested = true;
        s.notifications.unshift({ id: 'nt-app', type: 'request', text: `<b>${club.name}</b> üyelik başvurun kulüp yöneticisine iletildi. Onaylanınca bildirim alacaksın.`, ts: Date.now() + 1, read: false, link: '#/topluluk/' + club.id, community: club.id });
      }
    }
    return s;
  }

  /* ---------------- durum ---------------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); if (s && s.version === 1) return s; }
    } catch (e) { /* depolama kapalı olabilir */ }
    if (mode === 'account') {
      try { const a = JSON.parse(localStorage.getItem(KEYS.auth)); if (a && a.account) return buildWorkspace(a.account); } catch (e) { /* yok */ }
    }
    return window.SEED();
  }
  const state = load();
  // Kaldırılan özellikler: eski kayıtlardaki yorum bildirimlerini temizle
  state.notifications = state.notifications.filter((n) => n.type !== 'comment');
  if (state.notifSettings) delete state.notifSettings.comment;
  if (!state.docs) state.docs = window.SEED().docs || [];
  if (!state.tags) { const s0 = window.SEED(); state.tags = s0.tags; state.listings = s0.listings; state.followedTags = s0.followedTags; }
  if (state.themeV !== 2) { state.theme = 'light'; state.themeV = 2; } // açık tema varsayılan oldu
  if (!state.memberRequests) state.memberRequests = [{ user: 'u4', community: 'kodkahve', ts: Date.now() - 50 * 60000 }, { user: 'u8', community: 'doga', ts: Date.now() - 300 * 60000 }];
  const RQ = { u4: ['Uludağ Üni. · Bilgisayar Müh.', '032190045'], u8: ['Bursa Teknik Üni. · Peyzaj Mimarlığı', '22051017'] };
  state.memberRequests.forEach((x) => { if (!x.dept && RQ[x.user]) [x.dept, x.studentNo] = RQ[x.user]; });

  let warnedQuota = false;
  function save(quiet) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) {
      if (!quiet && !warnedQuota) { warnedQuota = true; App.toast('Tarayıcı depolama alanı doldu; son değişiklikler yalnızca bu oturumda saklanacak.', 'info'); }
      return false;
    }
  }
  function reset() {
    if (mode === 'account' && window.Auth && window.Auth.account()) return window.Auth.resetWorkspace();
    try { localStorage.removeItem(KEY); } catch (e) { /* yok */ }
    history.replaceState(null, '', '#/hosgeldin'); location.reload();
  }

  /* ---------------- yardımcılar ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- güvenli HTML yazma ----------------
     Şablonlardaki her değişken esc() ile kaçışlanır. Ek bir savunma katmanı olarak, DOM'a giren
     tüm işaretleme yalnızca bu yardımcılardan geçer:
       1) Trusted Types: CSP "require-trusted-types-for 'script'" ile zorunlu; "baglanti" politikası dışında
          hiçbir HTML yazma işlemi çalışmaz (destekleyen tarayıcılarda).
       2) Ayrıştırma betik çalıştırmayan ayrı bir belgede (DOMParser) yapılır, ardından temizlenir:
          tehlikeli etiketler, on* olay öznitelikleri ve javascript:/vbscript:/izinsiz data: adresleri silinir. */
  const ttPolicy = (() => {
    try { return window.trustedTypes ? window.trustedTypes.createPolicy('baglanti', { createHTML: (s) => s }) : null; } catch (e) { return null; }
  })();
  const BAD_TAGS = new Set(['script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'base', 'meta', 'link', 'style', 'noscript', 'foreignobject', 'template']);
  const URL_ATTRS = new Set(['href', 'src', 'xlink:href', 'action', 'formaction', 'poster', 'background', 'cite', 'srcset']);
  const SAFE_DATA = /^data:(image\/(png|jpe?g|gif|webp|avif)|video\/(mp4|webm|quicktime));base64,/;
  function sanitize(root) {
    const kill = [];
    const walker = (root.ownerDocument || document).createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (BAD_TAGS.has(n.localName.toLowerCase())) { kill.push(n); continue; }
      for (const a of Array.from(n.attributes)) {
        const name = a.name.toLowerCase();
        if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction') { n.removeAttribute(a.name); continue; }
        if (URL_ATTRS.has(name)) {
          const v = a.value.replace(/[\u0000- ]/g, '').toLowerCase();
          const bad = /^(javascript|vbscript):/.test(v) || (v.startsWith('data:') && (name === 'href' || name === 'xlink:href' || name === 'action' || !SAFE_DATA.test(v)));
          if (bad) n.removeAttribute(a.name);
        }
      }
    }
    kill.forEach((n) => n.remove());
    return root;
  }
  // HTML, sayfadan ayrı ve betik çalıştırmayan bir belgede (DOMParser) ayrıştırılır; burada <script> çalışmaz,
  // görsel yüklenmez, olay işleyici tetiklenmez. Temizlenen düğümler sonra sayfaya taşınır. innerHTML kullanılmaz.
  const parser = new DOMParser();
  function fragment(html) {
    const doc = parser.parseFromString(ttPolicy ? ttPolicy.createHTML(String(html)) : String(html), 'text/html');
    sanitize(doc.body);   // önce etkisiz belgede temizle; sayfaya taşınan düğüm (örn. <img>) hemen yüklenmeye başlar
    const frag = document.createDocumentFragment();
    frag.append(...doc.body.childNodes);
    return frag;
  }
  const setHTML = (el, html) => { el.replaceChildren(fragment(html)); return el; };
  const replaceHTML = (el, html) => { el.replaceWith(fragment(html)); };
  const appendHTML = (el, html) => { el.append(fragment(html)); };
  const lower = (s) => String(s || '').toLocaleLowerCase('tr');
  const nf = new Intl.NumberFormat('tr-TR');
  const num = (n) => nf.format(n);
  const uid = (p = 'id') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function initials(name) {
    const w = String(name).replace(/[&·]/g, ' ').split(/\s+/).filter(Boolean);
    return ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toLocaleUpperCase('tr');
  }
  function timeAgo(ts) {
    const d = Math.max(0, Date.now() - ts), m = Math.floor(d / 60000);
    if (m < 1) return 'şimdi';
    if (m < 60) return m + ' dk önce';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' saat önce';
    const g = Math.floor(h / 24);
    if (g === 1) return 'Dün';
    if (g < 7) return g + ' gün önce';
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(ts);
  }
  const fmt = {
    day: (ts) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric' }).format(ts),
    mon: (ts) => new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(ts).replace('.', ''),
    full: (ts) => new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(ts),
    time: (ts) => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(ts),
    short: (ts) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' }).format(ts),
    clock: (ts) => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(ts)
  };
  function daysLeft(ts) { const d = Math.ceil((ts - Date.now()) / 86400000); return d <= 0 ? 'Bugün sona eriyor' : d + ' gün kaldı'; }

  /* ---------------- roller ---------------- */
  const ROLES = {
    uye: { label: 'Bireysel kullanıcı', short: 'Üye', desc: 'İçeriklere erişir, etkinliklere katılır, üye olduğu gruplarla senkron kalır.' },
    moderator: { label: 'Topluluk moderatörü', short: 'Moderatör', desc: 'İçerik performansını ve etkileşimi takip eder, şikâyetleri inceler.' },
    yonetici: { label: 'Topluluk yöneticisi', short: 'Yönetici', desc: 'Kuralları uygular; üyeleri, etkinlikleri, departmanları ve moderatörleri yönetir.' },
    marka: { label: 'Marka / işletme', short: 'Marka', desc: 'Topluluk sponsorluğunu üstlenir, toplulukların ihtiyaçlarını karşılar.' }
  };
  const MANAGED = ['doga', 'kodkahve'];
  const BRAND_PAGE = 'kuzey';
  const role = () => state.role;
  const isManager = () => state.role === 'moderator' || state.role === 'yonetici';
  const isAdmin = () => state.role === 'yonetici';
  // Üyeler şimdilik kimseye mesaj gönderemez (rahatsız edici / siyasi içerik riskine karşı)
  const canMessage = () => state.role !== 'uye';
  const isBrand = () => state.role === 'marka';

  /* ---------------- varlıklar ---------------- */
  // Yalnızca nesnenin kendi anahtarları: "__proto__", "constructor" gibi URL değerleri prototipe ulaşmasın
  const own = (obj, id) => (typeof id === 'string' && Object.prototype.hasOwnProperty.call(obj, id) ? obj[id] : undefined);
  const U = (id) => own(state.users, id);
  const C = (id) => own(state.communities, id);
  const P = (id) => own(state.pages, id);
  const E = (id) => state.events.find((e) => e.id === id);
  const N = (id) => state.needs.find((n) => n.id === id);
  const me = () => U(state.me);

  function entity(ref) {
    if (!ref) return null;
    if (ref.kind === 'user') { const u = U(ref.id); return u && { ...u, kind: 'user', href: ref.id === state.me ? '#/profil' : '#/kisi/' + ref.id }; }
    if (ref.kind === 'community') { const c = C(ref.id); return c && { ...c, kind: 'community', href: '#/topluluk/' + ref.id }; }
    if (ref.kind === 'page') { const p = P(ref.id); return p && { ...p, kind: 'page', href: '#/sayfa/' + ref.id }; }
    return null;
  }
  function avatar(ent, size = 'md', extra = '') {
    if (!ent) return '';
    const sq = ent.kind && ent.kind !== 'user' ? ' sq' : '';
    return `<span class="av av-${size} g${(ent.hue || 0) % 6}${sq} ${extra}" aria-hidden="true">${esc(initials(ent.name))}</span>`;
  }
  const verified = (on) => on ? `<span class="verified" title="Doğrulanmış">${icon('badgeCheck', 'ico-sm')}<span class="sr-only">Doğrulanmış</span></span>` : '';

  /* ---------------- ikonlar ---------------- */
  const IC = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6 6 0 0 1 3.5 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    userPlus: '<circle cx="10" cy="8" r="4"/><path d="M2 21a8 8 0 0 1 16 0"/><path d="M19 8v6M16 11h6"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    message: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    heart: '<path d="M12 20.5s-8-4.7-8-11A4.5 4.5 0 0 1 12 6.6a4.5 4.5 0 0 1 8 2.9c0 6.3-8 11-8 11z"/>',
    comment: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z"/>',
    share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v12M7 8l5-5 5 5"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.6 3.4M6.6 6.6A17 17 0 0 0 2.5 12s3.5 7 9.5 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    eye: '<path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/><circle cx="12" cy="12" r="3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    send: '<path d="M21 3 10 14"/><path d="m21 3-7 18-4-7-7-4z"/>',
    clip: '<path d="m21 11.5-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9"/>',
    megaphone: '<path d="M3 10v4h4l8 5V5L7 10z"/><path d="M18.5 9a4 4 0 0 1 0 6"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    volume: '<path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
    volumeOff: '<path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="m17 9.5 5 5M22 9.5l-5 5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2.3-2.4 3.8"/><path d="M12 17h.01"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    logout: '<path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3"/>',
    video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10.5 6-3.5v10l-6-3.5z"/>',
    filter: '<path d="M3 5h18l-7 8.5V20l-4-2v-4.5z"/>',
    badgeCheck: '<path d="M12 2.5l2.6 1.9 3.2-.1 1 3.1 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3.1-3.2-.1L12 22.3l-2.6-1.9-3.2.1-1-3.1-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3.1 3.2.1z" fill="currentColor" stroke="none"/><path d="m8.5 12.3 2.3 2.3 4.7-4.8" stroke="#fff"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    hash: '<path d="M5 9h15M4 15h15M10 3 8 21M16 3l-2 18"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14.5 8.5l2 2"/>',
    devices: '<rect x="2" y="4" width="14" height="10" rx="2"/><path d="M6 18h6"/><rect x="17" y="8" width="5" height="12" rx="1.5"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    crown: '<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    sparkle: '<path d="M12 3c.6 4.5 2.5 6.4 7 7-4.5.6-6.4 2.5-7 7-.6-4.5-2.5-6.4-7-7 4.5-.6 6.4-2.5 7-7z"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>'
  };
  function icon(name, cls = '') { return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[name] || ''}</svg>`; }

  /* ---------------- illüstrasyonlar ---------------- */
  let sid = 0;
  function sceneSVG(name) {
    const id = 'sc' + (++sid);
    const lg = (n, a, b, vert = true) => `<linearGradient id="${id}${n}" x1="0" y1="0" x2="${vert ? 0 : 1}" y2="${vert ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
    const u = (n) => `url(#${id}${n})`;
    let d = '', b = '';
    switch (name) {
      case 'mountain':
        d = lg('a', '#2c3f8f', '#f4a36c') + lg('b', '#24305c', '#121a33');
        b = `<rect width="400" height="300" fill="${u('a')}"/><circle cx="292" cy="118" r="34" fill="#ffd9a0"/><path d="M0 230 90 120l50 55 70-95 110 130 80-60v150H0z" fill="#3b4a86" opacity=".85"/><path d="m210 80 24 32-13-5-11 12-8-14-13 7z" fill="#fff" opacity=".9"/><path d="M0 300V250l70-60 60 45 90-90 80 80 50-30 50 40v65z" fill="${u('b')}"/>`; break;
      case 'camp':
        d = lg('a', '#0b1230', '#2a2f6b') + lg('b', '#f5be4f', '#f46799');
        b = `<rect width="400" height="300" fill="${u('a')}"/>${[[40, 40], [90, 70], [150, 30], [220, 60], [300, 35], [350, 80], [260, 100], [120, 110], [30, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".8"/>`).join('')}<circle cx="330" cy="60" r="18" fill="#f4f7fc" opacity=".9"/><path d="M0 230 80 170l60 30 70-50 90 60 100-40v130H0z" fill="#182457"/><path d="M0 300V250h400v50z" fill="#0d1636"/><path d="M110 250 170 160l60 90z" fill="#40cddc"/><path d="m170 160 0 90-14 0z" fill="#2a9fb0"/><path d="M160 250 170 214l10 36z" fill="#0d1636"/><path d="M270 250c-8-18 2-26 10-38 4 12 18 20 8 38z" fill="${u('b')}"/><path d="M256 252h44" stroke="#7a4a2a" stroke-width="5" stroke-linecap="round"/><circle cx="279" cy="232" r="40" fill="#f5be4f" opacity=".12"/>`; break;
      case 'forest':
        d = lg('a', '#123d3a', '#47c391') + lg('b', '#0f2a2a', '#0b1d1f');
        b = `<rect width="400" height="300" fill="${u('a')}"/><circle cx="90" cy="80" r="28" fill="#e8fff4" opacity=".7"/>${[30, 80, 130, 190, 240, 300, 350].map((x, i) => `<path d="M${x} ${300 - (i % 2 ? 40 : 10)} ${x + 30} ${110 + (i % 3) * 25} ${x + 60} ${300 - (i % 2 ? 40 : 10)}z" fill="#1f6b55" opacity=".9"/>`).join('')}<path d="M0 300V240c80-20 160 10 240-10s120 0 160 10v60z" fill="${u('b')}"/>${[10, 110, 210, 320].map((x) => `<path d="M${x} 300 ${x + 40} 150 ${x + 80} 300z" fill="#0d3b31"/>`).join('')}`; break;
      case 'sea':
        d = lg('a', '#f46799', '#f5be4f') + lg('b', '#2b4ea8', '#14204a');
        b = `<rect width="400" height="300" fill="${u('a')}"/><circle cx="200" cy="170" r="54" fill="#ffe3b0"/><rect y="170" width="400" height="130" fill="${u('b')}"/>${[190, 210, 232, 256].map((y, i) => `<path d="M${120 - i * 20} ${y}h${160 + i * 40}" stroke="#ffd9a0" stroke-width="3" stroke-linecap="round" opacity="${0.7 - i * 0.15}"/>`).join('')}<path d="M300 168l20-30 4 30z" fill="#14204a"/><path d="M296 170h36l-6 8h-26z" fill="#14204a"/>`; break;
      case 'coffee':
        d = lg('a', '#3a2418', '#8a5a3c') + lg('b', '#f4f7fc', '#cfd8e6');
        b = `<rect width="400" height="300" fill="${u('a')}"/><circle cx="320" cy="60" r="70" fill="#f5be4f" opacity=".15"/><ellipse cx="200" cy="248" rx="120" ry="18" fill="#000" opacity=".25"/><ellipse cx="200" cy="232" rx="100" ry="20" fill="${u('b')}"/><path d="M130 130h140l-12 92a20 20 0 0 1-20 18h-76a20 20 0 0 1-20-18z" fill="${u('b')}"/><path d="M270 150c40 0 40 50 0 50" fill="none" stroke="#e1e7f0" stroke-width="12"/><ellipse cx="200" cy="132" rx="70" ry="12" fill="#5a3522"/><path d="M175 110c-10-14 10-22 0-38M205 108c-10-14 10-22 0-38M235 110c-10-14 10-22 0-38" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>`; break;
      case 'code':
        d = lg('a', '#111a33', '#1f2a52');
        b = `<rect width="400" height="300" fill="${u('a')}"/><rect x="70" y="50" width="260" height="170" rx="12" fill="#0b1124" stroke="#2c3a66" stroke-width="3"/><circle cx="92" cy="70" r="5" fill="#f46799"/><circle cx="108" cy="70" r="5" fill="#f5be4f"/><circle cx="124" cy="70" r="5" fill="#47c391"/>${[[90, 96, 60, '#9970f5'], [158, 96, 90, '#40cddc'], [110, 118, 120, '#437ef5'], [110, 140, 70, '#47c391'], [188, 140, 80, '#f5be4f'], [110, 162, 140, '#40cddc'], [90, 184, 50, '#9970f5']].map(([x, y, w, c]) => `<rect x="${x}" y="${y}" width="${w}" height="9" rx="4.5" fill="${c}" opacity=".9"/>`).join('')}<path d="M40 232h320l-24 26H64z" fill="#2c3a66"/>`; break;
      case 'music':
        d = lg('a', '#1b0f3a', '#4b2a8a') + lg('b', '#f46799', '#9970f5');
        b = `<rect width="400" height="300" fill="${u('a')}"/><path d="M80 0 140 260H20zM320 0 380 260H260z" fill="#fff" opacity=".07"/><path d="M200 0 250 260H150z" fill="#40cddc" opacity=".12"/>${Array.from({ length: 13 }, (_, i) => { const h = [40, 70, 110, 80, 140, 100, 160, 120, 90, 130, 70, 50, 30][i]; return `<rect x="${62 + i * 22}" y="${230 - h}" width="12" height="${h}" rx="6" fill="${u('b')}"/>`; }).join('')}<rect y="240" width="400" height="60" fill="#120a28"/>`; break;
      case 'bike':
        d = lg('a', '#40cddc', '#437ef5');
        b = `<rect width="400" height="300" fill="${u('a')}"/><circle cx="320" cy="70" r="30" fill="#fff" opacity=".85"/><path d="M0 230c100-30 300-30 400 0v70H0z" fill="#1f2a52"/><path d="M0 262h400" stroke="#f5be4f" stroke-width="4" stroke-dasharray="18 14"/><g fill="none" stroke="#0d1220" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="140" cy="190" r="40"/><circle cx="270" cy="190" r="40"/><path d="M140 190 185 125h65l20 65M185 125l35 65 50-65M178 110h22M250 125l-6-18h20"/></g>`; break;
      case 'photo':
        d = lg('a', '#9970f5', '#f46799');
        b = `<rect width="400" height="300" fill="${u('a')}"/><rect x="100" y="90" width="200" height="140" rx="22" fill="#0d1220"/><rect x="150" y="72" width="70" height="30" rx="8" fill="#0d1220"/><circle cx="200" cy="160" r="46" fill="#1f2a52"/><circle cx="200" cy="160" r="30" fill="#40cddc"/><circle cx="188" cy="148" r="9" fill="#fff" opacity=".8"/><circle cx="270" cy="112" r="7" fill="#f5be4f"/>`; break;
      case 'city':
        d = lg('a', '#f5be4f', '#f46799');
        b = `<rect width="400" height="300" fill="${u('a')}"/><circle cx="110" cy="110" r="40" fill="#fff4dd" opacity=".8"/>${[[20, 150, 50], [75, 120, 40], [120, 170, 60], [185, 100, 45], [235, 140, 55], [295, 90, 40], [340, 160, 60]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${300 - y}" fill="#2a1f45"/>${Array.from({ length: Math.floor((300 - y) / 26) }, (_, r) => `<rect x="${x + 10}" y="${y + 14 + r * 26}" width="${w - 20}" height="8" fill="#f5be4f" opacity=".35"/>`).join('')}`).join('')}<path d="M185 100l22-30 23 30z" fill="#2a1f45"/>`; break;
      case 'volunteer':
        d = lg('a', '#47c391', '#40cddc');
        b = `<rect width="400" height="300" fill="${u('a')}"/>${[[110, '#437ef5'], [170, '#9970f5'], [230, '#f46799'], [290, '#f5be4f']].map(([x, c]) => `<circle cx="${x}" cy="150" r="22" fill="#0d1220"/><path d="M${x - 34} 260a34 46 0 0 1 68 0z" fill="${c}"/>`).join('')}<path d="M200 70c-12-22-46-10-34 16l34 30 34-30c12-26-22-38-34-16z" fill="#f46799" stroke="#fff" stroke-width="4"/>`; break;
      default:
        d = lg('a', '#437ef5', '#9970f5');
        b = `<rect width="400" height="300" fill="${u('a')}"/>`;
    }
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>${d}</defs>${b}</svg>`;
  }
  const SCENE_ALT = { mountain: 'Dağ manzarası', camp: 'Gece kamp alanı', forest: 'Orman', sea: 'Gün batımında deniz', coffee: 'Kahve fincanı', code: 'Kod editörü', music: 'Konser sahnesi', bike: 'Bisiklet', photo: 'Fotoğraf makinesi', city: 'Şehir silueti', volunteer: 'Gönüllüler' };
  function media(m, cls = '') {
    if (m && m.src) {
      return m.video
        ? `<div class="scene ${cls}"><video src="${m.src}" muted playsinline preload="metadata" aria-label="${esc(m.alt || 'Video')}"></video></div>`
        : `<div class="scene ${cls}"><img src="${m.src}" alt="${esc(m.alt || 'Yüklenen görsel')}" loading="lazy"></div>`;
    }
    const s = (m && m.scene) || 'default';
    return `<div class="scene ${cls}" role="img" aria-label="${esc((m && m.alt) || SCENE_ALT[s] || 'Görsel')}">${sceneSVG(s)}</div>`;
  }

  /* ---------------- kulüp başvuruları ----------------
     Kayıtta seçilen kulübe yapılan başvurular, iki çalışma alanının (hesap ve demo yönetici) ortak
     gördüğü ayrı bir anahtarda tutulur. Gerçek sistemde bu liste sunucuda, ilgili kulübün yöneticisine gider. */
  function readApps() {
    try { const v = JSON.parse(localStorage.getItem(KEYS.apps)); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function writeApps(list) {
    try { localStorage.setItem(KEYS.apps, JSON.stringify(list.slice(-100))); } catch (e) { /* depolama kapalı */ }
  }
  function syncApps() {
    const list = readApps();
    let changed = false;
    if (isAdmin()) {   // yöneticiye yeni başvuruların bildirimi
      state.notifiedApps = state.notifiedApps || [];
      list.filter((a) => a.status === 'pending' && !state.notifiedApps.includes(a.id) && state.communities[a.club]).forEach((a) => {
        state.notifiedApps.push(a.id);
        state.notifications.unshift({ id: 'nt-' + a.id, type: 'request', text: `<b>${esc(a.name)}</b>, <b>${esc(state.communities[a.club].name)}</b> için üyelik başvurusu yaptı`, ts: a.ts, read: false, link: '#/yonetim?tab=uyelik', community: a.club });
        changed = true;
      });
    }
    if (mode === 'account') {   // başvuru sahibine sonucun bildirimi
      let acc = null; try { acc = JSON.parse(localStorage.getItem(KEYS.auth)).account; } catch (e) { /* yok */ }
      const app = acc && acc.appId && list.find((a) => a.id === acc.appId);
      const c = app && state.communities[app.club];
      if (c && app.status !== 'pending' && state.appResult !== app.status) {
        state.appResult = app.status;
        c.requested = false;
        if (app.status === 'approved') { c.joined = true; c.members++; }
        state.notifications.unshift({ id: 'nt-res-' + app.id, type: 'request', text: app.status === 'approved' ? `<b>${esc(c.name)}</b> üyeliğin onaylandı. Kulübe hoş geldin!` : `<b>${esc(c.name)}</b> üyelik başvurun bu kez onaylanmadı.`, ts: app.decided || Date.now(), read: false, link: '#/topluluk/' + c.id, community: c.id });
        changed = true;
      }
    }
    if (changed) save();
  }

  /* ---------------- dışa aktar ---------------- */
  window.Core = {
    state, save, reset, mode, KEYS, buildWorkspace, $, $$, esc, setHTML, replaceHTML, appendHTML, lower, num, uid, initials, timeAgo, fmt, daysLeft,
    ROLES, MANAGED, BRAND_PAGE, role, isManager, isAdmin, isBrand, canMessage,
    U, C, P, E, N, me, entity, avatar, verified, icon, sceneSVG, media, readApps, writeApps
  };
  syncApps();
})();
