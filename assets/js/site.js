window.initSite = function(){
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch(e){}
  // Open every page at the top (unless a #section was asked for). Repeat briefly in case the
  // host restores the previous page's scroll position, but stop as soon as the visitor scrolls.
  if (!location.hash){
    let touched = false; const stop = () => { touched = true; };
    ['wheel','touchstart','keydown','mousedown'].forEach(ev=>window.addEventListener(ev, stop, {once:true, passive:true}));
    const top = () => { if (!touched && window.scrollY) window.scrollTo({top:0, left:0, behavior:'instant'}); };
    top(); requestAnimationFrame(top); [60,150,300,600,1000].forEach(t=>setTimeout(top,t));
    window.addEventListener('pageshow', e=>{ if (e.persisted) top(); });
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r=document) => r.querySelector(s), $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // Header shadow on scroll
  const head = $('.site-head');
  const onScroll = () => head && head.classList.toggle('scrolled', window.scrollY > 24);
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  // Drawer
  const drawer = $('#drawer');
  const openD = () => { drawer.classList.add('open'); document.body.classList.add('lock'); drawer.setAttribute('aria-hidden','false'); $('.burger').setAttribute('aria-expanded','true'); setTimeout(()=>$('.d-close',drawer).focus(),50); };
  const closeD = () => { drawer.classList.remove('open'); document.body.classList.remove('lock'); drawer.setAttribute('aria-hidden','true'); $('.burger').setAttribute('aria-expanded','false'); };
  if (drawer){
    $$('.burger').forEach(b=>b.addEventListener('click', openD));
    $('.d-close',drawer).addEventListener('click', closeD);
    $$('nav a', drawer).forEach(a=>a.addEventListener('click', closeD));
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') { closeD(); closeLb && closeLb(); } });
  }

  // Dropdown keyboard / touch
  $$('.dd > a').forEach(a=>{
    a.addEventListener('click', e=>{ if (window.matchMedia('(hover: none)').matches && !a.parentElement.classList.contains('open')) { e.preventDefault(); a.parentElement.classList.add('open'); } });
  });
  document.addEventListener('click', e=>{ $$('.dd.open').forEach(d=>{ if(!d.contains(e.target)) d.classList.remove('open'); }); });

  // Reveal on scroll: auto-tag common blocks
  const sel = ['main section > .wrap > *','main > .wrap > section > *','.facts > div','.track li','.svc-row','.home-card','.rv-cards > .rv','.feat','.tier','.card','.st','.prom > div','.promise > div','.vgrid > div','.people > .person','.meaning > div','.tl > .yr','.combo > div','.svc','.story .part','.pair > div','.compare','.sum > div','.prow','.lead','.visit','.band','.cta','.lineage .wrap > div','.sig .wrap > div','.pk-head','.pk-foot','.j-head','.sec-head','.rv-head','.head','.title','.faq > *','.contact-grid > *','.legal > *'];
  const els = new Set(); sel.forEach(s=>$$(s).forEach(e=>{ if(!e.closest('.hero') && !e.closest('.no-rv')) els.add(e); }));
  if (!reduce && 'IntersectionObserver' in window){
    const io = new IntersectionObserver(ents=>ents.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);} }), {rootMargin:'0px 0px -8% 0px', threshold:.08});
    els.forEach(e=>{ e.classList.add('reveal'); io.observe(e); });
    // stagger siblings
    els.forEach(e=>{ const sib = Array.from(e.parentElement.children).filter(c=>els.has(c)); const i = sib.indexOf(e); if (i>0) e.style.transitionDelay = Math.min(i*90, 450)+'ms'; });
    $$('.rvi').forEach(e=>{ e.classList.add('rv-img'); io.observe(e); });
  }

  // Count-up numbers
  $$('[data-count]').forEach(el=>{
    const end = parseInt(el.dataset.count,10), suf = el.dataset.suffix||'';
    if (reduce || !('IntersectionObserver' in window)) { el.textContent = end+suf; return; }
    el.textContent = '0'+suf;
    const io = new IntersectionObserver(([en])=>{ if(!en.isIntersecting) return; io.disconnect();
      const t0 = performance.now(), d = 1400;
      const step = t => { const p = Math.min((t-t0)/d,1), v = Math.round(end*(1-Math.pow(1-p,3))); el.textContent = v+suf; if(p<1) requestAnimationFrame(step); };
      requestAnimationFrame(step); }, {threshold:.6});
    io.observe(el);
  });

  // Hero slideshow
  const slides = $$('.slides img'), thumbs = $$('.thumbs button'), chipName = $('.chip-n');
  if (slides.length){
    let i = 0, timer;
    const show = n => { i = (n+slides.length)%slides.length; slides.forEach((s,k)=>s.classList.toggle('on',k===i)); thumbs.forEach((t,k)=>{t.classList.toggle('on',k===i); t.setAttribute('aria-pressed',k===i);});
      if (chipName){ const chip=chipName.closest('.chip'), cd=$('.chip-d'); chip.style.opacity=0; setTimeout(()=>{ chipName.textContent = slides[i].dataset.name; if(cd) cd.textContent = slides[i].dataset.desc||''; if(chip.tagName==='A') chip.href = slides[i].dataset.href||'portfolio.html'; chip.style.opacity=1; },250);} };
    const play = () => { if(reduce) return; clearInterval(timer); timer = setInterval(()=>show(i+1), 5200); };
    thumbs.forEach((t,k)=>t.addEventListener('click',()=>{ show(k); play(); }));
    show(0); play();
    const hero = $('.hero-art'); if (hero){ hero.addEventListener('mouseenter',()=>clearInterval(timer)); hero.addEventListener('mouseleave',play); }
  }

  // Carousels (reviews etc.)
  $$('[data-carousel]').forEach(c=>{
    const track = $('.c-track', c), prev = $('.c-prev', c), next = $('.c-next', c), dots = $$('.c-dots i', c);
    if (!track) return;
    const by = () => { const f = track.children[0]; return f ? f.getBoundingClientRect().width + 24 : 300; };
    prev && prev.addEventListener('click', ()=>track.scrollBy({left:-by(), behavior: reduce?'auto':'smooth'}));
    next && next.addEventListener('click', ()=>track.scrollBy({left: by(), behavior: reduce?'auto':'smooth'}));
    const upd = () => { const max = track.scrollWidth - track.clientWidth; const p = max>0 ? track.scrollLeft/max : 0;
      const k = Math.round(p*(dots.length-1)); dots.forEach((d,j)=>d.classList.toggle('on',j===k));
      prev && prev.classList.toggle('on', track.scrollLeft>4); next && next.classList.toggle('on', track.scrollLeft < max-4); };
    track.addEventListener('scroll', upd, {passive:true}); window.addEventListener('resize', upd); upd();
  });

  // Accordions
  $$('.acc-b').forEach(b=>b.addEventListener('click',()=>{ const it=b.closest('.acc-i'); const open=!it.classList.contains('open'); it.classList.toggle('open',open); b.setAttribute('aria-expanded',open); }));

  // Jump chips active state (services): the active chip is the last section whose top has passed the sticky bars
  const jumps = $$('.jump a[href^="#"]');
  if (jumps.length){
    const bar = $('.jump');
    const items = jumps.map(a=>({a, t:document.getElementById(a.getAttribute('href').slice(1))})).filter(x=>x.t);
    let lockUntil = 0;
    const setOn = a => { if (a.classList.contains('on')) return; jumps.forEach(j=>j.classList.toggle('on', j===a));
      if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({left: a.offsetLeft - 20, behavior: reduce?'auto':'smooth'}); };
    const line = () => (bar ? bar.getBoundingClientRect().bottom : 160) + 40;
    const upd = () => { if (Date.now() < lockUntil) return;
      const y = line(); let cur = items[0];
      items.forEach(x=>{ if (x.t.getBoundingClientRect().top <= y) cur = x; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = items[items.length-1];
      setOn(cur.a); };
    jumps.forEach(a=>a.addEventListener('click', ()=>{ setOn(a); lockUntil = Date.now() + 1200; }));
    let st; window.addEventListener('scroll', ()=>{ clearTimeout(st); st = setTimeout(()=>{ lockUntil = 0; upd(); }, 150); if (Date.now() >= lockUntil) upd(); }, {passive:true});
    window.addEventListener('resize', upd); upd();
  }

  // Portfolio filters
  const grid = $('#pgrid');
  if (grid){
    const cards = $$('.pcard', grid), chips = $$('.fchip'), dSel = $('#fdistrict'), sSel = $('#fstatus'), count = $('#pcount'), empty = $('#pempty');
    let style = 'all';
    const apply = () => {
      let n = 0;
      cards.forEach(c=>{ const ok = (style==='all'||c.dataset.style===style) && (!dSel.value||c.dataset.district===dSel.value) && (!sSel.value||c.dataset.status===sSel.value);
        c.classList.toggle('hide', !ok); if (ok) n++; });
      count.textContent = n + (n===1?' home':' homes'); empty.hidden = n>0;
      chips.forEach(ch=>ch.classList.toggle('on', ch.dataset.f===style));
    };
    chips.forEach(ch=>ch.addEventListener('click',()=>{ style = ch.dataset.f; try{ history.replaceState(null,'', style==='all'?location.pathname:'#'+style);}catch(e){} apply(); }));
    [dSel,sSel].forEach(s=>s.addEventListener('change',apply));
    $('#freset') && $('#freset').addEventListener('click',()=>{ style='all'; dSel.value=''; sSel.value=''; apply(); });
    const fromHash = () => { const h = location.hash.slice(1); if (h && chips.some(c=>c.dataset.f===h)) { style = h; return true; } return false; };
    fromHash(); window.addEventListener('hashchange', ()=>{ if (fromHash()) apply(); });
    $$('.vbtn').forEach(v=>v.addEventListener('click',()=>{ $$('.vbtn').forEach(x=>{x.classList.toggle('on',x===v); x.setAttribute('aria-pressed',x===v);}); grid.classList.toggle('as-list', v.dataset.v==='list'); }));
    apply();
  }

  // Before / after slider
  $$('.ba').forEach(ba=>{
    const r = $('input', ba), l = $('.ba-l', ba), h = $('.ba-h', ba);
    const set = v => { l.style.clipPath = `inset(0 ${100-v}% 0 0)`; h.style.left = v+'%'; };
    r.addEventListener('input', ()=>set(r.value)); set(r.value);
  });

  // Lightbox
  const lb = $('#lb'); let closeLb = null;
  if (lb){
    const imgs = $$('[data-lb]'); const im = $('img', lb), cnt = $('.cnt', lb); let k = 0;
    const show = n => { k=(n+imgs.length)%imgs.length; im.src = imgs[k].dataset.lb; im.alt = imgs[k].getAttribute('aria-label')||''; cnt.textContent = (k+1)+' / '+imgs.length; };
    imgs.forEach((a,n)=>a.addEventListener('click',e=>{ e.preventDefault(); show(n); lb.classList.add('open'); document.body.classList.add('lock'); $('.x',lb).focus(); }));
    closeLb = () => { lb.classList.remove('open'); document.body.classList.remove('lock'); };
    $('.x',lb).addEventListener('click', closeLb); $('.pv',lb).addEventListener('click',()=>show(k-1)); $('.nx',lb).addEventListener('click',()=>show(k+1));
    lb.addEventListener('click', e=>{ if(e.target===lb) closeLb(); });
    document.addEventListener('keydown', e=>{ if(!lb.classList.contains('open')) return; if(e.key==='ArrowRight') show(k+1); if(e.key==='ArrowLeft') show(k-1); });
  }

  // Contact form -> WhatsApp
  const form = $('#enquiry');
  if (form){
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const f = new FormData(form); const name = (f.get('name')||'').trim(), phone=(f.get('phone')||'').trim();
      const err = $('#ferr');
      if (!name || !phone){ err.textContent = 'Please add your name and phone number so we can call you back.'; err.hidden=false; return; }
      err.hidden = true;
      const lines = ['Enquiry', 'Name: '+name, 'Phone: '+phone];
      ['location','plot','service','message'].forEach(k=>{ const v=(f.get(k)||'').trim(); if(v) lines.push(k[0].toUpperCase()+k.slice(1)+': '+v); });
      const url = 'https://wa.me/919074001122?text=' + encodeURIComponent(lines.join('\n'));
      const out = $('#fdone'); out.hidden = false; $('a', out).href = url;
      out.scrollIntoView({behavior: reduce?'auto':'smooth', block:'center'});
    });
  }

  // Year
  $$('.yr-now').forEach(e=>e.textContent = new Date().getFullYear());
};
