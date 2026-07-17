/* Fly with Andreea. Photo resolver.
   Elements with data-fwa-img="basename" load /extras/basename.<ext>, trying
   jpg, jpeg, png, avif, webp and using the first that exists.
   <img> gets its src swapped; anything else gets a background-image.
   If no file matches, the existing image/placeholder is left untouched. */
(function(){
  if (window.__fwaPhotos) return; window.__fwaPhotos = 1;
  var EXT = ['jpg','jpeg','png','avif','webp'];
  function resolve(el){
    var base = el.getAttribute('data-fwa-img');
    if (!base) return;
    var isImg   = el.tagName === 'IMG';
    var overlay = el.getAttribute('data-fwa-overlay') || '';
    var i = 0;
    (function next(){
      if (i >= EXT.length) return;               // nothing found: leave as-is
      var url = '/extras/' + base + '.' + EXT[i++];
      var im = new Image();
      im.onload = function(){
        if (isImg) { el.src = url; return; }
        el.style.backgroundImage = (overlay ? overlay + ', ' : '') + "url('" + url + "')";
        el.style.backgroundSize = 'cover';
        if (!el.style.backgroundPosition) el.style.backgroundPosition = 'center';
        el.style.backgroundRepeat = 'no-repeat';
      };
      im.onerror = next;
      im.src = url;
    })();
  }
  function init(){ document.querySelectorAll('[data-fwa-img]').forEach(resolve); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
