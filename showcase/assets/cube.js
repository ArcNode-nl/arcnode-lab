/* ArcNode Knowledge Cube. Interactive 3D projection without external libraries.
   ALL information is made-up generic manufacturing-process demonstration data.
   No CLC data, solution descriptions, taxonomy, or other customer IP. */
(() => {
'use strict';
const TYPE = {
  business:{label:'Business',color:'#32e1ec'},
  process:{label:'Proces',color:'#85a5ff'},
  data:{label:'Data',color:'#fac978'},
  technology:{label:'Technologie',color:'#72e4ad'}
};
const NODES = [
 ['request','Klantvraag','business',-1.65,.80,-.15,'Een opdracht begint met verwachtingen over aantallen, uitvoering en levering.','E-mail / klantgesprek'],
 ['offer','Offerte','business',-1.12,1.68,.65,'Een berekende prijs en afgesproken voorwaarden vormen de commerciële uitgangspositie.','Voorcalculatie'],
 ['product','Product MB-40','business',-.08,.43,.20,'Eén product verbindt specificaties, gegevensbronnen, productie en kosten.','Artikelomschrijving'],
 ['delivery','Leverafspraak','business',.34,1.86,-.60,'De afgesproken leverdatum beïnvloedt de volgorde en capaciteit van werkzaamheden.','Orderbevestiging'],
 ['supplier','Leverancier','business',-2.03,-.88,-.90,'Inkoopgegevens zijn nodig om materiaalbeschikbaarheid en kostprijs te beoordelen.','Inkoopbestand'],
 ['job','Werkorder 041','process',1.04,.52,.32,'De werkorder vertaalt een geaccepteerde opdracht naar uitvoerbare stappen.','Werkorderinstructie'],
 ['cut','Lasersnijden','process',1.86,.25,.86,'De eerste bewerking heeft een geplande tijd en wordt tijdens uitvoering geregistreerd.','Bewerkingsroute'],
 ['bend','Kanten','process',1.88,-.79,.55,'Nabewerking volgt op het snijden en kent eigen capaciteit en kostentoerekening.','Werkstationplanning'],
 ['check','Kwaliteitscontrole','process',.89,-1.52,.65,'Controle toetst het resultaat aan de specificaties en registreert afwijkingen.','Controleformulier'],
 ['shipment','Levering','process',.10,-1.84,-.55,'Afgeronde onderdelen worden verzameld en uitgeleverd volgens afspraak.','Paklijst'],
 ['drawing','CAD-tekening','data',-1.00,.48,-1.65,'Technische specificaties leggen vorm en maatvoering van het product vast.','Tekening versie B'],
 ['bom','Materiaallijst','data',-.90,-1.08,-1.35,'Benodigde onderdelen en hoeveelheden vormen de basis voor inkoop en productie.','BOM / materiaallijst'],
 ['estimate','Voorcalculatie','data',-.37,.20,1.76,'Een uitsplitsing van materiaal en uren bepaalt de verwachte kostprijs.','Calculatieversie 1'],
 ['actual','Nacalculatie','data',.92,-.73,1.77,'Werkelijke materiaal- en bewerkingskosten worden vergeleken met de offerte.','Kostenregistratie'],
 ['stock','Voorraadstatus','data',-1.95,-.05,1.07,'Beschikbaarheid kan invloed hebben op planning en levertijd.','Artikelbestand'],
 ['erp','ERP','technology',1.58,1.36,-1.03,'Centraal administratief systeem voor opdrachten, stamgegevens en boekingen.','Systeeminterface'],
 ['api','API-koppeling','technology',2.03,-.05,-1.18,'Gecontroleerde gegevensuitwisseling voorkomt het dubbel invoeren van informatie.','Interfacecontract'],
 ['dash','Productiedashboard','technology',1.46,-1.29,-1.30,'Een actueel overzicht combineert voortgang, planning en orderstatus.','Operationeel scherm']
].map(([id,title,type,x,y,z,description,source])=>({id,title,type,x:x*.65,y:y*.66,z:z*.64,description,source}));
const EDGE_IDS = [
 ['request','offer'],['request','product'],['offer','estimate'],['offer','job'],['offer','delivery'],
 ['product','drawing'],['product','bom'],['product','job'],['product','estimate'],['product','stock'],
 ['drawing','bom'],['bom','supplier'],['bom','stock'],['supplier','stock'],
 ['job','cut'],['cut','bend'],['bend','check'],['check','shipment'],['delivery','shipment'],
 ['job','erp'],['erp','api'],['api','dash'],['erp','stock'],['actual','erp'],['actual','dash'],
 ['cut','actual'],['bend','actual'],['check','actual'],['estimate','actual'],['job','dash']
];
const byId=new Map(NODES.map(n=>[n.id,n]));
const EDGES=EDGE_IDS.map(([a,b])=>[byId.get(a),byId.get(b)]);
let controller=null;
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function makeHTML(){return `<div class="cube-shell">
  <div class="cube-head"><div class="cube-head-copy"><span class="cube-kicker">ARCNODE / KNOWLEDGE SPACE</span><b>Kennis in een ruimtelijke structuur</b></div><span class="cube-head-meta">${NODES.length} OBJECTEN &nbsp; · &nbsp; ${EDGES.length} RELATIES</span></div>
  <div class="cube-layout"><div class="cube-stage">
    <canvas class="cube-canvas" aria-label="Interactieve driedimensionale kubus met zes vlakken en kennisobjecten binnenin. Draai door te slepen en selecteer objecten door te klikken."></canvas>
    <div class="cube-toolbar"><button class="cube-chip active" data-filter="all" type="button">Alle lagen</button>${Object.keys(TYPE).map(t=>`<button class="cube-chip" type="button" data-filter="${t}">${TYPE[t].label}</button>`).join('')}</div>
    <div class="cube-bottom"><div class="cube-hint">↔ Draai de kubus met je vinger · tik op een object · zoom met +/−</div><div class="cube-controls"><button type="button" class="cube-control" data-cube-control="minus" aria-label="Uitzoomen">−</button><button type="button" class="cube-control" data-cube-control="plus" aria-label="Inzoomen">+</button><button type="button" class="cube-control active" data-cube-control="rotate">↻</button><button type="button" class="cube-control" data-cube-control="reset">Herstel beeld</button></div></div>
  </div><aside class="cube-inspector" aria-live="polite"><div class="cube-inspector-meta">OBJECT / RELATIES</div><div class="cube-inspector-detail"></div></aside></div>
</div>`;}
function mount(target){destroy();target.innerHTML=makeHTML(); controller=new CubeController(target);}
function destroy(){if(controller){controller.destroy(); controller=null;}}
class CubeController {
 constructor(root){
  this.root=root;this.canvas=root.querySelector('.cube-canvas');this.ctx=this.canvas.getContext('2d');
  this.stage=root.querySelector('.cube-stage');this.detail=root.querySelector('.cube-inspector-detail');
  this.yaw=-.72;this.pitch=.54;this.zoom=.93;this.auto=true;this.selected='product';this.hover=null;this.filter='all';
  this.points=[];this.dragging=false;this.pointer=null;this.lastTime=0;this.lastInteract=performance.now();this.destroyed=false;
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.stage);this.resize();
  this.bound={pointerdown:e=>this.pointerDown(e),pointermove:e=>this.pointerMove(e),pointerup:e=>this.pointerUp(e),wheel:e=>this.wheel(e)};
  this.canvas.addEventListener('pointerdown',this.bound.pointerdown);this.canvas.addEventListener('pointermove',this.bound.pointermove);
  this.canvas.addEventListener('pointerup',this.bound.pointerup);this.canvas.addEventListener('pointercancel',this.bound.pointerup);
  this.canvas.addEventListener('wheel',this.bound.wheel,{passive:false});
  root.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>this.setFilter(b.dataset.filter)));
  root.querySelectorAll('[data-cube-control]').forEach(b=>b.addEventListener('click',()=>this.control(b.dataset.cubeControl)));
  this.renderDetail();this.frame(0);
 }
 resize(){const r=this.stage.getBoundingClientRect();this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);}
 project(n){
  const ca=Math.cos(this.yaw),sa=Math.sin(this.yaw),cb=Math.cos(this.pitch),sb=Math.sin(this.pitch);
  const x=n.x*ca-n.z*sa,z0=n.x*sa+n.z*ca,y=n.y*cb-z0*sb,z=n.y*sb+z0*cb;
  const f=this.zoom*3.7/(5.8-z);
  const scale=Math.min(this.w*.153,this.h*.153)*(this.w<480?.88:1);
  return {...n, sx:this.w*.5+x*scale*f*1.5,sy:this.h*.46-y*scale*f*1.5, z, factor:f, radius:Math.max(5,Math.min(17,(n.id==='product'?12:7.5)*f*1.55))};
 }
 connected(a,b){return EDGE_IDS.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));}
 visible(n){return this.filter==='all'||n.type===this.filter||n.id===this.selected;}
 draw(){
  const ctx=this.ctx,w=this.w,h=this.h;ctx.clearRect(0,0,w,h);
  // A real geometric CUBE. Eight vertices, twelve equal-length edges and
  // six transparent planar faces. Nodes live INSIDE the cube (not around it).
  const side=1.62;
  const vertices=[];
  for(const x of [-side,side])for(const y of [-side,side])for(const z of [-side,side])vertices.push({x,y,z});
  const v=vertices.map(p=>this.project(p));
  const faces=[
   {ids:[0,1,3,2],name:'WEST',rgb:'43,159,196'},
   {ids:[4,5,7,6],name:'OOST',rgb:'51,205,218'},
   {ids:[0,1,5,4],name:'ONDER',rgb:'26,100,155'},
   {ids:[2,3,7,6],name:'BOVEN',rgb:'28,209,226'},
   {ids:[0,2,6,4],name:'ACHTER',rgb:'33,125,192'},
   {ids:[1,3,7,5],name:'VOOR',rgb:'42,229,221'}
  ].map(face=>({...face, z:face.ids.reduce((s,i)=>s+v[i].z,0)/4})).sort((a,b)=>a.z-b.z);
  const edges=[];
  for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){
   const a=vertices[i],b=vertices[j];
   if(Number(a.x!==b.x)+Number(a.y!==b.y)+Number(a.z!==b.z)===1)
    edges.push({i,j,z:(v[i].z+v[j].z)/2});
  }
  ctx.save();
  const poly=(pts)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.sx,p.sy):ctx.moveTo(p.sx,p.sy));ctx.closePath();};
  // Back of the transparent box, then internal translucent glass shelves.
  faces.forEach((face,k)=>{poly(face.ids.map(i=>v[i]));ctx.fillStyle=`rgba(${face.rgb},${k<3?.045:.085})`;ctx.fill();});
  for(const height of [-.68,.15,.91]){
   const pts=[{x:-side,y:height,z:-side},{x:side,y:height,z:-side},{x:side,y:height,z:side},{x:-side,y:height,z:side}].map(p=>this.project(p));
   poly(pts);ctx.strokeStyle='rgba(48,192,214,.18)';ctx.lineWidth=.75;ctx.setLineDash([3,8]);ctx.stroke();ctx.setLineDash([]);
  }
  const t=this.points=NODES.map(n=>this.project(n));const pmap=new Map(t.map(p=>[p.id,p]));
  const active=this.selected;const hi=this.hover||active;
  for(const [an,bn] of EDGES){const a=pmap.get(an.id),b=pmap.get(bn.id);if(!this.visible(a)||!this.visible(b))continue;
   const highlight=a.id===hi||b.id===hi;const activePair=a.id===active||b.id===active;
   ctx.beginPath();ctx.moveTo(a.sx,a.sy);ctx.lineTo(b.sx,b.sy);ctx.lineWidth=highlight?1.8:1;
   ctx.strokeStyle=highlight?'#60e6f1b8':activePair?'#64accb70':'#3c748a55';ctx.stroke();
  }
  const sorted=t.slice().sort((a,b)=>a.z-b.z);
  for(const n of sorted){if(!this.visible(n))continue;
   const col=TYPE[n.type].color;const selected=n.id===this.selected,hot=n.id===this.hover;
   const emphasized=selected||hot;const dimmed=this.filter!=='all'&&n.type!==this.filter;
   let radius=n.radius*(emphasized?1.3:1);ctx.save();ctx.globalAlpha=dimmed?.36:1;
   const g=ctx.createRadialGradient(n.sx,n.sy,1,n.sx,n.sy,radius*4.3);g.addColorStop(0,col+'42');g.addColorStop(1,col+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.sx,n.sy,radius*4.3,0,Math.PI*2);ctx.fill();
   ctx.beginPath();ctx.arc(n.sx,n.sy,radius,0,Math.PI*2);ctx.fillStyle=selected?'#c2feff':'#092538';ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=selected?2.8:1.6;ctx.stroke();
   ctx.beginPath();ctx.arc(n.sx,n.sy,Math.max(2.5,radius*.32),0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
   // Labels prefer to remain readable even while the network turns.
   if((emphasized || (this.w>=780 ? (this.filter==='all'||n.type===this.filter) : (this.w>=470 && this.connected(n.id,this.selected)))) && (n.sy>=56 || emphasized) && (n.sy<=this.h-52 || emphasized)){
    const font=emphasized?'600 12px Arial':'11px Arial';ctx.font=font;const sw=ctx.measureText(n.title).width;
    const bx=Math.max(4,Math.min(w-sw-17,n.sx+radius+6)),by=n.sy-11;
    ctx.fillStyle=emphasized?'#0a2735e8':'#0a1c2cb8';ctx.beginPath();ctx.roundRect(bx,by,sw+13,23,5);ctx.fill();
    ctx.fillStyle=emphasized?'#e4ffff':'#bfd9e5';ctx.fillText(n.title,bx+7,by+15);
   }
   ctx.restore();
  }
  // Draw front-facing structure after internal objects so the viewer sees
  // an unmistakable cube even when the knowledge network is dense.
  const median=edges.map(e=>e.z).sort((a,b)=>a-b)[6];
  edges.sort((a,b)=>a.z-b.z);
  for(const e of edges){
   const front=e.z>=median;
   ctx.save();ctx.beginPath();ctx.moveTo(v[e.i].sx,v[e.i].sy);ctx.lineTo(v[e.j].sx,v[e.j].sy);
   ctx.strokeStyle=front?'rgba(80,245,246,.91)':'rgba(63,149,190,.57)';
   ctx.lineWidth=front?2.4:1.35;
   if(front){ctx.shadowColor='#20dbe9';ctx.shadowBlur=14;}
   ctx.stroke();ctx.restore();
  }
  for(const p of v){ctx.save();ctx.beginPath();ctx.arc(p.sx,p.sy,2.6,0,Math.PI*2);ctx.fillStyle='rgba(146,255,255,.94)';ctx.shadowColor='#4bedf4';ctx.shadowBlur=10;ctx.fill();ctx.restore();}
  ctx.restore();this.points=t;
 }
 frame(ms){if(this.destroyed)return;const elapsed=Math.min(35,ms-this.lastTime||16);this.lastTime=ms;
  if(this.auto&&!this.dragging&&(ms-this.lastInteract)>1100)this.yaw+=elapsed*.000055;
  this.draw();this.frameId=requestAnimationFrame(time=>this.frame(time));}
 hit(e){const r=this.canvas.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;
  return this.points.filter(n=>this.visible(n)).map(n=>({n,d:Math.hypot(x-n.sx,y-n.sy)})).filter(v=>v.d<Math.max(22,v.n.radius+8)).sort((a,b)=>a.d-b.d)[0]?.n||null;}
 pointerDown(e){this.pointer={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};this.dragging=true;this.lastInteract=performance.now();this.canvas.classList.add('is-grabbing');try{this.canvas.setPointerCapture(e.pointerId);}catch{}}
 pointerMove(e){if(this.pointer){let dx=e.clientX-this.pointer.lastX,dy=e.clientY-this.pointer.lastY;this.pointer.moved||=Math.hypot(e.clientX-this.pointer.x,e.clientY-this.pointer.y)>7;
  if(this.pointer.moved){this.yaw+=dx*.008;this.pitch=Math.max(-1.38,Math.min(1.38,this.pitch+dy*.007));}
  this.pointer.lastX=e.clientX;this.pointer.lastY=e.clientY;this.lastInteract=performance.now();this.hover=null;
 }else{const n=this.hit(e);this.hover=n?.id||null;this.canvas.style.cursor=n?'pointer':'grab';}}
 pointerUp(e){if(!this.pointer)return;if(!this.pointer.moved){const hit=this.hit(e);if(hit)this.select(hit.id);}this.pointer=null;this.dragging=false;this.canvas.classList.remove('is-grabbing');this.lastInteract=performance.now();}
 wheel(e){e.preventDefault();this.zoom=Math.max(.67,Math.min(1.9,this.zoom*(e.deltaY>0?.90:1.1)));this.lastInteract=performance.now();}
 select(id){if(!byId.has(id))return;this.selected=id;this.renderDetail();this.lastInteract=performance.now();}
 setFilter(type){this.filter=type;this.root.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===type));this.lastInteract=performance.now();}
 control(mode){if(mode==='plus')this.zoom=Math.min(1.9,this.zoom*1.15);if(mode==='minus')this.zoom=Math.max(.67,this.zoom/1.15);
  if(mode==='rotate'){this.auto=!this.auto;this.root.querySelector('[data-cube-control="rotate"]').classList.toggle('active',this.auto);}
  if(mode==='reset'){this.yaw=-.72;this.pitch=.54;this.zoom=.93;this.filter='all';this.setFilter('all');this.select('product');this.auto=true;this.root.querySelector('[data-cube-control="rotate"]').classList.add('active');}
  this.lastInteract=performance.now();}
 renderDetail(){const n=byId.get(this.selected);const edges=EDGES.filter(([a,b])=>a.id===n.id||b.id===n.id).map(([a,b])=>a.id===n.id?b:a);
  this.detail.innerHTML=`<div class="cube-node-group" style="--node-accent:${TYPE[n.type].color}">${TYPE[n.type].label.toUpperCase()}</div>
  <h2>${safe(n.title)}</h2><p class="cube-node-desc">${safe(n.description)}</p>
  <div class="cube-note"><strong>Informatiebron</strong><br>${safe(n.source)}</div>
  <div><h3>VERBONDEN OBJECTEN · ${edges.length}</h3><div class="cube-link-list">${edges.map(o=>`<button type="button" class="cube-related" data-cube-node="${o.id}">${safe(o.title)}<span>↗</span></button>`).join('')}</div></div>
  <div class="cube-inspector-foot">Selecteer een ander object om te ontdekken welke processen, gegevens en systemen ermee verbonden zijn.</div>`;
  this.detail.querySelectorAll('[data-cube-node]').forEach(b=>b.addEventListener('click',()=>this.select(b.dataset.cubeNode)));
 }
 destroy(){this.destroyed=true;cancelAnimationFrame(this.frameId);this.resizeObserver.disconnect();this.canvas.removeEventListener('pointerdown',this.bound.pointerdown);this.canvas.removeEventListener('pointermove',this.bound.pointermove);this.canvas.removeEventListener('pointerup',this.bound.pointerup);this.canvas.removeEventListener('pointercancel',this.bound.pointerup);this.canvas.removeEventListener('wheel',this.bound.wheel);}
}
window.ArcNodeCube={mount,destroy};
})();
