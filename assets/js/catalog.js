/* Architage: loads assets/data/catalog.json and builds every page from it. */
(function () {
  'use strict';
  const DATA_URL = 'assets/data/catalog.json';
  const page = document.body.dataset.page;
  let C = null; // catalog

  // ---------- helpers ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = p => !p ? '' : (/^(https?:|data:|assets\/|\/)/.test(p) ? p : 'assets/img/' + p);
  const telHref = n => 'tel:' + String(n).replace(/[^\d+]/g, '');
  const wa = () => `https://wa.me/${C.Company.WhatsAppNumber}?text=${encodeURIComponent(C.Company.WhatsAppMessage || 'Enquiry')}`;
  const ext = 'target="_blank" rel="noopener"';
  const projUrl = id => 'project.html#' + encodeURIComponent(id);
  const proj = id => C.Portfolio.find(p => p.ProjectName === id);
  const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const initials = n => String(n || '').replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').split(/[\s&]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const statusTag = p => p.ProjectStatus === 'Handed Over' ? (p.HandedOver ? `Handed over ${p.HandedOver}` : 'Handed over') : p.ProjectStatus;
  const statusCls = p => p.ProjectStatus === 'Handed Over' ? 'built' : 'wip';
  const pos = p => p ? ` style="object-position:${esc(p)}"` : '';
  const svg = (d, w = 1.7) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    ph: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/>'),
    ig: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14.5 8.5l2 2"/>'),
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2A9.7 9.7 0 003.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1012 2.2zm0 17.7a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.8.9-.3.2-.5 0a6.6 6.6 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 00-.6.3 2.7 2.7 0 00-.9 2 4.6 4.6 0 001 2.5 10.6 10.6 0 004 3.6c1.5.6 2.1.7 2.9.6a2.4 2.4 0 001.6-1.1 2 2 0 00.1-1.1c-.1-.1-.2-.2-.4-.3z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="#C8800E"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>',
    outline: '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 38 L44 2.5 Q50 -1.5 56 2.5 L100 38 V94 Q100 100 94 100 H6 Q0 100 0 94 Z" fill="none" stroke="#C8800E" vector-effect="non-scaling-stroke" style="stroke-width:1.5px"/></svg>',
    check: '<svg class="ic" viewBox="0 0 56 56"><path d="M8 24 L28 8 L48 24 V46 H8 Z" fill="none" stroke="#3A5202" stroke-width="2"/><path d="M20 30 l6 6 l12 -12" fill="none" stroke="#C8800E" stroke-width="2.5"/></svg>',
    phone56: '<svg class="ic" viewBox="0 0 56 56"><rect x="16" y="6" width="24" height="44" rx="4" fill="none" stroke="#3A5202" stroke-width="2"/><circle cx="28" cy="22" r="6" fill="none" stroke="#C8800E" stroke-width="2.5"/></svg>',
    shield: '<svg class="ic" viewBox="0 0 56 56"><path d="M28 6 L46 13 V28 C46 39 38 46 28 50 C18 46 10 39 10 28 V13 Z" fill="none" stroke="#3A5202" stroke-width="2"/><path d="M21 28l5 5 9-10" fill="none" stroke="#C8800E" stroke-width="2.5"/></svg>'
  };
  const stars = n => `<span class="stars" aria-label="${n || 5} out of 5">${I.star.repeat(Math.max(1, Math.min(5, n || 5)))}</span>`;
  const NAV = [['Home', 'index.html', 'home'], ['Portfolio', 'portfolio.html', 'portfolio'], ['Services', 'services.html', 'services'], ['How we work', 'how-we-work.html', 'process'], ['About us', 'about.html', 'about']];
  const activeKey = page === 'project' ? 'portfolio' : page;

  // ---------- shared chrome ----------
  function header() {
    const co = C.Company, p1 = co.Phones[0], p2 = co.Phones[1];
    let links = '', dl = '';
    NAV.forEach(([n, h, k]) => {
      const on = k === activeKey, cur = on ? ' class="on" aria-current="page"' : '';
      if (k === 'services') {
        links += `<span class="dd"><a${cur} href="${h}" aria-haspopup="true">${n}<i class="car"></i></a><div class="ddm"><a class="cur" href="services.html">All services<small>${esc(C.Services.map(s => s.Name).slice(0, 3).join(', '))} and more</small></a><a href="services.html#packages">Packages<small>${esc(C.Packages.map(p => p.PackageName).join(', '))}</small></a></div></span>`;
      } else links += `<a${cur} href="${h}">${n}</a>`;
      dl += `<a href="${h}"${on ? ' class="on"' : ''}>${n}${on ? ' <small>You are here</small>' : ''}</a>`;
      if (k === 'services') dl += '<a class="sub" href="services.html#packages">Packages</a>';
    });
    const phones = co.Phones.map(p => `<a href="${telHref(p)}">${I.ph}${esc(p)}</a>`).join('');
    document.getElementById('site-header').innerHTML =
      `<div class="topbar"><div class="wrap"><span class="motto-sm">${esc(co.TopBarText)}</span>${phones}<a href="${esc(co.Instagram)}" ${ext}>${I.ig}${esc(co.InstagramHandle)}</a></div></div>
      <header class="site-head"><div class="wrap"><nav class="nav" aria-label="Main"><a class="brand" href="index.html" aria-label="${esc(co.Name)} home"><img src="assets/img/logo-t.png" alt="${esc(co.LegalName)}"></a>
      <div class="nav-links">${links}</div><a class="btn btn-primary btn-sm" href="${wa()}" ${ext}>Book a consultation</a>
      <button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="drawer"><i></i></button></nav></div></header>
      <div class="drawer" id="drawer" aria-hidden="true" role="dialog" aria-label="Menu"><div class="d-top"><img src="assets/img/logo-t.png" alt="${esc(co.Name)}"><button class="d-close" aria-label="Close menu">${I.close}</button></div>
      <nav aria-label="Mobile">${dl}<a href="contact.html"${page === 'contact' ? ' class="on"' : ''}>Contact${page === 'contact' ? ' <small>You are here</small>' : ''}</a></nav>
      <div class="d-acts"><div class="d-motto">${esc(co.BrandLine)}</div>${co.Phones.map(p => `<a class="d-row" href="${telHref(p)}">${I.ph}<span>${esc(p)}</span>Call</a>`).join('')}
      <div class="d-two"><a href="${wa()}" ${ext} style="background:#fff;color:#1E7E34">${I.wa}WhatsApp</a><a href="${esc(co.Instagram)}" ${ext} style="border:1px solid var(--line-lt)">${I.ig}Instagram</a></div></div></div>`;
  }
  function footer() {
    const co = C.Company, tl = co.Tagline.split(/(?<=\.)\s+/);
    document.getElementById('site-footer').innerHTML =
      `<footer class="foot"><div class="wrap"><div class="cols">
        <div><div class="motto">${tl.map(esc).join('<br>')}</div><div class="brandline">${esc(co.BrandLine)}</div><p style="color:rgba(237,239,230,.7);margin-top:16px;font-size:15px;max-width:300px">${esc(co.FooterDescription)}</p></div>
        <div><h4>Explore</h4><ul>${NAV.map(([n, h]) => `<li><a href="${h}">${n}</a></li>`).join('')}<li><a href="contact.html">Contact</a></li></ul></div>
        <div><h4>Talk to us</h4><ul>${co.Phones.map(p => `<li><a href="${telHref(p)}">${I.ph}${esc(p)}</a></li>`).join('')}<li><a href="${wa()}" ${ext}>${I.wa}WhatsApp us</a></li><li><a href="${esc(co.Instagram)}" ${ext}>${I.ig}${esc(co.Instagram.replace(/^https?:\/\/(www\.)?/, ''))}</a></li>${co.Email ? `<li><a href="mailto:${esc(co.Email)}">${esc(co.Email)}</a></li>` : ''}</ul></div>
        <div class="start"><h4>Start your home</h4><p>Tell us about your plot and we will call you back within one working day.</p><a class="btn btn-teak btn-sm" href="${wa()}" ${ext}>Book a consultation</a></div>
      </div><div class="base"><span>© <span class="yr-now">${new Date().getFullYear()}</span> ${esc(co.LegalName)}</span><span><a href="privacy.html">Privacy policy</a> &nbsp;&nbsp; <a href="terms.html">Terms of use</a></span></div></div></footer>
      <div class="mbar"><a class="btn btn-primary" href="${wa()}" ${ext}>${page === 'project' ? 'Plan a home like this' : 'Book a consultation'}</a><a class="btn wa btn-ghost" href="${wa()}" ${ext} aria-label="WhatsApp" style="color:#1E7E34">${I.wa}</a></div>
      <a class="wa-float" href="${wa()}" ${ext} aria-label="Chat with us on WhatsApp" style="color:#fff">${I.wa}</a>`;
  }
  // Fill [data-c="Field"] and [data-c="Phones.0"] placeholders in static pages
  function bindCompany(root) {
    root.querySelectorAll('[data-c]').forEach(el => {
      const v = el.dataset.c.split('.').reduce((o, k) => o == null ? o : o[k], C.Company);
      if (v != null) el.textContent = v;
    });
    root.querySelectorAll('[data-wa]').forEach(a => { a.href = wa(); a.target = '_blank'; a.rel = 'noopener'; });
  }

  // ---------- pages ----------
  const R = {};

  R.home = () => {
    const co = C.Company, h = C.Home_Hero, S = C.Home_PageSliders;
    const tl = co.Tagline.split(/(?<=\.)\s+/);
    const brand = co.BrandLine.split('|').map(s => `<span>${esc(s.trim())}</span>`).join('<b>|</b>');
    const steps = h.Steps.map((s, i) => i === h.Steps.length - 1 ? `<span class="key">${I.key}${esc(s)}</span>` : `<span>${esc(s)}</span><i></i>`).join('');
    const slides = S.map((s, i) => `<img src="${img(s.ImageName)}" alt="${esc(s.Name)}, ${esc(s.Description)}" data-name="${esc(s.Name)}" data-desc="${esc(s.Description)}" data-href="${s.ProjectName ? projUrl(s.ProjectName) : 'portfolio.html'}"${pos(s.ImagePosition)}${i === 0 ? ' class="on"' : ' loading="lazy"'}>`).join('');
    const thumbs = S.map(s => `<button aria-label="Show ${esc(s.Name)}"><img src="${img(s.ImageName)}" alt=""></button>`).join('');
    const s0 = S[0] || {};
    const stats = C.Home_Stats.map(s => {
      const m = String(s.Title).match(/^(\d+)(\+?)(.*)$/);
      const t = m ? `<span data-count="${m[1]}" data-suffix="${m[2]}">${m[1]}${m[2]}</span>${esc(m[3])}` : esc(s.Title);
      return `<div><strong>${t}</strong>${esc(s.Description)}</div>`;
    }).join('');
    const J = C.Home_Journey;
    const journey = J.map((j, i) => i === J.length - 1 ? `<li class="end"><span class="n">${I.key}</span><h4>${esc(j.Name)}</h4><p>${esc(j.Description)}</p></li>` : `<li><span class="n">${i + 1}</span><h4>${esc(j.Name)}</h4><p>${esc(j.Description)}</p></li>`).join('');
    const sp = C.Home_SignatureProject, sig = proj(sp.ProjectName) || C.Portfolio[0];
    const svc = C.Services.map((s, i) => `<a class="svc-row${i === 0 ? ' open' : ''}" href="services.html#${esc(s.Id)}"><h3>${esc(s.Name)}</h3><p>${esc(s.Summary)}</p><span>Explore ${esc(s.Name.toLowerCase())}</span></a>`).join('');
    const feat = C.Home_FeaturedProjects.map(proj).filter(Boolean).map(p => `<a class="home-card" href="${projUrl(p.ProjectName)}"><div class="ph zoom"><img class="cover" src="${img(p.ImageUrl)}" alt="${esc(p.Title)}"${pos(p.ImagePosition)} loading="lazy"></div><h3>${esc(p.Title)}</h3><div class="meta"><span>${esc(p.Location)}</span><span>${esc(p.BuiltUpArea)}</span><span>${esc(p.Category)}</span></div></a>`).join('');
    const L = C.Home_Lineage;
    const fr = C.Reviews.find(r => r.IsFeatured) || C.Reviews[0];
    const others = C.Reviews.filter(r => r !== fr);
    const rcards = others.map(r => `<div class="rv">${stars(r.Rating)}<p>“${esc(r.Quote)}”</p><div class="who"><span class="av">${esc(initials(r.Name))}</span><div><b>${esc(r.Name)}</b><small>${esc(r.Project)}</small></div>${r.IsSample ? '<span class="smp">Sample review</span>' : ''}</div></div>`).join('');
    const ndots = Math.max(1, Math.ceil(others.length / 4));
    return `<div class="wrap">
  <section class="hero"><div class="hero-in">
      <h1>${tl.map(esc).join('<br>')}</h1>
      <div class="tah"><i></i>${brand}<i></i></div>
      <p class="lede">${esc(h.Description)}</p>
      <div class="ctas"><a class="btn btn-primary" href="${wa()}" ${ext}>Book a design consultation</a><a class="btn btn-ghost" href="portfolio.html">See our portfolio</a></div>
      <div class="e2e">${steps}</div><div class="since"><span class="rule"></span><span>Formerly <b>${esc(co.FormerName)}</b>. Building since ${esc(co.Since)}.</span></div>
    </div>
    <div class="hero-art"><div class="outline">${I.outline}</div><div class="gable"><div class="slides">${slides}</div></div>
      <a class="chip" href="${s0.ProjectName ? projUrl(s0.ProjectName) : 'portfolio.html'}"><small class="chip-d">${esc(s0.Description)}</small><strong class="chip-n">${esc(s0.Name)}</strong></a><div class="thumbs">${thumbs}</div></div>
  </section>
  <div class="facts">${stats}</div>
</div>
<div class="wrap"><section class="journey"><div class="j-head"><h2>We take care of everything, from the first sketch to handing over the keys</h2><p>No juggling architects, contractors and interior designers. One ${esc(co.Name)} team, one contract and one project lead, from start to finish.</p></div><ol class="track">${journey}</ol></section></div>
<section class="sig"><div class="wrap">
  <div class="img rvi"><img class="cover" src="${img(sig.ImageUrl)}" alt="${esc(sig.Title)}"${pos(sig.ImagePosition)}></div>
  <div><div class="kicker">Signature project</div><h2>${esc(sp.Heading || sig.Title)}</h2><p>${esc(sp.Description || sig.ShortDescription)}</p>
    <dl><div><dt>Location</dt><dd>${esc(sig.Location)}</dd></div><div><dt>Built-up area</dt><dd>${esc(sig.BuiltUpArea)}</dd></div><div><dt>Style</dt><dd>${esc(sig.Style)}</dd></div><div><dt>${sig.ProjectStatus === 'Handed Over' ? 'Handed over' : 'Status'}</dt><dd>${esc(sig.ProjectStatus === 'Handed Over' ? (sig.HandedOver || 'Yes') : sig.ProjectStatus)}</dd></div></dl>
    <a class="btn btn-ghost" href="${projUrl(sig.ProjectName)}">Read the full story</a></div>
</div></section>
<div class="wrap">
  <section class="sec"><div class="sec-head"><h2>Everything your home needs, under one roof</h2><p>Hire us for one part or the whole journey. Either way, one project lead stays with you from start to finish.</p></div><div class="svc">${svc}</div></section>
  <section class="sec"><div class="sec-head"><h2>Homes we have built</h2><a class="btn btn-ghost btn-sm" style="color:var(--green)" href="portfolio.html">View all ${esc(co.HomesDelivered)} homes</a></div><div class="homes">${feat}</div></section>
</div>
<section class="lineage"><div class="wrap">
  <div><div class="years"><div><div class="yr">${esc(L.FromYear)}</div><div class="yr-label">${esc(co.FormerName)}</div></div><div class="arrow"></div><div><div class="yr now">${esc(L.ToYear)}</div><div class="yr-label">${esc(co.LegalName)}</div></div></div></div>
  <div><h2>${esc(L.Heading)}</h2>${L.Paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</div>
</div></section>
<div class="wrap">
  <section class="reviews" data-carousel>
    <div class="rv-head"><div><h2>In the words of our homeowners</h2><p>Families across India and abroad on what it was like to build with us.</p></div><div class="arrows"><button class="c-prev" aria-label="Previous reviews">‹</button><button class="c-next on" aria-label="Next reviews">›</button></div></div>
    <div class="rv-grid">
      <div class="feat"><div class="ph"><img class="cover" src="${img(fr.ImageUrl || (proj(fr.ProjectName) || {}).ImageUrl || (C.Portfolio[0] || {}).ImageUrl)}" alt="">${fr.ProjectName ? `<a class="play" href="${projUrl(fr.ProjectName)}">${I.play}See their home</a>` : ''}</div>
        <div class="fq">${stars(fr.Rating)}<blockquote>“${esc(fr.Quote)}”</blockquote><cite><b>${esc(fr.Name)}</b>${esc(fr.Project)}</cite></div></div>
      <div class="rv-cards c-track" tabindex="0" aria-label="Reviews">${rcards}</div>
    </div>
    <div class="rv-dots c-dots">${'<i></i>'.repeat(ndots).replace('<i>', '<i class="on">')}</div>
  </section>
  <section class="cta"><div class="txt"><h2>Tell us about your plot</h2><p>Share your location, plot size and budget. An architect will call you within one working day, in English or Malayalam.</p><div class="row"><a class="btn btn-teak" href="${wa()}" ${ext}>Book a design consultation</a><a class="btn btn-ghost" href="${wa()}" ${ext}>Chat on WhatsApp</a></div></div>
    <div class="ph"><img class="cover" src="${img((S[1] || S[0]).ImageName)}" alt=""${pos((S[1] || S[0]).ImagePosition)} loading="lazy"></div></section>
</div>`;
  };

  R.portfolio = () => {
    const P = C.Portfolio, cats = [...new Set(P.map(p => p.Category))], dists = [...new Set(P.map(p => p.District || p.Location))].sort(), stats = [...new Set(P.map(p => p.ProjectStatus))];
    const chips = `<button class="chip fchip on" data-f="all">All <span class="c">${P.length}</span></button>` + cats.map(c => `<button class="chip fchip" data-f="${slug(c)}">${esc(c)} <span class="c">${P.filter(p => p.Category === c).length}</span></button>`).join('');
    const cards = P.map(p => `<a class="pcard card" href="${projUrl(p.ProjectName)}" data-style="${slug(p.Category)}" data-district="${esc(p.District || p.Location)}" data-status="${slug(p.ProjectStatus)}">
      <div class="ph zoom"><img class="cover" src="${img(p.ImageUrl)}" alt="${esc(p.Title)}"${pos(p.ImagePosition)} loading="lazy"><span class="tag ${statusCls(p)}">${esc(statusTag(p))}</span></div>
      <div class="ci"><h3>${esc(p.Title)}</h3><div class="meta"><span>${esc(p.Location)}</span><span>${esc(p.BuiltUpArea)}</span><span>${esc(p.Category)}</span></div><span class="more">View home</span></div></a>`).join('');
    return `<div class="wrap">
  <header class="head"><h1>Our portfolio</h1><p>A selection from our ${esc(C.Company.HomesDelivered)} homes across India. Filter by style, district or status to find a home like the one you have in mind.</p></header>
  <div class="filters" role="group" aria-label="Filter homes">${chips}<span class="sep"></span>
    <label class="sel"><select id="fdistrict" aria-label="District"><option value="">All districts</option>${dists.map(d => `<option>${esc(d)}</option>`).join('')}</select></label>
    <label class="sel"><select id="fstatus" aria-label="Status"><option value="">Any status</option>${stats.map(s => `<option value="${slug(s)}">${esc(s)}</option>`).join('')}</select></label>
    <div class="view"><button class="vbtn on" data-v="grid" aria-pressed="true">Gallery</button><button class="vbtn" data-v="list" aria-pressed="false">List</button></div></div>
  <div class="result"><span>Showing <b id="pcount">${P.length} homes</b></span><span>Newest first</span></div>
  <div class="pgrid" id="pgrid">${cards}</div>
  <div class="empty" id="pempty" hidden><p>No homes match these filters.</p><button class="btn btn-ghost btn-sm" id="freset" style="color:var(--green)">Clear filters</button></div>
  <div class="band" style="margin:72px 0 110px"><div><h3>Seen a home you like? We can plan one like it for your plot.</h3><p>Share the home name and your plot details. We reply within one working day.</p></div><a class="btn btn-teak" href="${wa()}" ${ext}>Plan a home like this</a></div>
</div>`;
  };

  R.project = () => {
    const id = decodeURIComponent(location.hash.slice(1)), P = C.Portfolio, i = P.findIndex(p => p.ProjectName === id);
    if (i < 0) return null; // -> not found
    const p = P[i], prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    const imgs = (p.Images && p.Images.length ? p.Images : [p.ImageUrl]).map(img);
    const rest = imgs.slice(1);
    const cmp = (p.ComparisonImages || []).map(img), c1 = cmp[0] || imgs[0], c2 = cmp[1] || imgs[0];
    const same = c1 === c2;
    document.title = `${p.Title}, ${p.Location} | ${C.Company.Name}`;
    const facts = [['Location', p.Location], ['Plot', p.Plot], ['Built-up area', p.BuiltUpArea], ['Bedrooms', p.Bedrooms], ['Style', p.Style], ['Services', p.Services], ['Build time', p.BuiltTime], p.ProjectStatus === 'Handed Over' && p.HandedOver ? ['Handed over', p.HandedOver] : ['Status', p.ProjectStatus]].filter(f => f[1] != null && f[1] !== '' && !/^not specified$/i.test(String(f[1]).trim()));
    const T = p.Testimonial || {};
    return `<div class="wrap">
  <div class="crumb"><a href="portfolio.html">Portfolio</a> / <a href="portfolio.html#${slug(p.Category)}">${esc(p.Category)}</a> / ${esc(p.Title)}</div>
  <div class="title"><div class="hero-in"><h1>${esc(p.Title)}</h1><p>${esc(p.ShortDescription)}</p></div><span class="tag ${statusCls(p)}">${esc(statusTag(p))}</span></div>
  <div class="hero-img"><img class="cover" src="${imgs[0]}" alt="${esc(p.Title)}, ${esc(p.Location)}"${pos(p.ImagePosition)}><button data-lb="${imgs[0]}" aria-label="${esc(p.Title)} photo 1">View all ${imgs.length} photos</button></div>
  <div class="body">
    <div class="story">
      <div class="part"><div class="lbl">The brief</div><div><h2>${esc(p.BriefTitle)}</h2><p>${esc(p.BriefDescription)}</p></div></div>
      <div class="part"><div class="lbl">Our response</div><div><h2>${esc(p.OurResponseTitle)}</h2><p>${esc(p.OurResponseDescription)}</p></div></div>
      <div class="part"><div class="lbl">The result</div><div><h2>${esc(p.ResultTitle)}</h2><p>${esc(p.ResultDescription)}</p></div></div>
    </div>
    <aside class="facts"><div class="box"><dl>${facts.map(f => `<div><dt>${f[0]}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>
      <a class="btn btn-primary" href="${wa()}" ${ext}>Plan a home like this</a><a class="wa" href="${wa()}" ${ext}>Ask about this home on WhatsApp</a></div></aside>
  </div>
  ${rest.length ? `<div class="pair">${rest.slice(0, 3).map((g, k) => `<a href="${g}" data-lb="${g}" aria-label="${esc(p.Title)} photo ${k + 2}"><img class="cover" src="${g}" alt="" loading="lazy"></a>`).join('')}</div><p class="cap">Tap a photo to see it larger.</p>` : ''}
  ${cmp.length >= 2 ? (() => { const reno = /renovat|restor/i.test(p.Category || ''), L = reno ? 'Before' : '3D design', R = reno ? 'After' : 'Built';
    return `<div class="ba"><img src="${c2}" alt="${R}"><div class="ba-l"><img src="${c1}" alt="${L}"></div><div class="ba-h"><span>Drag</span></div><span class="lab" style="left:24px">${L}</span><span class="lab" style="right:24px">${R}</span><input type="range" min="0" max="100" value="50" aria-label="Compare ${L.toLowerCase()} with ${R.toLowerCase()}"></div>
  <p class="cap">${reno ? 'Drag to compare the home before and after our work.' : 'Drag to compare the approved 3D view with the finished home.'}</p>`; })() : ''}
</div>
${T.Quote ? `<section class="quote"><div class="wrap"><div><blockquote>“${esc(T.Quote)}”</blockquote><cite>${esc(T.Name)}, homeowners</cite></div><div class="ph gable"><img class="cover" src="${rest[0] || imgs[0]}" alt=""></div></div></section>` : ''}
<div class="wrap"><div class="next"><a href="${projUrl(prev.ProjectName)}"><small>Previous home</small><strong>${esc(prev.Title)}</strong></a><a href="${projUrl(next.ProjectName)}" style="text-align:right"><small>Next home</small><strong>${esc(next.Title)}</strong></a></div></div>
<div class="lb" id="lb" role="dialog" aria-label="Photo viewer"><img src="" alt=""><button class="x" aria-label="Close">×</button><button class="pv" aria-label="Previous photo">‹</button><button class="nx" aria-label="Next photo">›</button><span class="cnt"></span></div>`;
  };

  R.services = () => {
    const S = C.Services, pi = C.Packages_Intro || {};
    const jump = S.map((s, i) => `<a${i === 0 ? ' class="on"' : ''} href="#${esc(s.Id)}">${esc(s.Name)}</a>`).join('') + '<a class="pk" href="#packages">Packages</a>';
    const secs = S.map((s, i) => {
      const btn = s.ButtonUrl ? `<a class="btn btn-primary" href="${esc(s.ButtonUrl)}">${esc(s.ButtonLabel)}</a>` : `<a class="btn btn-primary" href="${wa()}" ${ext}>${esc(s.ButtonLabel || 'Book a consultation')}</a>`;
      return `<section class="svc${i % 2 ? ' flip' : ''}" id="${esc(s.Id)}">
    <div class="ph${i % 4 === 0 ? ' gable' : ''} zoom"><img class="cover" src="${img(s.ImageUrl)}" alt="${esc(s.Name)}"${pos(s.ImagePosition)} loading="lazy"></div>
    <div><h2>${esc(s.Name)}</h2><p class="what">${esc(s.Description)}</p>
      <ul class="inc">${(s.KeyPoints || []).map(k => `<li>${esc(k)}</li>`).join('')}</ul>
      <div class="meta">${(s.Timelines || []).map(t => `<div>${esc(t.Name)}<b>${esc(t.Timeline)}</b></div>`).join('')}</div>
      <div class="links">${btn}${s.LinkLabel ? `<a class="t" href="${esc(s.LinkUrl || 'portfolio.html')}">${esc(s.LinkLabel)}</a>` : ''}</div></div></section>`;
    }).join('');
    const tiers = C.Packages.map(p => `<div class="tier${p.IsMostChosen ? ' pick' : ''}">${p.IsMostChosen ? '<span class="badge">Most chosen</span>' : ''}<h3>${esc(p.PackageName)}</h3><div class="for">${esc(p.Tagline)}</div><ul>${p.Features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      <a class="btn ${p.IsMostChosen ? 'btn-teak' : 'btn-ghost'}"${p.IsMostChosen ? '' : ' style="color:var(--green)"'} href="${wa()}" ${ext}>Ask about ${esc(p.PackageName)}</a></div>`).join('');
    const combo = (C.ServiceCombinations || []).map((c, i) => `<div${i === 0 ? ' class="hl"' : ''}><div><b>${esc(c.Name)}</b><small>${esc(c.Description)}</small></div><span>${esc(c.Badge)}</span></div>`).join('');
    const faq = C.CommonQuestions.map((q, i) => `<div class="acc-i${i === 0 ? ' open' : ''}"><button class="acc-b" aria-expanded="${i === 0}">${esc(q.QuestionTitle)}<span class="pm"></span></button><div class="acc-p"><div><p>${esc(q.Answer)}</p></div></div></div>`).join('');
    return `<div class="wrap">
  <header class="head"><h1>Services &amp; packages</h1><p>Choose a single service or the full journey from first sketch to handing over the keys. Every project gets one project lead who answers your calls.</p></header>
  <div class="jump">${jump}</div>
  ${secs}
  <section class="pkg" id="packages">
    <div class="pk-head"><div><h2>Packages</h2><p>${esc(pi.Description)}</p></div>${pi.AllInclude ? `<div class="pk-note">All packages include<b>${esc(pi.AllInclude)}</b></div>` : ''}</div>
    <div class="tiers" style="--n:${Math.min(C.Packages.length, 3)}">${tiers}</div>
    <div class="pk-foot"><span>Not sure which package suits you? An architect will help you choose on your first call.</span><a class="btn btn-primary btn-sm" href="${wa()}" ${ext}>Book a consultation</a></div>
  </section>
</div>
${combo ? `<section class="together"><div class="wrap"><div><h2>Not sure what you need?</h2><p>Most families choose design and build together. One team handles everything, so nothing falls between an architect and a contractor.</p><a class="btn btn-teak" href="${wa()}" ${ext}>Talk to an architect</a></div><div class="combo">${combo}</div></div></section>` : ''}
<div class="wrap"><section class="faq"><h2>Common questions</h2><div class="acc">${faq}</div></section></div>`;
  };

  R.process = () => {
    const H = C.HowWeWork, n = H.Stages.length;
    let cum = 0;
    const plan = H.PaymentPlan.map(p => { cum += Number(p.Percentage) || 0; return `<div class="prow"><span>${esc(p.Name)}</span><b>${esc(p.Percentage)}%</b><div class="bar"><i style="width:${Math.min(cum, 100)}%"></i></div></div>`; }).join('');
    const icons = [I.check, I.phone56, I.shield];
    return `<div class="wrap">
  <header class="head"><h1>From first visit to house-warming</h1><p>${n} stages, each with a clear outcome, a set time and a payment that only falls due when the stage is done.</p></header>
  <div class="sum">${H.Summary.map(s => `<div><b>${esc(s.Title)}</b><span>${esc(s.Description)}</span></div>`).join('')}</div>
  <div class="stages">${H.Stages.map((s, i) => `<div class="st"${i === n - 1 ? ' style="padding-bottom:0"' : ''}><div class="n">${i + 1}</div><div><h2>${esc(s.Name)}</h2><div class="when">${esc(s.Duration)}</div><p>${esc(s.Description)}</p>${s.ImageUrl ? `<div class="ph zoom rvi"><img class="cover" src="${img(s.ImageUrl)}" alt="" loading="lazy"></div>` : ''}</div>
      <div class="get"><h4>You receive</h4><ul>${s.YouReceive.map(y => `<li>${esc(y)}</li>`).join('')}</ul><div class="pay"><span>Payment</span><b>${esc(s.Payment)}</b></div></div></div>`).join('')}</div>
</div>
<section class="pays" style="margin-top:112px"><div class="wrap"><div><h2>You pay as your home rises</h2><p>No large advance. Each payment is linked to a stage you can see finished, with photos and a quality report.</p></div><div class="ptable">${plan}</div></div></section>
<div class="wrap"><section class="promise">${H.Promises.map((p, i) => `<div>${icons[i % 3]}<h3>${esc(p.Title)}</h3><p>${esc(p.Description)}</p></div>`).join('')}</section></div>
<div class="wrap"><section class="cta-b"><div><h2>Start with a free site visit</h2><p>An architect visits your plot, listens to your family and gives you a budget range.</p></div><a class="btn btn-teak" href="${wa()}" ${ext}>Book a site visit</a></section></div>`;
  };

  const mapSrc = co => { const e = String(co.GoogleMapsEmbed || '').trim(); const m = e.match(/src=["']([^"']+)["']/); const u = m ? m[1] : e; if (/^https:\/\/(www\.|maps\.)?google\.[a-z.]+\/maps(\/embed|\?.*output=embed)/.test(u)) return u; return co.Address ? 'https://www.google.com/maps?q=' + encodeURIComponent(co.Address) + '&output=embed' : ''; };
  const mapLink = co => co.GoogleMapsLink || (co.Address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(co.Address) : '');
  const canFrame = () => !/claude|anthropic/.test(location.hostname);
  const mapBox = (co, cls) => { const src = mapSrc(co), link = mapLink(co); if (!src && !link) return ''; return `<div class="${cls} gmap">${src && canFrame() ? `<iframe src="${esc(src)}" title="${esc(co.Name)} studio on Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>` : '<span class="pin"></span>'}${link ? `<a class="mlab" href="${esc(link)}" ${ext}>Get directions on Google Maps</a>` : ''}</div>`; };

  R.about = () => {
    const A = Object.assign({}, C.About), co = C.Company, T = A.Timeline;
    // accept older catalog shapes: About.Founder (single) and About.Team (plain list)
    if (!A.Founders && A.Founder && A.Founder.Name) A.Founders = [{ Name: A.Founder.Name, Role: A.Founder.Role, Bio: A.Founder.Quote ? [A.Founder.Quote] : [], ImageUrl: A.Founder.ImageUrl }];
    if (Array.isArray(A.Team)) A.Team = { Heading: 'Our team', Members: A.Team.filter(m => m && (m.Name || m.Role) && m.Name !== 'Team member') };
    return `<div class="wrap"><section class="hero"><div><h1>${esc(A.Heading)}</h1><p>${esc(A.Description)}</p></div><div class="ph gable hero-in"><img class="cover" src="${img(A.ImageUrl)}" alt=""></div></section></div>
<section class="mark"><div class="wrap"><div class="logo"><img src="assets/img/logo-t.png" alt="${esc(co.Name)} logo"></div><div><h2>The story in our logo</h2><div class="meaning">${A.LogoMeaning.map(m => `<div><b>${esc(m.Title)}</b><p>${esc(m.Description)}</p></div>`).join('')}</div></div></div></section>
<div class="wrap"><section class="story"><h2>Our journey</h2><div class="tl" style="--n:${T.length}">${T.map((t, i) => `<div class="yr${i === T.length - 1 ? ' now' : ''}"><b>${esc(t.Year)}</b><h4>${esc(t.Title)}</h4><p>${esc(t.Description)}</p></div>`).join('')}</div></section></div>
<section class="values"><div class="wrap"><h2>What we promise every family</h2><div class="vgrid">${A.Values.map(v => `<div><h3>${esc(v.Name)}</h3><p>${esc(v.Description)}</p></div>`).join('')}</div></div></section>
<div class="wrap">
  ${A.Founders && A.Founders.length ? `<section class="team" id="founders"><div class="hd"><div><p class="eyebrow">${esc((A.People || {}).Tagline || '')}</p><h2>${esc((A.People || {}).Heading || 'The people behind Architage')}</h2></div><p>${esc((A.People || {}).Description || '')}</p></div>
    ${(A.People || {}).Belief ? `<p class="belief">${esc(A.People.Belief)}</p>` : ''}
    <div class="founders">${A.Founders.map((f, i) => `<article class="founder${i % 2 ? ' flip' : ''}"><div class="f-pic">${f.ImageUrl ? `<img class="cover" src="${img(f.ImageUrl)}" alt="${esc(f.Name)}"${pos(f.ImagePosition || '50% 30%')}>` : `<span>${esc(initials(f.Name))}</span>`}</div><div class="f-txt"><h3>${esc(f.Name)}</h3><p class="f-role">${esc(f.Role)}</p>${f.Tagline ? `<p class="f-tag">${esc(f.Tagline)}</p>` : ''}${(f.Highlights || []).length ? `<ul class="f-hl">${f.Highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}${(f.Bio || []).map(b => `<p>${esc(b)}</p>`).join('')}${(f.Sections || []).length ? `<details class="f-more"><summary><span class="more">Read full profile</span><span class="less">Show less</span></summary>${f.Sections.map(sc => `<div class="f-sec"><h4>${esc(sc.Heading)}</h4>${(sc.Paragraphs || []).map(x => `<p>${esc(x)}</p>`).join('')}${(sc.Points || []).length ? `<ul class="f-pts">${sc.Points.map(pt => `<li><b>${esc(pt.Title)}</b>${esc(pt.Description)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</details>` : ''}${f.Quote ? `<blockquote class="f-q">“${esc(f.Quote)}”</blockquote>` : ''}</div></article>`).join('')}</div>
    ${A.Directors && (A.Directors.Members || []).length ? `<div class="dirs"><div class="crew-hd"><h3>${esc(A.Directors.Heading || 'Our directors')}</h3>${A.Directors.Description ? `<p>${esc(A.Directors.Description)}</p>` : ''}</div><div class="dir-grid">${A.Directors.Members.map(m => { const b = m.Bio || []; return `<article class="dir"><div class="d-pic">${m.ImageUrl ? `<img class="cover" src="${img(m.ImageUrl)}" alt="${esc(m.Name)}"${pos(m.ImagePosition || '50% 30%')}>` : `<span>${esc(initials(m.Name))}</span>`}</div><div class="d-txt"><h4>${esc(m.Name)}</h4><p class="f-role">${esc(m.Role)}</p>${m.Credentials ? `<p class="d-cred">${esc(m.Credentials)}</p>` : ''}${b.length ? `<p>${esc(b[0])}</p>` : ''}${b.length > 1 ? `<details class="f-more"><summary><span class="more">Read more</span><span class="less">Show less</span></summary>${b.slice(1).map(x => `<p>${esc(x)}</p>`).join('')}</details>` : ''}</div></article>`; }).join('')}</div></div>` : ''}
    ${A.Team && (A.Team.Members || []).length ? `<div class="crew"><div class="crew-hd"><h3>${esc(A.Team.Heading || 'Our team')}</h3>${A.Team.Description ? `<p>${esc(A.Team.Description)}</p>` : ''}</div><div class="crew-grid">${A.Team.Members.map(m => `<div class="mate"><div class="m-pic">${m.ImageUrl ? `<img class="cover" src="${img(m.ImageUrl)}" alt="${esc(m.Name || m.Role)}">` : esc(initials(m.Name || m.Role))}</div><div class="m-txt">${m.Name ? `<b>${esc(m.Name)}</b>` : ''}${m.Role ? `<span class="m-role">${esc(m.Role)}</span>` : ''}${m.Description ? `<p>${esc(m.Description)}</p>` : ''}</div></div>`).join('')}</div></div>` : ''}
  </section>` : ''}
</div>
${A.Vision ? `<section class="vision"><div class="wrap"><p class="eyebrow">${esc(A.Vision.Heading)}</p><blockquote>${esc(A.Vision.Quote)}</blockquote><p>${esc(A.Vision.Description)}</p></div></section>` : ''}
<div class="wrap" style="margin-top:112px">
  ${A.Press && A.Press.length ? `<div class="press"><small>As featured in</small>${A.Press.map(p => `<span>${esc(p)}</span>`).join('')}</div>` : ''}
  <section class="visit"><div class="t"><h2>Visit our studio</h2><p>See material samples, 3D walkthroughs and models of homes we have built. Tea is on us.</p>
    <dl>${co.Phones.map((p, i) => `<div><dt>${i ? 'Or' : 'Call us'}</dt><dd><a href="${telHref(p)}">${esc(p)}</a></dd></div>`).join('')}<div><dt>Open</dt><dd>${esc(co.OpeningHours)}</dd></div><div><dt>Instagram</dt><dd><a href="${esc(co.Instagram)}" ${ext}>${esc(co.InstagramHandle)}</a></dd></div>${co.Address ? `<div><dt>Address</dt><dd>${esc(co.Address)}</dd></div>` : ''}</dl>
    <a class="btn btn-teak" href="${wa()}" ${ext}>Book a studio visit</a></div>
    ${mapBox(co, 'map') || `<a class="map" href="contact.html" aria-label="Contact and visit details"><span class="pin"></span><span class="mlab">See contact details</span></a>`}</section>
</div>
<div id="talk">${contactBlock('h2', false).replace('<div class="wrap">', '<div class="wrap talk">')}</div>`;
  };

  const contactBlock = (tag, withMap) => {
    const co = C.Company;
    const opts = [...(C.ServiceCombinations || []).map(c => c.Name), ...C.Services.map(s => s.Name)];
    return `<div class="wrap">
  <header class="c-head"><${tag}${tag === 'h1' ? ' class="hero-in"' : ''}><span>Let's talk about your home</span></${tag}><p>Call, WhatsApp or send your plot details. An architect will get back to you within one working day, in English or Malayalam.</p></header>
  <div class="contact-grid">
    <div class="cbox"><h2>Reach us directly</h2>
      ${co.Phones.map(p => `<a class="crow" href="${telHref(p)}">${I.ph}<span><small>Call</small><b>${esc(p)}</b></span><span class="go">Call</span></a>`).join('')}
      <a class="crow" href="${wa()}" ${ext}>${I.wa}<span><small>WhatsApp</small><b>Chat with an architect</b></span><span class="go">Open</span></a>
      <a class="crow" href="${esc(co.Instagram)}" ${ext}>${I.ig}<span><small>Instagram</small><b>${esc(co.InstagramHandle)}</b></span><span class="go">Follow</span></a>
      ${co.Email ? `<a class="crow" href="mailto:${esc(co.Email)}"><span><small>Email</small><b>${esc(co.Email)}</b></span></a>` : ''}
      ${mapLink(co) ? `<a class="crow" href="${esc(mapLink(co))}" ${ext}><span><small>Studio</small><b>${esc(co.Address || 'Find us on Google Maps')}</b></span><span class="go">Directions</span></a>` : (co.Address ? `<p class="hours">${esc(co.Address)}</p>` : '')}<p class="hours">Open ${esc(co.OpeningHours)}.</p>
    </div>
    <form class="fbox" id="enquiry" novalidate><h2>Send your plot details</h2><p>We'll prepare your message for WhatsApp, so you can send it in one tap.</p>
      <div class="fgrid">
        <div><label for="f-name">Your name</label><input id="f-name" name="name" autocomplete="name" required></div>
        <div><label for="f-phone">Phone or WhatsApp number</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required></div>
        <div><label for="f-loc">Plot location</label><input id="f-loc" name="location" placeholder="Town or district"></div>
        <div><label for="f-plot">Plot size</label><input id="f-plot" name="plot" placeholder="For example, 20 cents"></div>
        <div class="full"><label for="f-svc">What do you need?</label><select id="f-svc" name="service">${opts.map(o => `<option>${esc(o)}</option>`).join('')}</select></div>
        <div class="full"><label for="f-msg">Anything else we should know?</label><textarea id="f-msg" name="message"></textarea></div>
      </div>
      <button class="btn btn-primary" type="submit" style="margin-top:22px">Prepare WhatsApp message</button>
      <p class="ferr" id="ferr" hidden role="alert"></p>
      <div class="fdone" id="fdone" hidden><b>Your message is ready</b><p>Tap below to open WhatsApp with your details filled in, then press send.</p><a class="btn btn-teak btn-sm" href="${wa()}" ${ext}>Open WhatsApp</a></div>
    </form>
  </div>
  ${withMap ? mapBox(co, 'c-map') : ''}
</div>`;
  };
  R.contact = () => contactBlock('h1', true);

  const notFound = () => `<div class="wrap"><section class="legal" style="text-align:center;margin:0 auto"><h1>This home isn't in our portfolio</h1><p style="margin-bottom:28px">The link may be old, or the project may have been renamed.</p><p style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a class="btn btn-primary" href="portfolio.html">See our portfolio</a><a class="btn btn-ghost" href="index.html" style="color:var(--green)">Go to the home page</a></p></section></div>`;

  // ---------- boot ----------
  function render() {
    header(); footer();
    const main = document.getElementById('main');
    if (R[page]) {
      const html = R[page]();
      main.innerHTML = html == null ? notFound() : html;
    }
    bindCompany(document);
    document.body.classList.add('ready');
    if (typeof window.initSite === 'function') window.initSite();
    if (location.hash && page !== 'project') { const t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(() => t.scrollIntoView(), 60); }
  }
  function fail(err) {
    console.error('Catalog failed to load', err);
    document.getElementById('main').innerHTML = `<div class="wrap"><section class="legal" style="margin:0 auto;text-align:center"><h1>We couldn't load this page</h1><p>Please refresh the page. If you are the site owner, check that <b>${DATA_URL}</b> exists and is valid JSON, and that the site is opened through a web server rather than as a local file.</p></section></div>`;
    document.body.classList.add('ready');
  }
  fetch(DATA_URL, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.json(); })
    .then(d => { C = d; render(); }).catch(fail);
  if (page === 'project') window.addEventListener('hashchange', () => { if (C) { window.scrollTo(0, 0); location.reload(); } });
})();
