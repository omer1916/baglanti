/* Bağlantı · yönlendirme, kabuk, etkileşimler */
(function () {
  'use strict';
  const K = window.Core;
  const { state, save, $, $$, esc, setHTML, replaceHTML, appendHTML, lower, num, uid, icon, avatar, media, timeAgo, entity, U, C, P, E, N, me } = K;
  const { V, UI, postCard, rail } = window.Views;

  const els = { shell: $('#shell'), main: $('#main'), rail: $('#rail'), sidebar: $('#sidebar'), modal: $('#modal'), story: $('#story'), toasts: $('#toasts') };
  let lastRoute = '';

  /* =============== yardımcılar =============== */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const dec = (x) => { try { return decodeURIComponent(x); } catch (e) { return ''; } };
    const parts = path.split('/').filter(Boolean).map(dec);
    // URL'den gelen değerler beyaz listeyle sınırlanır: rota/kimlik/sekme yalnızca harf, rakam, - ve _
    const SAFE = /^[a-z0-9_-]{1,40}$/i;
    const q = new URLSearchParams(qs || '');
    if (q.has('tab') && !SAFE.test(q.get('tab'))) q.delete('tab');
    if (q.has('q')) q.set('q', q.get('q').slice(0, 100));
    const name = SAFE.test(parts[0] || '') ? parts[0] : (parts[0] ? 'notfound' : 'akis');
    const id = parts[1] && SAFE.test(parts[1]) ? parts[1] : (parts[1] ? '__invalid__' : undefined);
    return { name, id, q, path };
  }
  function toast(msg, kind = 'ok') {
    const t = document.createElement('div');
    t.className = 'toast';
    setHTML(t, icon(kind === 'ok' ? 'check' : 'info') + `<span>${esc(msg)}</span>`);
    els.toasts.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2800);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); } catch (e) { /* izin yoksa sessiz geç */ }
  }
  const embedded = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  function downloadFile(name, content, type) {
    if (embedded) { toast('Bu paylaşılan önizlemede dosya indirme kapalı; yerel sürümde çalışır.', 'info'); return false; }
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return true;
  }
  const unreadNotifs = () => state.notifications.filter((n) => !n.read).length;
  const unreadMsgs = () => !K.canMessage() ? 0 : state.conversations.reduce((s, c) => s + (c.unread || 0), 0);
  function notify(type, text, link, extra = {}) {
    state.notifications.unshift({ id: uid('nt'), type, text, ts: Date.now(), read: false, link, ...extra });
  }

  /* =============== kabuk =============== */
  function navItems() {
    return [
      ['akis', '#/akis', 'home', 'Ana sayfa'],
      ['kesfet', '#/kesfet', 'compass', 'Keşfet ve ara'],
      ['topluluklar', '#/topluluklar', 'users', 'Topluluklar & gruplar'],
      ['etkinlikler', '#/etkinlikler', 'calendar', 'Etkinlikler'],
      ['sponsorlar', '#/sponsorlar', 'gift', 'Sponsorlar & sayfalar'],
      ['ilanlar', '#/ilanlar', 'briefcase', 'İş & staj ilanları'],
      ['medya', '#/medya', 'image', 'Medya arşivi'],
      ['uyeler', '#/uyeler', 'userPlus', 'Üyeler & bağlantılar', state.connections.incoming.length]
    ];
  }
  function renderShell(r) {
    const key = r.name === 'topluluk' ? 'topluluklar' : r.name === 'etkinlik' ? 'etkinlikler' : r.name === 'sayfa' && !(r.id === K.BRAND_PAGE && K.isBrand()) ? 'sponsorlar' : r.name;
    const m = me();
    setHTML(els.sidebar, navItems().map(([k, href, ic, label, count]) => `<a class="nav-link" data-sec="${k}" href="${href}" ${k === key ? 'aria-current="page"' : ''} title="${label}">${icon(ic)}<span>${label}</span>${count ? `<span class="count">${count}</span>` : ''}</a>`).join(''));

    // hesap menüsü (profil fotoğrafı): hesapla ilgili her şey burada
    const pending = state.reports.filter((x) => x.status === 'Bekliyor').length;
    const acc = [];
    if (K.isBrand()) acc.push(['sayfa:kuzey', '#/sayfa/kuzey', 'chart', 'Sayfam & istatistik']);
    if (K.isManager()) acc.push(['yonetim', '#/yonetim', 'shield', 'Yönetim paneli', pending]);
    acc.push(['kaydedilenler', '#/kaydedilenler', 'bookmark', 'Kaydedilenler'], ['ayarlar', '#/ayarlar', 'settings', 'Ayarlar & gizlilik']);
    const accKey = r.name === 'sayfa' && r.id === K.BRAND_PAGE && K.isBrand() ? 'sayfa:kuzey' : r.name;
    setHTML($('#account-btn'), avatar({ ...m, kind: 'user' }, 'sm'));
    $('#account-btn').toggleAttribute('data-active', ['profil', 'kaydedilenler', 'ayarlar', 'yonetim'].includes(accKey) || accKey === 'sayfa:kuzey' || (r.name === 'kisi' && r.id === state.me));
    setHTML($('[data-popover="account"]'), `
      <a class="pop-me" href="#/profil">${avatar({ ...m, kind: 'user' }, 'md')}<span class="grow"><b>${esc(m.name)}</b><span>${K.mode === 'account' ? esc(window.Auth.account()?.email || '') : 'Demo modu · hesapsız'}</span><span>${esc(K.ROLES[state.role].label)} · Profilini gör</span></span></a>
      <hr>
      ${acc.map(([k, href, ic, label, count]) => `<a href="${href}" ${k === accKey ? 'aria-current="page"' : ''}>${icon(ic)}<span class="grow">${label}</span>${count ? `<span class="count">${count}</span>` : ''}</a>`).join('')}
      <button data-action="toggle-theme">${icon(state.theme === 'dark' ? 'sun' : 'moon')}${state.theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}</button>
      <hr><div class="menu-label">Demo rolü</div>
      ${Object.entries(K.ROLES).map(([k, v]) => `<button role="menuitemradio" aria-checked="${state.role === k}" data-action="set-role" data-role="${k}">${v.label}</button>`).join('')}
      <hr>
      <a href="#/hosgeldin">${icon('sparkle')}Tanıtım ve SSS</a>
      <button data-action="reset-demo">${icon('refresh')}${K.mode === 'account' ? 'Hesap verilerini sıfırla' : 'Demoyu sıfırla'}</button>
      <hr>
      ${K.mode === 'account' ? `<button data-action="logout">${icon('logout')}Çıkış yap</button>` : `<a href="#/kayit">${icon('userPlus')}Kayıt ol</a><button data-action="logout">${icon('logout')}Demodan çık</button>`}`);

    // üst çubuk: etkin sayfa
    $$('.topbar [data-top]').forEach((el) => { if (el.dataset.top === r.name) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });

    // üyelerde mesaj simgesi gizli
    $$('[data-top="mesajlar"]').forEach((el) => { el.hidden = !K.canMessage(); });
    // rozetler
    const counts = { messages: unreadMsgs(), notifications: unreadNotifs() };
    $$('[data-badge]').forEach((el) => { const n = counts[el.dataset.badge]; if (n) el.setAttribute('data-badge-count', n > 9 ? '9+' : n); else el.removeAttribute('data-badge-count'); });
    // alt gezinme
    $$('.bottom-nav [data-nav]').forEach((el) => { if (el.dataset.nav === r.name) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.theme === 'dark' ? '#0E0F13' : '#F3F4F7');
  }

  /* =============== yönlendirme =============== */
  const PUBLIC_ROUTES = ['hosgeldin', 'giris', 'kayit', 'sss'];
  function render(opts = {}) {
    const r = parseHash();
    if (!window.Auth.isAuthed() && !PUBLIC_ROUTES.includes(r.name)) { location.replace(K.mode === 'account' ? '#/giris' : '#/hosgeldin'); return; }
    const fn = Object.prototype.hasOwnProperty.call(V, r.name) && !['discoverResults', 'galleryList', 'msgBubble', 'notfound'].includes(r.name) ? V[r.name] : V.notfound;
    const view = fn(r);
    const layout = view.layout || '';
    els.shell.className = 'shell ' + layout;
    document.body.classList.toggle('landing', layout === 'bare');
    document.body.dataset.route = r.name;
    setHTML(els.main, view.html);
    setHTML(els.rail, layout ? '' : (view.rail || rail()));
    renderShell(r);
    document.title = `${view.title} · Bağlantı`;
    const routeKey = r.path;
    els.main.classList.remove('route-enter');
    if (routeKey !== lastRoute && !opts.keepScroll) {
      void els.main.offsetWidth;   // animasyonu yeniden başlat
      els.main.classList.add('route-enter');
      window.scrollTo(0, 0);
      if (lastRoute) els.main.focus({ preventScroll: true });
    }
    lastRoute = routeKey;
    closeDrawer();
    if (view.after) view.after();
  }
  function refresh() { save(); render({ keepScroll: true }); }
  function rerenderPost(id) {
    const p = state.posts.find((x) => x.id === id);
    const el = document.getElementById('post-' + id);
    save();
    if (p && el) replaceHTML(el, postCard(p)); else render({ keepScroll: true });
    renderShell(parseHash());
  }

  /* =============== popover / çekmece =============== */
  let openPop = null;
  function closePopovers() {
    if (openPop) { openPop.pop.hidden = true; openPop.btn.setAttribute('aria-expanded', 'false'); openPop = null; }
  }
  function togglePopover(btn) {
    const pop = document.querySelector(`[data-popover="${btn.dataset.menu}"]`);
    if (!pop) return;
    const willOpen = pop.hidden;
    closePopovers();
    if (willOpen) { pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); openPop = { pop, btn }; }
  }
  function openDrawer() { els.sidebar.scrollTop = 0; document.body.classList.add('drawer-open'); $('.drawer-backdrop').hidden = false; }
  function closeDrawer() { document.body.classList.remove('drawer-open'); $('.drawer-backdrop').hidden = true; }

  /* =============== modal =============== */
  let onConfirm = null;
  function openModal({ title, body, foot = '', cls = '', form = '', formAttrs = '' }) {
    const m = els.modal;
    m.className = 'modal ' + cls;
    const inner = `<div class="modal-head"><h2 id="modal-title">${title}</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Kapat">${icon('x')}</button></div><div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}`;
    setHTML(m, form ? `<form class="modal-form" data-form="${form}" ${formAttrs} novalidate>${inner}</form>` : inner);
    if (!m.open) m.showModal();
  }
  function closeModal() { if (els.modal.open) els.modal.close(); }
  function confirmModal({ title, text, ok = 'Onayla', danger = false, onOk }) {
    onConfirm = onOk;
    openModal({ title, body: `<p>${text}</p>`, foot: `<button class="btn" data-action="close-modal">Vazgeç</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm-ok">${ok}</button>` });
  }

  /* ---------- gönderi oluşturucu ---------- */
  let cs = null;
  const ALLOWED = { uye: ['post'], moderator: ['post', 'announcement'], yonetici: ['post', 'event', 'announcement', 'sponsor'], marka: ['post'] };
  const TYPE_LABEL = { post: 'Gönderi', event: 'Etkinlik', announcement: 'Duyuru', sponsor: 'Sponsor ihtiyacı' };
  const FEELINGS = ['😊 mutlu', '🤩 heyecanlı', '🙏 minnettar', '🏕️ kampta', '🎵 müzik dinliyor', '🚴 pedal çeviriyor', '☕ kahve molasında'];

  function openComposer(o = {}) {
    const allowed = ALLOWED[state.role];
    const editing = o.editId && state.posts.find((p) => p.id === o.editId);
    if (editing) {
      cs = { editId: editing.id, type: editing.type, text: editing.text, media: editing.media.slice(), location: editing.location || '', feeling: editing.feeling || '', visibility: editing.visibility, target: editing.community || '', showLoc: !!editing.location, showFeel: !!editing.feeling, ev: {}, need: {} };
    } else {
      const type = allowed.includes(o.type) ? o.type : 'post';
      let target = o.community || '';
      if (type !== 'post' && !K.MANAGED.includes(target)) target = K.MANAGED[0];
      cs = { type, text: '', media: [], location: '', feeling: '', visibility: type === 'announcement' ? 'Topluluk üyeleri' : 'Herkese açık', target, showLoc: false, showFeel: !!o.feeling, ev: { title: '', date: '', time: '19:00', location: '', capacity: 50, partners: [] }, need: { title: '', category: 'Ürün', goal: 10, deadline: '' } };
    }
    renderComposer();
    if (o.pick) setTimeout(() => $('#compose-file')?.click(), 50);
  }
  function composerIdentity() {
    if (K.isBrand()) return { ...P(K.BRAND_PAGE), kind: 'page' };
    if (cs.type !== 'post' && cs.target) return { ...C(cs.target), kind: 'community' };
    return { ...me(), kind: 'user' };
  }
  function renderComposer() {
    const allowed = ALLOWED[state.role];
    const who = composerIdentity();
    const max = 1000;
    const targets = cs.type === 'post'
      ? [['', K.isBrand() ? 'Sayfamda' : 'Profilimde'], ...Object.values(state.communities).filter((c) => c.joined).map((c) => [c.id, c.name])]
      : K.MANAGED.map((id) => [id, C(id).name]);
    const otherComms = Object.values(state.communities).filter((c) => c.id !== cs.target && c.type !== 'Gizli');
    const ph = { post: 'Aklından neler geçiyor?', event: 'Etkinliği kısaca anlat…', announcement: 'Duyurunu yaz…', sponsor: 'Topluluğun neye ihtiyaç duyuyor, neden?' }[cs.type];
    const body = `
      ${allowed.length > 1 && !cs.editId ? `<div class="seg" role="group" aria-label="Gönderi türü">${allowed.map((t) => `<button type="button" data-action="cs-type" data-value="${t}" aria-pressed="${cs.type === t}">${TYPE_LABEL[t]}</button>`).join('')}</div>` : ''}
      <div class="row">${avatar(who, 'md')}<div class="grow"><b>${esc(who.name)}</b>
        <div class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap">
          <label class="sr-only" for="cs-target">Paylaşım yeri</label>
          <select class="select" id="cs-target" data-cs="target" style="width:auto;min-height:34px;padding:4px 32px 4px 10px;font-size:13px" ${cs.editId ? 'disabled' : ''}>${targets.map(([v, l]) => `<option value="${v}" ${cs.target === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
          <label class="sr-only" for="cs-vis">Görünürlük</label>
          <select class="select" id="cs-vis" data-cs="visibility" style="width:auto;min-height:34px;padding:4px 32px 4px 10px;font-size:13px">${['Herkese açık', 'Topluluk üyeleri', 'Arkadaşlar', 'Sadece ben'].map((v) => `<option ${cs.visibility === v ? 'selected' : ''}>${v}</option>`).join('')}</select>
        </div></div></div>
      ${cs.type === 'event' && !cs.editId ? `<div class="form-grid">
        <div class="field full"><label for="ev-title">Etkinlik adı *</label><input class="input" id="ev-title" data-cs="ev.title" value="${esc(cs.ev.title)}" required maxlength="80"></div>
        <div class="field"><label for="ev-date">Tarih *</label><input class="input" type="date" id="ev-date" data-cs="ev.date" value="${esc(cs.ev.date)}" required></div>
        <div class="field"><label for="ev-time">Saat</label><input class="input" type="time" id="ev-time" data-cs="ev.time" value="${esc(cs.ev.time)}"></div>
        <div class="field"><label for="ev-loc">Konum *</label><input class="input" id="ev-loc" data-cs="ev.location" value="${esc(cs.ev.location)}" required placeholder="Mekân, ilçe"></div>
        <div class="field"><label for="ev-cap">Kontenjan</label><input class="input" type="number" min="1" id="ev-cap" data-cs="ev.capacity" value="${esc(cs.ev.capacity)}"></div>
        <fieldset class="field full" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">Ortak etkinlik (isteğe bağlı)</legend><div class="row" style="flex-wrap:wrap;gap:6px">${otherComms.map((c) => `<label class="chip" style="cursor:pointer"><input type="checkbox" data-cs-partner value="${c.id}" ${cs.ev.partners.includes(c.id) ? 'checked' : ''} style="accent-color:var(--brand-strong)">${esc(c.name)}</label>`).join('')}</div></fieldset>
      </div>` : ''}
      ${cs.type === 'sponsor' && !cs.editId ? `<div class="form-grid">
        <div class="field full"><label for="nd-title">İhtiyaç başlığı *</label><input class="input" id="nd-title" data-cs="need.title" value="${esc(cs.need.title)}" required maxlength="80" placeholder="Örn. 40 adet uyku tulumu"></div>
        <div class="field"><label for="nd-cat">Kategori</label><select class="select" id="nd-cat" data-cs="need.category">${['Ürün', 'Ekipman', 'Mekân', 'Baskı', 'Ulaşım', 'İkram'].map((x) => `<option ${cs.need.category === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label for="nd-goal">Hedef miktar *</label><input class="input" type="number" min="1" id="nd-goal" data-cs="need.goal" value="${esc(cs.need.goal)}"></div>
        <div class="field full"><label for="nd-dl">Son tarih *</label><input class="input" type="date" id="nd-dl" data-cs="need.deadline" value="${esc(cs.need.deadline)}"></div>
      </div>` : ''}
      <div class="field"><label class="sr-only" for="cs-text">Gönderi metni</label>
        <textarea class="textarea compose-text" id="cs-text" data-cs="text" maxlength="${max}" placeholder="${ph}">${esc(cs.text)}</textarea>
        <div class="counter ${cs.text.length > max - 50 ? 'warn' : ''}" id="cs-count" aria-live="polite">${cs.text.length} / ${max}</div></div>
      ${cs.media.length ? `<div class="attach-grid">${cs.media.map((m, i) => `<div class="attach">${m.src ? (m.video ? `<video src="${esc(m.src)}" muted></video>` : `<img src="${esc(m.src)}" alt="Önizleme ${i + 1}">`) : media(m)}<button type="button" data-action="cs-remove-media" data-i="${i}" aria-label="Medyayı kaldır">${icon('x', 'ico-sm')}</button></div>`).join('')}</div>` : ''}
      ${cs.showLoc ? `<div class="field"><label for="cs-loc">Konum</label><input class="input" id="cs-loc" data-cs="location" value="${esc(cs.location)}" placeholder="Örn. Uludağ, Bursa"></div>` : ''}
      ${cs.showFeel ? `<div class="field"><span class="label">Duygu / aktivite</span><div class="feeling-list">${FEELINGS.map((f) => `<button type="button" class="chip" data-action="cs-feel" data-value="${esc(f)}" aria-pressed="${cs.feeling === f}">${f}</button>`).join('')}</div></div>` : ''}
      <div class="tool-row"><span class="label">Gönderine ekle</span>
        <label class="tool-btn c1" title="Fotoğraf / Video" style="cursor:pointer">${icon('image')}<span class="sr-only">Fotoğraf veya video ekle</span><input type="file" id="compose-file" data-change="compose-file" accept="image/*,video/*" multiple hidden></label>
        <button type="button" class="tool-btn c2" data-action="cs-toggle" data-key="showLoc" aria-pressed="${cs.showLoc}" title="Konum">${icon('pin')}<span class="sr-only">Konum ekle</span></button>
        <button type="button" class="tool-btn c3" data-action="cs-toggle" data-key="showFeel" aria-pressed="${cs.showFeel}" title="Duygu / Aktivite">${icon('smile')}<span class="sr-only">Duygu veya aktivite ekle</span></button>
        <button type="button" class="tool-btn c4" data-action="cs-sample" title="Örnek görsel">${icon('sparkle')}<span class="sr-only">Örnek görsel ekle</span></button>
      </div>
      ${!cs.editId && state.drafts.length ? `<button type="button" class="callout" data-action="cs-load-draft" style="text-align:left">${icon('file')}<span>${state.drafts.length} kayıtlı taslağın var. <b>Son taslağı aç</b></span></button>` : ''}
      <p class="xs muted">${icon('info', 'ico-sm')} Yayınladıktan sonra düzenleyebilir veya silebilirsin.</p>`;
    const foot = `${cs.editId ? '' : '<button type="button" class="btn btn-ghost" data-action="cs-draft">Taslak olarak kaydet</button>'}<button type="submit" class="btn btn-primary">${cs.editId ? 'Kaydet' : 'Paylaş'}</button>`;
    openModal({ title: cs.editId ? 'Gönderiyi düzenle' : 'Yeni gönderi oluştur', body, foot, form: 'compose' });
    const ta = $('#cs-text');
    if (ta && !(cs.type === 'event' || cs.type === 'sponsor')) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }
  function setCs(path, val) {
    const [a, b] = path.split('.');
    if (b) cs[a][b] = val; else cs[a] = val;
  }
  function submitComposer() {
    const text = cs.text.trim();
    const dateTs = (d, t = '10:00') => { if (!d) return null; const [y, mo, da] = d.split('-').map(Number); const [h, mi] = (t || '10:00').split(':').map(Number); return new Date(y, mo - 1, da, h, mi).getTime(); };
    if (cs.editId) {
      const p = state.posts.find((x) => x.id === cs.editId);
      if (!text && !cs.media.length && !p.event && !p.need) return toast('Gönderi boş olamaz.', 'info');
      Object.assign(p, { text, media: cs.media, visibility: cs.visibility, location: cs.location.trim(), feeling: cs.feeling, edited: true });
      closeModal(); refresh(); return toast('Gönderi güncellendi');
    }
    const post = { id: uid('p'), author: K.isBrand() ? { kind: 'page', id: K.BRAND_PAGE } : cs.type === 'post' ? { kind: 'user', id: state.me } : { kind: 'community', id: cs.target }, community: cs.target || null, ts: Date.now(), visibility: cs.visibility, type: cs.type, text, media: cs.media, location: cs.location.trim(), feeling: cs.feeling, likes: 0, liked: false, saved: false, shares: 0, comments: [] };
    if (cs.type === 'event') {
      const ev = cs.ev;
      const start = dateTs(ev.date, ev.time);
      if (!ev.title.trim() || !start || !ev.location.trim()) return toast('Etkinlik adı, tarih ve konum gerekli.', 'info');
      const e = { id: uid('e'), title: ev.title.trim(), communities: [cs.target, ...ev.partners], start, location: ev.location.trim(), category: C(cs.target).category, going: 1, capacity: Math.max(1, +ev.capacity || 50), attending: true, interested: false, sponsors: [], scene: C(cs.target).scene, desc: text || 'Ayrıntılar yakında.' };
      state.events.push(e);
      post.event = e.id;
      if (!post.text) post.text = `Yeni etkinlik: ${e.title}`;
    } else if (cs.type === 'sponsor') {
      const nd = cs.need;
      const dl = dateTs(nd.deadline);
      if (!nd.title.trim() || !dl || !(+nd.goal > 0)) return toast('Başlık, hedef ve son tarih gerekli.', 'info');
      const n = { id: uid('n'), community: cs.target, title: nd.title.trim(), category: nd.category, desc: text || nd.title.trim(), goal: +nd.goal, progress: 0, deadline: dl, supporters: [] };
      state.needs.unshift(n);
      post.need = n.id;
    } else {
      if (!text && !cs.media.length) return toast('Bir şeyler yaz ya da medya ekle.', 'info');
      if (cs.type === 'announcement') C(cs.target).pinned = text.slice(0, 160);
    }
    state.posts.unshift(post);
    if (cs.draftIndex != null) state.drafts.splice(cs.draftIndex, 1);
    closeModal();
    UI.feedFilter = 'tumu';
    const r = parseHash();
    if (['akis', 'topluluk', 'profil', 'sayfa', 'etkinlikler', 'sponsorlar', 'yonetim'].includes(r.name)) refresh(); else location.hash = '#/akis';
    toast({ post: 'Gönderin paylaşıldı', event: 'Etkinlik oluşturuldu ve duyuruldu', announcement: 'Duyuru yayınlandı ve sabitlendi', sponsor: 'Sponsor ihtiyacı yayınlandı' }[cs.type]);
  }

  /* ---------- hikâye görüntüleyici ---------- */
  let sv = null;
  const STORY_MS = 5000;
  function openStory(id) {
    const list = state.stories.filter((s) => !s.hidden);
    const si = list.findIndex((s) => s.id === id);
    if (si < 0) return;
    sv = { list, si, ii: 0, timer: null, remaining: STORY_MS, started: 0, paused: false };
    els.story.showModal();
    renderStory();
  }
  function renderStory() {
    clearTimeout(sv.timer);
    const s = sv.list[sv.si], it = s.items[sv.ii], c = C(s.community);
    const manage = K.isManager() && K.MANAGED.includes(c.id);
    els.story.classList.toggle('paused', sv.paused);
    setHTML(els.story, `<div class="story-frame">
      ${media({ scene: it.scene, alt: it.caption })}
      <button class="story-nav prev" data-action="story-prev" aria-label="Önceki"></button>
      <button class="story-nav next" data-action="story-next" aria-label="Sonraki"></button>
      <div class="story-top">
        <div class="story-bars">${s.items.map((_, i) => `<i class="${i < sv.ii ? 'done' : i === sv.ii ? 'run' : ''}"><b></b></i>`).join('')}</div>
        <div class="story-who">${avatar({ ...c, kind: 'community' }, 'sm')}<div class="grow"><b>${esc(c.name)}</b><span>${timeAgo(it.ts)} · 24 saat görünür</span></div>
          <button data-action="story-pause" aria-label="${sv.paused ? 'Oynat' : 'Duraklat'}">${icon(sv.paused ? 'play' : 'pause')}</button>
          <button data-action="story-close" aria-label="Kapat">${icon('x')}</button></div>
      </div>
      <div class="story-cap">
        <p>${esc(it.caption)}</p>
        <div class="row"><span class="row" style="gap:6px">${manage ? `${icon('eye', 'ico-sm')} ${num(it.views)} görüntülenme` : 'Dikey video · altyazılı'}</span>
          <span class="btn-row"><button class="btn btn-sm" data-action="story-mute" data-id="${s.id}">${icon(s.muted ? 'volume' : 'volumeOff', 'ico-sm')}${s.muted ? 'Sesi aç' : 'Sessize al'}</button><button class="btn btn-sm" data-action="story-hide" data-id="${s.id}">${icon('eyeOff', 'ico-sm')}Gizle</button></span></div>
      </div>
    </div>`);
    sv.remaining = STORY_MS;
    if (!sv.paused) { sv.started = Date.now(); sv.timer = setTimeout(storyNext, STORY_MS); }
  }
  function storyNext() {
    if (!sv) return;
    const s = sv.list[sv.si];
    if (sv.ii < s.items.length - 1) { sv.ii++; return renderStory(); }
    s.seen = true; save();
    if (sv.si < sv.list.length - 1) { sv.si++; sv.ii = 0; return renderStory(); }
    closeStory();
  }
  function storyPrev() {
    if (sv.ii > 0) sv.ii--; else if (sv.si > 0) { sv.si--; sv.ii = 0; }
    renderStory();
  }
  function storyPause() {
    sv.paused = !sv.paused;
    if (sv.paused) { clearTimeout(sv.timer); sv.remaining -= Date.now() - sv.started; }
    else { sv.started = Date.now(); sv.timer = setTimeout(storyNext, Math.max(200, sv.remaining)); }
    els.story.classList.toggle('paused', sv.paused);
    const b = els.story.querySelector('[data-action="story-pause"]');
    if (b) { setHTML(b, icon(sv.paused ? 'play' : 'pause')); b.setAttribute('aria-label', sv.paused ? 'Oynat' : 'Duraklat'); }
  }
  function closeStory() {
    if (sv) { clearTimeout(sv.timer); sv.list[sv.si].seen = true; sv = null; }
    if (els.story.open) els.story.close();
    save();
    if (parseHash().name === 'akis') render({ keepScroll: true });
  }

  /* ---------- ışık kutusu ---------- */
  let lb = null;
  function openLightbox(items, i) {
    lb = { items, i };
    renderLightbox();
  }
  function renderLightbox() {
    const it = lb.items[lb.i];
    const many = lb.items.length > 1;
    openModal({
      title: `${esc(it.caption || 'Medya')}${many ? ` <span class="muted small">${lb.i + 1} / ${lb.items.length}</span>` : ''}`,
      cls: 'lightbox',
      body: it.src && it.video ? `<div class="scene"><video src="${it.src}" controls playsinline style="width:100%;max-height:70dvh"></video></div>` : media(it),
      foot: many ? `<button class="btn" data-action="lb-prev">${icon('chevronLeft', 'ico-sm')}Önceki</button><button class="btn" data-action="lb-next">Sonraki${icon('chevronRight', 'ico-sm')}</button>` : ''
    });
    els.modal.querySelector('.modal-body').style.padding = '0';
  }

  /* =============== eylemler =============== */
  const A = {};
  const post = (id) => state.posts.find((p) => p.id === id);

  A['toggle-menu'] = (el) => togglePopover(el);
  A['toggle-drawer'] = () => (document.body.classList.contains('drawer-open') ? closeDrawer() : openDrawer());
  A['close-drawer'] = closeDrawer;
  A['toggle-theme'] = () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); save(true); refresh(); };
  A['close-modal'] = closeModal;
  A['confirm-ok'] = () => { const fn = onConfirm; onConfirm = null; closeModal(); fn && fn(); };
  A['set-role'] = (el) => { state.role = el.dataset.role; refresh(); toast(`Rol: ${K.ROLES[state.role].label}`); };
  A['enter-demo'] = (el) => {
    const r = el.dataset.role || 'uye';
    if (K.mode === 'account') return window.Auth.switchToDemo(r);
    state.onboarded = true; state.role = r; save(); location.hash = '#/akis'; toast(`${K.ROLES[state.role].label} olarak demoya girildi`);
  };
  A['reset-demo'] = () => confirmModal(K.mode === 'account'
    ? { title: 'Hesap verilerini sıfırla', text: 'Gönderilerin, mesajların ve ayarların ilk haline döner. Hesabın ve şifren silinmez.', ok: 'Sıfırla', danger: true, onOk: K.reset }
    : { title: 'Demoyu sıfırla', text: 'Yaptığın tüm değişiklikler silinecek ve demo ilk haline dönecek.', ok: 'Sıfırla', danger: true, onOk: K.reset });

  /* ---------- hesap ---------- */
  A.logout = () => window.Auth.logout();
  A['sample-login'] = () => {
    const f = $('[data-form="login"]');
    const res = window.Auth.loginSample(!!(f && f.remember.checked));
    if (!res.ok) toast(res.error, 'info');
  };
  A['toggle-pw'] = (el) => {
    const inp = document.getElementById(el.dataset.for); if (!inp) return;
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    el.setAttribute('aria-pressed', String(show));
    el.setAttribute('aria-label', show ? 'Şifreyi gizle' : 'Şifreyi göster');
    setHTML(el, icon(show ? 'eyeOff' : 'eye', 'ico-sm'));
  };
  A['forgot-password'] = () => openModal({ title: 'Şifremi unuttum', body: `<p>Gerçek bir sistemde e-posta adresine sıfırlama bağlantısı gönderilir. Bu göstermelik sürümde e-posta gönderilmez.</p><div class="callout">${icon('info')}<span>Şifreni hatırlamıyorsan <a class="link" href="#/kayit">yeni hesap oluşturabilirsin</a>; bu, tarayıcıdaki mevcut hesabın yerine geçer.${window.Auth.account()?.seeded ? ' Örnek hesaba giriş ekranındaki “Örnek hesapla giriş yap” düğmesiyle girebilirsin.' : ''}</span></div>`, foot: '<button class="btn btn-primary" data-action="close-modal">Tamam</button>' });
  A['show-record'] = () => openModal({ title: 'Saklanan hesap kaydı', body: `<p class="small muted">Tarayıcının yerel deposunda (localStorage) tutulan kayıt. Tuz ve özet kısaltılarak gösteriliyor; şifrenin kendisi hiçbir yerde saklanmaz.</p><div class="table-wrap"><pre class="code">${esc(JSON.stringify(window.Auth.record(), (k, v) => (['created', 'lastLogin', 'prevLogin', 'lockUntil', 'pwChanged'].includes(k) && v ? new Date(v).toLocaleString('tr-TR') : v), 2))}</pre></div>`, foot: '<button class="btn btn-primary" data-action="close-modal">Kapat</button>' });

  A.compose = (el) => openComposer({ type: el.dataset.type, community: el.dataset.community, pick: !!el.dataset.pick, feeling: !!el.dataset.feeling });
  A['cs-type'] = (el) => { cs.type = el.dataset.value; if (cs.type !== 'post' && !K.MANAGED.includes(cs.target)) cs.target = K.MANAGED[0]; if (cs.type === 'post') cs.target = ''; cs.visibility = cs.type === 'announcement' ? 'Topluluk üyeleri' : 'Herkese açık'; renderComposer(); };
  A['cs-toggle'] = (el) => { cs[el.dataset.key] = !cs[el.dataset.key]; renderComposer(); };
  A['cs-feel'] = (el) => { cs.feeling = cs.feeling === el.dataset.value ? '' : el.dataset.value; renderComposer(); };
  A['cs-remove-media'] = (el) => { cs.media.splice(+el.dataset.i, 1); renderComposer(); };
  A['cs-sample'] = () => { const pool = ['mountain', 'camp', 'forest', 'sea', 'coffee', 'music', 'bike', 'city']; cs.media.push({ scene: pool[Math.floor(Math.random() * pool.length)] }); renderComposer(); };
  A['cs-draft'] = () => { if (!cs.text.trim() && !cs.media.length) return toast('Boş taslak kaydedilemez.', 'info'); const d = { ...cs }; delete d.draftIndex; state.drafts.unshift(JSON.parse(JSON.stringify(d))); save(); closeModal(); toast('Taslak kaydedildi'); };
  A['cs-load-draft'] = () => { cs = { ...JSON.parse(JSON.stringify(state.drafts[0])), draftIndex: 0 }; if (!ALLOWED[state.role].includes(cs.type)) cs.type = 'post'; renderComposer(); };

  // Beğenenler: örnek veride beğenen listesi tutulmadığı için gönderiye göre sabit bir sırayla üyelerden seçilir
  A['show-likes'] = (el) => {
    const p = post(el.dataset.id); if (!p) return;
    const seed = [...p.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
    const others = Object.values(state.users).filter((u) => u.id !== state.me)
      .map((u, i) => ({ u, k: (seed * (i + 3) * 2654435761) >>> 0 })).sort((a, b) => a.k - b.k).map((x) => x.u);
    const shown = (p.liked ? [me()] : []).concat(others.slice(0, Math.max(0, Math.min(p.likes - (p.liked ? 1 : 0), others.length))));
    const rest = p.likes - shown.length;
    const isFriend = (id) => state.connections.friends.includes(id);
    openModal({
      title: `Beğenenler <span class="muted small">${num(p.likes)}</span>`,
      body: `<ul class="likers">${shown.map((u) => `<li><a class="liker" href="#/kisi/${u.id}" data-action="close-modal">${avatar({ ...u, kind: 'user' }, 'md')}<span class="grow"><b>${u.id === state.me ? 'Sen' : esc(u.name)}</b><span>@${esc(u.handle)} · ${esc(u.city || '')}${u.id !== state.me && isFriend(u.id) ? ' · Bağlantın' : ''}</span></span><span class="like-dot" aria-hidden="true">${icon('heart')}</span></a></li>`).join('')}</ul>
        ${rest > 0 ? `<p class="small muted likers-more">ve ${num(rest)} kişi daha beğendi</p>` : ''}`,
      foot: '<button class="btn btn-primary" data-action="close-modal">Kapat</button>'
    });
  };
  A.like = (el) => { const p = post(el.dataset.id); p.liked = !p.liked; p.likes += p.liked ? 1 : -1; rerenderPost(p.id); };
  A.save = (el) => { const p = post(el.dataset.id); p.saved = !p.saved; rerenderPost(p.id); toast(p.saved ? 'Kaydedilenlere eklendi' : 'Kaydedilenlerden çıkarıldı'); };
  A.share = (el) => { const p = post(el.dataset.id); p.shares++; copy(location.href.split('#')[0] + '#/akis'); rerenderPost(p.id); toast('Gönderi bağlantısı kopyalandı'); };
  A['copy-link'] = (el) => { copy(location.href.split('#')[0] + (el.dataset.href || '#/akis')); toast('Bağlantı kopyalandı'); };
  A['hide-post'] = (el) => { state.hiddenPosts.push(el.dataset.id); rerenderPost(el.dataset.id); };
  A['unhide-post'] = (el) => { state.hiddenPosts = state.hiddenPosts.filter((x) => x !== el.dataset.id); rerenderPost(el.dataset.id); };
  A['edit-post'] = (el) => openComposer({ editId: el.dataset.id });
  A['delete-post'] = (el) => confirmModal({ title: 'Gönderiyi sil', text: 'Bu gönderi kalıcı olarak silinecek. Bu işlem geri alınamaz.', ok: 'Sil', danger: true, onOk: () => { state.posts = state.posts.filter((p) => p.id !== el.dataset.id); refresh(); toast('Gönderi silindi'); } });
  A['mod-remove-post'] = (el) => confirmModal({ title: 'İçeriği kaldır', text: 'Gönderi kural ihlali nedeniyle kaldırılacak ve paylaşan kişiye bildirim gidecek. İşlem denetim kayıtlarına eklenir.', ok: 'Kaldır', danger: true, onOk: () => { state.posts = state.posts.filter((p) => p.id !== el.dataset.id); state.audit.push({ ts: Date.now(), who: state.me, text: 'Gönderi moderasyon tarafından kaldırıldı' }); refresh(); toast('İçerik kaldırıldı'); } });
  A.report = (el) => {
    const reasons = ['Spam veya yanıltıcı', 'Taciz / nefret söylemi', 'Sahte hesap', 'Telif ihlali', 'Kişisel veri paylaşımı', 'Diğer'];
    openModal({ title: `${esc(el.dataset.kind)} bildir`, form: 'report', formAttrs: `data-kind="${esc(el.dataset.kind)}" data-id="${esc(el.dataset.id)}"`,
      body: `<p class="small muted">Bildirimin anonimdir. Moderatörler öncelik ve risk sınıfına göre inceler.</p><div class="radio-list" role="radiogroup" aria-label="Bildirme nedeni">${reasons.map((x, i) => `<label class="radio-item"><input type="radio" name="reason" value="${x}" ${i === 0 ? 'checked' : ''}>${x}</label>`).join('')}</div><div class="field"><label for="rp-note">Ek açıklama (isteğe bağlı)</label><textarea class="textarea" id="rp-note" name="note" maxlength="500" style="min-height:80px"></textarea></div>`,
      foot: `<button type="button" class="btn" data-action="close-modal">Vazgeç</button><button class="btn btn-danger">Bildir</button>` });
  };
  A.lightbox = (el) => { const p = post(el.dataset.post); openLightbox(p.media.map((m) => ({ ...m, caption: entity(p.author)?.name })), +el.dataset.i); };
  A['lightbox-gallery'] = (el) => openLightbox(window.Views.V.galleryList(), +el.dataset.i);
  A['lightbox-scene'] = (el) => openLightbox([{ scene: el.dataset.scene, caption: 'Medya' }], 0);
  A['lb-prev'] = () => { lb.i = (lb.i - 1 + lb.items.length) % lb.items.length; renderLightbox(); };
  A['lb-next'] = () => { lb.i = (lb.i + 1) % lb.items.length; renderLightbox(); };

  A['open-story'] = (el) => openStory(el.dataset.id);
  A['story-next'] = storyNext; A['story-prev'] = storyPrev; A['story-pause'] = storyPause; A['story-close'] = closeStory;
  A['story-mute'] = (el) => { const s = state.stories.find((x) => x.id === el.dataset.id); s.muted = !s.muted; save(); toast(s.muted ? 'Hikâye sessize alındı; listenin sonunda gösterilecek' : 'Sessiz kaldırıldı'); renderStory(); };
  A['story-hide'] = (el) => { const s = state.stories.find((x) => x.id === el.dataset.id); s.hidden = true; save(); closeStory(); toast('Bu topluluğun hikâyeleri gizlendi'); };

  A.join = (el) => { const c = C(el.dataset.id); if (c.type === 'Herkese açık') { c.joined = true; c.members++; toast(`${c.name} grubuna katıldın`); } else { c.requested = true; toast('Katılma isteğin yöneticiye iletildi'); } refresh(); };
  A['cancel-request'] = (el) => { C(el.dataset.id).requested = false; refresh(); toast('İstek geri çekildi'); };
  A.leave = (el) => { const c = C(el.dataset.id); confirmModal({ title: 'Gruptan ayrıl', text: `<b>${esc(c.name)}</b> grubundan ayrılmak istediğine emin misin? Gönderileri artık akışında görmeyeceksin.`, ok: 'Ayrıl', danger: true, onOk: () => { c.joined = false; c.members--; refresh(); toast('Gruptan ayrıldın'); } }); };
  A['follow-page'] = (el) => { const p = P(el.dataset.id); p.following = !p.following; p.followers += p.following ? 1 : -1; refresh(); toast(p.following ? `${p.name} takip ediliyor` : 'Takipten çıkıldı'); };
  A.rsvp = (el) => {
    const e = E(el.dataset.id);
    if (el.dataset.kind === 'going') { e.attending = !e.attending; e.going += e.attending ? 1 : -1; if (e.attending) e.interested = false; toast(e.attending ? 'Katılımın kaydedildi · 1 gün önce hatırlatılacak' : 'Katılım iptal edildi'); }
    else { e.interested = !e.interested; toast(e.interested ? 'İlgilendiğin etkinliklere eklendi' : 'İlgi kaldırıldı'); }
    refresh();
  };
  A.ics = (el) => {
    const e = E(el.dataset.id);
    const d = (ts) => new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const t = (s) => String(s || '').replace(/[\\;,]/g, (c) => '\\' + c).replace(/\r?\n/g, '\\n');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Baglanti//TR', 'BEGIN:VEVENT', `UID:${e.id}@baglanti`, `DTSTAMP:${d(Date.now())}`, `DTSTART:${d(e.start)}`, `DTEND:${d(e.start + 3 * 3600000)}`, `SUMMARY:${t(e.title)}`, `LOCATION:${t(e.location)}`, `DESCRIPTION:${t(e.desc)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    if (downloadFile(`${e.title.replace(/[^\p{L}\p{N}]+/gu, '-')}.ics`, ics, 'text/calendar')) toast('Takvim dosyası indirildi');
  };
  A['share-event'] = (el) => { copy(location.href.split('#')[0] + '#/etkinlik/' + el.dataset.id); toast('Etkinlik bağlantısı kopyalandı'); };
  A['share-need'] = (el) => { copy(location.href.split('#')[0] + '#/sponsorlar'); toast('İhtiyaç bağlantısı kopyalandı'); };
  A.support = (el) => {
    const n = N(el.dataset.id);
    const left = Math.max(1, n.goal - n.progress);
    openModal({ title: 'Destek ol', form: 'support', formAttrs: `data-id="${n.id}"`,
      body: `<div class="callout">${icon('gift')}<span><b>${esc(n.title)}</b><br>${esc(C(n.community).name)} · ${num(n.progress)} / ${num(n.goal)} karşılandı</span></div>
        <div class="radio-list" role="radiogroup" aria-label="Destek türü">${['Ürün desteği', 'Mekân desteği', 'İndirim / kupon', 'Ulaşım desteği'].map((x, i) => `<label class="radio-item"><input type="radio" name="kind" value="${x}" ${i === 0 ? 'checked' : ''}>${x}</label>`).join('')}</div>
        <div class="field"><label for="sp-amt">Karşılanacak miktar (en fazla ${left})</label><input class="input" type="number" id="sp-amt" name="amount" min="1" max="${left}" value="${Math.min(left, 5)}" required></div>
        <div class="field"><label for="sp-note">Topluluğa not</label><textarea class="textarea" id="sp-note" name="note" style="min-height:80px" maxlength="400" placeholder="Teslimat ve iletişim bilgisi…"></textarea></div>`,
      foot: `<button type="button" class="btn" data-action="close-modal">Vazgeç</button><button class="btn btn-primary">Desteği gönder</button>` });
  };

  A['conn-accept'] = (el) => { const x = state.connections.incoming.splice(+el.dataset.i, 1)[0]; if (x.kind === 'user') state.connections.friends.push(x.id); else { C(x.id).joined = true; C(x.id).members++; } refresh(); toast(x.kind === 'user' ? 'Bağlantı isteği onaylandı' : 'Topluluk davetini kabul ettin'); };
  A['conn-decline'] = (el) => { state.connections.incoming.splice(+el.dataset.i, 1); refresh(); toast('İstek silindi'); };
  A['conn-withdraw'] = (el) => { state.connections.sent.splice(+el.dataset.i, 1); refresh(); toast('İstek geri çekildi'); };
  A['conn-add'] = (el) => { const id = el.dataset.id; const cn = state.connections; if (cn.friends.includes(id) || cn.sent.some((x) => x.id === id)) return toast('Zaten bağlantı isteği gönderdin', 'info'); const sg = cn.suggestions.find((s) => s.id === id); cn.suggestions = cn.suggestions.filter((s) => s.id !== id); cn.sent.unshift({ kind: 'user', id, mutual: sg ? sg.mutual : 1 }); refresh(); toast(`${U(id).name} kişisine bağlantı isteği gönderildi`); };
  A['conn-dismiss'] = (el) => { state.connections.suggestions = state.connections.suggestions.filter((s) => s.id !== el.dataset.id); refresh(); };

  A['notif-open'] = (el) => { const n = state.notifications.find((x) => x.id === el.dataset.id); n.read = true; save(); location.hash = n.link; if (location.hash === n.link) render(); };
  A['notif-read-all'] = () => { state.notifications.forEach((n) => (n.read = true)); refresh(); toast('Tüm bildirimler okundu'); };

  A['mod-act'] = (el) => { const r = state.reports.find((x) => x.id === el.dataset.id); r.status = el.dataset.do; state.audit.push({ ts: Date.now(), who: state.me, text: `${r.target}: ${r.status.toLocaleLowerCase('tr')} (${r.reason})` }); refresh(); toast(`Şikâyet sonuçlandı: ${r.status}`); };
  A['member-req'] = (el) => {
    const ok = !!el.dataset.ok;
    let name, comm;
    if (el.dataset.app) {   // kayıtta kulüp seçen üyenin başvurusu
      const apps = K.readApps(); const a = apps.find((x) => x.id === el.dataset.app);
      if (!a || a.status !== 'pending') return refresh();
      a.status = ok ? 'approved' : 'rejected'; a.decided = Date.now(); K.writeApps(apps);
      name = a.name; comm = C(a.club);
    } else {
      const x = state.memberRequests.splice(+el.dataset.i, 1)[0]; if (!x) return;
      name = U(x.user).name; comm = C(x.community);
    }
    if (ok) comm.members++;
    state.audit.push({ ts: Date.now(), who: state.me, text: `${name} üyelik başvurusu ${ok ? 'onaylandı' : 'reddedildi'} (${comm.name})` });
    refresh(); toast(ok ? `${name} kulübe üye yapıldı` : 'Başvuru reddedildi');
  };
  A['mod-remove'] = (el) => { const c = C(UI.adminComm); c.moderators = c.moderators.filter((x) => x !== el.dataset.id); state.audit.push({ ts: Date.now(), who: state.me, text: `${U(el.dataset.id).name} moderatörlükten alındı (${c.name})` }); refresh(); toast('Moderatör yetkisi kaldırıldı'); };
  A['topic-toggle'] = (el) => { const t = C(UI.adminComm).departments[+el.dataset.d].topics[+el.dataset.t]; t.open = !t.open; refresh(); toast(t.open ? 'Konu açıldı' : 'Konu kapatıldı'); };

  A.unblock = (el) => { state.privacy.blocked.splice(+el.dataset.i, 1); refresh(); toast('Engel kaldırıldı'); };
  A['block-user'] = (el) => confirmModal({ title: 'Kullanıcıyı engelle', text: `<b>${esc(el.dataset.name)}</b> seni bulamayacak, mesaj gönderemeyecek ve içeriklerini görmeyeceksin. Ayarlardan geri alabilirsin.`, ok: 'Engelle', danger: true, onOk: () => { state.privacy.blocked.push(el.dataset.name); refresh(); toast('Kullanıcı engellendi'); } });
  A['device-logout'] = (el) => { state.devices = state.devices.filter((d) => d.id !== el.dataset.id); refresh(); toast('Cihazdaki oturum kapatıldı'); };
  A['download-data'] = () => { const data = { hesap: K.mode === 'account' ? window.Auth.record() : 'demo modu', profil: me(), gonderiler: state.posts.filter((p) => p.author.id === state.me), mesajlar: state.conversations.map((c) => ({ sohbet: c.title, mesajlar: c.messages.filter((m) => m.from === 'me').map((m) => m.text || m.file || 'görsel') })), gizlilik: state.privacy, belgeler: state.docs.filter((d) => d.owner === state.me).map(({ data, ...rest }) => rest) }; if (downloadFile('baglanti-verilerim.json', JSON.stringify(data, null, 2), 'application/json')) toast('Verilerin indirildi'); };
  A.skip = (el, e) => { e.preventDefault(); els.main.focus(); };
  A['scroll-to'] = (el) => {
    const t = document.getElementById(el.dataset.target);
    if (!t) return;
    const y0 = scrollY;
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { if (scrollY === y0) t.scrollIntoView({ block: 'start' }); }, 350);
  };
  A['close-account'] = () => (K.mode === 'account' && window.Auth.account()
    ? confirmModal({ title: 'Hesabını sil', text: `<b>${esc(window.Auth.account().email)}</b> hesabı, gönderilerin, mesajların ve ayarların bu tarayıcıdan kalıcı olarak silinecek. Bu işlem geri alınamaz.`, ok: 'Hesabı kalıcı olarak sil', danger: true, onOk: () => window.Auth.deleteAccount() })
    : openModal({ title: 'Hesabını kapat', body: `<p>Demo modunda kapatılacak bir hesap yok. Hesap kapatma akışını denemek için önce kayıt ol.</p>`, foot: '<button class="btn" data-action="close-modal">Vazgeç</button><a class="btn btn-primary" href="#/kayit">Kayıt ol</a>' }));
  A['change-password'] = () => openModal({ title: window.Auth.sampleOpen() ? 'Şifre belirle' : 'Şifre değiştir', form: 'password', body: `${window.Auth.sampleOpen() ? `<div class="callout">${icon('info')}<span>Örnek hesabın henüz şifresi yok. Şifre belirlersen tek tıkla giriş kapanır; sonraki girişlerde bu şifreyi kullanırsın.</span></div><input type="hidden" name="old" value="">` : `<div class="field"><label for="pw-old">Mevcut şifre</label><input class="input" type="password" id="pw-old" name="old" autocomplete="current-password" required></div>`}<div class="field"><label for="pw-new">Yeni şifre</label><input class="input" type="password" id="pw-new" name="new" autocomplete="new-password" minlength="8" required><span class="xs muted">En az 8 karakter; harf ve rakam içermeli.</span></div>`, foot: `<button type="button" class="btn" data-action="close-modal">Vazgeç</button><button class="btn btn-primary">Güncelle</button>` });
  A['edit-profile'] = () => { const m = me(); openModal({ title: 'Profili düzenle', form: 'profile', body: `<div class="field"><label for="pf-name">Ad soyad</label><input class="input" id="pf-name" name="name" value="${esc(m.name)}" required maxlength="40"></div><div class="field"><label for="pf-city">Şehir</label><input class="input" id="pf-city" name="city" value="${esc(m.city)}" maxlength="30"></div><div class="field"><label for="pf-bio">Kısa biyografi</label><textarea class="textarea" id="pf-bio" name="bio" maxlength="160" style="min-height:90px">${esc(m.bio)}</textarea></div>`, foot: `<button type="button" class="btn" data-action="close-modal">Vazgeç</button><button class="btn btn-primary">Kaydet</button>` }); };
  A['new-group'] = () => openModal({ title: 'Yeni grup oluştur', form: 'new-group', body: `<div class="field"><label for="ng-name">Grup adı</label><input class="input" id="ng-name" name="name" required maxlength="50"></div><div class="form-grid"><div class="field"><label for="ng-type">Grup türü</label><select class="select" id="ng-type" name="type"><option>Herkese açık</option><option>Özel</option><option>Gizli</option></select></div><div class="field"><label for="ng-cat">Kategori</label><select class="select" id="ng-cat" name="cat"><option>Kamp</option><option>Teknoloji</option><option>Müzik</option><option>Spor</option><option>Sanat</option><option>Gönüllülük</option></select></div></div><div class="field"><label for="ng-desc">Açıklama</label><textarea class="textarea" id="ng-desc" name="desc" maxlength="300" style="min-height:90px"></textarea></div>`, foot: `<button type="button" class="btn" data-action="close-modal">Vazgeç</button><button class="btn btn-primary">Oluştur</button>` });
  const noMsg = () => { if (K.canMessage()) return false; toast('Mesajlaşma üyeler için şimdilik kapalı', 'info'); return true; };
  /* ---------- profil belgeleri ---------- */
  const DOC_MAX = 1.5 * 1024 * 1024;   // tarayıcı depolaması küçük olduğu için; sunucuda daha büyük olabilir
  A['doc-add'] = () => openModal({
    title: 'Belge ekle', form: 'doc-upload',
    body: `<div class="stack">
      <div class="field"><label for="doc-cat">Tür</label><select class="select" id="doc-cat" name="cat">${V.DOC_CATS.map(([k, l]) => `<option value="${k}">${l === 'CV' ? 'CV / özgeçmiş' : l.replace(/lar$/, '').replace(/ler$/, '')}</option>`).join('')}</select></div>
      <div class="field"><label for="doc-title">Başlık</label><input class="input" id="doc-title" name="title" maxlength="60" required placeholder="Ör. Python ile Veri Analizi Sertifikası" aria-describedby="doc-title-err"><span class="field-error" id="doc-title-err" role="alert"></span></div>
      <div class="field"><label for="doc-file">PDF dosyası</label><input class="input" type="file" id="doc-file" name="file" accept="application/pdf,.pdf" required aria-describedby="doc-file-err"><span class="xs muted">Yalnızca PDF · en fazla 1,5 MB</span><span class="field-error" id="doc-file-err" role="alert"></span></div>
    </div>`,
    foot: `<button type="button" class="btn" data-action="close-modal">Vazgeç</button><button class="btn btn-primary">Yükle</button>`
  });
  async function docUpload(f) {
    const file = f.file.files && f.file.files[0];
    const title = f.title.value.trim();
    const errs = {};
    if (title.length < 2) errs.title = 'Belgeye kısa bir başlık ver.';
    if (!file) errs.file = 'Bir PDF dosyası seç.';
    else if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) errs.file = 'Yalnızca PDF dosyası yüklenebilir.';
    else if (file.size > DOC_MAX) errs.file = 'Dosya 1,5 MB sınırını aşıyor.';
    else if (new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()) !== '%PDF-') errs.file = 'Dosya geçerli bir PDF değil.';   // uzantıya değil içeriğe bak
    showFieldErrors(f, errs);
    if (Object.keys(errs).length) return;
    const cat = V.DOC_CATS.some(([k]) => k === f.cat.value) ? f.cat.value : 'sertifika';
    let data;
    try { data = await readURL(file); } catch (e) { showFieldErrors(f, { file: 'Dosya okunamadı.' }); return; }
    data = 'data:application/pdf;base64,' + data.slice(data.indexOf(',') + 1);
    const doc = { id: uid('d'), owner: state.me, cat, title: title.slice(0, 60), name: safeName(file.name).replace(/[\\/:*?"<>|]/g, '_'), size: file.size, ts: Date.now(), data };
    state.docs.push(doc);
    if (!save(true)) { state.docs.pop(); save(true); showFieldErrors(f, { file: 'Tarayıcı depolama alanı doldu. Daha küçük bir PDF dene ya da eski bir belgeyi sil.' }); return; }
    closeModal(); location.hash = '#/profil?tab=belgeler'; refresh(); toast('Belge profiline eklendi');
  };
  // Örnek belgeler için içerik yok: başlığı yazan tek sayfalık örnek PDF üret
  function samplePdf(d) {
    const tr = { ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U', '’': "'" };
    const t = (x) => String(x).replace(/[çÇğĞıİöÖşŞüÜ’]/g, (c) => tr[c]).replace(/[^\x20-\x7e]/g, '').replace(/([()\\])/g, '\\$1');
    const owner = U(d.owner);
    const stream = `BT /F1 22 Tf 72 720 Td (${t(d.title)}) Tj 0 -32 Td /F1 13 Tf (${t(owner ? owner.name : '')}) Tj 0 -24 Td (Baglanti - ornek belge) Tj ET`;
    const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
    let out = '%PDF-1.4\n'; const off = [];
    objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const x = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((n) => String(n).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
    return new TextEncoder().encode(out);
  }
  A['doc-open'] = (el) => {
    const d = state.docs.find((x) => x.id === el.dataset.id); if (!d) return;
    let bytes;
    if (d.data && d.data.startsWith('data:application/pdf;base64,')) { const bin = atob(d.data.slice(28)); bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); }
    else bytes = samplePdf(d);
    if (downloadFile(d.name, bytes, 'application/pdf')) toast(`${d.name} indirildi`);
  };
  A['doc-del'] = (el) => {
    const d = state.docs.find((x) => x.id === el.dataset.id && x.owner === state.me); if (!d) return;
    confirmModal({ title: 'Belgeyi sil', text: `<b>${esc(d.title)}</b> profilinden kaldırılacak. Bu işlem geri alınamaz.`, ok: 'Sil', danger: true, onOk: () => { state.docs = state.docs.filter((x) => x !== d); save(); refresh(); toast('Belge silindi'); } });
  };

  A.dm = (el) => { if (noMsg()) return; const id = el.dataset.id; let c = state.conversations.find((x) => x.kind === 'user' && x.with === id); if (!c) { c = { id: uid('c'), kind: 'user', with: id, title: U(id).name, subtitle: U(id).city, online: Math.random() > 0.5, unread: 0, messages: [] }; state.conversations.unshift(c); save(); } location.hash = '#/mesajlar/' + c.id; };
  A['new-chat'] = () => noMsg() || openModal({ title: 'Yeni sohbet', body: `<div class="list">${Object.values(state.users).filter((u) => u.id !== state.me).map((u) => `<button class="list-item" style="width:100%;text-align:left" data-action="dm" data-id="${u.id}">${avatar({ ...u, kind: 'user' }, 'md')}<span class="grow"><b>${esc(u.name)}</b><span>${esc(u.city)}</span></span>${icon('chevronRight')}</button>`).join('')}</div>` });
  A['mute-chat'] = () => toast('Sohbet 8 saat sessize alındı');

  // filtreler
  A['feed-filter'] = (el) => { UI.feedFilter = el.dataset.value; render({ keepScroll: true }); };
  A['event-cat'] = (el) => { UI.eventCat = el.dataset.value; render({ keepScroll: true }); };
  /* ---------- iş & staj ilanları ---------- */
  const HEX = /^#[0-9a-f]{6}$/i;
  const jobsRender = () => render({ keepScroll: true });
  A['jobs-type'] = (el) => { UI.jobs.type = el.dataset.value; jobsRender(); };
  A['jobs-tag'] = (el) => { const t = UI.jobs.tags; const id = el.dataset.value; UI.jobs.tags = t.includes(id) ? t.filter((x) => x !== id) : [...t, id]; if (parseHash().name !== 'ilanlar') location.hash = '#/ilanlar'; else jobsRender(); };
  A['jobs-clear'] = () => { UI.jobs = { ...UI.jobs, type: 'Tümü', tags: [], mode: 'all', q: '', followed: false }; jobsRender(); };
  A['tag-follow'] = (el) => { const id = el.dataset.id; const on = state.followedTags.includes(id); state.followedTags = on ? state.followedTags.filter((x) => x !== id) : [...state.followedTags, id]; save(); jobsRender(); toast(on ? 'Etiket takipten çıkarıldı' : 'Etiket takip ediliyor; ilanlarda öne çıkar'); };
  const listing = (id) => state.listings.find((l) => l.id === id);
  A['job-save'] = (el) => { const l = listing(el.dataset.id); if (!l) return; l.saved = !l.saved; save(); jobsRender(); toast(l.saved ? 'İlan kaydedildi' : 'İlan kayıtlardan çıkarıldı'); };
  A['job-apply'] = (el) => {
    const l = listing(el.dataset.id); if (!l || l.applied || K.isBrand()) return;
    const docs = state.docs.filter((d) => d.owner === state.me).length;
    confirmModal({ title: 'İlana başvur', text: `<b>${esc(l.title)}</b> · ${esc(P(l.page).name)}<br><br>Başvurunla birlikte adın, kullanıcı adın ve profilindeki ${docs ? `<b>${docs} belge</b> (CV, sertifika, proje)` : 'belgeler'} ilan sahibiyle paylaşılır.${docs ? '' : ' Henüz belge eklemedin; önce <a class="link" href="#/profil?tab=belgeler">CV’ni eklemek</a> isteyebilirsin.'}`, ok: 'Başvur', onOk: () => { l.applied = true; l.applicants++; save(); jobsRender(); toast('Başvurun iletildi'); } });
  };
  A['job-del'] = (el) => {
    const l = listing(el.dataset.id); if (!l || !(K.isBrand() && l.page === K.BRAND_PAGE)) return;
    confirmModal({ title: 'İlanı kaldır', text: `<b>${esc(l.title)}</b> ilanı yayından kaldırılacak. Bu işlem geri alınamaz.`, ok: 'Kaldır', danger: true, onOk: () => { state.listings = state.listings.filter((x) => x !== l); save(); jobsRender(); toast('İlan kaldırıldı'); } });
  };
  A['job-new'] = () => {
    if (!K.isBrand()) return;
    const min = new Date(Date.now() + 86400000).toISOString().slice(0, 10), max = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
    openModal({
      title: 'İlan ver', form: 'job-post',
      body: `<div class="stack">
        <div class="field"><label for="jp-title">İlan başlığı</label><input class="input" id="jp-title" name="title" maxlength="80" required placeholder="Ör. Grafik tasarım stajyeri" aria-describedby="jp-title-err"><span class="field-error" id="jp-title-err" role="alert"></span></div>
        <div class="form-grid">
          <div class="field"><label for="jp-type">İlan türü</label><select class="select" id="jp-type" name="type">${V.JOB_TYPES.map((t) => `<option>${t}</option>`).join('')}</select></div>
          <div class="field"><label for="jp-mode">Çalışma şekli</label><select class="select" id="jp-mode" name="mode">${V.JOB_MODES.map((t) => `<option>${t}</option>`).join('')}</select></div>
          <div class="field"><label for="jp-city">Şehir</label><input class="input" id="jp-city" name="city" maxlength="30" value="Bursa"></div>
          <div class="field"><label for="jp-deadline">Son başvuru</label><input class="input" type="date" id="jp-deadline" name="deadline" min="${min}" max="${max}" required aria-describedby="jp-deadline-err"><span class="field-error" id="jp-deadline-err" role="alert"></span></div>
        </div>
        <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-weight:700;font-size:14px;margin-bottom:6px">Etiketler <span class="muted" style="font-weight:500">(1–5 tane · ilan yalnızca bu etiketlerle ilgilenenlerin filtresinde öne çıkar)</span></legend>
          <div class="tag-pick" id="jp-tags" aria-describedby="jp-tags-err">${state.tags.map((t) => `<label class="tag-check"><input type="checkbox" name="tags" value="${esc(t.id)}">${V.tagChip(t)}</label>`).join('')}</div>
          <span class="field-error" id="jp-tags-err" role="alert"></span></fieldset>
        <div class="field"><label for="jp-desc">Açıklama</label><textarea class="textarea" id="jp-desc" name="desc" rows="4" maxlength="600" required placeholder="Görev, aranan nitelikler, çalışma saatleri…" aria-describedby="jp-desc-err"></textarea><span class="field-error" id="jp-desc-err" role="alert"></span></div>
      </div>`,
      foot: `<button type="button" class="btn" data-action="close-modal">Vazgeç</button><button class="btn btn-primary">${icon('briefcase', 'ico-sm')}Yayınla</button>`
    });
  };
(el) => { UI.sponsorCat = el.dataset.value; render({ keepScroll: true }); };
  A['notif-filter'] = (el) => { UI.notifFilter = el.dataset.value; render({ keepScroll: true }); };
  A['mod-filter'] = (el) => { UI.modFilter = el.dataset.value; render({ keepScroll: true }); };
  A['media-kind'] = (el) => { UI.mediaKind = el.dataset.value; render({ keepScroll: true }); };

  /* =============== form gönderimleri =============== */
  const F = {};
  F['top-search'] = (f) => { const q = f.q.value.trim(); f.q.value = ''; f.q.blur(); UI.discover.q = q; location.hash = '#/kesfet' + (q ? '?q=' + encodeURIComponent(q) : ''); };
  F.discover = (f) => { f.querySelector('input').blur(); };
  F.noop = () => {};
  F.compose = () => submitComposer();
  F['jobs-search'] = (f) => { UI.jobs.q = f.q.value.trim().slice(0, 60); jobsRender(); };
  F['job-post'] = (f) => {
    if (!K.isBrand()) return;
    const title = f.title.value.trim(), desc = f.desc.value.trim();
    const tags = $$('input[name="tags"]:checked', f).map((x) => x.value).filter((id) => state.tags.some((t) => t.id === id));
    const dl = f.deadline.value ? new Date(f.deadline.value + 'T23:59').getTime() : NaN;
    const errs = {};
    if (title.length < 5) errs.title = 'Başlık en az 5 karakter olmalı.';
    if (!(dl > Date.now() && dl < Date.now() + 181 * 86400000)) errs.deadline = 'Bugünden sonra, en fazla 6 ay içinde bir tarih seç.';
    if (desc.length < 20) errs.desc = 'Açıklama en az 20 karakter olmalı.';
    showFieldErrors(f, errs);
    const tagErr = $('#jp-tags-err'); tagErr.textContent = !tags.length ? 'En az bir etiket seç.' : tags.length > 5 ? 'En fazla 5 etiket seçebilirsin.' : '';
    if (Object.keys(errs).length || tagErr.textContent) return;
    state.listings.unshift({ id: uid('l'), page: K.BRAND_PAGE, title: title.slice(0, 80), type: V.JOB_TYPES.includes(f.type.value) ? f.type.value : 'Staj', mode: V.JOB_MODES.includes(f.mode.value) ? f.mode.value : 'Yerinde', city: f.city.value.trim().slice(0, 30) || 'Bursa', tags, deadline: dl, ts: Date.now(), applicants: 0, applied: false, saved: false, desc: desc.slice(0, 600) });
    save(); closeModal(); UI.jobs.tab = 'benim'; location.hash = '#/ilanlar?tab=benim'; jobsRender(); toast('İlan yayınlandı');
  };
  F['tag-create'] = (f) => {
    if (!K.isAdmin()) return;
    const name = f.elements.name.value.trim().replace(/\s+/g, ' ');
    const sel = f.querySelector('input[name="color"]:checked');
    const color = sel && sel.value === 'custom' ? f.elements.custom.value : sel ? sel.value : '';
    const errs = {};
    if (name.length < 2 || name.length > 24) errs.name = 'Etiket adı 2–24 karakter olmalı.';
    else if (state.tags.some((t) => t.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))) errs.name = 'Bu adla bir etiket zaten var.';
    showFieldErrors(f, errs);
    if (Object.keys(errs).length || !HEX.test(color)) return;
    state.tags.push({ id: uid('tg'), name, color: color.toUpperCase(), community: UI.adminComm, ts: Date.now() });
    state.audit.push({ ts: Date.now(), who: state.me, text: `“${name}” etiketi oluşturuldu (${C(UI.adminComm).name})` });
    save(); refresh(); toast('Etiket oluşturuldu');
  };
  F['doc-upload'] = docUpload;
  F.report = (f) => {
    const reason = f.reason.value;
    const pr = /Taciz/.test(reason) ? 'Yüksek' : /Spam|Sahte|Kişisel/.test(reason) ? 'Orta' : 'Düşük';
    const p = f.dataset.kind === 'Gönderi' ? post(f.dataset.id) : null;
    state.reports.unshift({ id: uid('r'), target: `${f.dataset.kind}${p && p.community ? ' · ' + C(p.community).name : ''}`, preview: p ? `“${(p.text || '').slice(0, 60)}…”` : (f.note.value.trim() || `${f.dataset.kind} bildirimi`), reason, reporter: state.me, priority: pr, risk: reason.split(' ')[0], community: p?.community || 'doga', ts: Date.now(), status: 'Bekliyor' });
    closeModal(); save(); renderShell(parseHash()); toast('Bildirimin alındı. İnceleme sonucunu sana ileteceğiz.');
  };
  F.support = (f) => {
    const n = N(f.dataset.id);
    const amt = Math.max(1, Math.min(n.goal - n.progress, +f.amount.value || 1));
    n.progress += amt;
    if (!n.supporters.includes(K.BRAND_PAGE)) n.supporters.push(K.BRAND_PAGE);
    notify('sponsor', `<b>Kuzey Kahve</b> “${esc(n.title)}” ihtiyacına destek oldu (${esc(f.kind.value)})`, '#/sponsorlar');
    closeModal(); refresh(); toast(`Desteğin iletildi: ${amt} adet · ${C(n.community).name} bilgilendirildi`);
  };
  F.profile = (f) => { const m = me(); m.name = f.name.value.trim() || m.name; m.city = f.city.value.trim(); m.bio = f.bio.value.trim(); if (K.mode === 'account') window.Auth.updateProfile({ name: m.name, city: m.city }); closeModal(); refresh(); toast('Profil güncellendi'); };
  F.password = async (f) => {
    if (K.mode === 'account' && window.Auth.account()) {
      const btn = f.closest('dialog')?.querySelector('.btn-primary'); if (btn) btn.disabled = true;
      const err = await window.Auth.changePassword(f.old.value, f.new.value);
      if (btn) btn.disabled = false;
      if (err) return toast(err, 'info');
      closeModal(); return toast('Şifren güncellendi');
    }
    if (f.new.value.length < 8) return toast('Yeni şifre en az 8 karakter olmalı.', 'info');
    closeModal(); toast('Demo modunda şifre yok; değişiklik kaydedilmedi', 'info');
  };
  function showFieldErrors(f, errors) {
    $$('.field-error', f).forEach((el) => { el.textContent = ''; });
    $$('[aria-invalid]', f).forEach((el) => el.removeAttribute('aria-invalid'));
    let first = null;
    Object.entries(errors).forEach(([k, msg]) => {
      const inp = f.elements[k]; const box = inp && document.getElementById((inp.getAttribute('aria-describedby') || '').split(' ').find((x) => x.endsWith('-err')) || '');
      if (box) box.textContent = msg;
      if (inp) { inp.setAttribute('aria-invalid', 'true'); first = first || inp; }
    });
    if (first) first.focus();
  }
  const busy = (f, on) => { const b = f.querySelector('button.btn-primary'); if (b) { b.disabled = on; b.toggleAttribute('aria-busy', on); } };
  F.login = async (f) => {
    const alert = $('#lg-alert');
    const errs = {};
    if (!f.id.value.trim()) errs.id = 'E-posta veya kullanıcı adını yaz.';
    if (!f.password.value) errs.password = 'Şifreni yaz.';
    showFieldErrors(f, errs);
    alert.hidden = true;
    if (Object.keys(errs).length) return;
    busy(f, true);
    const res = await window.Auth.login(f.id.value, f.password.value, f.remember.checked);
    if (!res.ok) busy(f, false);
    if (!res.ok) { alert.textContent = res.error; alert.hidden = false; f.password.value = ''; f.password.focus(); }
  };
  F.register = (f) => {
    const d = { name: f.name.value, username: f.username.value, email: f.email.value, city: f.city.value, role: f.role.value, club: f.role.value === 'uye' ? f.club.value : '', dept: f.dept.value, studentNo: f.studentNo.value, note: f.note.value, password: f.password.value, confirm: f.confirm.value, consent: f.consent.checked };
    const errs = window.Auth.validateRegister(d);
    showFieldErrors(f, errs);
    if (Object.keys(errs).length) return;
    const doRegister = async () => { busy(f, true); const res = await window.Auth.register(d); if (!res.ok) { busy(f, false); showFieldErrors(f, res.errors); } };
    const existing = window.Auth.account();
    if (existing) confirmModal({ title: 'Mevcut hesabın yerine geçsin mi?', text: `Bu tarayıcıda <b>${esc(existing.email)}</b> hesabı kayıtlı. Yeni hesap oluşturursan eski hesap ve tüm verileri silinir.`, ok: 'Yeni hesabı oluştur', danger: true, onOk: doRegister });
    else doRegister();
  };
  F['new-group'] = (f) => {
    const name = f.name.value.trim(); if (!name) return toast('Grup adı gerekli.', 'info');
    const id = uid('g');
    const scene = { Kamp: 'camp', Teknoloji: 'code', Müzik: 'music', Spor: 'bike', Sanat: 'photo', Gönüllülük: 'volunteer' }[f.cat.value];
    state.communities[id] = { id, name, kind: 'grup', type: f.type.value, members: 1, city: me().city, category: f.cat.value, scene, hue: 1, joined: true, requested: false, desc: f.desc.value.trim() || 'Yeni grup.', rules: ['Saygılı dil kullanın.'], tags: [lower(f.cat.value)], pinned: '', moderators: [state.me], admins: [state.me], departments: [], sponsors: [], created: String(new Date().getFullYear()) };
    closeModal(); save(); location.hash = '#/topluluk/' + id; toast('Grup oluşturuldu');
  };
  F['block-add'] = (f) => { const n = f.name.value.trim(); if (!n) return; state.privacy.blocked.push(n); refresh(); toast('Kullanıcı engellendi'); };
  F['assign-mod'] = (f) => { const c = C(UI.adminComm); const id = f.user.value; if (!c.moderators.includes(id)) c.moderators.push(id); state.audit.push({ ts: Date.now(), who: state.me, text: `${U(id).name} moderatör olarak atandı (${c.name})` }); refresh(); toast(`${U(id).name} moderatör olarak atandı`); };
  F['add-topic'] = (f) => { const t = f.t.value.trim(); if (!t) return; C(UI.adminComm).departments[+f.dataset.d].topics.push({ t, open: true }); refresh(); toast('Konu açıldı'); };
  F['add-dept'] = (f) => { const n = f.name.value.trim(); if (!n) return; C(UI.adminComm).departments.push({ id: uid('d'), name: n, topics: [] }); refresh(); toast('Departman eklendi'); };
  F.chat = (f) => {
    if (noMsg()) return;
    const conv = state.conversations.find((c) => c.id === f.dataset.id);
    const t = f.text.value.trim(); if (!t) return;
    conv.messages.push({ from: 'me', text: t, ts: Date.now() });
    f.text.value = '';
    save(); appendMessage(conv, conv.messages[conv.messages.length - 1]);
    fakeReply(conv);
  };

  function appendMessage(conv, m) {
    const body = $('#chat-body');
    if (!body) return;
    appendHTML(body, window.Views.msgBubble(m, conv));
    body.scrollTop = body.scrollHeight;
    const li = $(`#chat-items a[href="#/mesajlar/${conv.id}"] .grow span`);
    if (li) li.textContent = (m.from === 'me' ? 'Sen: ' : '') + (m.img ? '📷 Fotoğraf' : m.file ? '📎 ' + m.file : m.text);
  }
  const REPLIES = ['Harika, teşekkürler! 🙌', 'Tamamdır, etkinlikte görüşürüz.', 'Bunu gruba da iletiyorum.', 'Süper fikir 👍', 'Detayları akşam paylaşırım.'];
  function fakeReply(conv) {
    const body = $('#chat-body');
    if (!body) return;
    const from = conv.kind === 'user' ? conv.with : ['u3', 'u7', 'u2', 'u1'][Math.floor(Math.random() * 4)];
    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.textContent = `${U(from).name.split(' ')[0]} yazıyor…`;
    setTimeout(() => { if (document.body.contains(body)) { body.appendChild(typing); body.scrollTop = body.scrollHeight; } }, 600);
    setTimeout(() => {
      typing.remove();
      const m = { from, text: REPLIES[Math.floor(Math.random() * REPLIES.length)], ts: Date.now() };
      conv.messages.push(m); save();
      if (parseHash().id === conv.id || ($('#chat-body') && document.querySelector(`.chat-item[aria-current="true"][href="#/mesajlar/${conv.id}"]`))) appendMessage(conv, m);
    }, 2000);
  }

  /* =============== değişiklik olayları =============== */
  const CH = {};
  CH['feed-sort'] = (el) => { UI.feedSort = el.value; render({ keepScroll: true }); };
  CH['discover-filter'] = (el) => { UI.discover[el.dataset.key] = el.value; const box = $('#discover-results'); if (box) setHTML(box, V.discoverResults(box.dataset.tab)); };
  CH['media-comm'] = (el) => { UI.mediaComm = el.value; render({ keepScroll: true }); };
  CH['admin-comm'] = (el) => { UI.adminComm = el.value; render({ keepScroll: true }); };
  CH['tag-preview'] = (el) => {
    const f = el.form; if (!f) return;
    if (el.name === 'custom') { const r = f.querySelector('input[name="color"][value="custom"]'); if (r) r.checked = true; }
    const sel = f.querySelector('input[name="color"]:checked');
    const color = sel && sel.value === 'custom' ? f.elements.custom.value : sel && sel.value;
    const prev = $('#tag-preview'); if (!prev) return;
    if (HEX.test(color || '')) prev.style.setProperty('--tag', color);
    prev.textContent = f.elements.name.value.trim() || 'Etiket önizleme';
  };
  CH['jobs-mode'] = (el) => { UI.jobs.mode = el.value; jobsRender(); };
  CH['jobs-sort'] = (el) => { UI.jobs.sort = el.value; jobsRender(); };
  CH['jobs-followed'] = (el) => { UI.jobs.followed = el.checked; jobsRender(); };
  CH['tag-color'] = (el) => {
    const t = state.tags.find((x) => x.id === el.dataset.id);
    if (!t || !K.isAdmin() || !K.MANAGED.includes(t.community) || !HEX.test(el.value)) return;
    t.color = el.value.toUpperCase(); save(); refresh(); toast(`“${t.name}” rengi güncellendi`);
  };
  A['tag-del'] = (el) => {
    const t = state.tags.find((x) => x.id === el.dataset.id);
    if (!t || !K.isAdmin() || !K.MANAGED.includes(t.community)) return;
    const used = state.listings.filter((l) => l.tags.includes(t.id)).length;
    confirmModal({ title: 'Etiketi sil', text: `<b>${esc(t.name)}</b> etiketi silinecek${used ? ` ve ${used} ilandan kaldırılacak` : ''}. Bu işlem geri alınamaz.`, ok: 'Sil', danger: true, onOk: () => {
      state.tags = state.tags.filter((x) => x !== t);
      state.listings.forEach((l) => { l.tags = l.tags.filter((x) => x !== t.id); });
      state.followedTags = state.followedTags.filter((x) => x !== t.id);
      UI.jobs.tags = UI.jobs.tags.filter((x) => x !== t.id);
      state.audit.push({ ts: Date.now(), who: state.me, text: `“${t.name}” etiketi silindi` });
      save(); refresh(); toast('Etiket silindi');
    } });
  };
  CH['rg-role'] = (el) => { const box = $('#rg-club-box'); if (box) box.hidden = el.value !== 'uye'; };
  CH['notif-setting'] = (el) => { state.notifSettings[el.dataset.key] = el.checked; save(); toast(el.checked ? 'Bildirim türü açıldı' : 'Bildirim türü sessize alındı'); };
  CH['notif-freq'] = (el) => { state.notifSettings.frequency = el.value; save(); toast(`Bildirim sıklığı: ${el.value}`); };
  CH['notif-quiet'] = (el) => { state.notifSettings.quiet = el.checked; save(); toast(el.checked ? 'Sessiz saatler açık' : 'Sessiz saatler kapalı'); };
  CH['privacy-vis'] = (el) => { state.privacy.visibility = el.value; save(); toast(`Profil görünürlüğü: ${el.value}`); };
  CH['privacy-toggle'] = (el) => { state.privacy[el.dataset.key] = el.checked; refresh(); toast('Ayar kaydedildi'); };
  CH.theme = (el) => { state.theme = el.checked ? 'dark' : 'light'; applyTheme(); save(); };
  /* Yükleme güvenliği: yalnızca izinli türler; fotoğraflar tuvalde yeniden çizilir.
     Böylece EXIF/GPS konumu, kamera bilgisi gibi gizli üst veriler silinir ve boyut küçülür. */
  const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  const VID_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
  const readURL = (file) => new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = rej; rd.readAsDataURL(file); });
  async function cleanImage(file, max = 1600) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86);
    } finally { URL.revokeObjectURL(url); }
  }
  const safeName = (n) => String(n || 'dosya').replace(/[\u0000-\u001f]/g, '').slice(0, 80);
  CH['compose-file'] = async (el) => {
    const files = Array.from(el.files || []).slice(0, 6);
    el.value = '';
    for (const file of files) {
      const isImg = IMG_TYPES.includes(file.type), isVid = VID_TYPES.includes(file.type);
      if (!isImg && !isVid) { toast(`${safeName(file.name)}: desteklenmeyen dosya türü`, 'info'); continue; }
      if (file.size > 15 * 1024 * 1024) { toast(`${safeName(file.name)} 15 MB sınırını aşıyor`, 'info'); continue; }
      try {
        const src = isImg && file.type !== 'image/gif' ? await cleanImage(file) : await readURL(file);
        cs?.media.push({ src, video: isVid, alt: safeName(file.name).replace(/\.[a-z0-9]+$/i, '') });
      } catch (e) { toast(`${safeName(file.name)} okunamadı`, 'info'); }
    }
    if (cs) renderComposer();
  };
  CH['chat-file'] = (el) => {
    if (noMsg()) return;
    const file = el.files && el.files[0];
    if (!file) return;
    const conv = state.conversations.find((c) => c.id === el.dataset.id);
    const push = (m) => { conv.messages.push(m); save(); appendMessage(conv, m); fakeReply(conv); };
    if (IMG_TYPES.includes(file.type) && file.type !== 'image/gif' && file.size < 15 * 1024 * 1024) {
      cleanImage(file, 1280).then((img) => push({ from: 'me', img, ts: Date.now() })).catch(() => toast('Görsel okunamadı', 'info'));
    } else push({ from: 'me', file: `${safeName(file.name)} (${Math.max(1, Math.round(file.size / 1024))} KB)`, ts: Date.now() });
    el.value = '';
  };

  /* =============== olay dinleyicileri =============== */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (openPop && !(el && el.dataset.action === 'toggle-menu') && !e.target.closest('.popover')) closePopovers();
    if (!el) return;
    const act = el.dataset.action;
    if (!Object.prototype.hasOwnProperty.call(A, act)) return;
    if (el.tagName === 'A' && !el.getAttribute('href')) e.preventDefault();
    if (act !== 'toggle-menu') closePopovers();
    A[act](el, e);
  });
  // Başka sekmede çıkış / hesap silme / şifre değişikliği olursa bu sekme de güncellensin
  window.addEventListener('storage', (e) => {
    if ([K.KEYS.auth, K.KEYS.session, K.KEYS.active].includes(e.key) && !window.Auth.isAuthed() && !PUBLIC_ROUTES.includes(parseHash().name)) { history.replaceState(null, '', K.mode === 'account' ? '#/giris' : '#/hosgeldin'); location.reload(); }
  });
  // popover içindeki bağlantılar menüyü kapatsın
  document.addEventListener('click', (e) => { if (e.target.closest('.popover a')) closePopovers(); });

  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]');
    if (!f) return;
    e.preventDefault();
    const fn = Object.prototype.hasOwnProperty.call(F, f.dataset.form) && F[f.dataset.form];
    if (fn) fn(f, e);
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && Object.prototype.hasOwnProperty.call(CH, el.dataset.change)) CH[el.dataset.change](el, e);
    if (e.target.matches('[data-cs-partner]') && cs) {
      const v = e.target.value;
      cs.ev.partners = e.target.checked ? [...cs.ev.partners, v] : cs.ev.partners.filter((x) => x !== v);
    }
    if (e.target.matches('[data-cs]') && cs) {
      setCs(e.target.dataset.cs, e.target.value);
      if (e.target.dataset.cs === 'target') renderComposer();
    }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-cs]') && cs) {
      setCs(t.dataset.cs, t.value);
      if (t.dataset.cs === 'text') { const c = $('#cs-count'); if (c) { c.textContent = `${t.value.length} / 1000`; c.classList.toggle('warn', t.value.length > 950); } }
    }
    if (t.id === 'discover-q') {
      UI.discover.q = t.value;
      const box = $('#discover-results');
      if (box) setHTML(box, V.discoverResults(box.dataset.tab));
      const params = new URLSearchParams(); if (box && box.dataset.tab !== 'tumu') params.set('tab', box.dataset.tab); if (t.value) params.set('q', t.value);
      history.replaceState(null, '', '#/kesfet' + (params.toString() ? '?' + params : ''));
    }
    if (t.closest('[data-form="login"], [data-form="register"]') && t.hasAttribute('aria-invalid')) {
      t.removeAttribute('aria-invalid');
      const box = document.getElementById(t.getAttribute('aria-describedby')); if (box) box.textContent = '';
    }
    if (t.id === 'rg-pass') {
      const s = window.Auth.strength(t.value);
      const box = $('#rg-strength');
      if (box) {
        box.dataset.level = t.value ? (s.score <= 2 ? 'weak' : s.score === 3 ? 'mid' : 'strong') : '';
        $$('.strength-bar i', box).forEach((i, n) => i.classList.toggle('on', t.value && n < Math.max(1, s.score)));
        box.querySelector('span').textContent = t.value ? `Şifre gücü: ${s.label}` : 'En az 8 karakter; harf ve rakam içermeli.';
      }
    }
    if (t.id === 'member-q') {
      UI.memberQ = t.value;
      const pos = t.selectionStart;
      render({ keepScroll: true });
      const n = $('#member-q'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
    }
    if (t.id === 'chat-q') {
      const q = lower(t.value);
      $$('#chat-items li').forEach((li) => { li.hidden = q && !li.dataset.title.includes(q); });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePopovers(); closeDrawer(); }
    if (els.modal.open && els.modal.classList.contains('lightbox') && lb) {
      if (e.key === 'ArrowRight') A['lb-next'](); if (e.key === 'ArrowLeft') A['lb-prev']();
    }
    if (els.story.open && sv) {
      if (e.key === 'ArrowRight') storyNext(); if (e.key === 'ArrowLeft') storyPrev(); if (e.key === ' ') { e.preventDefault(); storyPause(); }
    }
    // "/" ile aramaya odaklan
    if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]')) {
      const s = $('#discover-q') || $('.top-search input');
      if (s && s.offsetParent) { e.preventDefault(); s.focus(); }
    }
  });

  els.modal.addEventListener('click', (e) => { if (e.target === els.modal) closeModal(); });
  els.modal.addEventListener('close', () => { cs = null; lb = null; els.modal.replaceChildren(); });
  els.story.addEventListener('close', () => { if (sv) closeStory(); });
  els.story.addEventListener('click', (e) => { if (e.target === els.story) closeStory(); });

  window.addEventListener('hashchange', () => { closeModal(); render(); });
  matchMedia('(max-width: 720px)').addEventListener('change', () => { if (parseHash().name === 'mesajlar') render({ keepScroll: true }); });

  /* =============== başlat =============== */
  function hydrateIcons() { $$('[data-icon]').forEach((el) => { replaceHTML(el, icon(el.dataset.icon)); }); }
  window.App = { toast, render };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  applyTheme();
  hydrateIcons();
  render();
  const flashMsg = window.Auth.takeFlash();
  if (flashMsg) toast(flashMsg);
})();
