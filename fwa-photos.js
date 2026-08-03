/* Fly with Andreea. Photo resolver (v3).
   - Aircraft keys map to /jets/<manufacturer>-<model>-exterior|interior-N|floorplan-N (png/jpg/webp).
     Manufacturer comes from the page URL when possible, else AC_MAP.
   - GALLERY is dynamic: shows every interior-N that exists (1,2,3...) with no fixed limit.
   - Other keys (cat-*, dest-*, route-*, story-*) load from /extras/<key>.<ext>.
*/
(function(){
  if (window.__fwaPhotos) return; window.__fwaPhotos = 1;
  var EXT = ['png','jpg','webp'];
  var GAL_MAX = 40;                 // safety cap on interior probing
  var AC = {"king-air-260":"beechcraft","avanti":"piaggio","avanti-ii":"piaggio","pc-12-47e":"pilatus","citation-m2":"cessna","citation-mustang":"cessna","hondajet":"honda","phenom-100":"embraer","citation-cj":"cessna","citation-cj1":"cessna","citation-cj2":"cessna","citation-cj2-plus":"cessna","citation-cj3":"cessna","citation-cj4":"cessna","citation-ii":"cessna","citation-ultra":"cessna","citation-xls":"cessna","citation-xls-plus":"cessna","learjet-31":"bombardier","learjet-31a":"bombardier","learjet-40":"bombardier","learjet-45":"bombardier","phenom-300":"embraer","pc-24":"pilatus","citation-iii":"cessna","g150":"gulfstream","700a":"hawker","750":"hawker","800xp":"hawker","900xp":"hawker","learjet-60":"bombardier","challenger-300":"bombardier","challenger-350":"bombardier","citation-latitude":"cessna","citation-sovereign":"cessna","citation-x":"cessna","g200":"gulfstream","g280":"gulfstream","legacy-450":"embraer","legacy-500":"embraer","praetor-600":"embraer","challenger-604":"bombardier","challenger-605":"bombardier","challenger-850":"bombardier","falcon-2000lxs":"dassault","falcon-2000s":"dassault","falcon-900":"dassault","g450":"gulfstream","g-iv":"gulfstream","legacy-600":"embraer","legacy-650":"embraer","falcon-7x":"dassault","falcon-8x":"dassault","global-5000":"bombardier","global-6000":"bombardier","global-6500":"bombardier","global-7500":"bombardier","global-express":"bombardier","global-express-xrs":"bombardier","g500":"gulfstream","g550":"gulfstream","g650":"gulfstream","acj318-elite":"airbus","acj319neo":"airbus","acj320neo":"airbus","erj-135-lr":"embraer","erj-145-lr":"embraer","lineage-1000":"embraer","bbj-737-700":"boeing","bbj2-737-800":"boeing","bbj3-737-900er":"boeing","challenger-3500":"bombardier","citation-cj1-plus":"cessna","citation-cj3-plus":"cessna","phenom-300e":"embraer","falcon-2000ex":"dassault","falcon-2000lx":"dassault","400xp":"hawker","g-ivsp":"gulfstream","acj319":"airbus","acj320":"airbus","acj330":"airbus","learjet-75":"bombardier","learjet-40xr":"bombardier","learjet-45xr":"bombardier","learjet-60xr":"bombardier","challenger-650":"bombardier","citation-longitude":"cessna","caravan":"cessna","king-air-200":"beechcraft","avanti-p180":"piaggio","avanti-ii-p180":"piaggio","pc-12":"pilatus","pc-12-ngx":"pilatus","vision-sf50":"cirrus","d-jet":"diamond","total-eclipse":"eclipse","700":"adam","500":"eclipse","550":"eclipse","piperjet":"piper","hondajet-elite":"honda","learjet-35":"bombardier","learjet-35a":"bombardier","learjet-55":"bombardier","xt":"nextant","400xti":"nextant","premier-1":"raytheon","premier-1a":"raytheon","beechjet-400":"beechcraft","beechjet-400a":"beechcraft","400":"hawker","800":"hawker","800a":"hawker","850xp":"hawker","1000":"hawker","4000":"hawker","citation-cj4-gen2":"cessna","citation-bravo":"cessna","citation-encore":"cessna","citation-encore-plus":"cessna","citation-excel":"cessna","citation-vi":"cessna","citation-vii":"cessna","citation-xls-gen-2":"cessna","citation-sovereign-plus":"cessna","g100":"gulfstream","g700":"gulfstream","falcon-2000":"dassault","falcon-50":"dassault","falcon-50ex":"dassault","falcon-900lx":"dassault","phenom-100e":"embraer","phenom-100ev":"embraer","praetor-500":"embraer","spn":"grob"};
  var segs = location.pathname.replace(/\/+$/,'').split('/');
  var pageMslug = segs[segs.length-1] || '', pageManu = segs[segs.length-2] || '';
  function manuFor(m){ if (m===pageMslug && pageManu) return pageManu; return AC[m] || ''; }
  function parseKey(base){
    if (base.indexOf('floorplan-')===0){
      var r=base.slice(10);
      if (r.slice(-4)==='-day'   && AC[r.slice(0,-4)]!==undefined) return {mslug:r.slice(0,-4), suffix:'floorplan-1'};
      if (r.slice(-6)==='-night' && AC[r.slice(0,-6)]!==undefined) return {mslug:r.slice(0,-6), suffix:'floorplan-2'};
      return null;
    }
    if (base.indexOf('fleet-')===0){
      var s=base.slice(6);
      if (s.slice(-5)==='-hero' && AC[s.slice(0,-5)]!==undefined) return {mslug:s.slice(0,-5), suffix:'exterior'};
      if (AC[s]!==undefined) return {mslug:s, suffix:'exterior'};
      var m=s.match(/^(.*)-([0-9]+)$/);
      if (m && AC[m[1]]!==undefined) return {mslug:m[1], suffix:'interior-'+m[2]};
    }
    return null;
  }
  function bg(el,url){ el.style.backgroundImage="url('"+url+"')"; el.style.backgroundSize='cover';
    if(!el.style.backgroundPosition) el.style.backgroundPosition='center'; el.style.backgroundRepeat='no-repeat'; }
  function tryStem(stem, onhit, onmiss){         // stem without extension
    var i=0;(function n(){ if(i>=EXT.length){ if(onmiss)onmiss(); return; }
      var u=stem+'.'+EXT[i++], im=new Image(); im.onload=function(){onhit(u);}; im.onerror=n; im.src=u; })(); }

  // DYNAMIC GALLERY: replace fixed slides with one per existing interior-N
  function buildGallery(){
    var slides=document.querySelectorAll('.gal-slide[data-fwa-img]'); if(!slides.length) return;
    var first=slides[0].getAttribute('data-fwa-img')||''; var m=first.match(/^fleet-(.+)-[0-9]+$/); if(!m) return;
    var mslug=m[1], manu=manuFor(mslug); var box=slides[0].parentNode;
    if(!manu){ return; }                          // leave as-is if unknown
    for(var k=0;k<slides.length;k++) slides[k].parentNode.removeChild(slides[k]);  // clear fixed slots
    (function add(n){
      if(n>GAL_MAX) return;
      tryStem('/jets/'+manu+'-'+mslug+'-interior-'+n, function(u){
        var d=document.createElement('div'); d.className='gal-slide'; bg(d,u); box.appendChild(d);
        add(n+1);                                 // found -> next
      }, function(){ /* first gap -> stop */ });
    })(1);
  }
  function resolve(el){
    var base=el.getAttribute('data-fwa-img'); if(!base) return;
    var overlay=el.getAttribute('data-fwa-overlay')||'';
    var ac=parseKey(base);
    if(ac){ var manu=manuFor(ac.mslug); if(!manu) return;
      tryStem('/jets/'+manu+'-'+ac.mslug+'-'+ac.suffix, function(u){
        if(el.tagName==='IMG'){ el.src=u; return; }
        el.style.backgroundImage=(overlay?overlay+', ':'')+"url('"+u+"')"; el.style.backgroundSize='cover';
        if(!el.style.backgroundPosition) el.style.backgroundPosition='center'; el.style.backgroundRepeat='no-repeat';
      }, function(){ if(el.classList.contains('gal-slide')) el.style.display='none'; });
      return;
    }
    var i=0;(function n(){ if(i>=EXT.length) return; var u='/extras/'+base+'.'+EXT[i++], im=new Image();
      im.onload=function(){ if(el.tagName==='IMG'){el.src=u;return;} el.style.backgroundImage=(overlay?overlay+', ':'')+"url('"+u+"')"; el.style.backgroundSize='cover'; if(!el.style.backgroundPosition)el.style.backgroundPosition='center'; el.style.backgroundRepeat='no-repeat'; };
      im.onerror=n; im.src=u; })();
  }
  function init(){ buildGallery(); document.querySelectorAll('[data-fwa-img]').forEach(resolve); }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
