/* Chargeable weight calculator for the air cargo pages.
   1 shared file, cached across every page that uses it.

   WHAT IT DOES THAT THE FIRST VERSION DID NOT

   - Takes a consignment line by line, 1 line per cargo type, and adds them up.
     It opens with 1 line, so a shipper with 1 pallet sees exactly what they saw
     before and nothing more.
   - Rounds the way a carrier rounds: dimensions to the whole centimetre first,
     then the chargeable weight up to the next 0.5 kg.
   - Carries both divisors. 6,000 is air cargo. 5,000 is what express and
     courier services generally use, and a shipper comparing the 2 without
     knowing that is 20 per cent out.
   - Works in centimetres and kilos or in inches and pounds.
   - Warns when a piece is too tall for a lower hold, too tall for a main deck,
     or longer than a standard pallet. Catching that is worth more than the
     arithmetic.
   - Hands the finished summary to a quote or a message, so nobody retypes it.

   No libraries. Nothing leaves the browser unless the person clicks a button.
*/
(function () {
  'use strict';

  var CM = 2.54, LB = 0.45359237;

  // typical piece for each kind of cargo, in cm and kg, used to prefill a line.
  // Every figure is editable, they are a starting point rather than an answer.
  var TYPES = [
    ['General cargo',            120, 100, 120,  400],
    ['Industrial machinery',     220, 140, 155, 1850],
    ['Spare parts',              120, 100, 120,  640],
    ['Automotive parts',         120, 100, 135,  420],
    ['Aerospace components',     310, 120, 110,  615],
    ['Electronics',              120,  80,  95,  112],
    ['Pharmaceuticals, cooled',  120, 100, 110,  285],
    ['Perishables',               60,  40,  32,   14],
    ['Garments and textiles',    120, 100, 160,   95],
    ['Medical equipment',        150,  90, 120,  195],
    ['Telecoms hardware',        120, 100, 140,  230],
    ['Energy equipment',         280, 160, 170, 2400],
    ['Marine spares',            120, 100, 105,  510],
    ['Hotel and resort goods',   120, 100, 150,  130],
    ['Retail stock',             120, 100, 155,  145],
    ['Oversized unit',           400, 190, 185, 3100],
    ['Other, describe it',         0,   0,   0,    0]   // keep last, see OTHER
  ];
  var OTHER = TYPES.length - 1;

  // guidance thresholds in cm and kg, deliberately phrased as questions to ask
  var LOWER_HOLD_H = 160, MAIN_DECK_H = 300, PALLET_L = 318;

  function $(id, root) { return (root || document).querySelector('#' + id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function kg(n) {
    return n.toLocaleString('en-GB', { maximumFractionDigits: 1 }) + ' kg';
  }
  function up05(n) { return Math.max(0, Math.ceil(n * 2 - 1e-9) / 2); }

  function init(root) {
    if (root.getAttribute('data-cw-ready')) return;
    root.setAttribute('data-cw-ready', '1');

    var state = { divisor: 6000, imperial: false };
    var rowsBox = $('cwRows', root), addBtn = $('cwAdd', root);
    if (!rowsBox) return;

    // ---------------------------------------------------------------- a line
    function addRow(preset) {
      var r = el('div', 'cw-row-in');

      var sel = el('select', 'cw-type');
      TYPES.forEach(function (t, i) {
        var o = el('option', null, t[0]); o.value = i; sel.appendChild(o);
      });
      var other = el('input', 'cw-other');
      other.type = 'text';
      other.placeholder = 'What is it? For example machine parts in 1 crate';
      other.setAttribute('aria-label', 'Describe the cargo');
      other.hidden = true;
      var typeCell = wrap('Cargo', sel, 'cw-f-type');
      typeCell.appendChild(other);
      r.appendChild(typeCell);

      var f = {};
      [['n', 'Pieces', 1], ['L', 'Length', 0], ['W', 'Width', 0],
       ['H', 'Height', 0], ['k', 'Weight each', 0]].forEach(function (d) {
        var i = el('input');
        i.type = 'number'; i.min = '0'; i.step = 'any'; i.value = d[2];
        i.setAttribute('inputmode', 'decimal');
        f[d[0]] = i;
        r.appendChild(wrap(d[1], i, 'cw-f-' + d[0]));
      });

      var out = el('div', 'cw-line-out');
      var outN = el('b', null, '0 kg');
      out.appendChild(el('span', null, 'Chargeable'));
      out.appendChild(outN);
      r.appendChild(out);

      var del = el('button', 'cw-del', '\u00d7');
      del.type = 'button';
      del.setAttribute('aria-label', 'Remove this line');
      r.appendChild(del);

      var warn = el('p', 'cw-warn');
      warn.hidden = true;

      var holder = el('div', 'cw-line');
      holder.appendChild(r);
      holder.appendChild(warn);
      holder._f = f; holder._out = outN; holder._warn = warn;
      holder._sel = sel; holder._other = other;

      sel.addEventListener('change', function () {
        var isOther = +sel.value === OTHER;
        other.hidden = !isOther;
        typeCell.querySelector('span').textContent = isOther ? 'Cargo, describe it' : 'Cargo';
        if (isOther) { other.focus(); recalc(); return; }
        var t = TYPES[+sel.value];
        f.L.value = conv(t[1]); f.W.value = conv(t[2]);
        f.H.value = conv(t[3]); f.k.value = convW(t[4]);
        if (+f.n.value < 1) f.n.value = 1;
        recalc();
      });
      other.addEventListener('input', recalc);
      del.addEventListener('click', function () {
        if (rowsBox.children.length === 1) return;
        holder.remove(); showDel(); recalc();
      });
      Object.keys(f).forEach(function (k2) {
        f[k2].addEventListener('input', recalc);
      });

      rowsBox.appendChild(holder);
      if (preset != null) { sel.value = preset; sel.dispatchEvent(new Event('change')); }
      sync(); showDel();
      return holder;
    }

    function showDel() {
      var many = rowsBox.children.length > 1;
      Array.prototype.forEach.call(rowsBox.children, function (line) {
        var b = line.querySelector('.cw-del');
        if (b) b.style.visibility = many ? 'visible' : 'hidden';
      });
    }

    function wrap(label, node, cls) {
      var w = el('label', 'cw-f ' + (cls || ''));
      w.appendChild(el('span', null, label));
      w.appendChild(node);
      return w;
    }

    function conv(cmv) { return state.imperial ? Math.round(cmv / CM * 10) / 10 : cmv; }
    function convW(kgv) { return state.imperial ? Math.round(kgv / LB) : kgv; }

    // ------------------------------------------------------------- the sums
    function recalc() {
      var tot = { n: 0, act: 0, vol: 0, m3: 0 }, flags = [];

      Array.prototype.forEach.call(rowsBox.children, function (line) {
        var f = line._f;
        var n = Math.max(0, Math.floor(+f.n.value || 0));
        var L = +f.L.value || 0, W = +f.W.value || 0, H = +f.H.value || 0;
        var k = +f.k.value || 0;

        // to centimetres and kilos, then to the whole centimetre, which is the
        // order a carrier works in
        if (state.imperial) { L *= CM; W *= CM; H *= CM; k *= LB; }
        L = Math.round(L); W = Math.round(W); H = Math.round(H);

        var act = n * k, vol = n * L * W * H / state.divisor;
        var ch = up05(Math.max(act, vol));
        line._out.textContent = ch ? kg(ch) : '0 kg';
        line._out.className = vol > act ? 'cw-by-vol' : '';

        tot.n += n; tot.act += act; tot.vol += vol;
        tot.m3 += n * L * W * H / 1e6;

        var w = [];
        if (H > MAIN_DECK_H) {
          w.push('At ' + H + ' cm this piece is taller than the main deck of most '
               + 'freighters, so the aircraft has to be chosen around it.');
        } else if (H > LOWER_HOLD_H) {
          w.push('At ' + H + ' cm this piece is too tall for the lower hold of most '
               + 'aircraft, so it needs a freighter main deck rather than belly space.');
        }
        if (L > PALLET_L) {
          w.push('At ' + L + ' cm it is longer than a standard main deck pallet, so the '
               + 'cargo door and the aircraft type decide whether it goes.');
        }
        line._warn.textContent = w.join(' ');
        line._warn.hidden = !w.length;
        if (w.length) flags.push(1);
      });

      var ch = up05(Math.max(tot.act, tot.vol));
      set('cwTotPieces', tot.n ? tot.n.toLocaleString('en-GB') : '0');
      set('cwTotActual', kg(Math.round(tot.act * 10) / 10));
      set('cwTotVol', kg(Math.round(tot.vol * 10) / 10));
      set('cwTotM3', (Math.round(tot.m3 * 100) / 100).toLocaleString('en-GB') + ' m3');
      set('cwTotCh', kg(ch));

      var say = $('cwSay', root);
      if (say) {
        if (!ch) { say.textContent = ''; }
        else {
          var d = tot.m3 ? Math.round(tot.act / tot.m3) : 0;
          var line = tot.vol > tot.act
            ? 'The volume wins, so you are billed on ' + kg(ch) + ' rather than the '
              + kg(Math.round(tot.act)) + ' it weighs. At about ' + d + ' kg per cubic '
              + 'metre this consignment is light for its size, which is the case most '
              + 'people are caught by.'
            : (tot.act > tot.vol
              ? 'The scale wins, so you are billed on what it weighs. At about ' + d
                + ' kg per cubic metre it is dense enough that the volume never catches up.'
              : 'Actual and volumetric are level, which is the line the rule turns on.');
          if (state.divisor === 5000) {
            line += ' You are on the express divisor of 5,000, which is 200 kg per cubic '
                  + 'metre. Scheduled air cargo uses 6,000.';
          }
          say.textContent = line;
        }
      }
      root.setAttribute('data-cw-total', ch || 0);
      window.__cwSummary = summary(ch, tot);
    }

    function set(id, v) { var n = $(id, root); if (n) n.textContent = v; }

    function summary(ch, tot) {
      var u = state.imperial ? ' in' : ' cm', uw = state.imperial ? ' lb' : ' kg';
      var lines = [];
      Array.prototype.forEach.call(rowsBox.children, function (line) {
        var f = line._f, name = +line._sel.value === OTHER
          ? ((line._other.value || '').trim() || 'Other cargo')
          : TYPES[+line._sel.value][0];
        var n = Math.floor(+f.n.value || 0);
        if (!n) return;
        lines.push(n + ' x ' + name + ', ' + (+f.L.value) + ' by ' + (+f.W.value)
                 + ' by ' + (+f.H.value) + u + ', ' + (+f.k.value) + uw + ' each');
      });
      return lines.join('\n') + '\n\nTotal pieces ' + tot.n
           + '\nActual weight ' + kg(Math.round(tot.act * 10) / 10)
           + '\nVolumetric weight ' + kg(Math.round(tot.vol * 10) / 10)
           + '\nVolume ' + (Math.round(tot.m3 * 100) / 100) + ' m3'
           + '\nChargeable weight ' + kg(ch)
           + '\nDivisor ' + state.divisor.toLocaleString('en-GB');
    }

    // ------------------------------------------------------------- controls
    function sync() {
      var L = state.imperial ? ['Length, in', 'Width, in', 'Height, in', 'Weight each, lb']
                             : ['Length, cm', 'Width, cm', 'Height, cm', 'Weight each, kg'];
      Array.prototype.forEach.call(rowsBox.children, function (line) {
        ['L', 'W', 'H', 'k'].forEach(function (d, i2) {
          var s2 = line.querySelector('.cw-f-' + d + ' span');
          if (s2) s2.textContent = L[i2];
        });
      });
    }

    root.querySelectorAll('[data-cw-div]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.divisor = +b.getAttribute('data-cw-div');
        root.querySelectorAll('[data-cw-div]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        recalc();
      });
    });
    root.querySelectorAll('[data-cw-unit]').forEach(function (b) {
      b.addEventListener('click', function () {
        var want = b.getAttribute('data-cw-unit') === 'in';
        if (want === state.imperial) return;
        // convert what is already typed rather than throwing it away
        Array.prototype.forEach.call(rowsBox.children, function (line) {
          var f = line._f;
          ['L', 'W', 'H'].forEach(function (d) {
            var v = +f[d].value || 0;
            f[d].value = v ? Math.round((want ? v / CM : v * CM) * 10) / 10 : 0;
          });
          var w = +f.k.value || 0;
          f.k.value = w ? Math.round((want ? w / LB : w * LB) * 10) / 10 : 0;
        });
        state.imperial = want;
        root.querySelectorAll('[data-cw-unit]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        sync(); recalc();
      });
    });

    if (addBtn) addBtn.addEventListener('click', function () { addRow(0); });

    var copy = $('cwCopy', root);
    if (copy) copy.addEventListener('click', function () {
      var t = window.__cwSummary || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () {
          copy.textContent = 'Copied'; setTimeout(function () {
            copy.textContent = 'Copy the summary'; }, 1800);
        });
      }
    });
    var wa = $('cwWa', root);
    if (wa) wa.addEventListener('click', function () {
      var base = wa.getAttribute('data-wa');
      wa.setAttribute('href', base + encodeURIComponent('\n\n' + (window.__cwSummary || '')));
    });

    var preset = parseInt(root.getAttribute('data-cw-preset'), 10);
    addRow(isNaN(preset) ? 0 : preset);
    recalc();
  }

  function boot() {
    document.querySelectorAll('[data-fwa-cw]').forEach(init);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
