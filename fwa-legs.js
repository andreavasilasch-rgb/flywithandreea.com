/* Fly with Andreea, the leg card. Built by build_shared.py, do not edit by hand.
 *
 * The empty legs page and every route page draw their cards from this one file,
 * so a card fixed in one place is fixed in both. It needs 2 things on the page:
 * window.FWA_EL, the leg data, and fwa-legs.css.
 *
 * It exposes window.FWA_LEGS: card(leg) returns the markup for 1 card, wire()
 * starts the photo galleries inside whatever has just been drawn, and
 * openDetail(id) and openQuote(id) open the 2 modals. The modals are created
 * here when the page does not already carry them, so a route page needs no
 * extra markup at all.
 */
(function () {
  if (!window.FWA_EL) return;
  var D = window.FWA_EL;
  var L = D.legs, AP = D.airports, AC = D.aircraft;

  function shell(id, boxId, label) {
    if (document.getElementById(id)) return;
    var m = document.createElement('div');
    m.className = 'fl-modal fwa-legs';
    m.id = id;
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-label', label);
    m.innerHTML = '<div class="fl-modal-bg" data-close></div>'
      + '<div class="fl-sheetbox" id="' + boxId + '"></div>';
    document.body.appendChild(m);
  }
  shell('fwaDetail', 'fwaDetailBox', 'Flight detail');
  shell('fwaQuote', 'fwaQuoteBox', 'Request this flight');

  /* ------------------------------------------------------------------- art */
  var ART = {
    ext1: '<svg viewBox="0 0 300 210" preserveAspectRatio="xMidYMid slice">'
      + '<defs><linearGradient id="fwaG1" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#E4E0D9"/><stop offset="1" stop-color="#F2EFE9"/>'
      + '</linearGradient></defs><rect width="300" height="210" fill="url(#fwaG1)"/>'
      + '<rect y="146" width="300" height="64" fill="#DED8CE"/>'
      + '<g fill="#FBFBFA" stroke="#C9C3B8" stroke-width=".8">'
      + '<path d="M62 128 L206 128 Q225 128 231 122 L244 114 Q248 111 244 109 L225 109'
      + ' L206 118 L126 118 L109 104 L97 104 L105 118 L70 118 Q60 120 62 128z"/>'
      + '<path d="M158 118 L185 92 L196 92 L179 118z"/>'
      + '<path d="M145 128 L134 146 L143 146 L158 130z"/></g>'
      + '<g fill="#CBAD91"><circle cx="118" cy="114" r="2.2"/><circle cx="130" cy="114" r="2.2"/>'
      + '<circle cx="142" cy="114" r="2.2"/><circle cx="154" cy="114" r="2.2"/>'
      + '<circle cx="166" cy="114" r="2.2"/></g>'
      + '<ellipse cx="148" cy="148" rx="80" ry="5" fill="#000" opacity=".07"/></svg>',
    ext2: '<svg viewBox="0 0 300 210" preserveAspectRatio="xMidYMid slice">'
      + '<rect width="300" height="210" fill="#EDE8DF"/>'
      + '<rect y="142" width="300" height="68" fill="#D8D1C6"/>'
      + '<g fill="#FBFBFA" stroke="#C9C3B8" stroke-width=".8">'
      + '<path d="M32 124 L225 124 Q250 124 260 116 L275 106 L248 106 L225 114 L126 114'
      + ' L105 96 L90 96 L103 114 L42 114 Q27 117 32 124z"/>'
      + '<path d="M168 114 L202 84 L214 84 L191 114z"/></g>'
      + '<g fill="#CBAD91" opacity=".85"><circle cx="124" cy="110" r="2"/>'
      + '<circle cx="136" cy="110" r="2"/><circle cx="148" cy="110" r="2"/>'
      + '<circle cx="160" cy="110" r="2"/><circle cx="172" cy="110" r="2"/>'
      + '<circle cx="184" cy="110" r="2"/></g>'
      + '<ellipse cx="148" cy="144" rx="96" ry="5" fill="#000" opacity=".07"/></svg>',
    ext3: '<svg viewBox="0 0 300 210" preserveAspectRatio="xMidYMid slice">'
      + '<rect width="300" height="210" fill="#E8E4DE"/>'
      + '<rect y="152" width="300" height="58" fill="#DBD5CA"/>'
      + '<g fill="#F8F7F4" stroke="#C9C3B8" stroke-width=".8">'
      + '<path d="M44 136 L196 136 Q216 136 224 129 L240 119 L218 119 L198 127 L116 127'
      + ' L96 110 L84 110 L94 127 L54 127 Q44 129 44 136z"/>'
      + '<path d="M150 127 L180 100 L191 100 L172 127z"/></g>'
      + '<g fill="#BBB3A6" opacity=".5"><rect x="0" y="150" width="300" height="2"/></g>'
      + '<ellipse cx="140" cy="154" rx="84" ry="5" fill="#000" opacity=".06"/></svg>',
    int1: '<svg viewBox="0 0 300 210" preserveAspectRatio="xMidYMid slice">'
      + '<defs><linearGradient id="fwaG2" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#F4F0E9"/><stop offset="1" stop-color="#E0D9CD"/>'
      + '</linearGradient></defs><rect width="300" height="210" fill="url(#fwaG2)"/>'
      + '<path d="M0 0 L300 0 L300 30 Q150 46 0 30z" fill="#EEE9E0"/>'
      + '<g fill="#F7F3EC" stroke="#CFC6B8" stroke-width=".8">'
      + '<rect x="26" y="84" width="48" height="62" rx="10"/>'
      + '<rect x="90" y="84" width="48" height="62" rx="10"/>'
      + '<rect x="162" y="84" width="48" height="62" rx="10"/>'
      + '<rect x="226" y="84" width="48" height="62" rx="10"/></g>'
      + '<rect x="138" y="102" width="24" height="34" rx="3" fill="var(--ink-2)" opacity=".55"/>'
      + '<g fill="#E2DDD4" stroke="#CFC7BA" stroke-width=".7">'
      + '<ellipse cx="50" cy="56" rx="16" ry="11"/><ellipse cx="114" cy="56" rx="16" ry="11"/>'
      + '<ellipse cx="186" cy="56" rx="16" ry="11"/><ellipse cx="250" cy="56" rx="16" ry="11"/></g>'
      + '<rect y="182" width="300" height="28" fill="#6E6257" opacity=".22"/></svg>',
    int2: '<svg viewBox="0 0 300 210" preserveAspectRatio="xMidYMid slice">'
      + '<rect width="300" height="210" fill="#F1ECE4"/>'
      + '<path d="M0 0 L300 0 L300 26 Q150 40 0 26z" fill="#E7E1D7"/>'
      + '<g fill="#F9F5EE" stroke="#CFC6B8" stroke-width=".8">'
      + '<rect x="20" y="72" width="54" height="68" rx="11"/>'
      + '<rect x="84" y="72" width="54" height="68" rx="11"/></g>'
      + '<rect x="150" y="92" width="84" height="30" rx="4" fill="#A98A66" opacity=".6"/>'
      + '<rect x="150" y="122" width="84" height="6" rx="2" fill="#8A6E4E" opacity=".5"/>'
      + '<g fill="#E2DDD4" stroke="#CFC7BA" stroke-width=".7">'
      + '<ellipse cx="46" cy="46" rx="17" ry="12"/><ellipse cx="112" cy="46" rx="17" ry="12"/>'
      + '<ellipse cx="192" cy="46" rx="17" ry="12"/></g>'
      + '<rect y="178" width="300" height="32" fill="#6E6257" opacity=".2"/></svg>',
    int3: '<svg viewBox="0 0 300 210" preserveAspectRatio="xMidYMid slice">'
      + '<rect width="300" height="210" fill="#EEE9E0"/>'
      + '<path d="M0 0 L300 0 L300 34 Q150 50 0 34z" fill="#E5DED3"/>'
      + '<g fill="#FAF7F1" stroke="#CFC6B8" stroke-width=".8">'
      + '<rect x="34" y="90" width="68" height="56" rx="12"/>'
      + '<rect x="116" y="90" width="68" height="56" rx="12"/>'
      + '<rect x="198" y="90" width="68" height="56" rx="12"/></g>'
      + '<g fill="#E2DDD4" stroke="#CFC7BA" stroke-width=".7">'
      + '<ellipse cx="68" cy="62" rx="18" ry="12"/><ellipse cx="150" cy="62" rx="18" ry="12"/>'
      + '<ellipse cx="232" cy="62" rx="18" ry="12"/></g>'
      + '<rect y="180" width="300" height="30" fill="#6E6257" opacity=".2"/></svg>',
    plan: '<svg viewBox="0 0 300 210" preserveAspectRatio="xMidYMid slice">'
      + '<rect width="300" height="210" fill="#FBFAF8"/>'
      + '<g stroke="#CBAD91" stroke-width="1.4" fill="none">'
      + '<path d="M38 105 Q38 70 76 68 L226 68 Q262 72 270 105 Q262 138 226 142 L76 142'
      + ' Q38 140 38 105z"/></g>'
      + '<g fill="none" stroke="#B9B2A6" stroke-width="1">'
      + '<rect x="92" y="78" width="23" height="21" rx="5"/>'
      + '<rect x="92" y="112" width="23" height="21" rx="5"/>'
      + '<rect x="127" y="78" width="23" height="21" rx="5"/>'
      + '<rect x="127" y="112" width="23" height="21" rx="5"/>'
      + '<rect x="170" y="78" width="23" height="21" rx="5"/>'
      + '<rect x="170" y="112" width="23" height="21" rx="5"/>'
      + '<rect x="205" y="78" width="23" height="21" rx="5"/>'
      + '<rect x="205" y="112" width="23" height="21" rx="5"/>'
      + '<rect x="115" y="103" width="32" height="6" rx="2"/>'
      + '<rect x="193" y="103" width="32" height="6" rx="2"/>'
      + '<path d="M236 82 L262 82 L262 128 L236 128"/></g>'
      + '<text x="249" y="108" font-family="-apple-system,sans-serif" font-size="7.5"'
      + ' fill="#86868B" text-anchor="middle">LAV</text>'
      + '<text x="58" y="108" font-family="-apple-system,sans-serif" font-size="7.5"'
      + ' fill="#86868B" text-anchor="middle">GALLEY</text></svg>'
  };
  var SLIDES = [
    ['ext1','Exterior'],['ext2','Exterior'],['ext3','Exterior'],
    ['int1','Interior'],['int2','Interior'],['int3','Interior'],['plan','Floorplan']
  ];

  var ICON = {
    plane: '<svg viewBox="0 0 24 24"><g transform="rotate(90 12 12)">'
      + '<path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2'
      + ' 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>'
      + '</g></svg>',
    /* the same aircraft, nose up, so it can be turned to any heading */
    planeup: '<svg viewBox="0 0 24 24">'
      + '<path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2'
      + ' 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>'
      + '</svg>',
    wifi: '<svg viewBox="0 0 24 24"><path d="M12 21l-3.5-4.4a4.5 4.5 0 017 0zM5 13.5a11 11 0'
      + ' 0114 0l-1.6 2A8.4 8.4 0 006.6 15.5zM1.5 9.4a16 16 0 0121 0l-1.6 2a13.4 13.4 0 00-17.8 0z"/></svg>',
    lav: '<svg viewBox="0 0 24 24"><path d="M7 4h10v7H7zm-2 9h14v7H5z"/></svg>',
    pets: '<svg viewBox="0 0 24 24"><path d="M4.5 9a2 2 0 110-4 2 2 0 010 4zm5-2a2 2 0 110-4 2 2 0'
      + ' 010 4zm5 0a2 2 0 110-4 2 2 0 010 4zm5 2a2 2 0 110-4 2 2 0 010 4zM12 11c3 0 6 3.4 6 6a3 3 0'
      + ' 01-3 3c-1 0-2-.6-3-.6s-2 .6-3 .6a3 3 0 01-3-3c0-2.6 3-6 6-6z"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M3 7h13v10H3zm15 3h3l-2 4h-1z"/></svg>',
    fa: '<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-8 2-8 5v1h16v-1'
      + 'c0-3-4-5-8-5z"/></svg>',
    tick: '<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><path d="M17 9V7a5 5 0 00-10 0v2H5v12h14V9zm-8-2a3 3 0 016 0v2H9z"/></svg>'
  };


  /* --------------------------------------------------------------- helpers */
  /* --------------------------------------------------------- no duplicates
   * Operators release the same leg through more than one channel, so a feed of
   * 200 arrives carrying the same flight twice or three times. Two identical
   * cards one above the other make the whole list look careless, and the count
   * at the top becomes a lie.
   *
   * The same flight means: the same 2 airports, the same day, the same type of
   * aircraft. Not the same record, because the duplicates come from different
   * sources and carry different ids.
   *
   * Of a set of duplicates the one kept is the one a customer would rather see:
   * a leg with a price beats one without, then the cheaper of the two, then the
   * one carrying photographs, then whichever came first. Nothing is thrown away
   * silently in a way that could lose the only priced copy.
   */
  /* The list starts tomorrow. Today has gone.
   *
   * A leg used to stay up for the whole of its departure day, on the
   * reasoning that a 07:00 repositioning can still be sold at 06:00. In
   * practice it cannot: the enquiry has to be read, the operator has to
   * confirm the leg is still free, and the passenger has to reach the
   * terminal. A flight leaving in a few hours is an enquiry that ends in an
   * apology, so same day flights are not offered at all.
   *
   * The page works this out from today, every time it loads, so a file
   * uploaded on Monday is still honest on Friday without being uploaded
   * again.
   */
  function todayKey(){
    var n = new Date();
    return n.getFullYear() * 10000 + (n.getMonth() + 1) * 100 + n.getDate();
  }
  function flown(legs){
    var t = todayKey();
    return legs.filter(function (l) { return (l.sk || 0) > t; });
  }

  /* days to departure is worked out here rather than carried in the file,
     where it was only ever right on the day the file was built */
  function daysOut(l){
    var s = String(l.sk), t = todayKey().toString();
    function at(k){ return Date.UTC(+k.slice(0,4), +k.slice(4,6) - 1, +k.slice(6)); }
    return Math.round((at(s) - at(t)) / 86400000);
  }

  function dedupe(legs){
    var best = {}, order = [];
    legs.forEach(function (l) {
      var a = AC[l.ac];
      var key = [l.f, l.t, l.sk, (a && a.t) || l.ac].join('|');
      var have = best[key];
      if (!have) { best[key] = l; order.push(key); return; }
      if (better(l, have)) best[key] = l;
    });
    return order.map(function (k) { return best[k]; });

    function better(x, y){
      if (!!x.price !== !!y.price) return !!x.price;      /* a price beats none */
      if (x.price && y.price && x.price !== y.price) return x.price < y.price;
      var px = (AC[x.ac] && AC[x.ac].pics || []).length;
      var py = (AC[y.ac] && AC[y.ac].pics || []).length;
      if (px !== py) return px > py;                      /* photographs next */
      return false;                                        /* otherwise the first */
    }
  }

  function esc(s){ return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function money(n){ return '€' + Number(n).toLocaleString('en-GB'); }
  function dur(l){ return l.hh + ' h ' + (l.mm < 10 ? '0' : '') + l.mm + ' min'; }

  /* A leg the operator will move within a few days has 2 dates. Written out in
   * full, "23 Oct 2026 to 26 Oct 2026" wraps onto 3 lines in a narrow column
   * and says the month and the year twice for no reason. So whatever the 2
   * dates have in common is said once, at the end:
   *
   *     23 to 26 Oct 2026          same month
   *     28 Oct to 2 Nov 2026       same year
   *     30 Dec 2026 to 2 Jan 2027  neither
   */
  /* What is actually included, and nothing else.
   *
   * The first 3 lines are true of every empty leg, because they are what an
   * empty leg is. Everything after them is read from the aircraft, and a blank
   * in the file means nobody has checked, which is not the same as a No. So a
   * blank writes no line at all. The page never ticks something it was not
   * told, and never fills the gap with a sentence about power sockets.
   */
  function included(a){
    var out = ['The entire aircraft, no seat sharing',
               'Crew, fuel, handling and landing fees',
               'Private terminal at both ends'];
    /* the aircraft has it; the connection itself is metered and billed by the
       operator, so the line says so rather than letting a tick under Included
       imply otherwise */
    if (a.wifi) out.push('Wi-Fi on board, billed separately');
    if (a.lav) out.push('A lavatory on board');
    if (a.fa === 'Yes') out.push('A flight attendant');
    else if (a.fa === 'On request') out.push('A flight attendant, on request');
    if (a.pets === 'Yes') out.push('Pets in the cabin');
    else if (a.pets === 'On request') out.push('Pets in the cabin, on request');
    if (a.bag === 'In flight') out.push('Your bags reachable during the flight');
    return out;
  }

  function dateSpan(l){
    if (!l.date2 || l.date2 === l.date) return l.date;
    var a = String(l.date).split(' '), b = String(l.date2).split(' ');
    if (a.length !== 3 || b.length !== 3) return l.date + ' to ' + l.date2;
    if (a[2] !== b[2]) return l.date + ' to ' + l.date2;
    if (a[1] !== b[1]) return a[0] + ' ' + a[1] + ' to ' + l.date2;
    return a[0] + ' to ' + l.date2;
  }
  function ac(l){ return AC[l.ac]; }

  /* ------------------------------------------------------------- the map
   * 3 ways to fill the map slot, tried in this order.
   *
   * 1. /map/OMDW-OTBD.png, the map Worker. It draws a route once and keeps it,
   *    so a route costs 1 Mapbox image however many legs fly it. The address is
   *    the route, not the leg, which is the whole point: 200 new legs a week on
   *    corridors that repeat need almost no new maps. The token lives on the
   *    Worker and never reaches the page.
   * 2. window.FWA_MAPBOX_TOKEN, which asks Mapbox directly. For a preview before
   *    the Worker is up. Never for the live site: it publishes the token.
   * 3. the drawn map below. The airports are in their true positions and the
   *    line is a true great circle, but there is no coastline.
   */
  var MAPS_BASE = window.FWA_MAPS_BASE || '/map/';

  function gcPath(l, n){
    var p1 = l.flat * Math.PI / 180, o1 = l.flon * Math.PI / 180;
    var p2 = l.tlat * Math.PI / 180, o2 = l.tlon * Math.PI / 180;
    var d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((p2 - p1) / 2), 2)
      + Math.cos(p1) * Math.cos(p2) * Math.pow(Math.sin((o2 - o1) / 2), 2)));
    var out = [];
    for (var i = 0; i <= n; i++) {
      var f = i / n;
      if (!d) { out.push([l.flon, l.flat]); continue; }
      var a = Math.sin((1 - f) * d) / Math.sin(d), b = Math.sin(f * d) / Math.sin(d);
      var x = a * Math.cos(p1) * Math.cos(o1) + b * Math.cos(p2) * Math.cos(o2);
      var y = a * Math.cos(p1) * Math.sin(o1) + b * Math.cos(p2) * Math.sin(o2);
      var z = a * Math.sin(p1) + b * Math.sin(p2);
      out.push([+(Math.atan2(y, x) * 180 / Math.PI).toFixed(4),
                +(Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI).toFixed(4)]);
    }
    return out;
  }
  /* Mapbox overlays have no dash pattern, so the line is many short lines */
  function mapboxURL(l, w, h, view){
    var token = window.FWA_MAPBOX_TOKEN;
    if (!token) return '';
    var pts = gcPath(l, 40), feats = [], i = 0;
    while (i < pts.length - 1) {
      var seg = pts.slice(i, i + 3);
      if (seg.length > 1) feats.push({ type: 'Feature',
        properties: { stroke: '#1D1D1F', 'stroke-width': 2, 'stroke-opacity': 0.85 },
        geometry: { type: 'LineString', coordinates: seg } });
      i += 4;
    }
    feats.push({ type: 'Feature',
      properties: { 'marker-color': '#1D1D1F', 'marker-size': 'small' },
      geometry: { type: 'Point', coordinates: [l.flon, l.flat] } });
    feats.push({ type: 'Feature',
      properties: { 'marker-color': '#CBAD91', 'marker-size': 'small' },
      geometry: { type: 'Point', coordinates: [l.tlon, l.tlat] } });
    var gj = encodeURIComponent(JSON.stringify(
      { type: 'FeatureCollection', features: feats }));
    /* the same centre and zoom the Worker is given, so a preview and the live
       site frame the picture identically and the aircraft sits in one place */
    var where = r4(view.lon) + ',' + r4(view.lat) + ',' + view.zoom.toFixed(2);
    return 'https://api.mapbox.com/styles/v1/mapbox/light-v11/static/geojson(' + gj
      + ')/' + where + '/' + Math.round(w) + 'x' + Math.round(h)
      + '@2x?access_token=' + token;
  }
  function r4(v){ return (Math.round(v * 1e4) / 1e4).toFixed(4); }

  /* ---------------------------------------------------------- the framing
   * The page works out the centre and the zoom rather than letting Mapbox fit
   * the route, for 2 reasons. It is the only way to know where on the picture
   * the half way point falls, which is where the aircraft goes. And it is what
   * lets the plus and minus buttons work: a step of zoom is just a different
   * number in the address.
   *
   * Web Mercator, the projection every slippy map uses. The world is a square
   * 512 pixels across at zoom 0 and doubles with every zoom level.
   */
  var TILE = 512;
  function merc(lat, lon){
    var s = Math.min(Math.max(Math.sin(lat * Math.PI / 180), -0.9999), 0.9999);
    return { x: (lon + 180) / 360,
             y: 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI) };
  }
  function unmerc(x, y){
    return { lon: x * 360 - 180,
             lat: 90 - 360 * Math.atan(Math.exp((y - 0.5) * 2 * Math.PI)) / Math.PI };
  }
  /* the same 3 rules the Worker uses when it frames a map itself */
  function routeBox(pts){
    var lons = pts.map(function (p) { return p[0]; });
    var lats = pts.map(function (p) { return p[1]; });
    var cLon = (Math.min.apply(null, lons) + Math.max.apply(null, lons)) / 2;
    var cLat = (Math.min.apply(null, lats) + Math.max.apply(null, lats)) / 2;
    var sLon = Math.max((Math.max.apply(null, lons) - Math.min.apply(null, lons)) * 1.3, 16);
    var sLat = Math.max((Math.max.apply(null, lats) - Math.min.apply(null, lats)) * 1.3, 9);
    return { w: cLon - sLon / 2, e: cLon + sLon / 2,
             s: Math.max(-82, cLat - sLat / 2), n: Math.min(82, cLat + sLat / 2) };
  }
  function mapView(l, w, h, step){
    var pts = gcPath(l, 40);
    var b = routeBox(pts);
    var sw = merc(b.s, b.w), ne = merc(b.n, b.e);
    var dx = Math.abs(ne.x - sw.x), dy = Math.abs(sw.y - ne.y);
    /* the zoom at which the box just fits the picture */
    var z = Math.log2(Math.min(w / (dx * TILE), h / (dy * TILE)));
    z = Math.max(0.5, Math.min(16, z + (step || 0)));
    var c = unmerc((sw.x + ne.x) / 2, (sw.y + ne.y) / 2);
    return { lat: c.lat, lon: c.lon, zoom: Math.round(z * 100) / 100, pts: pts };
  }
  /* where the half way point lands on the picture, and which way it is heading */
  function mapPlane(view, w, h){
    var pts = view.pts, i = Math.floor(pts.length / 2);
    var scale = TILE * Math.pow(2, view.zoom);
    var c = merc(view.lat, view.lon);
    var at = function (p) {
      var m = merc(p[1], p[0]);
      return { x: (m.x - c.x) * scale + w / 2, y: (m.y - c.y) * scale + h / 2 };
    };
    var mid = at(pts[i]);
    var a = at(pts[Math.max(0, i - 2)]), b = at(pts[Math.min(pts.length - 1, i + 2)]);
    /* 0 degrees is nose up, and the picture's y grows downwards */
    var deg = Math.atan2(b.x - a.x, a.y - b.y) * 180 / Math.PI;
    /* as a share of the picture, so it stays in place at any size on screen */
    return { x: +(mid.x / w * 100).toFixed(2), y: +(mid.y / h * 100).toFixed(2),
             deg: Math.round(deg) };
  }

  /* the Worker's address for a route and a framing. Every number is rounded, so
     the same route at the same zoom always asks for the same picture and that
     picture is only ever drawn once. */
  function workerMapURL(l, view, w, h){
    return MAPS_BASE + encodeURIComponent(l.f) + '-' + encodeURIComponent(l.t)
      + '.png?f=' + r4(l.flat) + ',' + r4(l.flon)
      + '&t=' + r4(l.tlat) + ',' + r4(l.tlon)
      + '&c=' + r4(view.lat) + ',' + r4(view.lon)
      + '&z=' + view.zoom.toFixed(2)
      /* the slot's own shape, so the picture matches it and the aircraft drawn
         on top lands where it should */
      + '&s=' + Math.round(w) + 'x' + Math.round(h);
  }

  function mapHTML(l, w, h){
    var canWorker = window.FWA_MAP_WORKER !== false && l.f && l.t
      && isFinite(l.flat) && isFinite(l.tlat);
    var view = mapView(l, w, h, 0);
    if (!canWorker && !window.FWA_MAPBOX_TOKEN) return mapSVG(l, w, h, view);
    var src = canWorker ? workerMapURL(l, view, w, h) : mapboxURL(l, w, h, view);
    var p = mapPlane(view, w, h);

    /* The drawn map sits underneath. If the Worker is not up yet, or the map
       service has a bad minute, the picture removes itself and the drawn one
       shows through, so the preview is never a broken image. */
    return '<span class="fl-maplayer" data-map="' + l.id + '"'
      + ' data-w="' + w + '" data-h="' + h + '" data-step="0">'
      + mapSVG(l, w, h, view)
      /* Loaded at once, never lazily. The map is built inside the preview
         while the preview is still hidden, so a lazy picture is deferred
         and never reconsidered: it stayed blank for as long as the panel
         was open. It is 1 picture, and only when somebody opens a flight. */
      + '<img class="fl-mapimg" src="' + esc(src) + '" alt="' + esc(l.fc)
      + ' to ' + esc(l.tc) + '" loading="eager" decoding="async"'
      + ' onerror="this.remove()">'
      + '<span class="fl-mapplane" style="left:' + p.x + '%;top:' + p.y + '%;'
      + 'transform:translate(-50%,-50%) rotate(' + p.deg + 'deg)">'
      + ICON.planeup + '</span>'
      + '<span class="fl-mapzoom">'
      + '<button type="button" data-zoom="1" aria-label="Zoom in">'
      + '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>'
      + '<button type="button" data-zoom="-1" aria-label="Zoom out">'
      + '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>'
      + '</span></span>';
  }

  /* the plus and minus buttons. A step is only a different number in the
     address, and each step is drawn once and then cached like any other. */
  function wireMaps(root){
    var box = root || document;
    [].forEach.call(box.querySelectorAll('.fl-maplayer'), function (m) {
      if (m.__w) return; m.__w = 1;
      var l = byId(m.getAttribute('data-map'));
      if (!l) return;
      var w = +m.getAttribute('data-w'), h = +m.getAttribute('data-h');
      m.addEventListener('click', function (e) {
        var b = e.target.closest('[data-zoom]');
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        var step = (+m.getAttribute('data-step') || 0) + (+b.getAttribute('data-zoom'));
        step = Math.max(-3, Math.min(5, step));
        m.setAttribute('data-step', step);
        var view = mapView(l, w, h, step);
        var img = m.querySelector('.fl-mapimg');
        if (img) img.src = (window.FWA_MAP_WORKER === false)
          ? mapboxURL(l, w, h, view) : workerMapURL(l, view, w, h);
        /* the drawing underneath is redrawn as well, so that if the picture
           fails to load at this zoom the route is still under the aircraft */
        var old = m.querySelector('svg');
        if (old) {
          var tmp = document.createElement('div');
          tmp.innerHTML = mapSVG(l, w, h, view);
          m.replaceChild(tmp.firstChild, old);
        }
        var p = mapPlane(view, w, h);
        var pl = m.querySelector('.fl-mapplane');
        if (pl) {
          pl.style.left = p.x + '%';
          pl.style.top = p.y + '%';
          pl.style.transform = 'translate(-50%,-50%) rotate(' + p.deg + 'deg)';
        }
        [].forEach.call(m.querySelectorAll('[data-zoom]'), function (x) {
          var d = +x.getAttribute('data-zoom');
          x.disabled = (d > 0 && step >= 5) || (d < 0 && step <= -3);
        });
      });
    });
  }

  /* the map, drawn from the 2 coordinates, when there is no real one to show */
  function mapSVG(l, w, h, view){
    w = w || 760; h = h || 300;
    /* The same projection the real map uses, and the same framing, so the route
       drawn here lands exactly where the route on the real map lands. The
       aircraft is drawn over the top of both, and has to sit on the line in
       either case. An invented curve put the aircraft off the route. */
    view = view || mapView(l, w, h, 0);
    var pts = view.pts;
    var scale = TILE * Math.pow(2, view.zoom);
    var c = merc(view.lat, view.lon);
    function at(lat, lon){
      var m = merc(lat, lon);
      return { x: (m.x - c.x) * scale + w / 2, y: (m.y - c.y) * scale + h / 2 };
    }
    var a = at(l.flat, l.flon), b = at(l.tlat, l.tlon);

    var grid = '';
    for (var g = -180; g <= 180; g += 5) {
      var gx = at(0, g).x;
      if (gx > 4 && gx < w - 4)
        grid += '<line x1="' + gx.toFixed(1) + '" y1="0" x2="' + gx.toFixed(1) + '" y2="' + h
              + '" stroke="#E8E8ED" stroke-width=".6" opacity=".55"/>';
    }
    for (var k = -80; k <= 80; k += 5) {
      var gy = at(k, 0).y;
      if (gy > 4 && gy < h - 4)
        grid += '<line x1="0" y1="' + gy.toFixed(1) + '" x2="' + w + '" y2="' + gy.toFixed(1)
              + '" stroke="#E8E8ED" stroke-width=".6" opacity=".55"/>';
    }

    /* the great circle itself, point by point, not a curve that looks like one */
    var d = '';
    for (var i = 0; i < pts.length; i++) {
      var q = at(pts[i][1], pts[i][0]);
      d += (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
    }

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">'
      + '<rect width="' + w + '" height="' + h + '" fill="#F5F5F7"/>' + grid
      + '<path d="' + d + '" fill="none" stroke="#1D1D1F" stroke-width="1.8"'
      + ' stroke-dasharray="7 6" opacity=".78"/>'
      /* No aircraft here. It is drawn over the top of the map instead, so that
         it is in one place whether this drawing or the real map is showing. */
      + pin(a.x, a.y, l.f, l.fc, '#1D1D1F', a.y > h / 2)
      + pin(b.x, b.y, l.t, l.tc, '#CBAD91', b.y > h / 2)
      + '</svg>';

    function pin(x, y, code, city, col, below){
      var ty = below ? y - 20 : y + 26, cy = below ? y - 33 : y + 39;
      return '<g><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7.5" fill="' + col
        + '"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.8" fill="#fff"/>'
        + '<text x="' + x.toFixed(1) + '" y="' + ty.toFixed(1) + '" font-family="-apple-system,sans-serif"'
        + ' font-size="13" font-weight="600" fill="#1D1D1F" text-anchor="middle">'
        + esc(city.toUpperCase()) + '</text>'
        + '<text x="' + x.toFixed(1) + '" y="' + cy.toFixed(1) + '" font-family="-apple-system,sans-serif"'
        + ' font-size="10.5" letter-spacing="1.5" fill="#6E6E73" text-anchor="middle">'
        + esc(code) + '</text></g>';
    }
  }

  /* ------------------------------------------------------------- the card */
  /* Where the photographs live: /legs/<Aircraft ID>/exterior-1.jpg and so on. A
   * page that is not served from the site root can point this somewhere else by
   * setting window.FWA_PICS_BASE before this file loads. */
  var PICS_BASE = window.FWA_PICS_BASE || '/legs/';
  var CAPTION = { exterior: 'Exterior', interior: 'Interior', floorplan: 'Floorplan' };

  /* The caption is the slot word in the file name: exterior, interior or
     floorplan, wherever in the name it sits. */
  function picCaption(name){
    var m = /(exterior|interior|floorplan)/i.exec(String(name));
    return (m && CAPTION[m[1].toLowerCase()]) || 'Photo';
  }
  /* ------------------------------- photographs that arrive after deployment
   *
   * An aircraft with no photographs today still carries the names its
   * photographs will have, worked out from the spreadsheet's own naming rule.
   * The card is drawn flat, because that is the truth at the moment it is
   * drawn. Then, once, it asks the folder whether those files have appeared.
   *
   * The moment the files are sitting in /aircraft-photos/ the card becomes a
   * gallery on the next page view. No rebuild, no redeploy of the page, no
   * list to keep in step.
   *
   * It asks for at most 3: the first exterior, the first interior, the
   * floorplan. One of those existing is enough to know the set is there, and
   * the gallery drops any of the rest that are not. It asks only about the
   * aircraft on cards that have actually been drawn, and only once each, so
   * a page of 8 cards costs at most 8 of these, in the background, after the
   * page is already usable.
   */
  var ASKED = {};
  function firstOfEachSlot(want){
    var seen = {}, out = [];
    (want || []).forEach(function (n) {
      var m = /(exterior|interior|floorplan)/i.exec(n);
      var k = m ? m[1].toLowerCase() : 'other';
      if (!seen[k]) { seen[k] = 1; out.push(n); }
    });
    return out;
  }
  function lookForPhotographs(root){
    if (window.FWA_PICS_MAP) return;          /* a preview carries its own */
    var seen = {};
    [].forEach.call((root || document).querySelectorAll('.fl-leg[data-ac]'), function (card) {
      var id = card.getAttribute('data-ac');
      if (!id || seen[id] || ASKED[id]) return;
      seen[id] = 1;
      var a = AC[id];
      if (!a || (a.pics && a.pics.length) || !(a.want && a.want.length)) return;
      ASKED[id] = 1;
      var tries = firstOfEachSlot(a.want), i = 0;
      (function next(){
        if (i >= tries.length) return;
        var probe = new Image();
        probe.onload = function () {
          /* they are there. The card redraws as a gallery, and any name in
             the set that is still missing drops out of it by itself. */
          a.pics = a.want.slice();
          delete a.want;
          if (typeof render === 'function') render();
        };
        probe.onerror = function () { i++; next(); };
        probe.src = PICS_BASE + tries[i];
      }());
    });
  }

  function slidesFor(l){
    var a = ac(l);
    var own = (l.pics && l.pics.length) ? l.pics : (a && a.pics) || [];
    if (!own.length) return null;
    /* a preview that has to stand on its own can carry the pictures inside it:
       window.FWA_PICS_MAP maps the path to whatever should be used instead */
    var map = window.FWA_PICS_MAP;
    return own.map(function (n) {
      /* a name carrying its own extension is a file in the photographs folder
         exactly as it is on disk. A bare name is the older per aircraft folder
         and is still read, so nothing that already works stops working. */
      var src = /\.(jpe?g|png|webp)$/i.test(n)
        ? PICS_BASE + n
        : PICS_BASE + (l.picdir || l.ac) + '/' + n + '.jpg';
      return { src: (map && map[src]) || src, cap: picCaption(n),
               alt: picCaption(n) + ' of the ' + ((a && a.t) || 'aircraft') };
    });
  }

  function galleryHTML(id, l){
    var real = l ? slidesFor(l) : null;
    var slides = real || SLIDES.map(function (sl) { return { art: sl[0], cap: sl[1] }; });
    var s = '<div class="fl-gal" data-gal="' + id + '"><div class="fl-gal-track">';
    slides.forEach(function (sl, i) {
      s += '<div class="fl-gal-slide">'
        + (sl.src
           ? '<img src="' + esc(sl.src) + '" alt="' + esc(sl.alt || '')
             + '" loading="' + (i ? 'lazy' : 'eager')
             + '" decoding="async" onerror="this.closest(\'.fl-gal-slide\').remove()">'
           : ART[sl.art])
        + '<span class="fl-gal-cap">' + esc(sl.cap) + '</span></div>';
    });
    var n = slides.length;
    s += '</div><button class="fl-fav" type="button" data-fav="' + id + '" aria-label="Save">'
      + '<svg viewBox="0 0 24 24"><path d="M12 20.5 3.8 12.3a4.9 4.9 0 0 1 7-7l1.2 1.3 1.2-1.3'
      + 'a4.9 4.9 0 0 1 7 7z"/></svg></button>'
      + '<button class="fl-gal-ar fl-l" type="button" aria-label="Previous">'
      + '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>'
      + '<button class="fl-gal-ar fl-r" type="button" aria-label="Next">'
      + '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></button>'
      + '<span class="fl-gal-n">1 / ' + n + '</span><span class="fl-gal-dots">';
    for (var i = 0; i < n; i++) s += '<i' + (i ? '' : ' class="fl-on"') + '></i>';
    return s + '</span></div>';
  }

  function wireGalleries(){
    [].forEach.call(document.querySelectorAll('.fl-gal'), function (g) {
      if (g.__w) return; g.__w = 1;
      var tr = g.querySelector('.fl-gal-track'), sl = g.querySelectorAll('.fl-gal-slide');
      var num = g.querySelector('.fl-gal-n'), dots = g.querySelectorAll('.fl-gal-dots i');
      function at(){ return Math.round(tr.scrollLeft / tr.clientWidth); }
      function paint(){
        var i = Math.max(0, Math.min(sl.length - 1, at()));
        num.textContent = (i + 1) + ' / ' + sl.length;
        for (var k = 0; k < dots.length; k++) dots[k].className = (k === i ? 'fl-on' : '');
      }
      function go(d, e){ e.preventDefault(); e.stopPropagation();
        tr.scrollTo({ left: (at() + d) * tr.clientWidth, behavior: 'smooth' }); }
      g.querySelector('.fl-gal-ar.fl-l').addEventListener('click', function (e) { go(-1, e); });
      g.querySelector('.fl-gal-ar.fl-r').addEventListener('click', function (e) { go(1, e); });
      tr.addEventListener('scroll', paint);
    });
  }

  function routeHTML(l, big){
    /* A 3 row grid rather than 2 stacked blocks. The code, the city and the
       country each get their own row, shared by both sides, so the 2 columns
       line up whatever the names are. Every cell is 1 line, cut with an
       ellipsis if it has to be, which is what keeps it symmetrical when
       United Arab Emirates sits opposite Qatar. */
    var cls = big ? 'fl-route fl-route-big' : 'fl-route';
    var sub = big ? [l.ff, l.tf] : [l.fy, l.ty];
    return '<div class="' + cls + '">'
     + '<span class="fl-r-code fl-a">' + esc(l.f) + '</span>'
     + '<span class="fl-r-code fl-b">' + esc(l.t) + '</span>'
     + '<span class="fl-r-city fl-a" title="' + esc(l.fc) + '">' + esc(l.fc) + '</span>'
     + '<span class="fl-r-city fl-b" title="' + esc(l.tc) + '">' + esc(l.tc) + '</span>'
     + '<span class="fl-r-sub fl-a" title="' + esc(sub[0]) + '">' + esc(sub[0]) + '</span>'
     + '<span class="fl-r-sub fl-b" title="' + esc(sub[1]) + '">' + esc(sub[1]) + '</span>'
     + '<div class="fl-r-mid"><div class="fl-line"><span class="fl-bar2"></span>'
     + '<span class="fl-dot fl-a"></span><span class="fl-dot fl-b"></span>'
     + '<span class="fl-pl">' + ICON.plane + '</span></div>'
     + '<div class="fl-dur"><span>' + dur(l) + '</span><span class="fl-sep"> &middot; </span>'
     + '<span>' + l.nm + ' nm</span></div></div>'
     + '</div>';
  }

  function priceHTML(l){
    return '<div class="fl-price' + (l.price ? '' : ' fl-ask') + '">'
      + (l.price ? money(l.price) : 'Price on request') + '</div>'
      + '<div class="fl-per">Entire aircraft</div>';
  }

  /* Not every leg comes with photographs of the aircraft. A leg with none gets
   * the same card with the picture column taken out and the height cut to match,
   * rather than a grey box apologising for itself. */
  function hasPics(l){
    var a = ac(l);
    return !!((l.pics && l.pics.length) || (a && a.pics && a.pics.length));
  }
  function favHTML(id){
    return '<button class="fl-fav fl-solo" type="button" data-fav="' + id + '" aria-label="Save">'
      + '<svg viewBox="0 0 24 24"><path d="M12 20.5 3.8 12.3a4.9 4.9 0 0 1 7-7l1.2 1.3 1.2-1.3'
      + 'a4.9 4.9 0 0 1 7 7z"/></svg></button>';
  }
  function cardHTML(l){
    if (!hasPics(l)) return cardFlat(l);
    var a = ac(l);
    return '<article class="fl-leg" data-id="' + l.id + '" data-ac="' + l.ac
     + '" tabindex="0" role="button"'
     + ' aria-label="' + esc(l.fc) + ' to ' + esc(l.tc) + ', ' + esc(l.date)
     + ', see the details and photos">'
     + '<div class="fl-leg-main">' + galleryHTML(l.id, l)
     + '<div class="fl-mid">'
     + routeHTML(l, false)
     + '<div class="fl-meta">'
     + '<span class="fl-m1"><b>' + esc(l.date) + '</b>'
     + (l.time ? ' &middot; ' + esc(l.time) : '') + '</span>'
     + (l.flex ? '<span class="fl-flexi">Flexible</span>' : '')
     + '<span class="fl-dotsep"></span>'
     + '<span class="fl-m2">' + esc(a.t) + '</span>'
     + '<span class="fl-dotsep"></span>'
     + '<span class="fl-m3">' + esc(a.cat) + ', up to ' + a.pax + '</span>'
     + '</div></div>'
     + '<div class="fl-rail"><div class="fl-money">' + priceHTML(l) + '</div>'
     + '<div class="fl-acts">'
     + '<button class="fl-btn fl-ghost" type="button" data-detail="' + l.id + '">View</button>'
     + '<button class="fl-btn" type="button" data-book="' + l.id + '">Book now</button>'
     + '</div></div></div></article>';
  }

  /* The same card with the picture column removed. Every other part is identical,
   * in the same order, at the same sizes, so a list of the 2 kinds reads as one
   * list. The height comes down from 145 to 88 because the picture was the only
   * thing asking for the extra. The heart moves to the corner of the card, since
   * it used to live on the photograph. */
  function cardFlat(l){
    var a = ac(l);
    return '<article class="fl-leg fl-nopic" data-id="' + l.id + '" data-ac="' + l.ac
     + '" tabindex="0" role="button"'
     + ' aria-label="' + esc(l.fc) + ' to ' + esc(l.tc) + ', ' + esc(l.date)
     + ', see the details">'
     + '<div class="fl-leg-main">'
     /* the heart takes a narrow column of its own on the left, where the
        photograph would have been. Over the card it lands on a city name, and in
        the price column it lands on the price. */
     + favHTML(l.id)
     + '<div class="fl-mid">'
     + routeHTML(l, false)
     + '<div class="fl-meta">'
     + '<span class="fl-m1"><b>' + esc(l.date) + '</b>'
     + (l.time ? ' &middot; ' + esc(l.time) : '') + '</span>'
     + (l.flex ? '<span class="fl-flexi">Flexible</span>' : '')
     + '<span class="fl-dotsep"></span>'
     + '<span class="fl-m2">' + esc(a.t) + '</span>'
     + '<span class="fl-dotsep"></span>'
     + '<span class="fl-m3">' + esc(a.cat) + ', up to ' + a.pax + '</span>'
     + '</div></div>'
     + '<div class="fl-rail">'
     + '<div class="fl-money">' + priceHTML(l) + '</div>'
     + '<div class="fl-acts">'
     + '<button class="fl-btn fl-ghost" type="button" data-detail="' + l.id + '">View</button>'
     + '<button class="fl-btn" type="button" data-book="' + l.id + '">Book now</button>'
     + '</div></div>'
     + '</div></article>';
  }


  /* ---------------------------------------------------------- route preview */
  function detailHTML(l){
    var a = ac(l);
    return '<button class="fl-mx" type="button" data-close aria-label="Close">'
     + '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>'
     /* with no photographs the preview opens on the route instead, full width,
        rather than on an empty frame */
     + '<div class="fl-d-top' + (hasPics(l) ? '' : ' fl-nopic') + '">'
     + (hasPics(l)
        ? '<div class="fl-d-gal">' + galleryHTML('d' + l.id, l) + '</div>'
        : '<div class="fl-d-gal"><div class="fl-mapwrap tall">'
          + '<span class="fl-map-badge">' + l.nm + ' nm &middot; ' + dur(l) + '</span>'
          + mapHTML(l, 760, 400) + '</div></div>')
     + '<div class="fl-d-info">'
     + routeHTML(l, true)
     + '<dl class="fl-d-strip">'
     + '<div><dt>Departs</dt><dd>' + esc(dateSpan(l)) + '</dd></div>'
     + '<div><dt>Timing</dt><dd>' + (l.flex ? 'Flexible' : 'Fixed') + '</dd></div>'
     + '<div><dt>Passengers</dt><dd>Up to ' + a.pax + '</dd></div>'
     + '<div><dt>Flight</dt><dd>' + dur(l) + '</dd></div></dl>'
     + '</div></div>'

     + '<div class="fl-d-body">'
     /* the map is already at the top when there are no photographs, so it is not
        drawn a second time here */
     + (hasPics(l)
        ? '<p class="fl-d-h">The route</p>'
          + '<div class="fl-mapwrap"><span class="fl-map-badge">' + l.nm + ' nm &middot; '
          + dur(l) + '</span>' + mapHTML(l, 760, 300) + '</div>'
        : '')

     + '<p class="fl-d-h">The aircraft</p><dl class="fl-spec">'
     + '<div><dt>Type</dt><dd>' + esc(a.t) + '</dd></div>'
     + '<div><dt>Category</dt><dd>' + esc(a.cat) + '</dd></div>'
     /* A row only appears when the file has the figure. It used to print the
        word null where the number was missing, which it is on the 3 airliners,
        the most expensive cabins on the page. */
     + (a.yr ? '<div><dt>Year of make</dt><dd>' + a.yr + '</dd></div>' : '')
     + (a.ref ? '<div><dt>Refurbished</dt><dd>' + a.ref + '</dd></div>' : '')
     + '<div><dt>Passengers</dt><dd>Up to ' + a.pax + '</dd></div>'
     + (a.bags ? '<div><dt>Luggage</dt><dd>' + a.bags
         + (a.bags === 1 ? ' suitcase' : ' suitcases') + '</dd></div>' : '')
     + (a.ch ? '<div><dt>Cabin height</dt><dd>' + esc(a.ch) + '</dd></div>' : '')
     + (a.cw ? '<div><dt>Cabin width</dt><dd>' + esc(a.cw) + '</dd></div>' : '')
     + (a.cl ? '<div><dt>Cabin length</dt><dd>' + esc(a.cl) + '</dd></div>' : '')
     + (a.kt ? '<div><dt>Typical cruise</dt><dd>' + a.kt + ' kt</dd></div>' : '')
     + (a.rng ? '<div><dt>Range</dt><dd>' + a.rng.toLocaleString('en-GB')
         + ' nm</dd></div>' : '')
     /* said only where the operator has said it. A blank is not a No. */
     + (a.smoke ? '<div><dt>Smoking</dt><dd>'
         + (a.smoke === 'Yes' ? 'Permitted' : 'Not permitted') + '</dd></div>' : '')
     + '</dl>'

     + '<p class="fl-d-h">Included</p><ul class="fl-inc">'
     + included(a).map(function (line) {
         return '<li>' + ICON.tick + line + '</li>'; }).join('')
     + '</ul>'

     /* What else is in that particular cabin. Only in the preview, never on
        the card, so no card changes height. Nothing appears at all where the
        operator has listed nothing. */
     + ((a.amen && a.amen.length)
        ? '<p class="fl-d-h">In this cabin</p><ul class="fl-amen">'
          + a.amen.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('')
          + '</ul>'
        : '')

     + '<p class="fl-d-h">What an empty leg is</p>'
     + '<p class="fl-d-p">'
     + 'This aircraft is flying ' + esc(l.fc) + ' to ' + esc(l.tc) + ' anyway, to collect its next '
     + 'passengers or return to base. The cabin is empty. You pay a fraction of the charter rate '
     + 'for the same aircraft and the same crew, on the understanding that the date is set by the '
     + 'operator rather than by you.</p>'
     + '<p class="fl-caveat">Empty legs move. The aircraft belongs to whoever chartered the flight it '
     + 'is repositioning for, so a change to their plans changes this one. Andreea will tell you '
     + 'where it stands before you commit to anything, and if it falls away she will look for '
     + 'another.</p></div>'

     + '<div class="fl-d-foot"><div>' + priceHTML(l) + '</div>'
     + '<div class="fl-acts"><button class="fl-btn-g" type="button" data-ask="' + l.id + '">Ask Andreea</button>'
     + '<button class="fl-btn" type="button" data-book="' + l.id + '">Book now</button></div></div>';
  }

  /* ------------------------------------------------------------- quote form */
  /* The request form follows the shape a traveller already knows from every booking
   * flow: what you are asking for at the top, small and settled, then the few things
   * only you can answer, then the price and the action pinned where the thumb is.
   * The old version opened with a price panel taller than the form itself, which
   * made the first field feel a long way down. */
  function quoteHTML(l){
    var a = ac(l);
    return '<header class="fl-qbar">'
     + '<button class="fl-qback" type="button" data-close aria-label="Go back">'
     + '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>'
     + '<h2>Request this flight</h2>'
     + '<button class="fl-qback fl-qx" type="button" data-close aria-label="Close">'
     + '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>'
     + '</header>'

     + '<form class="fl-qscroll" id="fwa_qForm" onsubmit="return false">'

     + '<div class="fl-qtrip">'
     /* no thumbnail. It was a drawing on a grey square for every leg, and a
        photograph on only some of them, so the strip changed shape from card
        to card for no reason. The route and the aircraft say it. */
     + '<div class="fl-qtripT">'
     + '<div class="fl-qcodes">' + esc(l.f) + ' &middot; ' + esc(l.t) + '</div>'
     + '<div class="fl-qroute">' + esc(l.fc) + ' <span class="fl-qarrow">&#8594;</span> ' + esc(l.tc)
     + '</div>'
     + '<div class="fl-qac">' + esc(a.t) + ' &middot; up to ' + a.pax + ' passengers</div>'
     + '</div></div>'

     + '<div class="fl-qrow">'
     + '<div><span class="fl-qlab">Departure</span>'
     + '<div class="fl-qval">' + esc(dateSpan(l)) + (l.time ? ' &middot; ' + esc(l.time) : '') + '</div>'
     + '<div class="fl-qnote">' + (l.flex
         ? 'The operator sets this date. Tell Andreea below if another day suits you better.'
         : 'The operator sets this date and it is confirmed with the quote.') + '</div>'
     + '</div></div>'

     + '<div class="fl-qrow">'
     + '<div><span class="fl-qlab">Passengers</span>'
     + '<div class="fl-qval"><span id="fwa_paxN">' + a.pax + '</span> of ' + a.pax
     + ' <span class="fl-qsep">&middot;</span> entire aircraft</div></div>'
     + '<div class="fl-step">'
     + '<button type="button" data-pax="-1" aria-label="One passenger fewer">'
     + '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>'
     + '<input id="fwa_qSeats" type="text" inputmode="numeric" value="' + a.pax
     + '" data-max="' + a.pax + '" aria-label="Passengers" readonly>'
     + '<button type="button" data-pax="1" aria-label="One passenger more">'
     + '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>'
     + '</div></div>'

     + '<div class="fl-qsec">'
     + '<span class="fl-qlab">Your details</span>'
     + '<div class="fl-two">'
     + '<div class="fl-field"><label for="fwa_fName">First name</label>'
     + '<input id="fwa_fName" type="text" autocomplete="given-name" required></div>'
     + '<div class="fl-field"><label for="fwa_lName">Last name</label>'
     + '<input id="fwa_lName" type="text" autocomplete="family-name" required></div></div>'
     + '<div class="fl-two">'
     + '<div class="fl-field"><label for="fwa_qEmail">Email</label>'
     + '<input id="fwa_qEmail" type="email" autocomplete="email" inputmode="email" required></div>'
     + '<div class="fl-field"><label for="fwa_qPhone">Phone or WhatsApp</label>'
     + '<input id="fwa_qPhone" type="tel" autocomplete="tel" inputmode="tel" required></div></div>'
     + '<div class="fl-field"><label for="fwa_qBack">Preferred reply</label>'
     + '<select id="fwa_qBack"><option>WhatsApp</option><option>Email</option><option>A call</option>'
     + '</select></div>'
     + '</div>'

     + '<div class="fl-qsec">'
     + '<span class="fl-qlab">Anything Andreea should know</span>'
     + '<p class="fl-qsub">Optional.</p>'
     + '<div class="fl-field">'
     + '<textarea id="fwa_qMsg" maxlength="500" aria-label="Anything Andreea should know" '
     + 'placeholder="Trip purpose, luggage, pets, timing that matters."></textarea>'
     + '<div class="fl-cnt"><span id="fwa_qLen">0</span>/500</div></div>'
     + '</div>'

     + '<ul class="fl-q-assure">'
     + '<li>' + ICON.tick + 'Nothing is charged until the flight is confirmed.</li>'
     + '<li>' + ICON.tick + 'Every flight is operated by a fully vetted, AOC certified carrier.</li>'
     + '<li>' + ICON.tick + 'If the leg falls away, Andreea finds you another or quotes the route.</li>'
     + '</ul>'
     + '<p class="fl-q-note">Empty legs are not held until the operator confirms, so the sooner you '
     + 'ask the better. Andreea reads every request herself.</p>'
     + '</form>'

     + '<div class="fl-qbreak" id="fwa_qBreak" hidden>'
     + '<div class="fl-q-sum">'
     + (l.price
        ? '<div class="fl-q-line"><span>Entire aircraft</span><span>' + money(l.price) + '</span></div>'
          + '<div class="fl-q-line"><span>Taxes and fees</span><span>Confirmed with the quote</span></div>'
          + '<hr><div class="fl-q-line fl-tot"><span>Indicative total</span><span>' + money(l.price)
          + '</span></div>'
        : '<div class="fl-q-line"><span>Entire aircraft</span><span>Price on request</span></div>'
          + '<div class="fl-q-line"><span>Taxes and fees</span><span>Confirmed with the quote</span></div>')
     + '</div></div>'

     + '<footer class="fl-qfoot">'
     + '<div class="fl-qmoney">'
     + '<div class="fl-qprice' + (l.price ? '' : ' fl-ask') + '">'
     + (l.price ? money(l.price) : 'Price on request') + '</div>'
     + '<button class="fl-qdet" type="button" id="fwa_qDet" aria-expanded="false" '
     + 'aria-controls="fwa_qBreak">Price details</button></div>'
     + '<button class="fl-btn fl-dark" type="button" id="fwa_qSend">Request this flight</button>'
     + '</footer>';
  }
  function paxOptions(max){
    var s = '';
    for (var i = 1; i <= max; i++) s += '<option value="' + i + '">' + i
      + (i === 1 ? ' passenger' : ' passengers') + '</option>';
    return s;
  }
  function doneHTML(l){
    return '<button class="fl-mx" type="button" data-close aria-label="Close">'
     + '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>'
     + '<div class="fl-q-done"><div class="fl-tick">' + ICON.tick + '</div>'
     + '<h2>Request sent.</h2>'
     + '<p>Andreea has your enquiry for ' + esc(l.fc) + ' to ' + esc(l.tc) + ' on '
     + esc(l.date) + '. She will check the leg is still available and come back to you.</p></div>';
  }


  /* ------------------------------------------------------------------ modals */
  var detailM = document.getElementById('fwaDetail'), detailBox = document.getElementById('fwaDetailBox');
  var quoteM = document.getElementById('fwaQuote'), quoteBox = document.getElementById('fwaQuoteBox');
  function byId(id){ for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  /* A route page carries the card and the 2 modals but no filter sheet, so every
   * reference to the sheet is asked whether it exists first. The same file then
   * runs unchanged in both places. */
  function on(m){ return !!m && m.classList.contains('fl-on'); }
  /* Locking the page behind a panel.
   *
   * Hiding the body's overflow does nothing on an iPhone: the page keeps
   * scrolling under the panel, and because the finger is moving the page
   * rather than the panel, the preview feels frozen. Pinning the body at the
   * position it was at is the only thing that holds, and the scroll position
   * has to be put back afterwards or the page jumps to the top on close.
   */
  var lockedAt = 0;
  function lockPage(){
    if (document.body.classList.contains('fl-lock')) return;
    lockedAt = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = '-' + lockedAt + 'px';
    document.body.classList.add('fl-lock');
  }
  function open(m){ lockPage(); m.classList.add('fl-on'); }
  function unlock(){
    if (!document.body.classList.contains('fl-lock')) return;
    document.body.classList.remove('fl-lock');
    document.body.style.top = '';
    window.scrollTo(0, lockedAt);
  }
  function shut(m){ m.classList.remove('fl-on');
    if (!on(detailM) && !on(quoteM)) unlock(); }
  function openDetail(id){
    var l = byId(id); if (!l) return;
    detailBox.innerHTML = detailHTML(l); open(detailM); detailBox.scrollTop = 0;
    detailM.scrollTop = 0; wireGalleries(); wireMaps(detailBox);
  }
  function openQuote(id){
    var l = byId(id); if (!l) return;
    quoteBox.className = 'fl-sheetbox fl-qsheet';
    quoteBox.innerHTML = quoteHTML(l); open(quoteM); quoteM.scrollTop = 0;
    var msg = document.getElementById('fwa_qMsg'), len = document.getElementById('fwa_qLen');
    msg.addEventListener('input', function () { len.textContent = msg.value.length; });

    /* the passenger stepper. The aircraft is the whole aircraft either way, so this
     * is Andreea knowing how many seats to prepare, not a price control. */
    var seats = document.getElementById('fwa_qSeats'), paxN = document.getElementById('fwa_paxN');
    var max = parseInt(seats.getAttribute('data-max'), 10) || 1;
    function setPax(n){
      n = Math.max(1, Math.min(max, n));
      seats.value = n; paxN.textContent = n;
      quoteBox.querySelector('[data-pax="-1"]').disabled = (n <= 1);
      quoteBox.querySelector('[data-pax="1"]').disabled = (n >= max);
    }
    setPax(max);
    [].forEach.call(quoteBox.querySelectorAll('[data-pax]'), function (b) {
      b.addEventListener('click', function () {
        setPax(parseInt(seats.value, 10) + parseInt(b.getAttribute('data-pax'), 10));
      });
    });

    /* the breakdown stays folded away until asked for, so the first thing on
     * screen is the flight rather than a table of money. */
    var det = document.getElementById('fwa_qDet'), brk = document.getElementById('fwa_qBreak');
    det.addEventListener('click', function () {
      var openNow = brk.hasAttribute('hidden');
      if (openNow) brk.removeAttribute('hidden'); else brk.setAttribute('hidden', '');
      det.setAttribute('aria-expanded', openNow ? 'true' : 'false');
      det.textContent = openNow ? 'Hide details' : 'Price details';
    });

    document.getElementById('fwa_qSend').addEventListener('click', function () {
      var ok = ['fwa_fName','fwa_lName','fwa_qEmail','fwa_qPhone'].every(function (k) {
        var el = document.getElementById(k);
        if (!el.value.trim()) { el.style.borderColor = 'var(--gold-dk)'; el.focus(); return false; }
        el.style.borderColor = ''; return true;
      });
      if (!ok) return;
      quoteBox.className = 'fl-sheetbox';
      quoteBox.innerHTML = doneHTML(l);
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    var close = t.closest('[data-close]');
    if (close) { shut(close.closest('.fl-modal')); return; }
    var book = t.closest('[data-book]');
    if (book) { e.preventDefault(); shut(detailM); openQuote(book.getAttribute('data-book')); return; }
    var ask = t.closest('[data-ask]');
    if (ask) { e.preventDefault(); shut(detailM); openQuote(ask.getAttribute('data-ask')); return; }
    var det = t.closest('[data-detail]');
    if (det) { e.preventDefault(); openDetail(det.getAttribute('data-detail')); return; }
    if (t.closest('.fl-gal') || t.closest('.fl-rail')) return;
    var card = t.closest('.fl-leg');
    if (card) openDetail(card.getAttribute('data-id'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      var card = e.target.closest && e.target.closest('.fl-leg');
      if (card && e.target === card) { e.preventDefault(); openDetail(card.getAttribute('data-id')); }
      return;
    }
    if (e.key !== 'Escape') return;
    if (on(quoteM)) shut(quoteM);
    else if (on(detailM)) shut(detailM);
    else if (on(document.getElementById('fwaSheet'))) closeSheet();
  });

  /* The same leg reaches the feed through more than one channel, so the list
     is cleaned before anything is drawn from it. dedupe comes from the shared
     helpers above, so the empty legs page and every other page apply exactly
     the same rule. */
  L = dedupe(D.legs);
  D.legs = L;

  window.FWA_LEGS = {
    card: cardHTML,
    wire: function (root) { wireGalleries(); wireMaps(root);
      lookForPhotographs(root); },
    openDetail: openDetail,
    openQuote: openQuote,
    legs: L,
    aircraft: ac,
    money: money,
    esc: esc
  };
}());
