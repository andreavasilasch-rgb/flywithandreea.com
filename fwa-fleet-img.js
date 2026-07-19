/* Fly with Andreea - empty-leg aircraft image resolver.
   Assigns each empty-leg card a RANDOM real photo of the EXACT aircraft model.
   - AIRCRAFT_MAP is exact (no category guessing): leg aircraft name -> fleet image key.
   - Images live at /fleet-img/<key>/<key>-1.jpg .. -7.jpg (3 to 7 per model).
   - On each render it shuffles the candidate numbers and uses the first that exists,
     so identical models look different across cards and every update re-randomises.
   - If a model has no photos yet, or an unknown aircraft appears, it shows a neutral
     branded placeholder - never a wrong aircraft, never a blank.
   Fleet page uses the SAME folders as a full gallery. Names never change. */
(function(){
  if(window.__fwaFleetImg) return; window.__fwaFleetImg=1;
  var MAP={"Cessna Citation XLS": "cessna-citation-xls", "Cessna Citation XLS+": "cessna-citation-xls-plus", "Challenger 3500": "bombardier-challenger-3500", "Challenger 350": "bombardier-challenger-350", "Challenger 300": "bombardier-challenger-300", "Challenger 604": "bombardier-challenger-604", "Challenger 605": "bombardier-challenger-605", "Pilatus PC-24": "pilatus-pc-24", "Global 6000": "bombardier-global-6000", "Global 5000": "bombardier-global-5000", "Global Express XRS": "bombardier-global-express-xrs", "Cessna Citation CJ1": "cessna-citation-cj1", "Cessna Citation CJ1+": "cessna-citation-cj1-plus", "Cessna Citation CJ2": "cessna-citation-cj2", "Cessna Citation CJ2+": "cessna-citation-cj2-plus", "Cessna Citation CJ3": "cessna-citation-cj3", "Cessna Citation CJ3+": "cessna-citation-cj3-plus", "Embraer Phenom 300": "embraer-phenom-300", "Embraer Phenom 300E": "embraer-phenom-300e", "Embraer Phenom 100": "embraer-phenom-100", "Cessna Citation Latitude": "cessna-citation-latitude", "Cessna Citation M2": "cessna-citation-m2", "Cessna Citation Mustang": "cessna-citation-mustang", "Embraer Legacy 600": "embraer-legacy-600", "Embraer Legacy 650": "embraer-legacy-650", "Embraer Legacy 450": "embraer-legacy-450", "Embraer 135": "embraer-erj-135-lr", "Embraer Praetor 600": "embraer-praetor-600", "Falcon 2000LX": "dassault-falcon-2000lx", "Falcon 2000EX": "dassault-falcon-2000ex", "Gulfstream G200": "gulfstream-g200", "Gulfstream G280": "gulfstream-g280", "Gulfstream G-IVSP": "gulfstream-g-ivsp", "HondaJet": "honda-hondajet", "King Air 260": "beechcraft-king-air-260", "Hawker 400XP": "hawker-400xp", "Hawker 900XP": "hawker-900xp"};
  function keyOf(name){
    if(!name) return null;
    var n=name.trim();
    if(MAP[n]) return MAP[n];
    // tolerant match: strip manufacturer words + punctuation
    var s=n.toLowerCase().replace(/cessna|embraer|bombardier|dassault|gulfstream|beechcraft|hawker|pilatus/g,'').replace(/[^a-z0-9+]/g,'');
    for(var k in MAP){
      var ks=k.toLowerCase().replace(/[^a-z0-9+]/g,'');
      // compare against the MAP VALUE's tail (model part)
    }
    for(var name2 in MAP){
      var t=name2.toLowerCase().replace(/cessna|embraer|bombardier|dassault|gulfstream|beechcraft|hawker|pilatus/g,'').replace(/[^a-z0-9+]/g,'');
      if(t===s) return MAP[name2];
    }
    return null;
  }
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function setBg(el,url,fill){
    el.style.backgroundImage="url('"+url+"')";el.style.backgroundSize="cover";
    el.style.backgroundPosition="center";el.style.backgroundRepeat="no-repeat";
    if(fill) el.classList.add('has-photo');
  }
  function resolve(el){
    var key=keyOf(el.getAttribute('data-aircraft'));
    if(!key){ el.classList.add('no-photo'); return; }              // neutral placeholder via CSS
    var order=shuffle([1,2,3,4,5,6,7]); var i=0;
    (function tryNext(){
      if(i>=order.length){ el.classList.add('no-photo'); return; } // no photos yet -> placeholder
      var url='/fleet-img/'+key+'/'+key+'-'+order[i++]+'.jpg';
      var im=new Image();
      im.onload=function(){ setBg(el,url,true); };
      im.onerror=tryNext;
      im.src=url;
    })();
  }
  function init(){ document.querySelectorAll('[data-aircraft]').forEach(resolve); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.fwaAircraftKey=keyOf;   // fleet page can reuse the same mapping
})();
