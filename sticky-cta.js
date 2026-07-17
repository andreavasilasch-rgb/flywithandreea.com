/* Fly with Andreea. Global sticky action bar plus back-to-top.
   Drop-in: reference this file with a deferred script tag just before the closing body tag on any page.
   Self-contained, idempotent, and removes any older .mcta or .totop bars to avoid duplicates. */
(function () {
  if (window.__fwaStickyCTA) return;
  window.__fwaStickyCTA = 1;

  var WA    = 'https://wa.me/971503372980';
  var TEL   = 'tel:+971503372980';
  var MAIL  = 'mailto:andreea@flywithandreea.com';
  var QUOTE = '/#quote';

  var css = ''
    + '.fwa-cta{position:fixed;left:0;right:0;bottom:0;z-index:9000;display:flex;gap:10px;'
    + 'padding:10px 14px;background:rgba(255,255,255,.96);-webkit-backdrop-filter:blur(10px);'
    + 'backdrop-filter:blur(10px);border-top:.5px solid rgba(29,29,31,.12);box-sizing:border-box}'
    + '.fwa-cta a{flex:1;text-align:center;padding:13px 8px;border-radius:999px;font-weight:600;'
    + 'font-size:.92rem;text-decoration:none;letter-spacing:.01em;'
    + "font-family:-apple-system,BlinkMacSystemFont,system-ui,'Segoe UI',Roboto,Arial,sans-serif;"
    + 'white-space:nowrap;transition:background .2s,transform .15s}'
    + '.fwa-cta a:active{transform:scale(.98)}'
    + '.fwa-cta .q{background:#CBAD91;color:#fff}.fwa-cta .q:hover{background:#E0C4A0}'
    + '.fwa-cta .e{border:.5px solid #d5d5db;color:#B8966B}.fwa-cta .e:hover{border-color:#CBAD91;color:#CBAD91}'
    + '.fwa-cta .c{border:.5px solid #d5d5db;color:#B8966B}.fwa-cta .c:hover{border-color:#CBAD91;color:#CBAD91}'
    + '.fwa-cta .w{border:.5px solid #37b06a;color:#1c8f4f}.fwa-cta .w:hover{background:rgba(55,176,106,.08)}'
    + '.fwa-top{position:fixed;right:24px;bottom:90px;z-index:9001;width:54px;height:54px;border:0;padding:0;'
    + 'border-radius:50%;background:rgba(255,255,255,.9);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);'
    + 'cursor:pointer;display:flex;align-items:center;justify-content:center;'
    + 'box-shadow:0 12px 30px -10px rgba(29,29,31,.35);'
    + 'opacity:0;pointer-events:none;transform:translateY(10px) scale(.92);transition:opacity .4s,transform .4s}'
    + '.fwa-top.show{opacity:1;pointer-events:auto;transform:none}'
    + '.fwa-top:hover{box-shadow:0 18px 36px -12px rgba(29,29,31,.45)}'
    + '.fwa-top svg.ring{position:absolute;inset:0;width:54px;height:54px;transform:rotate(-90deg)}'
    + '.fwa-top .trk{fill:none;stroke:rgba(29,29,31,.12);stroke-width:2.5}'
    + '.fwa-top .prg{fill:none;stroke:#CBAD91;stroke-width:2.5;stroke-linecap:round}'
    + '.fwa-top .ar{position:relative;z-index:1;display:flex;color:#B8966B;transition:transform .25s cubic-bezier(.2,.7,.2,1)}'
    + '.fwa-top:hover .ar{transform:translateY(-3px)}'
    + '.fwa-top .ar svg{width:18px;height:18px}'
    + '@media(max-width:520px){.fwa-cta a{font-size:.82rem;padding:12px 4px}.fwa-top{width:50px;height:50px}.fwa-top svg.ring{width:50px;height:50px}}';

  function build() {
    // remove any pre-existing bars / buttons from individual pages
    var old = document.querySelectorAll('.mcta,.totop,.toTop,#toTop,#totop,.stickybar,.back-to-top,.fwa-cta,.fwa-top');
    for (var i = 0; i < old.length; i++) old[i].parentNode && old[i].parentNode.removeChild(old[i]);

    var style = document.createElement('style');
    style.setAttribute('data-fwa', 'sticky-cta');
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'fwa-cta';
    bar.innerHTML =
        '<a class="q" href="' + QUOTE + '">Quote</a>'
      + '<a class="e" href="' + MAIL + '">Email</a>'
      + '<a class="c" href="' + TEL + '">Call</a>'
      + '<a class="w" href="' + WA + '" target="_blank" rel="noopener">WhatsApp</a>';
    document.body.appendChild(bar);

    var top = document.createElement('button');
    top.className = 'fwa-top';
    top.setAttribute('aria-label', 'Back to top');
    top.innerHTML =
        '<svg class="ring" viewBox="0 0 54 54"><circle class="trk" cx="27" cy="27" r="24"/>'
      + '<circle class="prg" cx="27" cy="27" r="24"/></svg>'
      + '<span class="ar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
      + 'stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg></span>';
    document.body.appendChild(top);
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // reserve space so the footer is never hidden behind the bar
    var pad = bar.offsetHeight + 8;
    var cur = parseInt(getComputedStyle(document.body).paddingBottom, 10) || 0;
    if (cur < pad) document.body.style.paddingBottom = pad + 'px';

    // scroll-progress ring: the gold arc fills as the reader moves down the page
    var prg = top.querySelector('.prg');
    var C = 2 * Math.PI * 24;
    prg.style.strokeDasharray = C;
    prg.style.strokeDashoffset = C;
    var onScroll = function () {
      var doc = document.documentElement;
      var h = doc.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(Math.max(window.pageYOffset / h, 0), 1) : 0;
      prg.style.strokeDashoffset = C * (1 - p);
      top.classList.toggle('show', window.pageYOffset > 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
