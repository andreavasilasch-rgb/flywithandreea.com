/* Fly with Andreea, the empty leg row on a route page.
 *
 * Every route page already carries a small inline script that draws the old
 * card. This file runs after it and draws the row again with the new card, so
 * nothing has to be regenerated across the 7,448 route pages. When this file is
 * removed the old row comes back by itself.
 *
 * It needs, in this order: fwa-legs.css, the leg data, fwa-legs.js, then this.
 */
(function () {
  function go() {
    var sec = document.getElementById('route-el-sec');
    if (!sec || !window.FWA_LEGS || !window.FWA_EL) return;
    var row = sec.querySelector('.el-row');
    if (!row) return;

    /* city names are compared without accents or case, because the route url
       spells Dusseldorf and the leg data spells Düsseldorf */
    function n(s) {
      return String(s == null ? '' : s).normalize('NFD')
        .replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }
    var from = n(sec.getAttribute('data-from'));
    var to = n(sec.getAttribute('data-to'));

    var today = new Date();
    var tsk = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    var legs = (window.FWA_EL.legs || []).filter(function (l) {
      return n(l.fc) === from && n(l.tc) === to && (l.sk || 0) >= tsk;
    }).sort(function (a, b) { return (a.sk || 0) - (b.sk || 0); });

    sec.classList.add('fwa-legs');
    sec.style.display = 'block';

    /* The price watch is kept exactly as the page already writes it. It comes
       out of the data-watch attribute untouched, the same way the old inline
       script used it, so only the cards beside it change. */
    var watch = sec.getAttribute('data-watch') || '';

    row.className = 'el-row fl-row';
    row.innerHTML = watch + '<div class="fl-list">'
      + legs.map(window.FWA_LEGS.card).join('') + '</div>';
    window.FWA_LEGS.wire();

    if (!legs.length) {
      sec.classList.add('el-nolive');
      row.querySelector('.fl-list').innerHTML = '<div class="fl-nolive">'
        + '<p>No repositioning flight is listed on this sector today. They appear and '
        + 'go within hours, so the price watch beside this is the surer route.</p></div>';
    }
  }

  /* the inline renderer runs at parse time, so waiting for the document to be
     ready is enough to land after it */
  if (document.readyState !== 'loading') go();
  else document.addEventListener('DOMContentLoaded', go);
}());
