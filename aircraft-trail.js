/* Fly with Andreea. Aircraft cursor-trail (site-wide drop-in).
   Add once, before the closing body tag, on any page: a small jet follows the cursor
   with an elegant vapour contrail, tinted per section, brighter over dark sections.
   Self-contained, idempotent, and disabled on touch / reduced-motion. */
(function () {
  if (window.__fwaPageGlow) return; window.__fwaPageGlow = 1;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(pointer:fine)').matches && matchMedia('(hover:hover)').matches;
  if (reduce || !fine) return;

  var st = document.createElement('style'); st.setAttribute('data-fwa', 'aircraft-trail');
  st.textContent =
    '#fwa-glow-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40}'
    + '.wow-glow{display:none!important}'
    + '@media (hover:none),(pointer:coarse){#fwa-glow-canvas{display:none}}'
    + '@media (prefers-reduced-motion:reduce){#fwa-glow-canvas{display:none}}';
  (document.head || document.documentElement).appendChild(st);

  var PAL = [
    {plane:'#B8966B', tr:[250,247,242], ta:.50, cr:7, r:150, ha:.10, hg:[120,122,132]},
    {plane:'#A98A5F', tr:[255,253,248], ta:.46, cr:7, r:160, ha:.09, hg:[136,138,148]},
    {plane:'#B8966B', tr:[251,249,245], ta:.52, cr:6, r:140, ha:.11, hg:[106,108,118]},
    {plane:'#9C8259', tr:[255,254,250], ta:.44, cr:8, r:170, ha:.08, hg:[150,152,160]}
  ];
  var DARK = {plane:'#EADFCB', tr:[255,255,255], ta:.52, cr:7, r:150, ha:.16, hg:[226,228,236]};

  function start() {
    var cv = document.createElement('canvas'); cv.id = 'fwa-glow-canvas'; document.body.appendChild(cv);
    var ctx = cv.getContext('2d'), W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    function resize(){ W=innerWidth; H=innerHeight; cv.width=W*DPR; cv.height=H*DPR; cv.style.width=W+'px'; cv.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); }
    resize(); window.addEventListener('resize', resize);

    function isDark(el){ var bg=getComputedStyle(el).backgroundColor, m=bg.match(/rgba?\(([^)]+)\)/); if(!m) return false; var p=m[1].split(',').map(parseFloat); if(p.length>=4&&p[3]===0) return false; return (0.299*p[0]+0.587*p[1]+0.114*p[2])/255<0.42; }
    var zones=[].slice.call(document.querySelectorAll('section, footer, [id="time-now"], .stats-section, header, nav'));
    zones.forEach(function(z,i){ z.__glow = isDark(z)?DARK:PAL[i%PAL.length]; });
    var cur = PAL[0];
    var PLANE = new Path2D('M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z');
    var MAX=44, hist=[], tx=W/2, ty=H/2, px=tx, py=ty, ppx=px, ppy=py, ang=0, last=0, fade=0, alive=false, frames=0;

    function draw(){
      var now=performance.now(), idle=now-last, moving=idle<80;
      px+=(tx-px)*0.16; py+=(ty-py)*0.16;
      var dx=px-ppx, dy=py-ppy; ppx=px; ppy=py;
      if(dx*dx+dy*dy>0.6){ ang=Math.atan2(dy,dx); }
      if(moving){ fade=1; hist.push([px,py]); if(hist.length>MAX) hist.shift(); } else { fade*=0.93; }
      frames++;
      ctx.clearRect(0,0,W,H);
      if(moving && (frames%5)===0){ var el=document.elementFromPoint(tx,ty); while(el&&!el.__glow) el=el.parentElement; if(el) cur=el.__glow; }
      var len=hist.length, head=len?hist[len-1]:[px,py];
      var gr=cur.r, hgd=ctx.createRadialGradient(head[0],head[1],0,head[0],head[1],gr);
      hgd.addColorStop(0,'rgba('+cur.hg[0]+','+cur.hg[1]+','+cur.hg[2]+','+(cur.ha*fade)+')');
      hgd.addColorStop(1,'rgba('+cur.hg[0]+','+cur.hg[1]+','+cur.hg[2]+',0)');
      ctx.fillStyle=hgd; ctx.fillRect(head[0]-gr,head[1]-gr,gr*2,gr*2);
      for(var i=0;i<len;i++){
        var t=(i+1)/len, op=Math.pow(t,1.8)*cur.ta*fade, rad=cur.cr*(0.28+0.72*t);
        var cg=ctx.createRadialGradient(hist[i][0],hist[i][1],0,hist[i][0],hist[i][1],rad);
        cg.addColorStop(0,'rgba('+cur.tr[0]+','+cur.tr[1]+','+cur.tr[2]+','+op+')');
        cg.addColorStop(1,'rgba('+cur.tr[0]+','+cur.tr[1]+','+cur.tr[2]+',0)');
        ctx.fillStyle=cg; ctx.fillRect(hist[i][0]-rad,hist[i][1]-rad,rad*2,rad*2);
      }
      ctx.save(); ctx.globalAlpha=Math.min(1,fade*1.1);
      ctx.translate(head[0],head[1]); ctx.rotate(ang+Math.PI/2); ctx.scale(0.85,0.85); ctx.translate(-12,-12);
      ctx.shadowColor='rgba(203,173,145,.55)'; ctx.shadowBlur=9; ctx.fillStyle=cur.plane; ctx.fill(PLANE); ctx.restore();
      if(fade>0.02 || moving){ requestAnimationFrame(draw); } else { ctx.clearRect(0,0,W,H); hist.length=0; alive=false; }
    }
    window.addEventListener('mousemove', function(e){ tx=e.clientX; ty=e.clientY; last=performance.now(); if(!alive){ alive=true; requestAnimationFrame(draw); } }, {passive:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
