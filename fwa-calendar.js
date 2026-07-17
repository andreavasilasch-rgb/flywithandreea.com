/* Fly with Andreea. Branded date picker (site-wide drop-in).
   Upgrades any input[data-fwa-cal] into a Cinzel/gold calendar. Localized via data attrs.
   Self-contained, idempotent, no dependencies. */
(function(){
  if (window.__fwaCal) return; window.__fwaCal = 1;
  var CSS = '.fwa-cal{position:absolute;top:calc(100% + 8px);left:0;z-index:60;width:312px;background:#fff;border:.5px solid var(--line,#D2D2D7);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.14);padding:16px;display:none}'
  + '.fwa-cal.open{display:block}'
  + '.fwa-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}'
  + '.fwa-cal-mon{font-family:var(--serif,Georgia,serif);font-size:14px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--ink,#1D1D1F)}'
  + '.fwa-cal-nav{width:28px;height:28px;border-radius:50%;border:.5px solid var(--line,#D2D2D7);background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--gold-deep,#B8966B);font-size:14px;line-height:1;transition:.2s}'
  + '.fwa-cal-nav:hover{border-color:var(--gold,#CBAD91);background:#FDFBF9}'
  + '.fwa-cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:6px}'
  + '.fwa-cal-dow span{text-align:center;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#A1A1A6;padding:4px 0}'
  + '.fwa-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}'
  + '.fwa-cal-day{height:36px;border:0;background:transparent;border-radius:9px;font-family:inherit;font-size:13.5px;color:var(--ink-2,#3A3A3C);cursor:pointer;transition:.15s}'
  + '.fwa-cal-day:hover:not(:disabled){background:#F7F1EB;color:var(--gold-deep,#B8966B)}'
  + '.fwa-cal-day:disabled{color:#DCDCE0;cursor:default}'
  + '.fwa-cal-day.today{box-shadow:inset 0 0 0 1px var(--gold-light,#D6B89C)}'
  + '.fwa-cal-day.sel{background:var(--gold,#CBAD91);color:#fff;font-weight:500}'
  + '.fwa-cal-day.empty{visibility:hidden}'
  + '.fwa-cal-foot{border-top:.5px solid var(--line,#D2D2D7);margin-top:12px;padding-top:12px}'
  + '.fwa-cal-lab{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#A1A1A6;margin-bottom:8px}'
  + '.fwa-cal-times{display:flex;gap:6px;flex-wrap:wrap}'
  + '.fwa-cal-time{border:.5px solid var(--line,#D2D2D7);background:#fff;border-radius:40px;padding:6px 12px;font-size:11.5px;color:var(--ink-2,#3A3A3C);cursor:pointer;font-family:inherit;transition:.18s}'
  + '.fwa-cal-time:hover{border-color:var(--gold,#CBAD91)}'
  + '.fwa-cal-time.on{background:var(--gold,#CBAD91);border-color:var(--gold,#CBAD91);color:#fff}'
  + '.fwa-cal-done{width:100%;margin-top:12px;border:0;background:var(--ink,#1D1D1F);color:#fff;border-radius:40px;padding:10px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;font-family:inherit}'
  + '.fwa-cal-done:hover{background:var(--gold-deep,#B8966B)}'
  + '.fwa-cal-ico{background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23B8966B\' stroke-width=\'1.5\'><rect x=\'3\' y=\'5\' width=\'18\' height=\'16\' rx=\'2\'/><path d=\'M16 3v4M8 3v4M3 10h18\'/></svg>");background-repeat:no-repeat;background-position:right 15px center;padding-right:44px;cursor:pointer}';
  var st=document.createElement('style'); st.id='fwa-cal-css'; st.textContent=CSS; document.head.appendChild(st);

  function build(input){
    if (input.__fwaDone) return; input.__fwaDone=1;
    var MONTHS=(input.getAttribute('data-months')||'January,February,March,April,May,June,July,August,September,October,November,December').split(',');
    var DOW   =(input.getAttribute('data-dow')||'M,T,W,T,F,S,S').split(',');
    var TIMES =(input.getAttribute('data-times')||'Anytime,Morning,Afternoon,Evening').split(',');
    var LAB   = input.getAttribute('data-timelab')||'Preferred time';
    var DONE  = input.getAttribute('data-done')||'Done';
    input.setAttribute('readonly','readonly');
    input.setAttribute('autocomplete','off');
    input.classList.add('fwa-cal-ico');
    var host=input.parentNode;
    if (getComputedStyle(host).position==='static') host.style.position='relative';

    var cal=document.createElement('div'); cal.className='fwa-cal';
    cal.innerHTML='<div class="fwa-cal-head"><button type="button" class="fwa-cal-nav" data-p>&lsaquo;</button>'
      +'<div class="fwa-cal-mon"></div><button type="button" class="fwa-cal-nav" data-n>&rsaquo;</button></div>'
      +'<div class="fwa-cal-dow">'+DOW.map(function(d){return '<span>'+d+'</span>';}).join('')+'</div>'
      +'<div class="fwa-cal-grid"></div>'
      +'<div class="fwa-cal-foot"><div class="fwa-cal-lab">'+LAB+'</div><div class="fwa-cal-times">'
      + TIMES.map(function(t,i){return '<button type="button" class="fwa-cal-time'+(i===0?' on':'')+'" data-t="'+t+'">'+t+'</button>';}).join('')
      +'</div><button type="button" class="fwa-cal-done">'+DONE+'</button></div>';
    host.appendChild(cal);

    var grid=cal.querySelector('.fwa-cal-grid'), mon=cal.querySelector('.fwa-cal-mon');
    var today=new Date(); today.setHours(0,0,0,0);
    var view=new Date(today.getFullYear(),today.getMonth(),1);
    var sel=null, time=TIMES[0];
    var isoEl = input.getAttribute('data-iso') ? document.getElementById(input.getAttribute('data-iso')) : null;
    var afterEl = input.getAttribute('data-after') ? document.getElementById(input.getAttribute('data-after')) : null;
    function iso(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
    function floor(){ // earliest selectable: today, or the date in data-after
      var f=today;
      if(afterEl && afterEl.value){ var a=new Date(afterEl.value+'T00:00:00'); if(!isNaN(a) && a>f) f=a; }
      return f;
    }
    function prefill(){ // if the hidden ISO already holds a value (e.g. handed off from the booking bar)
      if(isoEl && isoEl.value){
        var d=new Date(isoEl.value+'T00:00:00');
        if(!isNaN(d)){ sel=d; view=new Date(d.getFullYear(),d.getMonth(),1); write(true); }
      }
    }

    function write(quiet){
      if(!sel) return;
      if(isoEl){ isoEl.value = iso(sel); if(!quiet){ try{ isoEl.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){} } }
      var s=sel.getDate()+' '+MONTHS[sel.getMonth()]+' '+sel.getFullYear();
      input.value = (time && time!==TIMES[0]) ? s+', '+time.toLowerCase() : s;
      input.classList.remove('error');
      var er=host.querySelector('.form-error-msg'); if(er) er.remove();
    }
    function render(){
      mon.textContent=(MONTHS[view.getMonth()]+' '+view.getFullYear()).toUpperCase();
      grid.innerHTML='';
      var start=(new Date(view.getFullYear(),view.getMonth(),1).getDay()+6)%7;
      var days=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
      for(var i=0;i<start;i++){var e=document.createElement('div');e.className='fwa-cal-day empty';grid.appendChild(e);}
      for(var d=1;d<=days;d++){
        var dt=new Date(view.getFullYear(),view.getMonth(),d);
        var b=document.createElement('button');
        b.type='button'; b.className='fwa-cal-day'; b.textContent=d;
        if(dt<floor()) b.disabled=true;
        if(dt.getTime()===today.getTime()) b.classList.add('today');
        if(sel&&dt.getTime()===sel.getTime()) b.classList.add('sel');
        b.addEventListener('click',(function(x){return function(ev){ev.stopPropagation();sel=x;render();write();};})(dt));
        grid.appendChild(b);
      }
    }
    input.addEventListener('click',function(e){e.stopPropagation();cal.classList.toggle('open');render();});
    cal.querySelector('[data-p]').addEventListener('click',function(e){e.stopPropagation();view.setMonth(view.getMonth()-1);render();});
    cal.querySelector('[data-n]').addEventListener('click',function(e){e.stopPropagation();view.setMonth(view.getMonth()+1);render();});
    cal.querySelectorAll('.fwa-cal-time').forEach(function(b){
      b.addEventListener('click',function(e){e.stopPropagation();
        cal.querySelectorAll('.fwa-cal-time').forEach(function(x){x.classList.remove('on');});
        b.classList.add('on'); time=b.getAttribute('data-t'); write();});
    });
    cal.querySelector('.fwa-cal-done').addEventListener('click',function(e){e.stopPropagation();cal.classList.remove('open');});
    cal.addEventListener('click',function(e){e.stopPropagation();});
    render(); prefill();
  }
  function init(){ document.querySelectorAll('input[data-fwa-cal]').forEach(build); }
  document.addEventListener('click',function(){document.querySelectorAll('.fwa-cal.open').forEach(function(c){c.classList.remove('open');});});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
