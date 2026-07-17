/* Fly with Andreea — Empty legs listing (filters + pagination). Reads window.EMPTY_LEGS. */
(function(){
  function init(){
    var legs=(window.EMPTY_LEGS||[]).slice();
    var grid=document.getElementById('elGrid'); if(!grid)return;
    var PAGE=24, shown=PAGE;
    var MN=['','ian.','feb.','mar.','apr.','mai','iun.','iul.','aug.','sep.','oct.','nov.','dec.'];
    var price=function(l){return parseInt(String(l.price).replace(/[^0-9]/g,''),10)||0;};
    var ym=function(l){return Math.floor((l.sk||0)/100);};
    var REGIONS=[['all','Toate rutele'],['europe','Europa'],['africa','Africa'],['asia','Asia'],['us','Statele Unite'],['transatlantic','Transatlantic']];
    var SORTS=[['soon','Cele mai apropiate'],['priceasc','Preț: crescător'],['pricedesc','Preț: descrescător']];
    var CATORDER=['Very light','Turboprops','Light','Midsize','Super midsize','Heavy','Long-range'];
    var CATLABEL={'Very light':'Very light','Turboprops':'Turbopropulsoare','Light':'Light','Midsize':'Midsize','Super midsize':'Super midsize','Heavy':'Heavy','Long-range':'Long-range'};
    var catlab=function(c){return CATLABEL[c]||c;};
    var state={region:'all',cats:{},month:'all',min:null,max:null,sort:'soon',search:''};
    var WA='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.885l6.186-1.443A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>';
    var ELp=function(l){return (window.ELprob?window.ELprob(l):(l.prob||50));};
    var catsActive=function(){return Object.keys(state.cats).filter(function(k){return state.cats[k];});};
    function match(l){
      if(state.region!=='all'&&(l.tags||[]).indexOf(state.region)<0)return false;
      var ca=catsActive(); if(ca.length&&ca.indexOf(l.cat)<0)return false;
      if(state.month!=='all'&&ym(l)!==state.month)return false;
      var p=price(l); if(state.min!=null&&p<state.min)return false; if(state.max!=null&&p>state.max)return false;
      if(state.search){var q=state.search.toLowerCase();if((l.from+' '+l.to+' '+l.aircraft).toLowerCase().indexOf(q)<0)return false;}
      return true;
    }
    function sortFn(a,b){if(state.sort==='priceasc')return price(a)-price(b);if(state.sort==='pricedesc')return price(b)-price(a);return (a.sk||0)-(b.sk||0);}
    function card(l){var pr=ELp(l);
      var msg=encodeURIComponent("Bună Andreea, aș dori să rezerv empty leg-ul "+l.from+" spre "+l.to+" pe "+l.date+" (de la "+l.price+"). Mai este disponibil?");
      return '<a class="empty-card" href="https://wa.me/971503372980?text='+msg+'" target="_blank" rel="noopener">'
       +'<div class="empty-card-top"><div class="empty-route">'+l.from+' → '+l.to+'</div><div class="empty-badge">Empty leg</div></div>'
       +'<div class="empty-meta"><div class="empty-date">'+l.date+'</div><div class="empty-time">'+l.aircraft+'</div></div>'
       +'<div class="empty-card-bottom"><div><div class="empty-price">De la '+l.price+'</div><div class="empty-aircraft">'+catlab(l.cat)+' · '+l.seats+' locuri</div></div><div class="empty-cta">'+WA+' Întreabă pe WhatsApp</div></div>'
       +'<div class="empty-prob"><div class="empty-prob-label">Probabilitate de confirmare</div><div class="empty-prob-bar-wrap"><div class="empty-prob-bar" style="width:'+pr+'%"></div></div><div class="empty-prob-pct">'+pr+'%</div></div>'
       +'</a>';
    }
    var rCount=function(c){return c==='all'?legs.length:legs.filter(function(l){return (l.tags||[]).indexOf(c)>=0;}).length;};
    var months=function(){var set={};legs.forEach(function(l){var k=ym(l);if(k)set[k]=(set[k]||0)+1;});return Object.keys(set).map(Number).sort(function(a,b){return a-b;}).map(function(k){return [k,MN[k%100]+' '+Math.floor(k/100),set[k]];});};
    function labels(){
      function L(p,t,on){var b=document.querySelector('[data-pill="'+p+'"]');if(b){b.firstChild.textContent=t+' ';b.classList.toggle('on',on);}}
      var r=REGIONS.filter(function(x){return x[0]===state.region;})[0];L('region',state.region==='all'?'Regiune':r[1],state.region!=='all');
      var n=catsActive().length;L('jets',n?'Aeronavă ('+n+')':'Aeronavă',n>0);
      L('when',state.month==='all'?'Când':(MN[state.month%100]+' '+Math.floor(state.month/100)),state.month!=='all');
      var t='Preț';if(state.min!=null||state.max!=null)t=(state.min!=null?'€'+state.min:'€0')+'–'+(state.max!=null?'€'+state.max:'∞');L('price',t,state.min!=null||state.max!=null);
      var so=SORTS.filter(function(x){return x[0]===state.sort;})[0];L('sort',state.sort==='soon'?'Sortare':so[1],state.sort!=='soon');
    }
    function render(){
      var list=legs.filter(match).sort(sortFn);
      grid.innerHTML=list.slice(0,shown).map(card).join('');
      var none=document.getElementById('elNone');if(none)none.style.display=list.length?'none':'block';
      var more=document.getElementById('elMore');if(more)more.classList.toggle('hide',list.length<=shown);
      var sh=document.getElementById('elShown');if(sh)sh.textContent=list.length+(list.length===1?' empty leg':' empty legs');
      var cnt=document.getElementById('elCount');if(cnt)cnt.textContent=legs.length;
      labels();
    }
    function apply(){shown=PAGE;render();}
    function closeAll(){document.querySelectorAll('.el-dd').forEach(function(x){x.classList.remove('open');});}
    function buildPanel(id,opts,getSel,onPick){var el=document.getElementById(id);if(!el)return;
      el.innerHTML=opts.map(function(o){return '<div class="el-prow'+(getSel()===o[0]?' sel':'')+'" data-v="'+o[0]+'">'+o[1]+(o[2]!=null?' <span>'+o[2]+'</span>':'')+'</div>';}).join('');
      el.querySelectorAll('.el-prow').forEach(function(row){row.addEventListener('click',function(){onPick(this.getAttribute('data-v'));el.querySelectorAll('.el-prow').forEach(function(x){x.classList.remove('sel');});this.classList.add('sel');closeAll();apply();});});}
    buildPanel('ddRegion',REGIONS.map(function(r){return [r[0],r[1],rCount(r[0])];}),function(){return state.region;},function(v){state.region=v;});
    buildPanel('ddWhen',[['all','Toate datele']].concat(months().map(function(m){return [String(m[0]),m[1],m[2]];})),function(){return String(state.month);},function(v){state.month=v==='all'?'all':parseInt(v,10);});
    buildPanel('ddSort',SORTS,function(){return state.sort;},function(v){state.sort=v;});
    var jp=document.getElementById('ddJets');
    if(jp){var counts={};legs.forEach(function(l){counts[l.cat]=(counts[l.cat]||0)+1;});
      var keys=Object.keys(counts).sort(function(a,b){var ia=CATORDER.indexOf(a),ib=CATORDER.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib);});
      jp.innerHTML=keys.map(function(k){return '<label class="el-check"><input type="checkbox" data-j="'+k.replace(/"/g,'')+'"><span class="el-box"></span><span class="el-lab">'+catlab(k)+'</span><span class="el-c">'+counts[k]+'</span></label>';}).join('');
      jp.querySelectorAll('input').forEach(function(c){c.addEventListener('change',function(){state.cats[this.getAttribute('data-j')]=this.checked;apply();});});}
    var mn=document.getElementById('elMin');if(mn)mn.addEventListener('input',function(){state.min=this.value?parseInt(this.value,10):null;apply();});
    var mx=document.getElementById('elMax');if(mx)mx.addEventListener('input',function(){state.max=this.value?parseInt(this.value,10):null;apply();});
    var se=document.getElementById('elSearch');if(se)se.addEventListener('input',function(){state.search=this.value;apply();});
    var sg=document.getElementById('elSearchBtn');if(sg)sg.addEventListener('click',function(){apply();});
    var more=document.getElementById('elMore');if(more)more.addEventListener('click',function(){shown+=PAGE;render();});
    document.querySelectorAll('.el-ddbtn').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();var dd=b.parentNode,op=dd.classList.contains('open');closeAll();if(!op)dd.classList.add('open');});});
    document.querySelectorAll('.el-panel').forEach(function(p){p.addEventListener('click',function(e){e.stopPropagation();});});
    document.addEventListener('click',closeAll);
    var cl=document.getElementById('elClear');if(cl)cl.addEventListener('click',function(){state={region:'all',cats:{},month:'all',min:null,max:null,sort:'soon',search:''};if(se)se.value='';if(mn)mn.value='';if(mx)mx.value='';document.querySelectorAll('#ddRegion .el-prow').forEach(function(x){x.classList.toggle('sel',x.getAttribute('data-v')==='all');});document.querySelectorAll('#ddWhen .el-prow').forEach(function(x){x.classList.toggle('sel',x.getAttribute('data-v')==='all');});document.querySelectorAll('#ddSort .el-prow').forEach(function(x){x.classList.toggle('sel',x.getAttribute('data-v')==='soon');});if(jp)jp.querySelectorAll('input').forEach(function(c){c.checked=false;});apply();});
    render();
  }
  if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init);
})();
