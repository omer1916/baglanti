/* Bağlantı · ekranlar ve bileşenler */
(function () {
  'use strict';
  const K = window.Core;
  const { state, esc, lower, num, timeAgo, fmt, daysLeft, icon, avatar, verified, media, entity, U, C, P, E, N, me } = K;

  const UI = window.UI = {
    openComments: new Set(),
    feedFilter: 'tumu', feedSort: 'onerilen',
    discover: { q: '', date: 'all', loc: 'all', kind: 'all', priv: 'all' },
    eventCat: 'Tümü', mediaComm: 'all', mediaKind: 'Tümü', notifFilter: 'all', sponsorCat: 'Tümü', memberQ: '', adminComm: 'kodkahve', modFilter: 'all'
  };

  /* =============== ortak parçalar =============== */
  const VIS_ICON = { 'Herkese açık': 'globe', 'Topluluk üyeleri': 'users', 'Arkadaşlar': 'users', 'Sadece ben': 'lock' };
  const TYPE_BADGE = { event: '<span class="badge blue">Etkinlik</span>', announcement: '<span class="badge amber">Duyuru</span>', sponsor: '<span class="badge pink">Sponsor ihtiyacı</span>' };

  function tabs(items, active, base) {
    return `<div class="tabs" role="tablist">${items.map(([k, label]) => `<a class="tab" role="tab" href="${base}?tab=${esc(k)}" aria-selected="${k === active}">${label}</a>`).join('')}</div>`;
  }
  function chips(items, active, action, key) {
    return `<div class="chips" role="group">${items.map(([v, label]) => `<button class="chip" data-action="${action}" data-key="${key || ''}" data-value="${esc(v)}" aria-pressed="${String(v) === String(active)}">${label}</button>`).join('')}</div>`;
  }
  function empty(ic, title, text, extra = '') {
    return `<div class="empty">${icon(ic)}<b>${title}</b><span>${text}</span>${extra}</div>`;
  }
  function richText(t) {
    return esc(t).replace(/#([\p{L}\p{N}_]+)/gu, (m, tag) => `<a class="tag" href="#/kesfet?q=${encodeURIComponent('#' + tag)}">#${tag}</a>`);
  }
  function mediaBtn(m, attrs, label) {
    return media(m).replace(/^<div class="scene ([^"]*)"[^>]*>/, (s, cls) => `<button type="button" class="scene ${cls}" ${attrs} aria-label="${esc(label)}">`).replace(/<\/div>$/, '</button>');
  }
  function dateBlock(ts) { return `<div class="date-block" aria-hidden="true"><span>${fmt.mon(ts)}</span><b>${fmt.day(ts)}</b></div>`; }

  function isMine(p) {
    if (p.author.kind === 'user' && p.author.id === state.me) return true;
    if (K.isBrand() && p.author.kind === 'page' && p.author.id === K.BRAND_PAGE) return true;
    if (K.isManager() && p.author.kind === 'community' && K.MANAGED.includes(p.author.id)) return true;
    return false;
  }
  const canModerate = (p) => K.isManager() && p.community && K.MANAGED.includes(p.community);

  function rsvpButtons(ev, small = true) {
    const sz = small ? ' btn-sm' : '';
    const past = ev.start < Date.now();
    if (past) return `<span class="badge">Tamamlandı</span>`;
    const full = ev.going >= ev.capacity && !ev.attending;
    return `<div class="btn-row">
      <button class="btn${sz} ${ev.attending ? 'btn-success' : 'btn-primary'}" data-action="rsvp" data-id="${ev.id}" data-kind="going" aria-pressed="${ev.attending}" ${full ? 'disabled' : ''}>${ev.attending ? icon('check', 'ico-sm') + 'Katılıyorsun' : full ? 'Kontenjan dolu' : 'Katılıyorum'}</button>
      <button class="btn${sz} ${ev.interested ? 'btn-soft' : ''}" data-action="rsvp" data-id="${ev.id}" data-kind="interested" aria-pressed="${ev.interested}">${icon('star', 'ico-sm')}${ev.interested ? 'İlgileniyorsun' : 'İlgileniyorum'}</button>
    </div>`;
  }
  function eventOrganizers(ev) {
    return ev.communities.map((id) => C(id)).filter(Boolean).map((c) => `<a href="#/topluluk/${c.id}">${esc(c.name)}</a>`).join(' + ');
  }

  /* ---------- gönderi kartı ---------- */
  function postCard(p) {
    if (state.hiddenPosts.includes(p.id)) {
      return `<article class="card post card-pad" id="post-${p.id}"><div class="row-between"><span class="muted small">${icon('eyeOff', 'ico-sm')} Gönderi gizlendi. Akışında bu tür içerikleri daha az göreceksin.</span><button class="btn btn-sm" data-action="unhide-post" data-id="${p.id}">Geri al</button></div></article>`;
    }
    const a = entity(p.author) || { name: 'Silinmiş hesap', hue: 0 };
    const comm = p.community && C(p.community);
    const mine = isMine(p);
    const extras = [];
    if (p.feeling) extras.push(`${esc(p.feeling)} hissediyor`);
    if (p.location) extras.push(`${icon('pin', 'ico-sm')} ${esc(p.location)}`);
    const commLink = comm && p.author.kind !== 'community' ? `<span aria-hidden="true">›</span><a href="#/topluluk/${comm.id}">${esc(comm.name)}</a>` : '';
    const ev = p.event && E(p.event);
    const need = p.need && N(p.need);
    const m = p.media || [];
    const open = UI.openComments.has(p.id);

    return `<article class="card post" id="post-${p.id}" aria-label="${esc(a.name)} gönderisi">
      <header class="post-head">
        <a href="${a.href || '#'}" tabindex="-1">${avatar(a, 'md')}</a>
        <div class="post-who">
          <div class="row" style="gap:6px;flex-wrap:wrap"><a class="name" href="${a.href || '#'}">${esc(a.name)}</a>${verified(a.verified)} ${commLink ? `<span class="post-meta" style="margin:0">${commLink}</span>` : ''} ${TYPE_BADGE[p.type] || ''}</div>
          <div class="post-meta"><time datetime="${new Date(p.ts).toISOString()}">${timeAgo(p.ts)}</time><span aria-hidden="true">·</span>${icon(VIS_ICON[p.visibility] || 'globe', 'ico-sm')}<span>${esc(p.visibility)}</span>${p.edited ? '<span aria-hidden="true">·</span><span>düzenlendi</span>' : ''}${extras.length ? '<span aria-hidden="true">·</span>' + extras.join(' <span aria-hidden="true">·</span> ') : ''}</div>
        </div>
        <div class="menu-wrap">
          <button class="icon-btn" data-action="toggle-menu" data-menu="pm-${p.id}" aria-haspopup="true" aria-expanded="false" aria-label="Gönderi seçenekleri">${icon('more')}</button>
          <div class="popover" data-popover="pm-${p.id}" hidden>
            <button data-action="save" data-id="${p.id}">${icon('bookmark')}${p.saved ? 'Kaydedilenlerden çıkar' : 'Gönderiyi kaydet'}</button>
            <button data-action="copy-link" data-id="${p.id}">${icon('link')}Bağlantıyı kopyala</button>
            ${mine ? `<hr><button data-action="edit-post" data-id="${p.id}">${icon('edit')}Düzenle</button><button class="danger" data-action="delete-post" data-id="${p.id}">${icon('trash')}Sil</button>` : `<button data-action="hide-post" data-id="${p.id}">${icon('eyeOff')}Gönderiyi gizle</button><button data-action="report" data-kind="Gönderi" data-id="${p.id}">${icon('flag')}Bildir</button>`}
            ${canModerate(p) && !mine ? `<hr><div class="menu-label">Moderasyon</div><button class="danger" data-action="mod-remove-post" data-id="${p.id}">${icon('shield')}İçeriği kaldır</button>` : ''}
          </div>
        </div>
      </header>
      ${p.text ? `<div class="post-body">${richText(p.text)}</div>` : '<div style="height:12px"></div>'}
      ${ev ? `<div class="embed">
          <div class="embed-date"><b>${fmt.day(ev.start)}</b><span>${fmt.mon(ev.start)}</span></div>
          <div class="embed-body">
            <h3><a href="#/etkinlik/${ev.id}">${esc(ev.title)}</a></h3>
            <div class="meta-line">${icon('clock')}${fmt.short(ev.start)} · ${fmt.time(ev.start)}</div>
            <div class="meta-line">${icon('pin')}<span class="ellipsis">${esc(ev.location)}</span></div>
            <div class="row-between" style="flex-wrap:wrap"><span class="small muted">${num(ev.going)} katılımcı${ev.communities.length > 1 ? ' · <span class="badge cyan">Ortak etkinlik</span>' : ''}</span>${rsvpButtons(ev)}</div>
          </div></div>` : ''}
      ${need ? `<div class="embed embed-need"><div class="embed-body">
          <div class="row-between"><h3>${esc(need.title)}</h3><span class="badge">${esc(need.category)}</span></div>
          <div class="progress" role="progressbar" aria-valuenow="${need.progress}" aria-valuemin="0" aria-valuemax="${need.goal}" aria-label="Karşılanma oranı"><span style="width:${Math.min(100, need.progress / need.goal * 100)}%"></span></div>
          <div class="row-between small muted"><span>${num(need.progress)} / ${num(need.goal)} karşılandı</span><span>${daysLeft(need.deadline)}</span></div>
          ${K.isBrand() ? `<div class="btn-row"><button class="btn btn-sm btn-primary" data-action="support" data-id="${need.id}">${icon('gift', 'ico-sm')}Destek ol</button></div>` : ''}
        </div></div>` : ''}
      ${m.length ? `<div class="post-media n${Math.min(m.length, 3)}">${m.slice(0, 3).map((x, i) => mediaBtn(x, `data-action="lightbox" data-post="${p.id}" data-i="${i}"`, 'Görseli büyüt')).join('')}</div>` : ''}
      <div class="post-stats">
        <span class="likes">${p.likes ? `<button type="button" class="likes-btn" data-action="show-likes" data-id="${p.id}" aria-label="${num(p.likes)} beğeni · beğenenleri gör"><span class="like-dot">${icon('heart')}</span>${num(p.likes)}</button>` : ''}</span>
        <span>${p.comments.length} yorum · ${p.shares} paylaşım</span>
      </div>
      <div class="post-actions">
        <button data-action="like" data-id="${p.id}" aria-pressed="${p.liked}">${icon('heart')}<span>Beğen</span></button>
        <button data-action="toggle-comments" data-id="${p.id}" aria-expanded="${open}">${icon('comment')}<span>Yorum</span></button>
        <button data-action="share" data-id="${p.id}">${icon('share')}<span>Paylaş</span></button>
      </div>
      ${open ? `<div class="post-comments">
        ${p.comments.map((c) => { const cu = U(c.user); return `<div class="comment">${avatar({ ...cu, kind: 'user' }, 'sm')}<div><div class="comment-bubble"><b>${esc(cu.name)}</b>${esc(c.text)}</div><div class="comment-time">${timeAgo(c.ts)}</div></div></div>`; }).join('')}
        <form class="comment-form" data-form="comment" data-id="${p.id}">${avatar({ ...me(), kind: 'user' }, 'sm')}<label class="sr-only" for="c-${p.id}">Yorum yaz</label><input class="input" id="c-${p.id}" name="text" placeholder="Yorum yaz…" autocomplete="off" maxlength="500" required><button class="icon-btn" aria-label="Yorumu gönder">${icon('send')}</button></form>
      </div>` : ''}
    </article>`;
  }

  /* ---------- sağ sütun ---------- */
  function rail() {
    const groups = Object.values(state.communities).filter((c) => !c.joined && c.type !== 'Gizli').slice(0, 3);
    const events = state.events.filter((e) => e.start > Date.now()).sort((a, b) => a.start - b.start).slice(0, 3);
    const people = state.connections.suggestions.slice(0, 3);
    return `
      <section class="card"><div class="card-head"><h2 class="card-title">Senin için · Önerilen gruplar</h2></div>
        <div class="rail-list">${groups.map((c) => `<div class="rail-item">${avatar({ ...c, kind: 'community' }, 'md')}<a class="grow" href="#/topluluk/${c.id}"><b class="ellipsis">${esc(c.name)}</b><span>${num(c.members)} üye · ${esc(c.type)}</span></a>${joinButton(c, true)}</div>`).join('')}</div>
        <div style="padding:0 16px 14px"><a class="link small" href="#/topluluklar?tab=kesfet">Tümünü gör</a></div></section>
      <section class="card"><div class="card-head"><h2 class="card-title">Yaklaşan etkinlikler</h2></div>
        <div class="rail-list">${events.map((e) => `<a class="rail-item" href="#/etkinlik/${e.id}">${dateBlock(e.start)}<span class="grow"><b class="ellipsis">${esc(e.title)}</b><span>${fmt.time(e.start)} · ${num(e.going)} katılımcı</span></span></a>`).join('')}</div></section>
      <section class="card"><div class="card-head"><h2 class="card-title">Tanıyor olabileceğin kişiler</h2></div>
        <div class="rail-list">${people.map((s) => { const u = U(s.id); return `<div class="rail-item">${avatar({ ...u, kind: 'user' }, 'md')}<a class="grow" href="#/kisi/${u.id}"><b>${esc(u.name)}</b><span>${s.mutual} ortak bağlantı</span></a><button class="icon-btn" data-action="conn-add" data-id="${u.id}" aria-label="${esc(u.name)} ile bağlantı kur">${icon('userPlus')}</button></div>`; }).join('')}</div></section>
      <p class="rail-foot">Bağlantı © 2026<br>Konsept prototip — veriler örnektir.</p>`;
  }

  function joinButton(c, small) {
    const sz = small ? ' btn-sm' : '';
    if (c.joined) return `<button class="btn${sz} btn-success" data-action="leave" data-id="${c.id}" aria-label="${esc(c.name)} grubundan ayrıl">${icon('check', 'ico-sm')}Üyesin</button>`;
    if (c.requested) return `<button class="btn${sz}" data-action="cancel-request" data-id="${c.id}">İstek gönderildi</button>`;
    return `<button class="btn${sz} btn-soft" data-action="join" data-id="${c.id}">${c.type === 'Herkese açık' ? 'Katıl' : 'Katılma isteği'}</button>`;
  }

  /* =============== EKRANLAR =============== */
  const V = {};

  const FAQS = [
    ['Bağlantı nedir?', 'Toplulukların etkinlik duyurularını, sosyal içeriklerini ve sponsor ihtiyaçlarını paylaştığı; üyelerin keşfettiği ve katıldığı bir topluluk platformudur.'],
    ['Bir gruba nasıl katılırım?', 'Herkese açık gruplara “Katıl” ile hemen üye olursun. Özel gruplar yönetici onayı ister; gizli gruplar yalnızca davetle görünür.'],
    ['Ortak etkinlik nedir?', 'Birden fazla topluluğun birlikte düzenlediği etkinliklerdir. Her iki topluluğun üyeleri de etkinliği akışında görür ve katılabilir.'],
    ['Sponsor ihtiyacı nasıl yayınlanır?', 'Topluluk yöneticileri gönderi oluştururken “Sponsor ihtiyacı” türünü seçer; hedef miktar ve son tarih belirtir. Markalar “Destek ol” ile katkı sunar.'],
    ['Gönderimi kimler görebilir?', 'Her gönderide görünürlüğü sen seçersin: Herkese açık, Topluluk üyeleri, Arkadaşlar veya Sadece ben. Yayınladıktan sonra düzenleyebilir ya da silebilirsin.'],
    ['Uygunsuz bir içeriği nasıl bildiririm?', 'Gönderinin ⋯ menüsünden “Bildir”i seç. Bildirimler öncelik ve risk sınıfına göre moderatör kuyruğuna düşer; sonuç sana bildirilir.'],
    ['Bildirimleri nasıl azaltırım?', 'Bildirimler sayfasından tür bazında kapatabilir, sıklığı günlük/haftalık özete çevirebilir ve sessiz saatleri açabilirsin.'],
    ['Verilerimi indirebilir miyim?', 'Evet. Ayarlar › Veri kontrolleri bölümünden tüm verilerini indirebilir veya hesabını kapatabilirsin.']
  ];

  /* ---------- açılış ---------- */
  V.hosgeldin = () => {
    const roleCards = [
      ['uye', 'user', 'var(--brand-soft)', 'var(--brand)'],
      ['moderator', 'shield', 'var(--accent-soft)', 'var(--accent)'],
      ['yonetici', 'crown', 'var(--warning-soft)', 'var(--warning)'],
      ['marka', 'building', 'var(--danger-soft)', 'var(--danger)']
    ];
    return {
      title: 'Topluluk ve etkinlik portalı', layout: 'bare',
      html: `<div class="landing-wrap">
        <nav class="l-nav" aria-label="Tanıtım">
          <a class="brand" href="#/hosgeldin"><span class="brand-mark" aria-hidden="true"></span><span class="brand-text">Bağlantı<small>Etkinlik Portalı</small></span></a>
          <div class="row" style="gap:8px"><button class="icon-btn" data-action="toggle-theme" aria-label="Temayı değiştir">${icon(state.theme === 'dark' ? 'sun' : 'moon')}</button>${window.Auth.isAuthed() ? `<a class="btn btn-primary" href="#/akis">Platforma dön ${icon('arrowRight', 'ico-sm')}</a>` : `<a class="btn btn-ghost" href="#/giris">Giriş yap</a>`}</div>
        </nav>
        <section class="l-hero">
          <div>
            <span class="l-kicker">${icon('sparkle', 'ico-sm')}Sosyal içerik ve topluluk platformu</span>
            <h1>Topluluklarının etkinliklerini <em>tek yerde</em> keşfet, paylaş, buluş.</h1>
            <p class="lead">Grupların etkinlik duyurularını, sosyal içeriklerini ve sponsor ihtiyaçlarını bir araya getiren platform. Kullanıcıya kontrol, topluluğa görünürlük, içeriğe kolay erişim.</p>
            <div class="l-cta">
              <a class="btn btn-primary" href="#/kayit">Ücretsiz kayıt ol ${icon('arrowRight', 'ico-sm')}</a>
              <button class="btn" data-action="scroll-to" data-target="roller">Hesapsız dene</button>
            </div>
            <div class="l-pills" aria-label="Platformun temel alanları"><span>İNSAN</span><span>İÇERİK</span><span>TOPLULUK</span><span>ETKİNLİK</span><span>DUYURULAR</span><span>SPONSORLAR</span></div>
          </div>
          <div class="l-visual" aria-hidden="true">
            <div class="l-glow"></div>
            <div class="l-phone">
              <div class="mini-top"><span class="brand-mark" style="width:22px;height:22px;border-radius:7px"></span>Bağlantı</div>
              <div class="mini-stories">${[0, 1, 2, 3, 4].map((g) => `<i class="g${g}"><b></b></i>`).join('')}</div>
              <div class="mini-post">${media({ scene: 'camp' })}<p><b>Doğa ve Kamp</b> · Kış kampı kayıtları açıldı!</p></div>
              <div class="mini-post">${media({ scene: 'music' })}</div>
              <div class="mini-nav">${icon('home')}${icon('compass')}${icon('plus')}${icon('bell')}${icon('user')}</div>
            </div>
            <div class="l-float f1">${dateBlock(state.events[0].start)}<div><b>Uludağ Kış Kampı</b><span>64 katılımcı · ortak etkinlik</span></div></div>
            <div class="l-float f2"><span class="av av-sm g3 sq">KK</span><div><b>Kuzey Kahve destek oldu</b><span>Meetup mekânı ve ikram</span></div></div>
          </div>
        </section>

        <section class="l-section" aria-labelledby="l-vizyon">
          <h2 id="l-vizyon">Proje vizyonu</h2>
          <p>İnsanların içerik paylaşabildiği, ilgi alanlarına göre topluluk kurabildiği dijital alan.</p>
          <div class="l-grid">
            ${[['megaphone', 'Etkinlik duyurularını paylaş', 'Metin, fotoğraf, video ve bağlantı paylaşımı. Etkinlik ve sponsor duyuruları.', 'var(--brand-soft)', 'var(--brand)'],
               ['compass', 'Etkinlikleri keşfet', 'Kişiler, sayfalar, gruplar ve yeni konular tek arama noktasında.', 'var(--accent-soft)', 'var(--accent)'],
               ['users', 'Topluluklar arası bağ kur', 'Arkadaşlık, yorum, mesaj ve birden fazla topluluğun ortak etkinlikleri.', 'var(--success-soft)', 'var(--success)']]
              .map(([ic, t, d, bg, fg]) => `<div class="card l-card"><span class="l-ico" style="background:${bg};color:${fg}">${icon(ic, 'ico-lg')}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
          </div>
        </section>

        <section class="l-section" id="roller" aria-labelledby="l-roller">
          <h2 id="l-roller">Her rol için tek ve tutarlı deneyim</h2>
          <p>Kayıt olmadan, dört farklı kullanıcı rolüyle deneyebilirsin. Rolü daha sonra hesap menüsünden değiştirebilirsin.</p>
          <div class="l-grid four">
            ${roleCards.map(([r, ic, bg, fg]) => `<div class="card l-card"><span class="l-ico" style="background:${bg};color:${fg}">${icon(ic, 'ico-lg')}</span><h3>${K.ROLES[r].label}</h3><p>${K.ROLES[r].desc}</p><button class="btn btn-sm" data-action="enter-demo" data-role="${r}">Bu rolle dene ${icon('arrowRight', 'ico-sm')}</button></div>`).join('')}
          </div>
        </section>

        <section class="l-section" aria-labelledby="l-nasil">
          <h2 id="l-nasil">Nasıl çalışır?</h2>
          <div class="l-grid l-steps">
            <div class="card l-card"><h3>Topluluğuna katıl</h3><p>Herkese açık gruplara tek dokunuşla katıl, özel gruplara üyelik isteği gönder.</p></div>
            <div class="card l-card"><h3>Etkinlikleri takip et</h3><p>Kişiselleştirilmiş akışta duyuruları gör, katılımını bildir, hatırlatma al.</p></div>
            <div class="card l-card"><h3>Sponsorla buluş</h3><p>Topluluklar ihtiyaçlarını yayınlar, markalar destek olur, herkes görünür olur.</p></div>
          </div>
        </section>

        <section class="l-section" id="sss" aria-labelledby="l-sss">
          <h2 id="l-sss">Sık sorulan sorular</h2>
          <div class="card faq">${FAQS.map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${q}${icon('chevronDown')}</summary><div class="answer">${a}</div></details>`).join('')}</div>
        </section>

        <footer class="l-footer">Bağlantı · Sosyal içerik ve topluluk platformu — konsept prototip. Tüm kişi, kurum ve içerikler örnektir.</footer>
      </div>`
    };
  };

  /* ---------- giriş & kayıt ---------- */
  function authShell(inner, side) {
    return `<div class="auth-wrap">
      <aside class="auth-side">
        <a class="brand" href="#/hosgeldin"><span class="brand-mark" aria-hidden="true"></span><span class="brand-text">Bağlantı<small>Etkinlik Portalı</small></span></a>
        <div class="auth-side-body">${side}</div>
        <p class="auth-side-foot">Göstermelik hesap sistemi · bilgiler yalnızca bu tarayıcıda saklanır, hiçbir sunucuya gönderilmez.</p>
      </aside>
      <div class="auth-main"><div class="auth-card">${inner}</div></div>
    </div>`;
  }
  const authSideDefault = () => `
    <h2>Topluluğunun etkinlikleri, tek hesapta.</h2>
    <ul class="auth-points">
      <li>${icon('calendar')}<span><b>Etkinliklere katıl</b>Katılımını bildir, hatırlatma al, takvimine ekle.</span></li>
      <li>${icon('users')}<span><b>Gruplarınla senkron kal</b>Üye olduğun toplulukların duyuruları akışında.</span></li>
      <li>${icon('shield')}<span><b>Gizliliğin senin elinde</b>Kim neyi görür, sen seçersin.</span></li>
    </ul>
    <div class="auth-mini">${dateBlock(state.events[0].start)}<div><b>${esc(state.events[0].title)}</b><span>${num(state.events[0].going)} katılımcı · ortak etkinlik</span></div></div>`;
  const pwField = (id, name, label, ac, extra = '') => `<div class="field"><label for="${id}">${label}</label><div class="pw-wrap"><input class="input" type="password" id="${id}" name="${name}" autocomplete="${ac}" required maxlength="128" aria-describedby="${id}-err"${extra}><button type="button" class="pw-toggle" data-action="toggle-pw" data-for="${id}" aria-label="Şifreyi göster" aria-pressed="false">${icon('eye', 'ico-sm')}</button></div><span class="field-error" id="${id}-err" role="alert"></span></div>`;

  V.giris = () => {
    const a = window.Auth.account();
    return {
      title: 'Giriş yap', layout: 'bare',
      html: authShell(`
        <div class="stack" style="gap:6px"><h1>Giriş yap</h1><p class="muted">Hesabın yok mu? <a class="link" href="#/kayit">Kayıt ol</a></p></div>
        ${a ? '' : `<div class="callout">${icon('info')}<span>Bu tarayıcıda kayıtlı hesap yok. <a class="link" href="#/kayit">Yeni hesap oluştur</a>.</span></div>`}
        <form class="stack-lg" data-form="login" novalidate>
          <div class="field"><label for="lg-id">E-posta veya kullanıcı adı</label><input class="input" id="lg-id" name="id" autocomplete="username" required autocapitalize="none" spellcheck="false" aria-describedby="lg-id-err"><span class="field-error" id="lg-id-err" role="alert"></span></div>
          ${pwField('lg-pass', 'password', 'Şifre', 'current-password')}
          <div class="row-between" style="flex-wrap:wrap"><label class="check"><input type="checkbox" name="remember" id="lg-remember"> Beni hatırla <span class="xs muted">(30 gün)</span></label><button type="button" class="link small" data-action="forgot-password">Şifremi unuttum</button></div>
          <div class="form-alert" id="lg-alert" role="alert" hidden></div>
          <button class="btn btn-primary btn-lg btn-block">Giriş yap</button>
        </form>
        <div class="or"><span>veya</span></div>
        <div class="stack">
          ${window.Auth.sampleOpen() ? `<button type="button" class="btn btn-block" data-action="sample-login">${icon('user', 'ico-sm')}Örnek hesapla giriş yap</button>` : ''}
          <button type="button" class="btn btn-ghost btn-block" data-action="enter-demo" data-role="uye">Hesapsız demoya göz at</button>
        </div>`, authSideDefault())
    };
  };

  V.kayit = () => {
    const a = window.Auth.account();
    return {
      title: 'Kayıt ol', layout: 'bare',
      html: authShell(`
        <div class="stack" style="gap:6px"><h1>Hesap oluştur</h1><p class="muted">Zaten hesabın var mı? <a class="link" href="#/giris">Giriş yap</a></p></div>
        ${a ? `<div class="callout warn">${icon('alert')}<span>Bu tarayıcıda kayıtlı bir hesap var: <b>${esc(a.email)}</b>. Platform tek hesapla çalışır; yeni kayıt mevcut hesabı ve verilerini siler.</span></div>` : ''}
        <form class="stack-lg" data-form="register" novalidate>
          <div class="form-grid">
            <div class="field"><label for="rg-name">Ad soyad</label><input class="input" id="rg-name" name="name" autocomplete="name" required maxlength="40" aria-describedby="rg-name-err"><span class="field-error" id="rg-name-err" role="alert"></span></div>
            <div class="field"><label for="rg-username">Kullanıcı adı</label><input class="input" id="rg-username" name="username" autocomplete="username" required maxlength="20" autocapitalize="none" spellcheck="false" placeholder="ornek_ad" aria-describedby="rg-username-err"><span class="field-error" id="rg-username-err" role="alert"></span></div>
            <div class="field full"><label for="rg-email">E-posta</label><input class="input" type="email" id="rg-email" name="email" autocomplete="email" required maxlength="254" inputmode="email" aria-describedby="rg-email-err"><span class="field-error" id="rg-email-err" role="alert"></span></div>
            <div class="field"><label for="rg-city">Şehir</label><input class="input" id="rg-city" name="city" autocomplete="address-level2" maxlength="30" placeholder="Bursa"></div>
            <div class="field"><label for="rg-role">Hesap türü</label><select class="select" id="rg-role" name="role">${Object.entries(K.ROLES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></div>
          </div>
          ${pwField('rg-pass', 'password', 'Şifre', 'new-password', ' minlength="8"')}
          <div class="strength" id="rg-strength" aria-live="polite"><div class="strength-bar"><i></i><i></i><i></i><i></i><i></i></div><span>En az 8 karakter; harf ve rakam içermeli.</span></div>
          ${pwField('rg-confirm', 'confirm', 'Şifre (tekrar)', 'new-password')}
          <div class="field"><label class="check" style="align-items:flex-start"><input type="checkbox" name="consent" id="rg-consent" aria-describedby="rg-consent-err"><span><b>Kullanım koşullarını</b> ve kişisel verilerin işlenmesine ilişkin aydınlatma metnini okudum, onaylıyorum.</span></label><span class="field-error" id="rg-consent-err" role="alert"></span></div>
          <button class="btn btn-primary btn-lg btn-block">Hesabı oluştur</button>
        </form>
        <p class="xs muted">${icon('lock', 'ico-sm')} Şifren düz metin olarak saklanmaz; tuzlu PBKDF2-SHA256 özeti (210.000 tur) tutulur.</p>`, authSideDefault())
    };
  };

  /* ---------- ana sayfa / akış ---------- */
  V.akis = () => {
    let posts = state.posts.slice();
    const f = UI.feedFilter;
    if (f === 'takip') posts = posts.filter((p) => (p.community && C(p.community)?.joined) || (p.author.kind === 'page' && P(p.author.id)?.following) || p.author.id === state.me || state.connections.friends.includes(p.author.id));
    if (f === 'etkinlik') posts = posts.filter((p) => p.type === 'event');
    if (f === 'duyuru') posts = posts.filter((p) => p.type === 'announcement');
    if (f === 'sponsor') posts = posts.filter((p) => p.type === 'sponsor');
    if (UI.feedSort === 'yeni') posts.sort((a, b) => b.ts - a.ts);
    else {
      // Önerilen: etkileşim / yaş; kendi yeni gönderin en üstte kalır
      const score = (p) => (isMine(p) && Date.now() - p.ts < 30 * 60000 ? 1e6 : 0) + (p.likes + p.comments.length * 3) / Math.pow((Date.now() - p.ts) / 3600000 + 2, 1.2);
      posts.sort((a, b) => score(b) - score(a));
    }
    const stories = state.stories.filter((s) => !s.hidden).sort((a, b) => (a.muted - b.muted) || (a.seen - b.seen));
    return {
      title: 'Ana sayfa',
      html: `
      <h1 class="sr-only">Ana sayfa · Haber akışı</h1>
      <section class="card edge" aria-label="Topluluk hikâyeleri">
        <div class="stories">
          ${stories.map((s) => { const c = C(s.community); return `<button class="story-btn" data-action="open-story" data-id="${s.id}" aria-label="${esc(c.name)} hikâyesi${s.seen ? ' (izlendi)' : ''}${s.muted ? ' (sessize alındı)' : ''}" style="${s.muted ? 'opacity:.5' : ''}"><span class="story-ring ${s.seen ? 'seen' : ''}">${avatar({ ...c, kind: 'community' }, 'lg')}</span><span class="ellipsis">${esc(s.label)}</span></button>`; }).join('')}
        </div>
      </section>
      <section class="card edge composer" aria-label="Gönderi oluştur">
        <div class="row">${avatar({ ...me(), kind: 'user' }, 'md')}<button class="composer-input" data-action="compose">Aklından neler geçiyor, ${esc(me().name.split(' ')[0])}?</button></div>
      </section>
      <div class="feed-filter">
        ${chips([['tumu', 'Tümü'], ['takip', 'Takip ettiklerim'], ['etkinlik', 'Etkinlikler'], ['duyuru', 'Duyurular'], ['sponsor', 'Sponsor ihtiyaçları']], f, 'feed-filter')}
        <label class="sr-only" for="feed-sort">Sıralama</label>
        <select class="select" id="feed-sort" data-change="feed-sort" style="width:auto;min-height:36px;padding-top:4px;padding-bottom:4px;font-size:13px;flex:none">
          <option value="onerilen" ${UI.feedSort === 'onerilen' ? 'selected' : ''}>Önerilen</option>
          <option value="yeni" ${UI.feedSort === 'yeni' ? 'selected' : ''}>En yeni</option>
        </select>
      </div>
      ${posts.length ? posts.map(postCard).join('') : `<div class="card">${empty('layers', 'Bu filtrede gönderi yok', 'Başka bir filtre seç veya yeni topluluklara katıl.')}</div>`}
      <p class="muted small" style="text-align:center;padding:16px">Hepsi bu kadar.</p>`
    };
  };

  /* ---------- keşfet & arama ---------- */
  function discoverResults(tab) {
    const d = UI.discover;
    const raw = d.q.trim();
    const q = lower(raw.replace(/^#/, ''));
    const hit = (...fields) => !q || fields.some((x) => lower(x).includes(q));
    const now = Date.now();
    const inDate = (ts, future) => {
      if (d.date === 'all') return true;
      const span = d.date === 'week' ? 7 : 30;
      return future ? ts - now <= span * 86400000 && ts >= now - 86400000 : now - ts <= span * 86400000;
    };
    const locOk = (city) => d.loc === 'all' || city === d.loc;
    const privOk = (t) => d.priv === 'all' || t === d.priv;

    const comms = Object.values(state.communities).filter((c) => (c.type !== 'Gizli' || c.joined) && hit(c.name, c.desc, c.category, c.tags.join(' ')) && locOk(c.city) && privOk(c.type));
    const topl = comms.filter((c) => c.kind === 'topluluk'), grp = comms.filter((c) => c.kind === 'grup');
    const pages = Object.values(state.pages).filter((p) => hit(p.name, p.desc, p.category) && locOk(p.city));
    const posts = state.posts.filter((p) => {
      const a = entity(p.author);
      if (!hit(p.text, a?.name, p.community ? C(p.community).name : '')) return false;
      if (!inDate(p.ts, false)) return false;
      if (d.kind === 'Metin' && (p.media.length || p.type === 'event')) return false;
      if (d.kind === 'Fotoğraf' && !p.media.length) return false;
      if (d.kind === 'Etkinlik' && p.type !== 'event') return false;
      if (d.priv !== 'all' && p.visibility !== d.priv) return false;
      return true;
    });
    const events = state.events.filter((e) => hit(e.title, e.location, e.category, e.desc) && inDate(e.start, true) && (d.loc === 'all' || e.location.includes(d.loc)));

    const commRow = (c) => `<div class="list-item">${avatar({ ...c, kind: 'community' }, 'md')}<a class="grow" href="#/topluluk/${c.id}"><b>${esc(c.name)}</b><span>${num(c.members)} üye · ${esc(c.type)} · ${esc(c.city)} · ${Math.max(1, (c.members % 17))} ortak bağlantı</span></a><div class="btn-row">${joinButton(c, true)}</div></div>`;
    const pageRow = (p) => `<div class="list-item">${avatar({ ...p, kind: 'page' }, 'md')}<a class="grow" href="#/sayfa/${p.id}"><b>${esc(p.name)} ${verified(p.verified)}</b><span>${esc(p.category)} · ${num(p.followers)} takipçi</span></a><div class="btn-row"><button class="btn btn-sm ${p.following ? 'btn-success' : 'btn-soft'}" data-action="follow-page" data-id="${p.id}">${p.following ? 'Takip ediliyor' : 'Takip et'}</button></div></div>`;
    const eventRow = (e) => `<a class="event-row" href="#/etkinlik/${e.id}">${dateBlock(e.start)}<span class="grow"><b class="ellipsis" style="display:block">${esc(e.title)}</b><span class="small muted">${fmt.time(e.start)} · ${esc(e.location)} · ${num(e.going)} katılımcı</span></span>${icon('chevronRight')}</a>`;
    const section = (title, count, body, more) => `<section class="card"><div class="card-head"><h2>${title} <span class="muted small">(${count})</span></h2>${more ? `<a class="link small" href="#/kesfet?tab=${more}&q=${encodeURIComponent(raw)}">Tümü</a>` : ''}</div><div class="list" style="margin-top:6px">${body}</div></section>`;

    if (tab === 'topluluklar') return topl.length ? `<section class="card"><div class="list">${topl.map(commRow).join('')}</div></section>` : `<div class="card">${empty('search', 'Sonuç bulunamadı', 'Farklı bir kelime veya filtre dene.')}</div>`;
    if (tab === 'gruplar') return grp.length ? `<section class="card"><div class="list">${grp.map(commRow).join('')}</div></section>` : `<div class="card">${empty('search', 'Sonuç bulunamadı', 'Farklı bir kelime veya filtre dene.')}</div>`;
    if (tab === 'sayfalar') return pages.length ? `<section class="card"><div class="list">${pages.map(pageRow).join('')}</div></section>` : `<div class="card">${empty('search', 'Sonuç bulunamadı', 'Farklı bir kelime veya filtre dene.')}</div>`;
    if (tab === 'etkinlikler') return events.length ? `<section class="card"><div class="list">${events.map(eventRow).join('')}</div></section>` : `<div class="card">${empty('calendar', 'Etkinlik bulunamadı', 'Tarih veya konum filtresini genişlet.')}</div>`;
    if (tab === 'gonderiler') return posts.length ? posts.map(postCard).join('') : `<div class="card">${empty('search', 'Gönderi bulunamadı', 'Anahtar kelimeyi veya tarih aralığını değiştir.')}</div>`;

    const total = topl.length + grp.length + pages.length + posts.length + events.length;
    if (!total) return `<div class="card">${empty('search', `“${esc(raw)}” için sonuç yok`, 'Yazımı kontrol et ya da daha genel bir kelime dene.')}</div>`;
    return [
      topl.length ? section('Topluluklar', topl.length, topl.slice(0, 3).map(commRow).join(''), 'topluluklar') : '',
      grp.length ? section('Gruplar', grp.length, grp.slice(0, 3).map(commRow).join(''), 'gruplar') : '',
      events.length ? section('Etkinlikler', events.length, events.slice(0, 3).map(eventRow).join(''), 'etkinlikler') : '',
      pages.length ? section('Sayfalar', pages.length, pages.slice(0, 3).map(pageRow).join(''), 'sayfalar') : '',
      posts.length ? `<h2 class="card-title pad-x" style="margin:20px 4px 0">Gönderiler (${posts.length})</h2>` + posts.slice(0, 3).map(postCard).join('') : ''
    ].join('');
  }
  V.discoverResults = discoverResults;

  V.kesfet = (r) => {
    const tab = r.q.get('tab') || 'tumu';
    if (r.q.has('q')) UI.discover.q = r.q.get('q');
    const d = UI.discover;
    const sel = (key, label, opts) => `<label class="field" style="flex:1;min-width:140px"><span class="sr-only">${label}</span><select class="select" data-change="discover-filter" data-key="${key}" aria-label="${label}">${opts.map(([v, l]) => `<option value="${v}" ${d[key] === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
    const trending = ['kamp', 'meetup', 'açıksahne', 'bisiklet', 'fotoğraf', 'gönüllülük'];
    return {
      title: 'Keşfet',
      html: `
      <div class="page-head"><div><h1>Keşfet ve ara</h1><p>Topluluk, gönderi, grup, sayfa ve etkinlik araması tek noktadan.</p></div></div>
      <section class="card card-pad stack">
        <form class="top-search" style="max-width:none;height:50px;margin:0" data-form="discover" role="search">
          ${icon('search')}<input type="search" name="q" id="discover-q" value="${esc(d.q)}" placeholder="Kamp ekipmanları, topluluklar veya gruplar ara…" aria-label="Ara" autocomplete="off">
        </form>
        <div class="row" style="flex-wrap:wrap;gap:8px">
          ${sel('date', 'Tarih', [['all', 'Her zaman'], ['week', 'Bu hafta'], ['month', 'Bu ay']])}
          ${sel('loc', 'Konum', [['all', 'Tüm şehirler'], ['Bursa', 'Bursa'], ['İstanbul', 'İstanbul'], ['İzmir', 'İzmir'], ['Ankara', 'Ankara']])}
          ${sel('kind', 'İçerik türü', [['all', 'Tüm içerik'], ['Metin', 'Metin'], ['Fotoğraf', 'Fotoğraf / video'], ['Etkinlik', 'Etkinlik']])}
          ${sel('priv', 'Gizlilik', [['all', 'Tüm gizlilik'], ['Herkese açık', 'Herkese açık'], ['Özel', 'Özel'], ['Topluluk üyeleri', 'Topluluk üyeleri']])}
        </div>
        ${!d.q ? `<div class="row" style="flex-wrap:wrap;gap:8px"><span class="small muted">Gündemde:</span>${trending.map((t) => `<a class="chip" href="#/kesfet?q=${encodeURIComponent('#' + t)}">#${t}</a>`).join('')}</div>` : ''}
      </section>
      <section class="card" style="overflow:hidden">${tabs([['tumu', 'Tümü'], ['topluluklar', 'Topluluklar'], ['gruplar', 'Gruplar'], ['gonderiler', 'Gönderiler'], ['sayfalar', 'Sayfalar'], ['etkinlikler', 'Etkinlikler']], tab, '#/kesfet')}</section>
      <div id="discover-results" class="stack-lg" data-tab="${esc(tab)}">${discoverResults(tab)}</div>
      <p class="callout pad-x">${icon('lock')}<span>Gizli gruplar arama sonuçlarında görünmez; yalnızca davetle katılınabilir.</span></p>`
    };
  };

  /* ---------- topluluklar listesi ---------- */
  V.topluluklar = (r) => {
    const tab = r.q.get('tab') || 'uyelik';
    let list = Object.values(state.communities);
    if (tab === 'uyelik') list = list.filter((c) => c.joined);
    if (tab === 'kesfet') list = list.filter((c) => !c.joined && c.type !== 'Gizli');
    if (tab === 'yonetilen') list = K.isManager() ? list.filter((c) => K.MANAGED.includes(c.id)) : [];
    const card = (c) => `<article class="card ccard">
      ${media({ scene: c.scene })}
      <div class="ccard-body">${avatar({ ...c, kind: 'community' }, 'lg')}
        <h3><a href="#/topluluk/${c.id}">${esc(c.name)}</a></h3>
        <div class="row small muted" style="gap:6px;flex-wrap:wrap"><span class="badge ${c.type === 'Herkese açık' ? 'green' : c.type === 'Özel' ? 'amber' : 'pink'}">${icon(c.type === 'Herkese açık' ? 'globe' : 'lock', 'ico-sm')}${esc(c.type)}</span><span>${num(c.members)} üye</span><span>· ${c.kind === 'grup' ? 'Grup' : 'Topluluk'}</span></div>
        <p class="small muted">${esc(c.desc)}</p>
      </div>
      <div class="ccard-foot">${joinButton(c, true)}<a class="btn btn-sm" href="#/topluluk/${c.id}">Görüntüle</a></div>
    </article>`;
    return {
      title: 'Topluluklar',
      html: `
      <div class="page-head"><div><h1>Topluluklar ve gruplar</h1><p>Ortak ilgi alanları etrafında içerik, tartışma ve etkinlik alanları.</p></div>${K.isAdmin() ? `<button class="btn btn-primary" data-action="new-group">${icon('plus')}Grup oluştur</button>` : ''}</div>
      <section class="card" style="overflow:hidden">${tabs([['uyelik', 'Üye olduklarım'], ['kesfet', 'Keşfet'], ...(K.isManager() ? [['yonetilen', 'Yönettiklerim']] : [])], tab, '#/topluluklar')}</section>
      ${list.length ? `<div class="grid-cards">${list.map(card).join('')}</div>` : `<div class="card">${empty('users', 'Burada henüz bir şey yok', 'Keşfet sekmesinden ilgi alanına uygun gruplara katıl.')}</div>`}
      <div class="callout pad-x">${icon('info')}<span><b>Grup türleri:</b> Herkese açık gruplara doğrudan katılınır, özel gruplar yönetici onayı ister, gizli gruplar yalnızca davetle görünür.</span></div>`
    };
  };

  /* ---------- topluluk profili ---------- */
  V.topluluk = (r) => {
    const c = C(r.id);
    if (!c) return V.notfound();
    const tab = r.q.get('tab') || 'gonderiler';
    const base = '#/topluluk/' + c.id;
    const canSee = c.type === 'Herkese açık' || c.joined;
    const manage = K.isManager() && K.MANAGED.includes(c.id);
    let body = '';
    if (!canSee && ['gonderiler', 'medya', 'departmanlar'].includes(tab)) {
      body = `<div class="card">${empty('lock', 'Bu grup ' + lower(c.type), 'Gönderileri görmek için üye olman gerekiyor.', joinButton(c))}</div>`;
    } else if (tab === 'gonderiler') {
      const posts = state.posts.filter((p) => p.community === c.id);
      body = `${c.pinned ? `<div class="pinned">${icon('pin')}<div><b>Sabitlenmiş duyuru</b><p class="small">${esc(c.pinned)}</p></div></div>` : ''}
        ${c.joined ? `<section class="card edge composer"><div class="row">${avatar({ ...me(), kind: 'user' }, 'md')}<button class="composer-input" data-action="compose" data-community="${c.id}">${esc(c.name)} grubunda paylaş…</button></div></section>` : ''}
        ${posts.length ? posts.map(postCard).join('') : `<div class="card">${empty('layers', 'Henüz gönderi yok', 'İlk paylaşımı sen yap.')}</div>`}`;
    } else if (tab === 'hakkinda') {
      const mods = c.moderators.map((id) => U(id)).filter(Boolean);
      body = `<section class="card card-pad stack-lg">
          <div class="stack"><h2 style="font-size:16px">Hakkında</h2><p>${esc(c.desc)}</p>
          <div class="stack small"><div class="meta-line">${icon(c.type === 'Herkese açık' ? 'globe' : 'lock')}<span><b>${esc(c.type)}</b> — ${c.type === 'Herkese açık' ? 'Herkes gönderileri görebilir.' : c.type === 'Özel' ? 'Yalnızca üyeler gönderileri görebilir; üyelik yönetici onayı ister.' : 'Yalnızca davetliler grubu görebilir.'}</span></div>
          <div class="meta-line">${icon('pin')}${esc(c.city)}</div><div class="meta-line">${icon('clock')}${esc(c.created)} yılından beri</div></div></div>
          <div class="stack"><h3 style="font-size:15px">Konu etiketleri</h3><div class="row" style="flex-wrap:wrap;gap:8px">${c.tags.map((t) => `<a class="chip" href="#/kesfet?q=${encodeURIComponent('#' + t)}">#${esc(t)}</a>`).join('')}</div></div>
          <div class="stack"><h3 style="font-size:15px">Grup kuralları</h3><ol style="margin:0;padding-left:20px;display:grid;gap:6px">${c.rules.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
          <div class="stack"><h3 style="font-size:15px">Yönetici ve moderatörler</h3>${mods.map((u) => `<div class="row">${avatar({ ...u, kind: 'user' }, 'sm')}<a class="grow" href="#/kisi/${u.id}"><b class="small">${esc(u.name)}</b></a><span class="badge ${c.admins.includes(u.id) ? 'amber' : 'cyan'}">${c.admins.includes(u.id) ? 'Yönetici' : 'Moderatör'}</span></div>`).join('')}</div>
        </section>`;
    } else if (tab === 'etkinlikler') {
      const evs = state.events.filter((e) => e.communities.includes(c.id)).sort((a, b) => a.start - b.start);
      body = evs.length ? `<section class="card"><div class="list">${evs.map((e) => `<a class="event-row" href="#/etkinlik/${e.id}">${dateBlock(e.start)}<span class="grow"><b style="display:block">${esc(e.title)}</b><span class="small muted">${fmt.time(e.start)} · ${esc(e.location)}${e.communities.length > 1 ? ' · Ortak etkinlik' : ''}</span></span>${e.start < Date.now() ? '<span class="badge">Geçmiş</span>' : e.attending ? '<span class="badge green">Katılıyorsun</span>' : ''}</a>`).join('')}</div></section>` : `<div class="card">${empty('calendar', 'Planlanmış etkinlik yok', 'Yeni etkinlikler burada görünür.')}</div>`;
      if (manage) body = `<div class="btn-row pad-x"><button class="btn btn-primary" data-action="compose" data-type="event" data-community="${c.id}">${icon('plus')}Etkinlik oluştur</button></div>` + body;
    } else if (tab === 'medya') {
      const items = galleryItems().filter((g) => g.community === c.id);
      body = items.length ? `<div class="gallery">${items.map((g) => galleryTile(g, items)).join('')}</div>` : `<div class="card">${empty('image', 'Medya arşivi boş', 'Paylaşılan fotoğraf ve videolar burada toplanır.')}</div>`;
    } else if (tab === 'departmanlar') {
      body = `<section class="card">${c.departments.map((dp) => `<div class="list-item" style="align-items:flex-start;flex-direction:column;gap:8px"><b>${icon('layers', 'ico-sm')} ${esc(dp.name)}</b><div class="stack" style="width:100%;gap:6px">${dp.topics.map((t) => `<div class="row-between small"><span>${icon('hash', 'ico-sm')} ${esc(t.t)}</span><span class="badge ${t.open ? 'green' : ''}">${t.open ? 'Açık konu' : 'Kapalı'}</span></div>`).join('')}</div></div>`).join('')}</section>${manage && K.isAdmin() ? `<a class="btn pad-x" href="#/yonetim?tab=departmanlar">Departmanları yönet</a>` : ''}`;
    } else if (tab === 'sponsorlar') {
      const sp = c.sponsors.map(P).filter(Boolean);
      const needs = state.needs.filter((n) => n.community === c.id);
      body = `<section class="card"><div class="card-head"><h2>Sponsorlar</h2></div><div class="list" style="margin-top:6px">${sp.length ? sp.map((p) => `<a class="list-item" href="#/sayfa/${p.id}">${avatar({ ...p, kind: 'page' }, 'md')}<span class="grow"><b>${esc(p.name)} ${verified(p.verified)}</b><span>${esc(p.category)}</span></span>${icon('chevronRight')}</a>`).join('') : `<div class="list-item muted">Henüz sponsor yok.</div>`}</div></section>
        <section class="card"><div class="card-head"><h2>İhtiyaçlar</h2>${manage ? `<button class="btn btn-sm btn-soft" data-action="compose" data-type="sponsor" data-community="${c.id}">${icon('plus', 'ico-sm')}İhtiyaç ekle</button>` : ''}</div><div class="stack" style="padding:12px 16px 16px">${needs.length ? needs.map(needCard).join('') : '<span class="muted small">Açık ihtiyaç yok.</span>'}</div></section>`;
    }
    return {
      title: c.name,
      html: `
      <section class="card edge profile-head">
        ${media({ scene: c.scene }, 'profile-cover')}
        <div class="profile-info">
          ${avatar({ ...c, kind: 'community' }, 'xl')}
          <div class="grow"><h1>${esc(c.name)}</h1><p class="muted small">${esc(c.city)} · ${num(c.members)} üye · ${esc(c.type)} ${c.kind === 'grup' ? 'grup' : 'topluluk'}</p></div>
          <div class="profile-actions">${joinButton(c)}<a class="btn" href="#/mesajlar">${icon('message', 'ico-sm')}Mesaj</a>
            <div class="menu-wrap"><button class="btn" data-action="toggle-menu" data-menu="cm-${c.id}" aria-label="Diğer seçenekler" aria-haspopup="true" aria-expanded="false">${icon('more')}</button>
              <div class="popover" data-popover="cm-${c.id}" hidden><button data-action="copy-link" data-href="${base}">${icon('link')}Bağlantıyı kopyala</button><button data-action="report" data-kind="Topluluk" data-id="${c.id}">${icon('flag')}Topluluğu bildir</button>${manage ? `<hr><a href="#/yonetim">${icon('shield')}Yönetim paneli</a>` : ''}</div></div>
          </div>
        </div>
        ${tabs([['gonderiler', 'Gönderiler'], ['hakkinda', 'Hakkında'], ['etkinlikler', 'Etkinlikler'], ['medya', 'Medya'], ['departmanlar', 'Departmanlar'], ['sponsorlar', 'Sponsorlar']], tab, base)}
      </section>
      ${body}`
    };
  };

  /* ---------- etkinlikler ---------- */
  V.etkinlikler = (r) => {
    const tab = r.q.get('tab') || 'yaklasan';
    const now = Date.now();
    let evs = state.events.slice();
    if (tab === 'yaklasan') evs = evs.filter((e) => e.start >= now);
    if (tab === 'katildiklarim') evs = evs.filter((e) => e.attending || e.interested);
    if (tab === 'ortak') evs = evs.filter((e) => e.communities.length > 1);
    if (tab === 'gecmis') evs = evs.filter((e) => e.start < now);
    if (UI.eventCat !== 'Tümü') evs = evs.filter((e) => e.category === UI.eventCat);
    evs.sort((a, b) => tab === 'gecmis' ? b.start - a.start : a.start - b.start);
    const cats = ['Tümü', ...new Set(state.events.map((e) => e.category))];
    return {
      title: 'Etkinlikler',
      html: `
      <div class="page-head"><div><h1>Etkinlikler</h1><p>Topluluk etkinlikleri, ortak etkinlikler ve hatırlatmalar.</p></div>${K.isAdmin() ? `<button class="btn btn-primary" data-action="compose" data-type="event">${icon('plus')}Etkinlik oluştur</button>` : ''}</div>
      <section class="card" style="overflow:hidden">${tabs([['yaklasan', 'Yaklaşan'], ['katildiklarim', 'Katıldıklarım'], ['ortak', 'Ortak etkinlikler'], ['gecmis', 'Geçmiş']], tab, '#/etkinlikler')}</section>
      ${chips(cats.map((c) => [c, c]), UI.eventCat, 'event-cat')}
      ${evs.length ? `<div class="stack">${evs.map((e) => `<article class="card event-card">
          ${media({ scene: e.scene })}
          <div class="event-card-body">
            <div class="row" style="gap:6px;flex-wrap:wrap"><span class="badge blue">${esc(e.category)}</span>${e.communities.length > 1 ? '<span class="badge cyan">Ortak etkinlik</span>' : ''}${e.sponsors.length ? `<span class="badge pink">${icon('gift', 'ico-sm')}Sponsorlu</span>` : ''}</div>
            <h3><a href="#/etkinlik/${e.id}">${esc(e.title)}</a></h3>
            <div class="meta-line">${icon('calendar')}${fmt.full(e.start)} · ${fmt.time(e.start)}</div>
            <div class="meta-line">${icon('pin')}${esc(e.location)}</div>
            <div class="meta-line">${icon('users')}<span>${eventOrganizers(e)}</span></div>
            <div class="progress" aria-label="Kontenjan doluluğu"><span style="width:${Math.min(100, e.going / e.capacity * 100)}%"></span></div>
            <div class="row-between" style="flex-wrap:wrap"><span class="small muted">${num(e.going)} / ${num(e.capacity)} katılımcı</span>${rsvpButtons(e)}</div>
          </div></article>`).join('')}</div>` : `<div class="card">${empty('calendar', 'Etkinlik bulunamadı', 'Başka bir sekme ya da kategori seç.')}</div>`}`
    };
  };

  V.etkinlik = (r) => {
    const e = E(r.id);
    if (!e) return V.notfound();
    const posts = state.posts.filter((p) => p.event === e.id);
    const attendees = Object.values(state.users).slice(1, 7);
    return {
      title: e.title,
      html: `
      <section class="card edge profile-head">
        ${media({ scene: e.scene }, 'profile-cover')}
        <div class="card-pad stack">
          <div class="row" style="gap:6px;flex-wrap:wrap"><span class="badge blue">${esc(e.category)}</span>${e.communities.length > 1 ? '<span class="badge cyan">Ortak etkinlik</span>' : ''}</div>
          <h1 style="font-size:clamp(22px,3vw,28px)">${esc(e.title)}</h1>
          <div class="meta-line">${icon('calendar')}${fmt.full(e.start)} · ${fmt.time(e.start)}</div>
          <div class="meta-line">${icon('pin')}${esc(e.location)}</div>
          <div class="meta-line">${icon('users')}<span>Düzenleyen: ${eventOrganizers(e)}</span></div>
          <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:4px">${rsvpButtons(e, false)}<button class="btn" data-action="ics" data-id="${e.id}">${icon('download', 'ico-sm')}Takvime ekle</button><button class="btn" data-action="share-event" data-id="${e.id}">${icon('share', 'ico-sm')}Paylaş</button></div>
        </div>
      </section>
      <section class="card card-pad stack"><h2 style="font-size:16px">Etkinlik hakkında</h2><p>${esc(e.desc)}</p></section>
      <section class="card card-pad stack">
        <div class="row-between"><h2 style="font-size:16px">Katılımcılar</h2><span class="small muted">${num(e.going)} / ${num(e.capacity)}</span></div>
        <div class="progress"><span style="width:${Math.min(100, e.going / e.capacity * 100)}%"></span></div>
        <div class="row"><div class="av-stack">${attendees.map((u) => avatar({ ...u, kind: 'user' }, 'sm')).join('')}</div><span class="small muted">${esc(attendees[0].name)}, ${esc(attendees[1].name)} ve ${num(Math.max(0, e.going - 2))} kişi daha</span></div>
      </section>
      ${e.sponsors.length ? `<section class="card"><div class="card-head"><h2>Sponsorlar</h2></div><div class="list" style="margin-top:6px">${e.sponsors.map(P).map((p) => `<a class="list-item" href="#/sayfa/${p.id}">${avatar({ ...p, kind: 'page' }, 'md')}<span class="grow"><b>${esc(p.name)} ${verified(p.verified)}</b><span>${esc(p.category)}</span></span>${icon('chevronRight')}</a>`).join('')}</div></section>` : ''}
      <h2 class="card-title pad-x" style="margin:20px 4px 0">Etkinlik paylaşımları</h2>
      ${posts.length ? posts.map(postCard).join('') : `<div class="card">${empty('message', 'Henüz paylaşım yok', 'Etkinlikle ilgili ilk gönderiyi sen paylaş.')}</div>`}`
    };
  };

  /* ---------- sponsorlar ---------- */
  function needCard(n) {
    const c = C(n.community);
    const done = n.progress >= n.goal;
    return `<article class="card card-pad stack" style="box-shadow:none">
      <div class="row">${avatar({ ...c, kind: 'community' }, 'sm')}<a class="grow small" href="#/topluluk/${c.id}"><b>${esc(c.name)}</b></a><span class="badge">${esc(n.category)}</span></div>
      <h3 style="font-size:16px">${esc(n.title)}</h3>
      <p class="small muted">${esc(n.desc)}</p>
      <div class="progress" role="progressbar" aria-valuenow="${n.progress}" aria-valuemin="0" aria-valuemax="${n.goal}" aria-label="Karşılanma"><span style="width:${Math.min(100, n.progress / n.goal * 100)}%"></span></div>
      <div class="row-between small"><span><b>${num(n.progress)}</b> / ${num(n.goal)} karşılandı</span><span class="muted">${done ? 'Tamamlandı' : daysLeft(n.deadline)}</span></div>
      <div class="row-between" style="flex-wrap:wrap">
        <div class="row" style="gap:6px">${n.supporters.length ? `<div class="av-stack">${n.supporters.map((id) => avatar({ ...P(id), kind: 'page' }, 'xs')).join('')}</div><span class="xs muted">${n.supporters.map((id) => esc(P(id).name)).join(', ')}</span>` : '<span class="xs muted">İlk destekçi sen ol</span>'}</div>
        ${K.isBrand() ? (n.supporters.includes(K.BRAND_PAGE) ? `<span class="badge green">${icon('check', 'ico-sm')}Destek verdin</span>` : `<button class="btn btn-sm btn-primary" data-action="support" data-id="${n.id}" ${done ? 'disabled' : ''}>${icon('gift', 'ico-sm')}Destek ol</button>`) : `<button class="btn btn-sm" data-action="share-need" data-id="${n.id}">${icon('share', 'ico-sm')}Paylaş</button>`}
      </div>
    </article>`;
  }
  V.sponsorlar = (r) => {
    const tab = r.q.get('tab') || 'ihtiyaclar';
    const cats = ['Tümü', ...new Set(state.needs.map((n) => n.category))];
    let needs = state.needs.slice();
    if (UI.sponsorCat !== 'Tümü') needs = needs.filter((n) => n.category === UI.sponsorCat);
    if (tab === 'destekler') needs = needs.filter((n) => n.supporters.includes(K.BRAND_PAGE));
    const pages = Object.values(state.pages);
    return {
      title: 'Sponsorlar',
      html: `
      <div class="page-head"><div><h1>Sponsorlar ve sayfalar</h1><p>Topluluklar ihtiyaçlarını yayınlar, markalar ve işletmeler destek olur.</p></div>${K.isAdmin() ? `<button class="btn btn-primary" data-action="compose" data-type="sponsor">${icon('plus')}İhtiyaç yayınla</button>` : ''}</div>
      ${K.isBrand() ? `<div class="callout">${icon('building')}<span><b>Kuzey Kahve</b> sayfası adına görüntülüyorsun. “Destek ol” ile toplulukların ihtiyaçlarını karşılayabilirsin.</span></div>` : ''}
      <section class="card" style="overflow:hidden">${tabs([['ihtiyaclar', 'Açık ihtiyaçlar'], ['markalar', 'Sponsor markalar'], ...(K.isBrand() ? [['destekler', 'Desteklerim']] : [])], tab, '#/sponsorlar')}</section>
      ${tab === 'markalar'
        ? `<div class="grid-cards">${pages.map((p) => `<article class="card ccard">${media({ scene: p.scene })}<div class="ccard-body">${avatar({ ...p, kind: 'page' }, 'lg')}<h3><a href="#/sayfa/${p.id}">${esc(p.name)}</a> ${verified(p.verified)}</h3><span class="small muted">${esc(p.category)} · ${num(p.followers)} takipçi</span><p class="small muted">${esc(p.desc)}</p></div><div class="ccard-foot"><button class="btn btn-sm ${p.following ? 'btn-success' : 'btn-soft'}" data-action="follow-page" data-id="${p.id}">${p.following ? 'Takip ediliyor' : 'Takip et'}</button><a class="btn btn-sm" href="#/sayfa/${p.id}">Sayfa</a></div></article>`).join('')}</div>`
        : `${chips(cats.map((c) => [c, c]), UI.sponsorCat, 'sponsor-cat')}
           ${needs.length ? `<div class="grid-cards">${needs.map((n) => `<div class="card" style="overflow:hidden">${needCard(n).replace('class="card card-pad stack" style="box-shadow:none"', 'class="card-pad stack"')}</div>`).join('')}</div>` : `<div class="card">${empty('gift', 'Burada ihtiyaç yok', 'Farklı bir kategori seç.')}</div>`}`}`
    };
  };

  /* ---------- işletme sayfası ---------- */
  V.sayfa = (r) => {
    const p = P(r.id);
    if (!p) return V.notfound();
    const own = K.isBrand() && p.id === K.BRAND_PAGE;
    const tab = r.q.get('tab') || (own ? 'istatistik' : 'gonderiler');
    const base = '#/sayfa/' + p.id;
    let body = '';
    if (tab === 'gonderiler') {
      const posts = state.posts.filter((x) => x.author.kind === 'page' && x.author.id === p.id);
      body = (own ? `<section class="card edge composer"><div class="row">${avatar({ ...p, kind: 'page' }, 'md')}<button class="composer-input" data-action="compose">${esc(p.name)} olarak paylaş…</button></div></section>` : '') + (posts.length ? posts.map(postCard).join('') : `<div class="card">${empty('layers', 'Henüz gönderi yok', 'Sayfa paylaşımları burada görünür.')}</div>`);
    } else if (tab === 'hakkinda') {
      const sponsored = Object.values(state.communities).filter((c) => c.sponsors.includes(p.id));
      body = `<section class="card card-pad stack-lg"><div class="stack"><h2 style="font-size:16px">Hakkında</h2><p>${esc(p.desc)}</p><div class="meta-line">${icon('tag')}${esc(p.category)}</div><div class="meta-line">${icon('pin')}${esc(p.city)}</div><div class="meta-line">${icon('badgeCheck')}${p.verified ? 'Doğrulanmış işletme' : 'Doğrulama bekliyor'}</div></div>
        <div class="stack"><h3 style="font-size:15px">Sponsor olduğu topluluklar</h3>${sponsored.length ? sponsored.map((c) => `<a class="row" href="#/topluluk/${c.id}">${avatar({ ...c, kind: 'community' }, 'sm')}<b class="small">${esc(c.name)}</b></a>`).join('') : '<span class="muted small">Henüz yok.</span>'}</div></section>`;
    } else if (tab === 'medya') {
      body = `<div class="gallery">${[p.scene, 'coffee', 'music', 'code', 'city', 'photo'].map((s, i) => `<button class="tile" data-action="lightbox-scene" data-scene="${s}" aria-label="Görseli büyüt">${media({ scene: s })}</button>`).join('')}</div>`;
    } else if (tab === 'istatistik' && own) {
      const st = p.stats;
      body = `<div class="stat-grid">
          <div class="card stat"><div class="label">Erişim (30 gün)</div><div class="value">${num(st.reach)}</div><div class="delta">▲ %12</div></div>
          <div class="card stat"><div class="label">Etkileşim oranı</div><div class="value">%${String(st.engagement).replace('.', ',')}</div><div class="delta">▲ 0,8 puan</div></div>
          <div class="card stat"><div class="label">Yeni takipçi</div><div class="value">+${num(st.growth)}</div><div class="delta">▲ %5</div></div>
        </div>
        <section class="card"><div class="card-head"><h2>Yayın takvimi</h2><button class="btn btn-sm btn-soft" data-action="compose">${icon('plus', 'ico-sm')}Planla</button></div>
          <div class="list" style="margin-top:6px">${state.schedule.filter((s) => s.page === p.id).sort((a, b) => a.when - b.when).map((s) => `<div class="list-item">${dateBlock(s.when)}<span class="grow"><b>${esc(s.text)}</b><span>${fmt.short(s.when)} · ${fmt.time(s.when)} · zamanlanmış</span></span></div>`).join('')}</div></section>
        <section class="card"><div class="card-head"><h2>Sayfa rolleri</h2></div>
          <div class="list" style="margin-top:6px">${[[me(), 'Yönetici', 'Tüm yetkiler'], [U('u5'), 'Editör', 'Gönderi ve takvim'], [U('u2'), 'Analist', 'Yalnızca istatistik']].map(([u, rl, d]) => `<div class="list-item">${avatar({ ...u, kind: 'user' }, 'md')}<span class="grow"><b>${esc(u.name)}</b><span>${d}</span></span><span class="badge ${rl === 'Yönetici' ? 'amber' : 'blue'}">${rl}</span></div>`).join('')}</div></section>`;
    }
    return {
      title: p.name,
      html: `
      <section class="card edge profile-head">
        ${media({ scene: p.scene }, 'profile-cover')}
        <div class="profile-info">
          ${avatar({ ...p, kind: 'page' }, 'xl')}
          <div class="grow"><h1>${esc(p.name)} ${verified(p.verified)}</h1><p class="muted small">${esc(p.category)} · ${num(p.followers)} takipçi</p><p class="small" style="margin-top:4px">${esc(p.desc)}</p></div>
          <div class="profile-actions">${own ? `<button class="btn btn-primary" data-action="compose">${icon('plus', 'ico-sm')}Gönderi</button>` : `<button class="btn ${p.following ? 'btn-success' : 'btn-primary'}" data-action="follow-page" data-id="${p.id}">${p.following ? icon('check', 'ico-sm') + 'Takip ediliyor' : 'Takip et'}</button><a class="btn" href="#/mesajlar">${icon('message', 'ico-sm')}Mesaj gönder</a>`}</div>
        </div>
        ${tabs([...(own ? [['istatistik', 'İstatistik & yönetim']] : []), ['gonderiler', 'Gönderiler'], ['hakkinda', 'Hakkında'], ['medya', 'Medya']], tab, base)}
      </section>
      ${body}`
    };
  };

  /* ---------- üyeler ve bağlantılar ---------- */
  V.uyeler = (r) => {
    const tab = r.q.get('tab') || 'gelen';
    const cn = state.connections;
    const who = (x) => x.kind === 'community' ? { ...C(x.id), kind: 'community', href: '#/topluluk/' + x.id } : { ...U(x.id), kind: 'user', href: '#/kisi/' + x.id };
    let body = '';
    if (tab === 'gelen') {
      body = cn.incoming.length ? `<section class="card"><div class="list">${cn.incoming.map((x, i) => { const w = who(x); return `<div class="list-item">${avatar(w, 'lg')}<a class="grow" href="${w.href}"><b>${esc(w.name)}</b><span>${esc(x.note || '')} · Ortak arkadaş: ${x.mutual}</span></a><div class="btn-row"><button class="btn btn-sm btn-primary" data-action="conn-accept" data-i="${i}">Onayla</button><button class="btn btn-sm" data-action="conn-decline" data-i="${i}">Sil</button></div></div>`; }).join('')}</div></section>` : `<div class="card">${empty('userPlus', 'Bekleyen istek yok', 'Yeni bağlantı istekleri burada görünür.')}</div>`;
    } else if (tab === 'gonderilen') {
      body = cn.sent.length ? `<section class="card"><div class="list">${cn.sent.map((x, i) => { const w = who(x); return `<div class="list-item">${avatar(w, 'lg')}<a class="grow" href="${w.href}"><b>${esc(w.name)}</b><span>İstek gönderildi · Ortak arkadaş: ${x.mutual}</span></a><div class="btn-row"><button class="btn btn-sm" data-action="conn-withdraw" data-i="${i}">İsteği geri çek</button></div></div>`; }).join('')}</div></section>` : `<div class="card">${empty('send', 'Gönderilmiş istek yok', 'Kişi önerilerinden bağlantı kurabilirsin.')}</div>`;
    } else if (tab === 'oneriler') {
      body = cn.suggestions.length ? `<div class="grid-cards">${cn.suggestions.map((s) => { const u = U(s.id); return `<article class="card card-pad stack" style="justify-items:center;text-align:center">${avatar({ ...u, kind: 'user' }, 'xl')}<div><b>${esc(u.name)}</b><p class="small muted">${esc(u.city)} · ${s.mutual} ortak bağlantı</p></div><div class="btn-row" style="width:100%"><button class="btn btn-sm btn-primary" style="flex:1" data-action="conn-add" data-id="${u.id}">${icon('userPlus', 'ico-sm')}Bağlantı kur</button><button class="btn btn-sm" data-action="conn-dismiss" data-id="${u.id}" aria-label="Öneriyi kaldır">${icon('x', 'ico-sm')}</button></div></article>`; }).join('')}</div>` : `<div class="card">${empty('users', 'Şimdilik öneri yok', 'Yeni gruplara katıldıkça öneriler gelir.')}</div>`;
    } else {
      const q = lower(UI.memberQ);
      const roleOf = (id) => { for (const c of Object.values(state.communities)) { if (c.admins.includes(id)) return ['Yönetici', 'amber', c.name]; } for (const c of Object.values(state.communities)) { if (c.moderators.includes(id)) return ['Moderatör', 'cyan', c.name]; } return ['Üye', '', '']; };
      const list = Object.values(state.users).filter((u) => !q || lower(u.name + ' ' + u.city).includes(q));
      body = `<section class="card"><div class="card-pad" style="padding-bottom:8px"><form class="top-search" style="max-width:none;margin:0" data-form="noop" role="search">${icon('search')}<input type="search" id="member-q" value="${esc(UI.memberQ)}" placeholder="Üyelerde ara…" aria-label="Üyelerde ara" autocomplete="off"></form></div>
        <div class="list" id="member-list">${list.map((u) => { const [rl, cls, where] = roleOf(u.id); const friend = cn.friends.includes(u.id); return `<div class="list-item">${avatar({ ...u, kind: 'user' }, 'md')}<a class="grow" href="${u.id === state.me ? '#/profil' : '#/kisi/' + u.id}"><b>${esc(u.name)}${u.id === state.me ? ' (sen)' : ''}</b><span>${esc(u.city)}${where ? ' · ' + esc(where) : ''}</span></a><div class="btn-row"><span class="badge ${cls}">${rl}</span>${friend ? '<span class="badge green">Bağlantı</span>' : ''}</div></div>`; }).join('') || '<div class="list-item muted">Sonuç yok.</div>'}</div></section>`;
    }
    return {
      title: 'Üyeler',
      html: `<div class="page-head"><div><h1>Üyeler ve bağlantılar</h1><p>İstek, onay ve takip durumları ayrı ayrı yönetilir.</p></div></div>
        <section class="card" style="overflow:hidden">${tabs([['gelen', `Gelen istekler${cn.incoming.length ? ' (' + cn.incoming.length + ')' : ''}`], ['gonderilen', 'Gönderilen istekler'], ['oneriler', 'Kişi önerileri'], ['liste', 'Üye listesi']], tab, '#/uyeler')}</section>
        ${body}`
    };
  };

  /* ---------- mesajlar ---------- */
  V.mesajlar = (r) => {
    const mobile = matchMedia('(max-width: 720px)').matches;
    const activeId = r.id || (mobile ? null : state.conversations[0]?.id);
    const conv = state.conversations.find((c) => c.id === activeId);
    if (conv && conv.unread) { conv.unread = 0; K.save(); }
    const convAvatar = (c, size) => c.kind === 'user' ? avatar({ ...U(c.with), kind: 'user' }, size) : avatar({ ...(C(c.community) || { name: c.title, hue: 2 }), kind: 'community' }, size);
    const last = (c) => c.messages[c.messages.length - 1];
    const preview = (m) => !m ? '' : (m.from === 'me' ? 'Sen: ' : '') + (m.img ? '📷 Fotoğraf' : m.file ? '📎 ' + m.file : m.text);
    return {
      title: 'Mesajlar', layout: 'wide',
      html: `<h1 class="sr-only">Mesajlar</h1>
      <section class="card chat ${r.id ? 'has-active' : ''}">
        <div class="chat-list">
          <div class="chat-list-head"><div class="row-between"><h2 style="font-size:18px">Sohbetler</h2><button class="icon-btn" data-action="new-chat" aria-label="Yeni sohbet">${icon('edit')}</button></div>
            <form class="top-search" style="max-width:none;margin:0;height:40px" data-form="noop" role="search">${icon('search', 'ico-sm')}<input type="search" id="chat-q" placeholder="Sohbetlerde ara" aria-label="Sohbetlerde ara"></form></div>
          <ul id="chat-items">${state.conversations.map((c) => `<li data-title="${esc(lower(c.title))}"><a class="chat-item" href="#/mesajlar/${c.id}" aria-current="${c.id === activeId}"><span class="${c.online ? 'online-dot' : ''}">${convAvatar(c, 'md')}</span><span class="grow"><b class="ellipsis">${esc(c.title)}</b><span class="ellipsis">${esc(preview(last(c)))}</span></span><span style="display:grid;justify-items:end;gap:4px"><span class="xs muted">${last(c) ? timeAgo(last(c).ts).replace(' önce', '') : ''}</span>${c.unread ? `<span class="unread">${c.unread}</span>` : ''}</span></a></li>`).join('')}</ul>
        </div>
        <div class="chat-pane">
          ${conv ? `
          <div class="chat-head">
            <a class="icon-btn only-mobile" href="#/mesajlar" aria-label="Sohbetlere dön">${icon('chevronLeft')}</a>
            <span class="${conv.online ? 'online-dot' : ''}">${convAvatar(conv, 'md')}</span>
            <div class="grow"><b class="ellipsis">${esc(conv.title)}</b><span class="${conv.online ? '' : 'muted'}" style="${conv.online ? '' : 'color:var(--muted)'}">${esc(conv.subtitle)}${conv.online ? ' · çevrimiçi' : ''}</span></div>
            <div class="menu-wrap"><button class="icon-btn" data-action="toggle-menu" data-menu="chm" aria-label="Sohbet seçenekleri" aria-haspopup="true" aria-expanded="false">${icon('more')}</button>
              <div class="popover" data-popover="chm" hidden><button data-action="mute-chat">${icon('volumeOff')}Sessize al</button><button data-action="report" data-kind="Sohbet" data-id="${conv.id}">${icon('flag')}Bildir</button>${conv.kind === 'user' ? `<button class="danger" data-action="block-user" data-name="${esc(conv.title)}">${icon('ban')}Engelle</button>` : ''}</div></div>
          </div>
          <div class="chat-body" id="chat-body" aria-live="polite">
            <span class="chat-day">Uçtan uca şifreli sohbet</span>
            ${conv.messages.map((m) => msgBubble(m, conv)).join('')}
          </div>
          <form class="chat-input" data-form="chat" data-id="${conv.id}">
            <label class="icon-btn" title="Görsel veya dosya ekle" style="cursor:pointer">${icon('clip')}<span class="sr-only">Görsel veya dosya ekle</span><input type="file" data-change="chat-file" data-id="${conv.id}" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" hidden></label>
            <label class="sr-only" for="chat-text">Mesaj yaz</label>
            <input class="input" id="chat-text" name="text" placeholder="Mesaj yaz…" autocomplete="off" maxlength="2000">
            <button class="btn btn-primary" aria-label="Gönder" style="width:44px;padding:0;border-radius:50%">${icon('send')}</button>
          </form>` : `<div class="chat-empty">${icon('message', 'ico-lg')}<b>Bir sohbet seç</b><span>Bire bir ve grup sohbetlerin burada.</span></div>`}
        </div>
      </section>`,
      after() { const b = document.getElementById('chat-body'); if (b) b.scrollTop = b.scrollHeight; }
    };
  };
  function msgBubble(m, conv) {
    const out = m.from === 'me';
    const u = !out && U(m.from);
    const showName = !out && conv.kind === 'group';
    const content = m.img ? `<img src="${esc(m.img)}" alt="Gönderilen görsel">` : m.file ? `<span class="msg-file">${icon('file')}${esc(m.file)}</span>` : esc(m.text);
    return `<div class="msg ${out ? 'out' : 'in'}">${showName ? `<span class="from">${esc(u.name)}</span>` : ''}${content}<small>${fmt.clock(m.ts)}</small></div>`;
  }
  V.msgBubble = msgBubble;

  /* ---------- bildirimler ---------- */
  const NT = { like: ['heart', 'var(--pink)', 'Beğeni'], comment: ['comment', 'var(--blue)', 'Yorum'], community: ['users', 'var(--green)', 'Topluluk'], event: ['calendar', 'var(--purple)', 'Etkinlik'], request: ['userPlus', 'var(--cyan)', 'Üyelik'], sponsor: ['gift', 'var(--amber)', 'Sponsor'] };
  V.bildirimler = () => {
    const f = UI.notifFilter;
    const s = state.notifSettings;
    let list = state.notifications.slice().sort((a, b) => b.ts - a.ts);
    if (f === 'unread') list = list.filter((n) => !n.read);
    else if (f === 'social') list = list.filter((n) => n.type === 'like' || n.type === 'comment');
    else if (f !== 'all') list = list.filter((n) => n.type === f);
    const toggles = Object.entries(NT).map(([k, [ic, , label]]) => `<div class="setting-row"><div class="row" style="gap:10px">${icon(ic)}<b>${label}</b></div><label class="switch"><input type="checkbox" data-change="notif-setting" data-key="${k}" ${s[k] ? 'checked' : ''} aria-label="${label} bildirimleri"><span></span></label></div>`).join('');
    return {
      title: 'Bildirimler',
      html: `<div class="page-head"><div><h1>Bildirimler</h1><p>Önemli gelişmeler tek yerde; yoğunluğu sen yönetirsin.</p></div><button class="btn" data-action="notif-read-all">${icon('check', 'ico-sm')}Tümünü okundu işaretle</button></div>
        ${chips([['all', 'Tümü'], ['unread', 'Okunmamış'], ['social', 'Beğeni & yorum'], ['community', 'Topluluk'], ['event', 'Etkinlik'], ['request', 'Üyelik'], ['sponsor', 'Sponsor']], f, 'notif-filter')}
        <section class="card" style="overflow:hidden">${list.length ? list.map((n) => { const [ic, col] = NT[n.type]; const who = n.who ? { ...U(n.who), kind: 'user' } : n.community ? { ...C(n.community), kind: 'community' } : { name: NT[n.type][2], hue: 1, kind: 'page' }; return `<button class="notif ${n.read ? '' : 'unread'}" data-action="notif-open" data-id="${n.id}"><span class="notif-ico">${avatar(who, 'md')}<span class="type" style="background:${col}">${icon(ic)}</span></span><span class="grow">${n.text}<span class="when">${timeAgo(n.ts)}</span></span>${n.read ? '' : '<span class="dot-unread" aria-label="Okunmadı"></span>'}</button>`; }).join('') : empty('bell', 'Bildirim yok', 'Bu filtrede gösterilecek bir şey kalmadı.')}</section>
        <section class="card card-pad only-narrow-settings">${notifSettingsHTML(toggles, s)}</section>`,
      rail: `<section class="card card-pad">${notifSettingsHTML(toggles, s)}</section>`
    };
  };
  function notifSettingsHTML(toggles, s) {
    return `<h2 style="font-size:16px;margin-bottom:4px">Bildirim ayarları</h2><p class="small muted" style="margin-bottom:8px">Türe göre sessize al, sıklığı belirle.</p>${toggles}
      <div class="setting-row"><div><b>Sıklık</b><span class="muted">Özet olarak da alabilirsin</span></div><select class="select" style="width:auto" data-change="notif-freq" aria-label="Bildirim sıklığı">${['Anında', 'Günlük özet', 'Haftalık özet'].map((x) => `<option ${s.frequency === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="setting-row"><div><b>Sessiz saatler</b><span class="muted">23:00 – 08:00 arası bildirim gönderme</span></div><label class="switch"><input type="checkbox" data-change="notif-quiet" ${s.quiet ? 'checked' : ''} aria-label="Sessiz saatler"><span></span></label></div>`;
  }

  /* ---------- medya arşivi ---------- */
  function galleryItems() {
    const fromPosts = [];
    state.posts.forEach((p) => p.media.forEach((m) => { if (p.community) fromPosts.push({ ...m, community: p.community, caption: (p.text || '').slice(0, 60), kind: m.video ? 'Video' : 'Fotoğraf' }); }));
    return [...fromPosts.filter((m) => m.src), ...state.gallery];
  }
  let galleryCache = [];
  function galleryTile(g, list) {
    galleryCache = list;
    const i = list.indexOf(g);
    return `<button class="tile" data-action="lightbox-gallery" data-i="${i}" aria-label="${esc(g.caption)} — büyüt">${media(g)}${g.kind === 'Video' ? `<span class="tile-badge">${icon('play', 'ico-sm')}</span>` : ''}<span class="tile-cap">${esc(g.caption)}</span></button>`;
  }
  V.galleryList = () => galleryCache;
  V.medya = () => {
    let items = galleryItems();
    if (UI.mediaComm !== 'all') items = items.filter((g) => g.community === UI.mediaComm);
    if (UI.mediaKind !== 'Tümü') items = items.filter((g) => g.kind === UI.mediaKind);
    const comms = Object.values(state.communities).filter((c) => c.joined || c.type === 'Herkese açık');
    return {
      title: 'Medya arşivi',
      html: `<div class="page-head"><div><h1>Medya arşivi ve galeri</h1><p>Toplulukların paylaştığı fotoğraf ve videolar tek arşivde.</p></div></div>
        <div class="row pad-x" style="flex-wrap:wrap;gap:8px">
          <label class="sr-only" for="media-comm">Topluluk</label>
          <select class="select" id="media-comm" data-change="media-comm" style="width:auto;flex:1;min-width:200px"><option value="all">Tüm topluluklar</option>${comms.map((c) => `<option value="${c.id}" ${UI.mediaComm === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
          <div class="seg" role="group" aria-label="Medya türü" style="flex:none">${['Tümü', 'Fotoğraf', 'Video'].map((k) => `<button data-action="media-kind" data-value="${k}" aria-pressed="${UI.mediaKind === k}">${k}</button>`).join('')}</div>
        </div>
        ${items.length ? `<div class="gallery">${items.map((g) => galleryTile(g, items)).join('')}</div>` : `<div class="card">${empty('image', 'Medya bulunamadı', 'Filtreleri değiştir.')}</div>`}
        <div class="callout pad-x">${icon('info')}<span>Görsellerde alternatif metin, videolarda altyazı desteği bulunur.</span></div>`
    };
  };

  /* ---------- profil ---------- */
  V.profil = (r) => V.kisi({ ...r, id: state.me });
  V.kisi = (r) => {
    const u = U(r.id);
    if (!u) return V.notfound();
    const self = u.id === state.me;
    const tab = r.q.get('tab') || 'gonderiler';
    const base = self ? '#/profil' : '#/kisi/' + u.id;
    const cn = state.connections;
    const friend = cn.friends.includes(u.id);
    const pending = cn.sent.some((x) => x.kind === 'user' && x.id === u.id);
    const myComms = Object.values(state.communities).filter((c) => self ? c.joined : (c.moderators.includes(u.id) || c.admins.includes(u.id)));
    const posts = state.posts.filter((p) => p.author.kind === 'user' && p.author.id === u.id);
    let body = '';
    if (tab === 'gonderiler') body = posts.length ? posts.map(postCard).join('') : `<div class="card">${empty('layers', 'Henüz gönderi yok', self ? 'İlk paylaşımını yap!' : 'Bu kişi henüz paylaşım yapmadı.', self ? `<button class="btn btn-primary" data-action="compose">Gönderi oluştur</button>` : '')}</div>`;
    else if (tab === 'hakkinda') body = `<section class="card card-pad stack"><h2 style="font-size:16px">Hakkında</h2><p>${esc(u.bio || '')}</p><div class="meta-line">${icon('pin')}${esc(u.city)}</div>${u.title ? `<div class="meta-line">${icon('shield')}${esc(u.title)}</div>` : ''}<div class="meta-line">${icon('clock')}${esc(u.joined || '2023')} yılından beri üye</div><h3 style="font-size:15px;margin-top:8px">Topluluklar</h3><div class="stack">${myComms.map((c) => `<a class="row" href="#/topluluk/${c.id}">${avatar({ ...c, kind: 'community' }, 'sm')}<b class="small">${esc(c.name)}</b></a>`).join('') || '<span class="muted small">—</span>'}</div>${self ? `<div class="callout">${icon('eye')}<span>Profil görünürlüğün: <b>${esc(state.privacy.visibility)}</b>. <a class="link" href="#/ayarlar">Değiştir</a></span></div>` : ''}</section>`;
    else if (tab === 'fotograflar') { const imgs = posts.flatMap((p) => p.media.map((m, i) => ({ m, p, i }))); body = imgs.length ? `<div class="gallery">${imgs.map(({ m, p, i }) => `<button class="tile" data-action="lightbox" data-post="${p.id}" data-i="${i}" aria-label="Görseli büyüt">${media(m)}</button>`).join('')}</div>` : `<div class="card">${empty('image', 'Fotoğraf yok', 'Paylaşılan fotoğraflar burada görünür.')}</div>`; }
    else if (tab === 'etkinlikler') { const evs = self ? state.events.filter((e) => e.attending || e.interested) : state.events.slice(0, 2); body = `<section class="card"><div class="list">${evs.map((e) => `<a class="event-row" href="#/etkinlik/${e.id}">${dateBlock(e.start)}<span class="grow"><b style="display:block">${esc(e.title)}</b><span class="small muted">${esc(e.location)}</span></span>${e.attending ? '<span class="badge green">Katılıyor</span>' : e.interested ? '<span class="badge blue">İlgileniyor</span>' : ''}</a>`).join('') || '<div class="list-item muted">Etkinlik yok.</div>'}</div></section>`; }
    return {
      title: u.name,
      html: `<section class="card edge profile-head">
        <div class="scene profile-cover" style="background:linear-gradient(120deg, rgba(67,126,245,.55), rgba(153,112,245,.45) 50%, rgba(64,205,220,.45))"></div>
        <div class="profile-info">
          ${avatar({ ...u, kind: 'user' }, 'xl')}
          <div class="grow"><h1>${esc(u.name)}</h1><p class="muted small">@${esc(u.handle)} · ${esc(u.city)} · ${posts.length} gönderi · ${self ? cn.friends.length : 12 + u.hue} bağlantı</p></div>
          <div class="profile-actions">${self ? `<button class="btn" data-action="edit-profile">${icon('edit', 'ico-sm')}Profili düzenle</button><a class="btn" href="#/ayarlar" aria-label="Gizlilik ayarları">${icon('lock', 'ico-sm')}Gizlilik</a>` : `${friend ? `<span class="btn btn-success">${icon('check', 'ico-sm')}Bağlantı</span>` : pending ? `<button class="btn" disabled>İstek gönderildi</button>` : `<button class="btn btn-primary" data-action="conn-add" data-id="${u.id}">${icon('userPlus', 'ico-sm')}Bağlantı kur</button>`}<button class="btn" data-action="dm" data-id="${u.id}">${icon('message', 'ico-sm')}Mesaj</button>
            <div class="menu-wrap"><button class="btn" data-action="toggle-menu" data-menu="um" aria-label="Diğer" aria-haspopup="true" aria-expanded="false">${icon('more')}</button><div class="popover" data-popover="um" hidden><button data-action="report" data-kind="Profil" data-id="${u.id}">${icon('flag')}Profili bildir</button><button class="danger" data-action="block-user" data-name="${esc(u.name)}">${icon('ban')}Engelle</button></div></div>`}</div>
        </div>
        ${tabs([['gonderiler', 'Gönderiler'], ['hakkinda', 'Hakkında'], ['fotograflar', 'Fotoğraflar'], ['etkinlikler', 'Etkinlikler']], tab, base)}
      </section>${body}`
    };
  };

  V.kaydedilenler = () => {
    const posts = state.posts.filter((p) => p.saved);
    return { title: 'Kaydedilenler', html: `<div class="page-head"><div><h1>Kaydedilenler</h1><p>Daha sonra dönmek için kaydettiğin gönderiler.</p></div></div>${posts.length ? posts.map(postCard).join('') : `<div class="card">${empty('bookmark', 'Kaydedilen gönderi yok', 'Gönderi menüsünden “Kaydet”i seçerek buraya ekleyebilirsin.')}</div>`}` };
  };

  /* ---------- ayarlar ---------- */
  function accountCard() {
    const A = window.Auth;
    const a = A.account();
    if (A.mode !== 'account' || !a) {
      return `<section class="card card-pad row-between" style="flex-wrap:wrap"><div class="row" style="gap:12px">${icon('user')}<div><b>Demo modundasın</b><p class="small muted">Değişiklikler hesapsız demo alanına kaydediliyor. Kendi hesabınla devam etmek için kayıt ol.</p></div></div><div class="btn-row"><a class="btn btn-sm" href="#/giris">Giriş yap</a><a class="btn btn-sm btn-primary" href="#/kayit">Kayıt ol</a></div></section>`;
    }
    const d = (ts) => ts ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(ts) : '—';
    const s = A.session();
    return `<section class="card card-pad stack">
      <div class="row-between" style="flex-wrap:wrap"><h2 style="font-size:16px">${icon('user')} Hesap</h2><span class="badge green">${icon('check', 'ico-sm')}Oturum açık${s && s.remember ? ' · hatırlanıyor' : ''}</span></div>
      <dl class="kv">
        <div><dt>Ad soyad</dt><dd>${esc(a.name)}</dd></div>
        <div><dt>Kullanıcı adı</dt><dd>@${esc(a.username)}</dd></div>
        <div><dt>E-posta</dt><dd>${esc(a.email)}</dd></div>
        <div><dt>Hesap türü</dt><dd>${esc(K.ROLES[a.role]?.label || '')}</dd></div>
        <div><dt>Kayıt tarihi</dt><dd>${d(a.created)}</dd></div>
        <div><dt>Önceki giriş</dt><dd>${d(a.prevLogin)}</dd></div>
      </dl>
      <p class="xs muted">${icon('lock', 'ico-sm')} Hesap kaydı ve verilerin yalnızca bu tarayıcıda saklanır. Şifre ${esc(a.algo)} özeti olarak tutulur.</p>
      <div class="btn-row"><button class="btn btn-sm" data-action="show-record">${icon('file', 'ico-sm')}Saklanan kaydı göster</button><button class="btn btn-sm" data-action="logout">${icon('logout', 'ico-sm')}Çıkış yap</button></div>
    </section>`;
  }
  V.ayarlar = () => {
    const pv = state.privacy;
    return {
      title: 'Ayarlar', layout: 'wide',
      html: `<div class="page-head"><div><h1>Gizlilik ve hesap ayarları</h1><p>Hangi bilginin kimlerce görüleceğini kolayca anla ve değiştir.</p></div></div>
      <div class="callout">${icon('shield')}<span><b>Varsayılan yaklaşım:</b> En az veri, açık rıza, anlaşılır seçenekler ve geri alınabilir tercihler.</span></div>
      ${accountCard()}
      <div class="split" style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));align-items:start">
        <div class="stack-lg">
          <section class="card card-pad stack"><h2 style="font-size:16px">${icon('eye')} Profil görünürlüğü</h2><p class="small muted">Profilini ve gönderilerini kimler görebilir?</p>
            <div class="radio-list" role="radiogroup" aria-label="Profil görünürlüğü">${[['Herkes', 'Platformdaki herkes'], ['Gruplar', 'Yalnızca ortak gruplardaki üyeler'], ['Sadece ben', 'Profilin gizli kalır']].map(([v, d]) => `<label class="radio-item"><input type="radio" name="vis" value="${v}" data-change="privacy-vis" ${pv.visibility === v ? 'checked' : ''}><span><b>${v}</b><br><span class="small muted">${d}</span></span></label>`).join('')}</div></section>
          <section class="card card-pad"><h2 style="font-size:16px;margin-bottom:6px">${icon('tag')} Etiketleme</h2>
            <div class="setting-row"><div><b>Etiketleri onayla</b><span class="muted">Etiketlendiğin gönderiler önce onayına gelsin</span></div><label class="switch"><input type="checkbox" data-change="privacy-toggle" data-key="tagApprove" ${pv.tagApprove ? 'checked' : ''} aria-label="Etiketleri onayla"><span></span></label></div>
            <div class="setting-row"><div><b>Zaman tünelinde göster</b><span class="muted">Onaylanan etiketler profilinde görünsün</span></div><label class="switch"><input type="checkbox" data-change="privacy-toggle" data-key="tagTimeline" ${pv.tagTimeline ? 'checked' : ''} aria-label="Etiketleri zaman tünelinde göster"><span></span></label></div></section>
          <section class="card card-pad stack"><h2 style="font-size:16px">${icon('ban')} Engelleme</h2><p class="small muted">Engellenen kişiler seni bulamaz, mesaj gönderemez.</p>
            <form class="row" data-form="block-add"><label class="sr-only" for="block-name">Engellenecek kullanıcı</label><input class="input" id="block-name" name="name" placeholder="Kullanıcı adı" required autocomplete="off"><button class="btn">Engelle</button></form>
            <div class="list">${pv.blocked.length ? pv.blocked.map((b, i) => `<div class="list-item" style="padding:10px 0;flex-wrap:nowrap"><span class="av av-sm" style="background:var(--surface-3);color:var(--muted)">${icon('ban', 'ico-sm')}</span><span class="grow"><b class="small">${esc(b)}</b></span><button class="btn btn-sm" data-action="unblock" data-i="${i}">Engeli kaldır</button></div>`).join('') : '<span class="small muted">Engellenen kimse yok.</span>'}</div></section>
        </div>
        <div class="stack-lg">
          <section class="card card-pad"><h2 style="font-size:16px;margin-bottom:6px">${icon('key')} Oturum güvenliği</h2>
            <div class="setting-row"><div><b>Şifre</b><span class="muted">Son değişiklik 3 ay önce</span></div><button class="btn btn-sm" data-action="change-password">Değiştir</button></div>
            <div class="setting-row"><div><b>İki aşamalı doğrulama</b><span class="muted">${pv.twoFactor ? 'Açık · doğrulama uygulaması' : 'Hesabını ekstra koruma altına al'}</span></div><label class="switch"><input type="checkbox" data-change="privacy-toggle" data-key="twoFactor" ${pv.twoFactor ? 'checked' : ''} aria-label="İki aşamalı doğrulama"><span></span></label></div>
            <h3 class="card-title" style="margin:14px 0 4px">Cihazlar</h3>
            ${state.devices.map((d) => `<div class="setting-row"><div class="row" style="gap:10px">${icon('devices')}<div><b>${esc(d.name)}</b><span class="muted">${esc(d.place)}</span></div></div>${d.current ? '<span class="badge green">Bu cihaz</span>' : `<button class="btn btn-sm" data-action="device-logout" data-id="${d.id}">Oturumu kapat</button>`}</div>`).join('')}</section>
          <section class="card card-pad"><h2 style="font-size:16px;margin-bottom:6px">${icon('download')} Veri kontrolleri</h2>
            <div class="setting-row"><div><b>Verilerini indir</b><span class="muted">Gönderi, mesaj ve profil bilgilerin (JSON)</span></div><button class="btn btn-sm" data-action="download-data">İndir</button></div>
            ${window.Auth.mode === 'account' && window.Auth.account() ? `<div class="setting-row"><div><b>Hesabını sil</b><span class="muted">Hesap kaydı ve tüm verilerin bu tarayıcıdan kalıcı olarak silinir</span></div><button class="btn btn-sm btn-danger" data-action="close-account">Hesabı sil</button></div>` : `<div class="setting-row"><div><b>Hesabını kapat</b><span class="muted">Demo modunda kapatılacak hesap yok</span></div><button class="btn btn-sm btn-danger" data-action="close-account">Hesabı kapat</button></div>`}</section>
          <section class="card card-pad"><h2 style="font-size:16px;margin-bottom:6px">${icon('sun')} Görünüm ve demo</h2>
            <div class="setting-row"><div><b>Koyu tema</b><span class="muted">Sistem ayarından bağımsız</span></div><label class="switch"><input type="checkbox" data-change="theme" ${state.theme === 'dark' ? 'checked' : ''} aria-label="Koyu tema"><span></span></label></div>
            <div class="setting-row"><div><b>Bildirim tercihleri</b><span class="muted">Tür, sıklık, sessiz saatler</span></div><a class="btn btn-sm" href="#/bildirimler">Aç</a></div>
            <div class="setting-row"><div><b>Demo verisini sıfırla</b><span class="muted">Tüm değişiklikler silinir</span></div><button class="btn btn-sm" data-action="reset-demo">${icon('refresh', 'ico-sm')}Sıfırla</button></div></section>
        </div>
      </div>`
    };
  };

  /* ---------- yönetim paneli ---------- */
  V.yonetim = (r) => {
    if (!K.isManager()) {
      return { title: 'Yönetim', html: `<div class="page-head"><div><h1>Yönetim paneli</h1><p>Moderatör ve topluluk yöneticilerine özel alan.</p></div></div><div class="card">${empty('shield', 'Bu alan için yetkin yok', 'Demoda rolünü değiştirerek paneli inceleyebilirsin.', `<div class="btn-row" style="justify-content:center"><button class="btn btn-primary" data-action="set-role" data-role="yonetici">Yönetici olarak gör</button><button class="btn" data-action="set-role" data-role="moderator">Moderatör olarak gör</button></div>`)}</div>` };
    }
    const admin = K.isAdmin();
    const tab = r.q.get('tab') || 'genel';
    const T = [['genel', 'Genel bakış'], ['moderasyon', 'Moderasyon'], ...(admin ? [['uyelik', 'Üyelik istekleri'], ['moderatorler', 'Moderatörler'], ['departmanlar', 'Departmanlar & konular']] : []), ['kayitlar', 'Denetim kayıtları']];
    const comm = C(UI.adminComm);
    const commSel = `<label class="sr-only" for="admin-comm">Topluluk</label><select class="select" id="admin-comm" data-change="admin-comm" style="width:auto">${K.MANAGED.map((id) => `<option value="${id}" ${UI.adminComm === id ? 'selected' : ''}>${esc(C(id).name)}</option>`).join('')}</select>`;
    let body = '';
    if (tab === 'genel') {
      const max = Math.max(...state.activity.map((a) => a.posts));
      const open = state.reports.filter((x) => x.status === 'Bekliyor').length;
      const top = state.posts.filter((p) => p.community && K.MANAGED.includes(p.community)).sort((a, b) => b.likes - a.likes).slice(0, 4);
      body = `<div class="stat-grid">
          <div class="card stat"><div class="label">Aktif kullanıcı</div><div class="value">${num(2184)}</div><div class="delta">▲ %9 bu hafta</div></div>
          <div class="card stat"><div class="label">7 / 30 gün geri dönüş</div><div class="value">%46 / %31</div><div class="delta">▲ 3 puan</div></div>
          <div class="card stat"><div class="label">Bugün gönderi · yorum</div><div class="value">${state.activity[6].posts} · ${state.activity[6].comments}</div><div class="delta">612 mesaj · ▲ %6</div></div>
          <div class="card stat"><div class="label">Şikâyet çözüm süresi</div><div class="value">3,2 sa</div><div class="delta">${open} açık şikâyet</div></div>
          <div class="card stat"><div class="label">Kullanıcı memnuniyeti</div><div class="value">4,6 / 5</div><div class="delta">▲ 0,2</div></div>
        </div>
        <section class="card card-pad stack">
          <div class="row-between"><h2 style="font-size:16px">Haftalık gönderi sayısı</h2><span class="small muted">Son 7 gün · tüm yönetilen topluluklar</span></div>
          <div class="bars" role="img" aria-label="Haftalık gönderi sayısı: ${state.activity.map((a) => a.d + ' ' + a.posts).join(', ')}">${state.activity.map((a) => `<div class="bar" tabindex="0" style="--h:${a.posts / max * 100}%"><span style="height:${a.posts / max * 100}%"></span><em class="tip" style="font-style:normal">${a.d}: ${a.posts} gönderi · ${a.comments} yorum</em></div>`).join('')}</div>
          <div class="bars-x" aria-hidden="true">${state.activity.map((a) => `<span>${a.d}</span>`).join('')}</div>
          <details class="small"><summary class="link" style="cursor:pointer">Tablo olarak göster</summary><div class="table-wrap"><table><thead><tr><th>Gün</th><th>Gönderi</th><th>Yorum</th></tr></thead><tbody>${state.activity.map((a) => `<tr><td>${a.d}</td><td>${a.posts}</td><td>${a.comments}</td></tr>`).join('')}</tbody></table></div></details>
        </section>
        <section class="card"><div class="card-head"><h2>İçerik performansı</h2><span class="small muted">En çok etkileşim alanlar</span></div>
          <div class="table-wrap" style="margin-top:8px"><table><thead><tr><th>Gönderi</th><th>Topluluk</th><th>Beğeni</th><th>Yorum</th><th>Paylaşım</th></tr></thead><tbody>${top.map((p) => `<tr><td style="max-width:260px"><a class="link ellipsis" style="display:block" href="#/topluluk/${p.community}">${esc((p.text || '').slice(0, 48))}…</a></td><td>${esc(C(p.community).name)}</td><td>${num(p.likes)}</td><td>${p.comments.length}</td><td>${p.shares}</td></tr>`).join('')}</tbody></table></div></section>`;
    } else if (tab === 'moderasyon') {
      let reps = state.reports.slice().sort((a, b) => ({ Yüksek: 0, Orta: 1, Düşük: 2 }[a.priority] - { Yüksek: 0, Orta: 1, Düşük: 2 }[b.priority]) || b.ts - a.ts);
      if (UI.modFilter === 'open') reps = reps.filter((x) => x.status === 'Bekliyor');
      if (UI.modFilter === 'done') reps = reps.filter((x) => x.status !== 'Bekliyor');
      const pc = { Yüksek: 'pink', Orta: 'amber', Düşük: '' };
      body = `${chips([['all', 'Tümü'], ['open', 'Bekleyen'], ['done', 'Sonuçlanan']], UI.modFilter, 'mod-filter')}
        <section class="card"><div class="card-head"><h2>Kural ihlali kuyruğu</h2><span class="small muted">Öncelik ve risk sınıflamasına göre</span></div>
          <div class="list" style="margin-top:6px">${reps.length ? reps.map((x) => `<div class="list-item" style="align-items:flex-start">
            <span class="av av-md sq" style="background:var(--${x.priority === 'Yüksek' ? 'danger' : x.priority === 'Orta' ? 'warning' : 'surface-3'}-soft, var(--surface-3));color:var(--text)">${icon('alert')}</span>
            <div class="grow stack" style="gap:4px"><div class="row" style="gap:6px;flex-wrap:wrap"><b>${esc(x.target)}</b><span class="badge ${pc[x.priority]}">${x.priority} öncelik</span><span class="badge">${esc(x.risk)}</span>${x.status !== 'Bekliyor' ? `<span class="badge green">${esc(x.status)}</span>` : ''}</div>
              <span class="small" style="color:var(--text-2)">${esc(x.preview)}</span><span class="xs muted">Bildiren: ${esc(U(x.reporter)?.name || 'Sen')} · ${timeAgo(x.ts)}</span></div>
            ${x.status === 'Bekliyor' ? `<div class="btn-row"><button class="btn btn-sm" data-action="mod-act" data-id="${x.id}" data-do="Uyarı verildi">Uyar</button><button class="btn btn-sm btn-danger" data-action="mod-act" data-id="${x.id}" data-do="Kaldırıldı">Kaldır</button><button class="btn btn-sm btn-ghost" data-action="mod-act" data-id="${x.id}" data-do="Reddedildi">Reddet</button></div>` : x.status !== 'İtiraz edildi' ? `<div class="btn-row"><button class="btn btn-sm btn-ghost" data-action="mod-act" data-id="${x.id}" data-do="İtiraz edildi">İtirazı işle</button></div>` : ''}
          </div>`).join('') : '<div class="list-item muted">Kuyruk boş 🎉</div>'}</div></section>
        <div class="grid-cards">
          <section class="card card-pad stack"><h3 class="card-title">Kullanıcı araçları</h3>${['Şikâyet et / bildir', 'Engelle ve sessize al', 'Yorumları gizle', 'İçeriği gizle'].map((x) => `<span class="row small">${icon('check', 'ico-sm')}${x}</span>`).join('')}</section>
          <section class="card card-pad stack"><h3 class="card-title">Topluluk kuralları</h3>${['Nefret ve taciz yasağı', 'Spam ve sahte hesap önleme', 'Telif ve kişisel veri koruması', 'Şeffaf yaptırım politikası'].map((x) => `<span class="row small">${icon('shield', 'ico-sm')}${x}</span>`).join('')}</section>
        </div>`;
    } else if (tab === 'uyelik') {
      const reqs = state.memberRequests;
      body = `<section class="card"><div class="card-head"><h2>Üyelik istekleri</h2><span class="small muted">Özel gruplar yönetici onayı ister</span></div><div class="list" style="margin-top:6px">${reqs.length ? reqs.map((x, i) => { const u = U(x.user); return `<div class="list-item">${avatar({ ...u, kind: 'user' }, 'md')}<a class="grow" href="#/kisi/${u.id}"><b>${esc(u.name)}</b><span>${esc(C(x.community).name)} · ${timeAgo(x.ts)}</span></a><div class="btn-row"><button class="btn btn-sm btn-primary" data-action="member-req" data-i="${i}" data-ok="1">Onayla</button><button class="btn btn-sm" data-action="member-req" data-i="${i}">Reddet</button></div></div>`; }).join('') : '<div class="list-item muted">Bekleyen istek yok.</div>'}</div></section>`;
    } else if (tab === 'moderatorler') {
      const mods = comm.moderators.map(U);
      const cands = Object.values(state.users).filter((u) => !comm.moderators.includes(u.id) && u.id !== state.me);
      body = `<div class="row pad-x">${commSel}</div>
        <section class="card"><div class="card-head"><h2>${esc(comm.name)} · ekip</h2></div><div class="list" style="margin-top:6px">${mods.map((u) => `<div class="list-item">${avatar({ ...u, kind: 'user' }, 'md')}<span class="grow"><b>${esc(u.name)}</b><span>${comm.admins.includes(u.id) ? 'Yönetici' : 'Moderatör'}</span></span><div class="btn-row">${comm.admins.includes(u.id) ? '<span class="badge amber">Yönetici</span>' : `<button class="btn btn-sm" data-action="mod-remove" data-id="${u.id}">Yetkiyi kaldır</button>`}</div></div>`).join('')}</div></section>
        <section class="card card-pad stack"><h2 style="font-size:16px">Moderatör ata</h2><form class="row" style="flex-wrap:wrap" data-form="assign-mod"><label class="sr-only" for="mod-user">Üye</label><select class="select grow" id="mod-user" name="user" style="min-width:200px">${cands.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select><button class="btn btn-primary">${icon('shield', 'ico-sm')}Moderatör yap</button></form></section>`;
    } else if (tab === 'departmanlar') {
      body = `<div class="row pad-x">${commSel}</div>
        ${comm.departments.map((dp, di) => `<section class="card"><div class="card-head"><h2>${icon('layers', 'ico-sm')} ${esc(dp.name)}</h2><span class="small muted">${dp.topics.length} konu</span></div>
          <div class="list" style="margin-top:6px">${dp.topics.map((t, ti) => `<div class="list-item" style="flex-wrap:nowrap"><span class="grow small">${icon('hash', 'ico-sm')} ${esc(t.t)}</span><span class="badge ${t.open ? 'green' : ''}">${t.open ? 'Açık' : 'Kapalı'}</span><button class="btn btn-sm" data-action="topic-toggle" data-d="${di}" data-t="${ti}">${t.open ? 'Konuyu kapat' : 'Konuyu aç'}</button></div>`).join('')}
          <form class="list-item" data-form="add-topic" data-d="${di}" style="flex-wrap:nowrap"><label class="sr-only" for="nt-${di}">Yeni konu</label><input class="input" id="nt-${di}" name="t" placeholder="Yeni konu başlığı" required autocomplete="off"><button class="btn btn-sm btn-soft">Konu aç</button></form></div></section>`).join('')}
        <section class="card card-pad stack"><h2 style="font-size:16px">Yeni departman</h2><form class="row" data-form="add-dept"><label class="sr-only" for="nd">Departman adı</label><input class="input" id="nd" name="name" placeholder="Örn. Sosyal medya ekibi" required autocomplete="off"><button class="btn btn-primary">Ekle</button></form></section>`;
    } else if (tab === 'kayitlar') {
      body = `<section class="card"><div class="card-head"><h2>Denetim kayıtları</h2><span class="small muted">Tüm moderasyon işlemleri izlenebilir</span></div><div class="list" style="margin-top:6px">${state.audit.slice().sort((a, b) => b.ts - a.ts).map((a) => `<div class="list-item">${avatar({ ...U(a.who), kind: 'user' }, 'sm')}<span class="grow"><b class="small">${esc(a.text)}</b><span>${esc(U(a.who).name)} · ${timeAgo(a.ts)}</span></span></div>`).join('')}</div></section>`;
    }
    return {
      title: 'Yönetim', layout: 'wide',
      html: `<div class="page-head"><div><h1>Yönetim paneli</h1><p>${admin ? 'Topluluk yöneticisi' : 'Topluluk moderatörü'} · ${K.MANAGED.map((id) => esc(C(id).name)).join(', ')}</p></div>${admin ? `<button class="btn btn-primary" data-action="compose" data-type="announcement">${icon('megaphone')}Duyuru yayınla</button>` : ''}</div>
        <section class="card" style="overflow:hidden">${tabs(T, tab, '#/yonetim')}</section>
        ${body}`
    };
  };

  /* ---------- SSS ---------- */
  // SSS artık tanıtım sayfasında; eski #/sss bağlantısı oradaki bölüme götürür
  V.sss = () => ({ ...V.hosgeldin(), title: 'Sık sorulan sorular', after: () => document.getElementById('sss')?.scrollIntoView() });

  V.notfound = () => ({ title: 'Bulunamadı', html: `<div class="card">${empty('compass', 'Sayfa bulunamadı', 'Aradığın içerik kaldırılmış ya da taşınmış olabilir.', '<a class="btn btn-primary" href="#/akis">Ana sayfaya dön</a>')}</div>` });

  window.Views = { V, UI, postCard, rail, joinButton, needCard, galleryItems, msgBubble };
})();
