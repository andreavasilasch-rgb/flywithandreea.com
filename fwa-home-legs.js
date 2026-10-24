/* Fly with Andreea, the empty leg block on the home page.
 *
 * The same card as the empty legs page and the route pages. This file only
 * redraws #emptyGrid and rewires the region buttons above it; the headline,
 * the lede and the green updated dot are the page's own and are left alone.
 *
 * Load order: fwa-legs.css, fwa-route-legs.css, the leg data, fwa-legs.js,
 * then this.
 */
(function () {
  var SHOWN = 12;          /* the home page shows a taste, not the whole list */

  /* the buttons say us, the data says united-states */
  var ALIAS = { us: 'united-states', 'united states': 'united-states',
                'middle east': 'middle-east' };

  function go() {
    var grid = document.getElementById('emptyGrid');
    if (!grid || !window.FWA_LEGS || !window.FWA_EL) return;

    var sec = grid.closest('.empty-section') || grid.parentElement;
    sec.classList.add('fwa-legs');
    grid.classList.add('fl-list');

    var today = new Date();
    var tsk = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    var all = (window.FWA_EL.legs || [])
      .filter(function (l) { return (l.sk || 0) >= tsk; })
      .sort(function (a, b) { return (a.sk || 0) - (b.sk || 0); });

    var region = 'all';

    function wanted() {
      if (region === 'all') return all;
      return all.filter(function (l) { return l.region === region; });
    }

    function paint() {
      var rows = wanted();
      grid.innerHTML = rows.length
        ? rows.slice(0, SHOWN).map(window.FWA_LEGS.card).join('')
        : '<div class="fl-nolive"><p>No leg on that part of the world today. '
          + 'They appear and go within hours, so it is worth looking again, or '
          + 'telling Andreea the route you fly.</p></div>';
      window.FWA_LEGS.wire();

      /* the line above the buttons counts what is actually on offer */
      var up = sec.querySelector('.empty-update');
      if (up) {
        var dot = up.querySelector('.empty-update-dot');
        up.textContent = 'Updated today · ' + all.length
          + (all.length === 1 ? ' leg available' : ' legs available');
        if (dot) up.insertBefore(dot, up.firstChild);
      }
    }

    var btns = sec.querySelectorAll('.empty-filter');
    [].forEach.call(btns, function (b) {
      /* The page's own handler is already on these buttons and would redraw
         the old cards first, so this one takes the click on the way down and
         stops it there. Without that the row flickers through the old card
         on every filter change. */
      b.addEventListener('click', function (e) {
        e.stopImmediatePropagation();
        var v = (b.getAttribute('data-cat') || 'all').toLowerCase();
        region = ALIAS[v] || v;
        [].forEach.call(btns, function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        paint();
      }, true);
      /* a region with nothing flying is dimmed rather than hidden, so the set
         of buttons does not change shape between visits */
      var v = (b.getAttribute('data-cat') || 'all').toLowerCase();
      var key = ALIAS[v] || v;
      if (key !== 'all' && !all.some(function (l) { return l.region === key; })) {
        b.style.opacity = '.42';
      }
    });

    paint();
  }

  if (document.readyState !== 'loading') go();
  else document.addEventListener('DOMContentLoaded', go);
}());
