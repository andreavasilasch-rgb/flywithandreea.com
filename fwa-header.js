/* Fly with Andreea - shared header behaviour: nav toggle, site search, language menu.
   Requires /search-index.js to be loaded. */

(function(){
  var nav=document.getElementById('navbar'), btn=document.getElementById('navToggle');
  if(!nav||!btn) return;
  function close(){ nav.classList.remove('open'); btn.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }
  btn.addEventListener('click',function(){ var o=nav.classList.toggle('open'); btn.setAttribute('aria-expanded',o?'true':'false'); document.body.style.overflow=o?'hidden':''; });
  nav.querySelectorAll('.nav-links a').forEach(function(a){ a.addEventListener('click',close); });
  window.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
})();

/* topbar v1 */
(function(){
  var inp=document.getElementById("tbSearch"), box=document.getElementById("tbResults");
  if(inp&&box){
    function close(){ box.classList.remove("open"); box.innerHTML=""; }
    inp.addEventListener("input",function(){
      var data=window.SEARCH_INDEX||[], q=inp.value.trim().toLowerCase();
      if(q.length<2){ close(); return; }
      var res=[]; for(var i=0;i<data.length;i++){ if((data[i].q||"").indexOf(q)!==-1) res.push(data[i]); }
      res.sort(function(a,b){ return (a.t.toLowerCase().indexOf(q)===0?0:1)-(b.t.toLowerCase().indexOf(q)===0?0:1); });
      res=res.slice(0,10);
      if(!res.length){ box.innerHTML="<div class=\"tb-none\">No results for \""+inp.value.replace(/</g,"&lt;")+"\"</div>"; box.classList.add("open"); return; }
      box.innerHTML=res.map(function(r){ return "<a class=\"tb-res\" href=\""+r.u+"\"><span>"+r.t+"</span><span class=\"tb-type\">"+r.k+"</span></a>"; }).join("");
      box.classList.add("open");
    });
    inp.addEventListener("blur",function(){ setTimeout(close,180); });
    document.addEventListener("keydown",function(e){ if(e.key==="Escape") close(); });
  }
  var lang=document.getElementById("tbLang");
  if(lang){ var btn=lang.querySelector(".tb-lang-btn");
    btn.addEventListener("click",function(e){ e.stopPropagation(); lang.classList.toggle("open"); btn.setAttribute("aria-expanded",lang.classList.contains("open")); });
    lang.querySelectorAll(".tb-lang-opt").forEach(function(a){ a.addEventListener("click",function(e){ if(a.hasAttribute("data-soon")){ e.preventDefault(); a.innerHTML=a.getAttribute("data-lang").toUpperCase()+" \u2014 <span class=\"tb-soon\">coming soon</span>"; } }); });
    document.addEventListener("click",function(){ lang.classList.remove("open"); });
  }
})();
