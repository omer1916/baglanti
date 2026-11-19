/* Bağlantı · hesap ve oturum (göstermelik)
   Sunucu yoktur: tek hesap ve verileri bu tarayıcının localStorage'ında tutulur.
   Şifre düz metin saklanmaz; WebCrypto PBKDF2-SHA256 (210.000 tur, 16 bayt rastgele tuz) özeti saklanır.
   Not: İstemci tarafı bir prototiptir. Tarayıcı deposuna erişen biri kaydı değiştirebilir;
   gerçek kimlik doğrulama, kilitleme ve oturum yönetimi sunucuda yapılmalıdır. */
(function () {
  'use strict';
  const K = window.Core;
  const { KEYS, mode, buildWorkspace } = K;

  /* Hazır örnek hesap. Kaynak kodda şifresi YOKTUR: her tarayıcıda rastgele, hiçbir şifreyle eşleşmeyen
     bir özetle oluşturulur ve yalnızca giriş ekranındaki “Örnek hesapla giriş yap” düğmesiyle açılır.
     Kullanıcı Ayarlar'dan kendi şifresini belirlerse tek tıkla giriş kapanır. */
  const SAMPLE_PROFILE = { name: 'Selin Koç', email: 'selin@baglanti.demo', username: 'selinkoc', city: 'Bursa', role: 'uye' };
  const KDF = { name: 'PBKDF2-SHA256', iter: 210000 };     // OWASP 2023 önerisi düzeyi
  const LEGACY = { name: 'SHA256-iter', iter: 1000 };       // WebCrypto yoksa (eski tarayıcı) yedek
  const LOCK_AFTER = 5, LOCK_MS = 30000, LOCK_MAX = 15 * 60000;
  const PW_MAX = 128;
  const REMEMBER_MS = 30 * 86400000, SESSION_MS = 12 * 3600000;
  const subtle = (window.crypto && window.crypto.subtle) || null;

  /* ---------- depolama ---------- */
  const store = (area) => ({
    get(k) { try { return window[area].getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window[area].setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { window[area].removeItem(k); } catch (e) { /* yok */ } }
  });
  const ls = store('localStorage'), ss = store('sessionStorage');
  const readJSON = (s, k) => { try { return JSON.parse(s.get(k)); } catch (e) { return null; } };

  /* ---------- SHA-256 (saf JS; http üzerinden de çalışsın diye) ---------- */
  const KK = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  function sha256(str) {
    const msg = new TextEncoder().encode(str);
    const l = msg.length, total = ((l + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(total); buf.set(msg); buf[l] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 4, (l * 8) >>> 0);
    dv.setUint32(total - 8, Math.floor((l * 8) / 0x100000000));
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const W = new Uint32Array(64);
    const r = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ (W[i - 15] >>> 3);
        const s1 = r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + KK[i] + W[i]) >>> 0;
        const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    return Array.from(H, (x) => x.toString(16).padStart(8, '0')).join('');
  }
  function legacyHash(pw, salt) { let h = salt + ':' + pw; for (let i = 0; i < LEGACY.iter; i++) h = sha256(salt + h); return h; }
  const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  function newSalt() { const a = new Uint8Array(16); crypto.getRandomValues(a); return hex(a); }
  async function derive(pw, salt, kdf) {
    if (kdf && kdf.name === KDF.name && subtle) {
      const enc = new TextEncoder();
      const key = await subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
      return hex(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: kdf.iter }, key, 256));
    }
    return legacyHash(pw, salt);
  }
  const bestKdf = () => (subtle ? { ...KDF } : { ...LEGACY });
  const kdfLabel = (k) => (k && k.name === KDF.name ? `PBKDF2-SHA256 · tuzlu · ${k.iter.toLocaleString('tr-TR')} tur` : `SHA-256 · tuzlu · ${LEGACY.iter} tur (yedek yöntem)`);
  // Sabit süreli karşılaştırma: eşleşmeyen ilk karakterde erken çıkmaz
  function safeEqual(a, b) { a = String(a); b = String(b); let d = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return d === 0; }
  async function setPassword(acc, pw) { const kdf = bestKdf(); acc.salt = newSalt(); acc.kdf = kdf; acc.algo = kdfLabel(kdf); acc.hash = await derive(pw, acc.salt, kdf); }

  /* ---------- hesap kaydı ---------- */
  let auth = readJSON(ls, KEYS.auth);
  function writeAuth() { ls.set(KEYS.auth, JSON.stringify(auth)); }
  function makeAccount(d, seeded) {
    return { name: d.name.trim().slice(0, 40), email: d.email.trim().toLowerCase().slice(0, 254), username: d.username.trim().toLowerCase(), city: (d.city || '').trim().slice(0, 30), role: K.ROLES[d.role] && d.role !== 'site' ? d.role : 'uye', club: d.club && K.state.communities[d.club] ? d.club : '', dept: (d.dept || '').trim().slice(0, 60), grad: !!d.grad, gradYear: d.grad ? String(d.gradYear || '').trim().slice(0, 4) : '', studentNo: d.grad ? '' : (d.studentNo || '').trim().toUpperCase().slice(0, 15), note: (d.note || '').trim().slice(0, 300), seeded: !!seeded, created: seeded ? Date.now() - 400 * 86400000 : Date.now(), lastLogin: null, failed: 0, locks: 0, lockUntil: 0, sessionToken: newSalt() };
  }
  // İlk açılışta örnek hesabı oluştur (hesap silinirse geri gelmez).
  if (!auth) {
    const a = makeAccount(SAMPLE_PROFILE, true);
    a.salt = newSalt(); a.kdf = bestKdf(); a.algo = kdfLabel(a.kdf) + ' · şifre belirlenmedi'; a.hash = newSalt() + newSalt();   // eşleşen şifre yok
    auth = { account: a }; writeAuth();
  }

  /* ---------- oturum ---------- */
  function readSession() { return readJSON(ss, KEYS.session) || readJSON(ls, KEYS.session); }
  function session() {
    const s = readSession(), a = auth && auth.account;
    if (!s || !a || !a.sessionToken || s.username !== a.username || !safeEqual(s.token, a.sessionToken)) return null;
    if (!(s.exp > Date.now())) { clearSession(); return null; }
    return s;
  }
  function startSession(remember) {
    const a = auth.account; if (!a.sessionToken) a.sessionToken = newSalt();
    const now = Date.now();
    const s = JSON.stringify({ username: a.username, token: a.sessionToken, at: now, exp: now + (remember ? REMEMBER_MS : SESSION_MS), remember: !!remember });
    ls.del(KEYS.session); ss.del(KEYS.session);
    (remember ? ls : ss).set(KEYS.session, s);
  }
  // Oturum belirtecini yenile: diğer sekmelerdeki tüm oturumlar geçersiz olur
  function rotateToken() { if (auth.account) auth.account.sessionToken = newSalt(); }
  function clearSession() { ls.del(KEYS.session); ss.del(KEYS.session); }
  function flash(msg) { ss.set(KEYS.flash, msg); }
  function takeFlash() { const m = ss.get(KEYS.flash); ss.del(KEYS.flash); return m; }
  function go(hash) { history.replaceState(null, '', hash); location.reload(); }

  /* ---------- doğrulama ---------- */
  const RX = { email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, username: /^[a-z0-9_.]{3,20}$/ };
  function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-zçğıöşü]/.test(pw) && /[A-ZÇĞİÖŞÜ]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^\p{L}\p{N}]/u.test(pw)) s++;
    return { score: s, label: s <= 2 ? 'Zayıf' : s === 3 ? 'Orta' : 'Güçlü' };
  }
  function passwordError(pw) {
    if (pw.length < 8) return 'Şifre en az 8 karakter olmalı.';
    if (pw.length > PW_MAX) return `Şifre en fazla ${PW_MAX} karakter olabilir.`;
    if (!/\p{L}/u.test(pw) || !/\d/.test(pw)) return 'Şifre en az bir harf ve bir rakam içermeli.';
    return '';
  }
  function validateRegister(d) {
    const e = {};
    if (d.name.trim().length < 3 || d.name.trim().length > 40) e.name = 'Adını ve soyadını yaz (3–40 karakter).';
    if (!RX.username.test(d.username.trim().toLowerCase())) e.username = 'Kullanıcı adı 3–20 karakter olmalı; yalnızca a-z, rakam, nokta ve alt çizgi.';
    if (!RX.email.test(d.email.trim()) || d.email.trim().length > 254) e.email = 'Geçerli bir e-posta adresi yaz (ör. ad@ornek.com).';
    const pe = passwordError(d.password); if (pe) e.password = pe;
    if (!e.password && d.password !== d.confirm) e.confirm = 'Şifreler eşleşmiyor.';
    if ((K.ROLES[d.role] ? d.role : 'uye') === 'uye') {
      if (!d.grad && !(d.club && K.state.communities[d.club])) e.club = 'Üye olmak istediğin kulübü seç.';
      if ((d.dept || '').trim().length < 3) e.dept = 'Okulunu ve bölümünü yaz.';
      if (d.grad) {
        const y = +String(d.gradYear || '').trim(), now = new Date().getFullYear();
        if (!/^\d{4}$/.test(String(d.gradYear || '').trim()) || y < 1960 || y > now) e.gradYear = `Mezuniyet yılını yaz (1960–${now}).`;
      } else if (!/^[0-9A-Za-z]{4,15}$/.test((d.studentNo || '').trim())) e.studentNo = 'Öğrenci numaranı yaz (4–15 harf ya da rakam).';
    }
    if (d.note && d.note.trim().length > 300) e.note = 'Tanıtım en fazla 300 karakter olabilir.';
    if (!d.consent) e.consent = 'Devam etmek için kullanım koşullarını ve aydınlatma metnini onayla.';
    return e;
  }

  /* ---------- işlemler ---------- */
  async function register(d) {
    const errors = validateRegister(d);
    if (Object.keys(errors).length) return { ok: false, errors };
    const a = makeAccount(d, false);
    await setPassword(a, d.password);
    a.lastLogin = Date.now();
    // Kulüp başvurusu: yöneticinin onay listesine düşer (eski hesabın başvurusu silinir)
    const old = auth.account;
    const apps = K.readApps().filter((x) => !(old && x.id === old.appId));
    if (a.role === 'uye' && (a.club || a.grad)) {
      a.appId = 'ap' + newSalt().slice(0, 10);
      apps.push({ id: a.appId, name: a.name, username: a.username, email: a.email, city: a.city, dept: a.dept, studentNo: a.studentNo, grad: a.grad, gradYear: a.gradYear, note: a.note, club: a.club, ts: Date.now(), status: a.grad ? 'review' : 'pending' });
    }
    K.writeApps(apps);
    auth.account = a;
    startSession(false);
    writeAuth();
    ls.set(KEYS.account, JSON.stringify(buildWorkspace(a)));
    ls.set(KEYS.active, 'account');
    flash(`Hesabın oluşturuldu. Hoş geldin, ${a.name.split(' ')[0]}!`);
    go('#/akis');
    return { ok: true };
  }
  async function login(id, pw, remember) {
    const a = auth.account;
    if (!a) return { ok: false, error: 'Bu tarayıcıda kayıtlı hesap yok. Önce kayıt ol.' };
    const now = Date.now();
    if (a.lockUntil > now) return { ok: false, error: `Çok fazla hatalı deneme. ${Math.ceil((a.lockUntil - now) / 1000)} saniye sonra tekrar dene.` };
    const ident = String(id).trim().toLowerCase();
    // Kimlik yanlış olsa da özet hesaplanır: yanıt süresi hangi alanın hatalı olduğunu ele vermez
    const pwOk = pw.length <= PW_MAX && safeEqual(await derive(pw, a.salt, a.kdf || LEGACY), a.hash);
    if (!(ident === a.email || ident === a.username) || !pwOk) {
      a.failed = (a.failed || 0) + 1;
      if (a.failed >= LOCK_AFTER) {
        a.failed = 0; a.locks = (a.locks || 0) + 1;
        const ms = Math.min(LOCK_MS * 2 ** (a.locks - 1), LOCK_MAX);   // her kilitte süre ikiye katlanır
        a.lockUntil = now + ms; writeAuth();
        return { ok: false, error: `Çok fazla hatalı deneme. Güvenliğin için giriş ${ms >= 60000 ? Math.round(ms / 60000) + ' dakika' : Math.round(ms / 1000) + ' saniye'} kilitlendi.` };
      }
      writeAuth();
      return { ok: false, error: `E-posta / kullanıcı adı veya şifre hatalı. Kalan deneme: ${LOCK_AFTER - a.failed}.` };
    }
    const best = bestKdf();
    if (!a.kdf || a.kdf.name !== best.name || a.kdf.iter < best.iter) await setPassword(a, pw);   // eski özeti yükselt
    a.failed = 0; a.locks = 0; a.lockUntil = 0; a.prevLogin = a.lastLogin; a.lastLogin = now;
    startSession(remember);
    writeAuth();
    if (!ls.get(KEYS.account)) ls.set(KEYS.account, JSON.stringify(buildWorkspace(a)));
    ls.set(KEYS.active, 'account');
    flash(`Tekrar hoş geldin, ${a.name.split(' ')[0]}!`);
    go('#/akis');
    return { ok: true };
  }
  function logout() {
    if (mode === 'account') { rotateToken(); writeAuth(); clearSession(); flash('Çıkış yapıldı.'); go('#/giris'); }
    else { K.state.onboarded = false; K.save(); flash('Demodan çıkıldı.'); go('#/hosgeldin'); }
  }
  function deleteAccount() {
    if (auth.account && auth.account.appId) K.writeApps(K.readApps().filter((x) => x.id !== auth.account.appId));
    auth.account = null; writeAuth();
    ls.del(KEYS.account); clearSession();
    ls.set(KEYS.active, 'demo');
    flash('Hesabın ve tüm verilerin silindi.');
    go('#/hosgeldin');
  }
  function switchToDemo(role) {
    const s = readJSON(ls, KEYS.demo) || window.SEED();
    s.onboarded = true; s.role = K.ROLES[role] ? role : 'uye';
    ls.set(KEYS.demo, JSON.stringify(s));
    ls.set(KEYS.active, 'demo');
    flash(`${K.ROLES[s.role].label} olarak demoya girildi.`);
    go('#/akis');
  }
  function resetWorkspace() {
    ls.set(KEYS.account, JSON.stringify(buildWorkspace(auth.account)));
    flash('Hesap verileri ilk haline döndürüldü.');
    go('#/akis');
  }
  // Örnek hesap, kullanıcı kendi şifresini belirleyene kadar şifresizdir
  const sampleOpen = () => !!(auth.account && auth.account.seeded && !auth.account.pwChanged);
  function loginSample(remember) {
    if (!sampleOpen()) return { ok: false, error: 'Örnek hesap için tek tıkla giriş kapalı; şifrenle giriş yap.' };
    const a = auth.account;
    a.failed = 0; a.locks = 0; a.lockUntil = 0; a.prevLogin = a.lastLogin; a.lastLogin = Date.now();
    startSession(remember);
    writeAuth();
    if (!ls.get(KEYS.account)) ls.set(KEYS.account, JSON.stringify(buildWorkspace(a)));
    ls.set(KEYS.active, 'account');
    flash(`Örnek hesapla giriş yapıldı. Hoş geldin, ${a.name.split(' ')[0]}!`);
    go('#/akis');
    return { ok: true };
  }
  async function changePassword(oldPw, newPw) {
    const a = auth.account;
    if (!a) return 'Oturum bulunamadı.';
    if (!sampleOpen() && !safeEqual(await derive(oldPw, a.salt, a.kdf || LEGACY), a.hash)) return 'Mevcut şifre hatalı.';
    const pe = passwordError(newPw); if (pe) return pe;
    if (!sampleOpen() && oldPw === newPw) return 'Yeni şifre mevcut şifreden farklı olmalı.';
    const s = session();
    await setPassword(a, newPw); a.pwChanged = Date.now();
    rotateToken(); startSession(!!(s && s.remember));   // diğer oturumlar kapanır, bu sekme açık kalır
    writeAuth();
    return '';
  }
  function updateProfile(p) {
    if (!auth.account) return;
    if (typeof p.name === 'string' && p.name.trim().length >= 3) auth.account.name = p.name.trim().slice(0, 40);
    if (typeof p.city === 'string') auth.account.city = p.city.trim().slice(0, 30);
    if (typeof p.dept === 'string') auth.account.dept = p.dept.trim().slice(0, 60);
    writeAuth();
  }
  function record() {
    const a = auth.account; if (!a) return null;
    const { salt, hash, sessionToken, ...rest } = a;
    return { ...rest, salt: salt.slice(0, 8) + '…', hash: hash.slice(0, 16) + '…', sessionToken: '(gizli)' };
  }

  window.Auth = {
    sampleOpen, loginSample,
    mode, strength, validateRegister,
    account: () => auth.account,
    session,
    isAuthed: () => (mode === 'account' ? !!session() : !!K.state.onboarded),
    register, login, logout, deleteAccount, switchToDemo, resetWorkspace, changePassword, updateProfile, record, takeFlash,
    PW_MAX, sha256
  };
})();
