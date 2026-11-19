/* Bağlantı · site yöneticisi (ortaklar) girişi
   Üye girişinden ayrıdır: #/admin. Şifrenin kendisi hiçbir yerde tutulmaz; yalnızca
   PBKDF2-SHA256 özeti (geri çevrilemez) aşağıdaki listede durur.

   NOT: Site şimdilik sunucusuz (statik) çalışıyor. Bu giriş, yönetim ekranını kapatır;
   veriler ise her tarayıcının kendi deposundadır. Gerçek koruma ve ortak veri için
   giriş kontrolü sunucuya taşınmalıdır. */
(function () {
  'use strict';

  // Yeni yönetici eklemek için: #/admin?kurulum sayfasında oluşan satırı buraya ekleyin.
  const ADMINS = [
  ];

  // Erişimi kalıcı olarak kaldırılan yönetici kullanıcı adları (küçük harf).
  // Sahip (owner) hesabı bu satırları Site yönetimi > Yöneticiler ekranından üretir.
  const REVOKED = [
  ];

  const ITER = 310000;
  const SESSION_KEY = 'baglanti-admin';
  const LOCK_KEY = 'baglanti-admin-lock';
  const SESSION_MS = 8 * 3600000;
  const enc = new TextEncoder();
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const store = (s) => { try { return s(); } catch (e) { return null; } };

  async function derive(pw, salt, iter = ITER) {
    const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: iter }, key, 256));
  }
  // Sabit süreli karşılaştırma
  const isRevoked = (u) => REVOKED.includes(String(u || '').trim().toLowerCase());
  const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

  function session() {
    const s = store(() => JSON.parse(sessionStorage.getItem(SESSION_KEY)));
    if (!s || typeof s.exp !== 'number' || s.exp < Date.now()) return null;
    const a = ADMINS.find((x) => x.user === s.user);
    if (!a || isRevoked(a.user)) return null;
    return { user: a.user, name: a.name, owner: !!a.owner };
  }
  function lockState() { return store(() => JSON.parse(localStorage.getItem(LOCK_KEY))) || { fails: 0, until: 0, locks: 0 }; }
  function setLock(v) { store(() => localStorage.setItem(LOCK_KEY, JSON.stringify(v))); }

  async function login(user, pw) {
    const l = lockState();
    if (l.until > Date.now()) return { ok: false, error: `Çok fazla hatalı deneme. ${Math.ceil((l.until - Date.now()) / 1000)} sn sonra tekrar dene.` };
    if (!ADMINS.length) return { ok: false, error: 'Henüz yönetici hesabı tanımlı değil.' };
    const u = String(user || '').trim().toLowerCase();
    const a = ADMINS.find((x) => x.user === u);
    // Kullanıcı yoksa da aynı işi yap: süre farkından kullanıcı adı anlaşılmasın
    const h = await derive(String(pw || ''), a ? a.salt : 'yok-' + u, a ? a.iter || ITER : ITER);
    if (!a || isRevoked(a.user) || !same(h, a.hash)) {
      const fails = l.fails + 1;
      if (fails >= 5) {
        const locks = (l.locks || 0) + 1; const ms = Math.min(15 * 60000, 30000 * 2 ** (locks - 1));
        setLock({ fails: 0, locks, until: Date.now() + ms });
        return { ok: false, error: `Çok fazla hatalı deneme. Giriş ${Math.ceil(ms / 1000)} sn kilitlendi.` };
      }
      setLock({ ...l, fails });
      return { ok: false, error: 'Kullanıcı adı ya da şifre hatalı.' };
    }
    setLock({ fails: 0, until: 0, locks: 0 });
    store(() => sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: a.user, exp: Date.now() + SESSION_MS })));
    return { ok: true, name: a.name };
  }
  function logout() { store(() => sessionStorage.removeItem(SESSION_KEY)); }

  // Kurulum: yeni yönetici için koda eklenecek satırı üretir (şifre değil, özeti)
  function pwError(pw) {
    if (pw.length < 12) return 'Şifre en az 12 karakter olmalı.';
    if (!/\p{L}/u.test(pw) || !/\d/.test(pw)) return 'Şifre en az bir harf ve bir rakam içermeli.';
    return '';
  }
  async function makeEntry(user, name, pw, owner) {
    const u = String(user || '').trim().toLowerCase();
    if (!/^[a-z0-9._]{3,20}$/.test(u)) return { ok: false, error: 'Kullanıcı adı 3–20 karakter: a-z, rakam, nokta, alt çizgi.' };
    const n = String(name || '').trim().slice(0, 40);
    if (n.length < 2) return { ok: false, error: 'Görünecek adını yaz.' };
    const pe = pwError(String(pw || '')); if (pe) return { ok: false, error: pe };
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await derive(pw, salt);
    return { ok: true, line: `    { user: '${u}', name: '${n.replace(/['\\]/g, '')}', salt: '${salt}', iter: ${ITER}, hash: '${hash}'${owner ? ', owner: true' : ''} },` };
  }

  window.Admin = {
    session, login, logout, makeEntry,
    count: () => ADMINS.length,
    isOwner: () => { const s = session(); return !!(s && s.owner); },
    // Yalnızca sahip (owner) oturumunda: tüm yönetici listesi
    admins: () => { const s = session(); return s && s.owner ? ADMINS.map((a) => ({ user: a.user, name: a.name, owner: !!a.owner, revoked: isRevoked(a.user) })) : []; },
    // Sahip, bir yöneticiyi kaldırmak için REVOKED'a eklenecek satırı üretir (sahip kaldırılamaz)
    revokeLine: (u) => { const s = session(); const x = String(u || '').trim().toLowerCase(); return s && s.owner && ADMINS.some((a) => a.user === x && !a.owner) ? `    '${x.replace(/['\\]/g, '')}',` : null; }
  };
})();
