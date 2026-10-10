'use strict';
/* ArcNode Showcase v0.6. Independent fictional data: no customer data or code. */
const $ = s => document.querySelector(s);
const euro = n => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n);
const pct = n => new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(n)+'%';
const formatNum = n => new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(n);
const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults = () => ({phase:0,qty:40,materialUnit:9.5,cutPlan:2.5,bendPlan:2,checkPlan:1,hourRate:58,marginTarget:35,locked:null,note:'Alle scherpe randen ontbramen. Controleer de maatvoering.',materialActual:420,cutActual:3,bendActual:2.4,checkActual:1.2,scrapActual:25});
let job = defaults();
let activeCase = null;

function estimate(j=job){
  const material=j.qty*j.materialUnit, cut=j.cutPlan*j.hourRate, bend=j.bendPlan*j.hourRate, check=j.checkPlan*j.hourRate;
  const cost=material+cut+bend+check;
  const revenue=cost/(1-j.marginTarget/100);
  return {material,cut,bend,check,cost,revenue,profit:revenue-cost,margin:j.marginTarget};
}
function actual(j=job){
  const material=j.materialActual+j.scrapActual,cut=j.cutActual*j.hourRate,bend=j.bendActual*j.hourRate,check=j.checkActual*j.hourRate;
  return {material,cut,bend,check,cost:material+cut+bend+check};
}
function field(key,label,suffix='',step='1'){
  return `<label class="form-field"><span>${label}${suffix?' ('+suffix+')':''}</span><input data-field="${key}" type="number" min="0" step="${step}" value="${job[key]}" /></label>`;
}
function costRows(rows){return rows.map(([label,value])=>`<div class="cost-line"><span>${label}</span><strong class="focus-num">${euro(value)}</strong></div>`).join('');}
function stageTitle(meta,title,desc,status){return `<div class="work-title"><div><div class="meta">${meta}</div><h2>${title}</h2><p>${desc}</p></div><span class="status">${status}</span></div>`;}
function steps(){return `<nav class="steps" aria-label="Productiefasen">${['Offerte','Ordervoorbereiding','Productie','Nacalculatie'].map((name,i)=>`<div class="step ${i===job.phase?'active':''} ${i<job.phase?'completed':''}"><span>${i<job.phase?'✓':i+1}</span>${name}</div>`).join('')}</nav>`;}
function footer(){return `<div class="product-footer"><span>ARCNODE<b>.</b> / PRODUCTIEFLOW</span><span>Demonstratiebedrijf · fictieve prijzen en gegevens</span></div>`;}
function quoteUI(){
 const e=estimate();
 return `${stageTitle('OFF-2026-041 / AANVRAAG','Offerte voorbereiden','Fictieve opdracht: 40 metalen montagebeugels. Pas de aantallen of bewerkingstijden aan en bekijk direct de voorcalculatie.','VOORCALCULATIE')}
 <div class="two-col"><div class="white-panel"><h3>Productiegegevens <small>Montagebeugel MB-40</small></h3>
 <div class="form-grid">${field('qty','Aantal','stuks')}${field('materialUnit','Materiaal per stuk','€','.5')}${field('cutPlan','Lasersnijden gepland','uren','.1')}${field('bendPlan','Kanten gepland','uren','.1')}${field('checkPlan','Kwaliteitscontrole gepland','uren','.1')}${field('hourRate','Intern uurtarief','€','1')}${field('marginTarget','Gewenste brutomarge','%','1')}</div>
 <div class="formula-note">De kostprijs bestaat uit materiaal en interne productietijd. De verkoopprijs is berekend op basis van de gewenste brutomarge, niet door een percentage bij de kostprijs op te tellen.</div></div>
 <aside class="white-panel" id="quote-summary">${quoteSummary(e)}</aside></div>
 <div class="action-row"><button class="action-primary" data-action="accept">Offerte accepteren → Doorzetten naar order</button></div>`;
}
function quoteSummary(e){return `<h3>Voorcalculatie <small>EXCL. BTW</small></h3>${costRows([['Materiaal',e.material],['Lasersnijden',e.cut],['Kanten',e.bend],['Kwaliteitscontrole',e.check]])}<div class="cost-line"><span><b>Begrote kostprijs</b></span><strong>${euro(e.cost)}</strong></div><div class="total-line"><small>Vaste offerteprijs</small><strong>${euro(e.revenue)}</strong></div><div class="summary-sub"><span>Geplande brutomarge</span><b>${pct(e.margin)}</b></div><div class="summary-sub"><span>Verwacht brutoresultaat</span><b>${euro(e.profit)}</b></div>`;}
function orderUI(){
 const e=job.locked;
 return `${stageTitle('WO-2026-041 / AANMAKEN','Ordervoorbereiding','De goedgekeurde offerte is overgenomen. De verkoopprijs ligt vast; de productie-instructie kun je aanvullen.','GEREEDMAKEN')}
 <div class="kpi-grid"><div class="kpi"><small>Te produceren</small><strong>${job.qty} stuks</strong></div><div class="kpi"><small>Geoffreerde verkoopprijs</small><strong>${euro(e.revenue)}</strong></div><div class="kpi"><small>Begrote kostprijs</small><strong>${euro(e.cost)}</strong></div></div>
 <div class="two-col"><div class="white-panel"><h3>Bewerkingsvolgorde <small>WERKORDER 041</small></h3><div class="process-route">
 ${route(1,'Lasersnijden',job.cutPlan)}${route(2,'Kanten',job.bendPlan)}${route(3,'Kwaliteitscontrole',job.checkPlan)}</div></div>
 <div class="white-panel"><h3>Productie-instructie <small>INTERN</small></h3><label class="form-field"><span>Notities voor productie</span><textarea id="order-note" rows="4">${esc(job.note)}</textarea></label><div class="formula-note">In deze demoversie worden geen machines, voorraden of ERP-systemen aangestuurd.</div></div></div>
 <div class="action-row"><button class="action-ghost" data-action="back-quote">← Terug naar offerte</button><button class="action-primary" data-action="release">Vrijgeven voor productie →</button></div>`;
}
function route(n,name,time){return `<div class="route-row"><span class="route-number">0${n}</span><div><b>${name}</b><small>Standaard bewerkingsroute</small></div><span class="route-time">${formatNum(time)} uur gepland</span></div>`;}
function productionUI(){
 const e=job.locked,a=actual();
 return `${stageTitle('WO-2026-041 / UITVOERING','Productie registreren','Vul de werkelijke uren, materiaalkosten en uitval in. Zo ontstaan de cijfers voor de nacalculatie.','IN PRODUCTIE')}
 <div class="kpi-grid"><div class="kpi"><small>Werkorder</small><strong>041 · ${job.qty} st.</strong></div><div class="kpi"><small>Voorcalculatie</small><strong>${euro(e.cost)}</strong></div><div class="kpi"><small>Geregistreerde kosten</small><strong id="actual-live">${euro(a.cost)}</strong></div></div>
 <div class="two-col"><div class="white-panel"><h3>Werkelijke productie-invoer <small>REALISATIE</small></h3><div class="form-grid">${field('materialActual','Materiaal gebruikt','€','1')}${field('scrapActual','Uitval / afval','€','1')}${field('cutActual','Lasersnijden werkelijk','uren','.1')}${field('bendActual','Kanten werkelijk','uren','.1')}${field('checkActual','Controle werkelijk','uren','.1')}</div>
 <div class="instruction"><b>Werkorderinstructie:</b> ${esc(job.note||'Geen aanvullende instructies.')}</div></div>
 <aside class="white-panel"><h3>Actuele kosten <small>UITGESPLITST</small></h3><div id="actual-summary">${actualSummary(a)}</div></aside></div>
 <div class="action-row"><button class="action-ghost" data-action="back-order">← Ordervoorbereiding</button><button class="action-primary" data-action="finish">Productie afronden → Nacalculatie</button></div>`;
}
function actualSummary(a){return `${costRows([['Materiaal inclusief uitval',a.material],['Lasersnijden',a.cut],['Kanten',a.bend],['Kwaliteitscontrole',a.check]])}<div class="total-line"><small>Totaal werkelijke kosten</small><strong>${euro(a.cost)}</strong></div>`;}
function conclusionUI(){
 const e=job.locked,a=actual(),profit=e.revenue-a.cost,realMargin=profit/e.revenue*100;
 const rows=[['Materiaal incl. uitval',e.material,a.material],['Lasersnijden',e.cut,a.cut],['Kanten',e.bend,a.bend],['Kwaliteitscontrole',e.check,a.check]];
 return `${stageTitle('WO-2026-041 / AFGEROND','Nacalculatie','Van offerte tot uitvoering: welke productiekosten vielen hoger uit en wat betekent dat voor de marge?','AFGEROND')}
 <div class="margin-summary"><div class="margin-box"><small>Vaste offerteprijs</small><strong>${euro(e.revenue)}</strong></div><div class="margin-box"><small>Gerealiseerde brutomarge</small><strong class="${realMargin<e.margin?'warning':'positive'}">${pct(realMargin)}</strong></div><div class="margin-box"><small>Gerealiseerd brutoresultaat</small><strong>${euro(profit)}</strong></div></div>
 <div class="two-col"><div class="white-panel"><h3>Kostprijsvergelijking <small>VOOR- EN NACALCULATIE</small></h3><div style="overflow-x:auto"><table class="breakdown"><thead><tr><th>Kostensoort</th><th>Begroot</th><th>Werkelijk</th><th>Afwijking</th></tr></thead><tbody>
 ${rows.map(([name,planned,real])=>`<tr><td>${name}</td><td>${euro(planned)}</td><td>${euro(real)}</td><td class="${real>planned?'warning':'positive'}">${real>=planned?'+':''}${euro(real-planned)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Totaal</td><td>${euro(e.cost)}</td><td>${euro(a.cost)}</td><td class="${a.cost>e.cost?'warning':'positive'}">${a.cost>=e.cost?'+':''}${euro(a.cost-e.cost)}</td></tr></tfoot></table></div></div>
 <aside class="white-panel"><h3>Rendement van de order</h3><div class="margin-line"><span>Begrote brutomarge</span><strong>${pct(e.margin)}</strong></div><div class="margin-line"><span>Gerealiseerde brutomarge</span><strong class="${realMargin<e.margin?'warning':'positive'}">${pct(realMargin)}</strong></div><div class="margin-line"><span>Margeverschil</span><strong class="${realMargin<e.margin?'warning':'positive'}">${(realMargin-e.margin)>0?'+':''}${formatNum(realMargin-e.margin)} procentpunt</strong></div><div class="note-card" style="margin-top:18px">Een hogere kostprijs verlaagt de marge omdat de verkoopprijs bij het accepteren van de offerte is vastgezet. Alle bedragen zijn fictieve, toegerekende productiekosten; overhead en overige indirecte kosten zijn niet volledig uitgewerkt.</div></aside></div>
 <div class="action-row"><button class="action-ghost" data-action="edit-actual">← Werkelijke kosten aanpassen</button><button class="action-soft" data-action="reset">↻ Nieuwe demo starten</button></div>`;
}
function renderProduction(){
 const root=$('#detail-body');
 let body=[quoteUI,orderUI,productionUI,conclusionUI][job.phase]();
 root.innerHTML=`<div class="production-frame"><div class="production-top"><strong>WERKSTATION <span style="color:#039ba5">/</span> PRODUCTIE</strong><small>FICTIEF BEDRIJF · MONTAGEBEUGELS MB-40</small><span class="prod-badge">DEMO-OMGEVING</span></div>${steps()}<div class="work-area">${body}</div></div>${footer()}`;
 root.querySelectorAll('[data-field]').forEach(input=>{
   input.addEventListener('input',()=>{
     const n=Number(input.value),key=input.dataset.field;
     if(input.value===''||!Number.isFinite(n)||n<0||key==='qty'&&n<1||key==='marginTarget'&&n>=95)return;
     job[key]=n;
     if(job.phase===0)$('#quote-summary').innerHTML=quoteSummary(estimate());
     if(job.phase===2){const a=actual();$('#actual-summary').innerHTML=actualSummary(a);$('#actual-live').textContent=euro(a.cost);}
   });
 });
 $('#order-note')?.addEventListener('input',e=>job.note=e.target.value);
 root.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{
   const a=btn.dataset.action;
   if(a==='accept'){
     if(!validPhaseFields()){alert('Controleer de invoer. Aantal moet positief zijn en de brutomarge moet lager zijn dan 95%.');return;}
     job.locked={...estimate()};job.phase=1;
   } else if(a==='back-quote'){job.locked=null;job.phase=0;}
   else if(a==='release')job.phase=2;
   else if(a==='back-order')job.phase=1;
   else if(a==='finish'){
     if(!validPhaseFields()){alert('Controleer de geregistreerde productiekosten.');return;}
     job.phase=3;
   }else if(a==='edit-actual')job.phase=2;
   else if(a==='reset')job=defaults();
   renderProduction();
   document.querySelector('.detail-heading')?.scrollIntoView({behavior:'smooth',block:'start'});
 }));
}
function validPhaseFields(){
 return [...document.querySelectorAll('#detail-body [data-field]')].every(e=>e.value!==''&&Number.isFinite(Number(e.value))&&Number(e.value)>=0&&(e.dataset.field!=='qty'||Number(e.value)>=1)&&(e.dataset.field!=='marginTarget'||Number(e.value)<95));
}
function renderCube(){
  const root=$('#detail-body');
  root.innerHTML=`<div id="cube-mount"></div>`;
  window.ArcNodeCube.mount(root.querySelector('#cube-mount'));
}
function renderCocanvas(){
 const video='assets/demo_film3_downloadlijst_wit.webm';
 $('#detail-body').innerHTML=`
   <div class="video-area cocanvas-video-area">
     <video autoplay muted loop playsinline preload="auto" aria-label="Demonstratie CoCanvas: van technische tekening naar materiaallijst">
       <source src="${video}" type="video/webm" />
       Je browser ondersteunt deze video niet.
     </video>
   </div>
   <section class="cocanvas-context" aria-label="HTM-innovatiechallenge">
     <h2>CoCanvas: van materiaalanalyse naar slimme tekeningencontrole</h2>
     <p>HTM, het openbaarvervoerbedrijf in de regio Den Haag, zoekt een innovatieve oplossing voor een tijdrovend probleem. Bij de aanleg en het onderhoud van tram- en businfrastructuur moeten technische tekeningen onderling én met de bijbehorende werkbeschrijvingen (bestekken) overeenkomen. Die controles gebeuren nu grotendeels handmatig.</p>
     <p>Via het innovatieprogramma OV Connect daagt HTM technologiebedrijven uit om deze controles te automatiseren. De challenge biedt uitzicht op een betaalde pilot van €25.000.</p>
     <p><strong>ArcNode werkt aan een inzending op basis van de technologie achter CoCanvas.</strong> Waar CoCanvas technische tekeningen vertaalt naar bruikbare materiaalinformatie, onderzoeken we nu hoe dezelfde technologie verschillen, fouten en ontbrekende onderdelen in complexe infrastructuurprojecten kan herkennen en visualiseren.</p>
   </section>`;
}
const descriptions={
 cube:['Knowledge Cube','KENNISVISUALISATIE','Kennis, relaties en herkomst inzichtelijk maken.','01 / KENNIS'],
 production:['Productieflow','PRODUCTIEAUTOMATISERING','Offerte → ordervoorbereiding → productie → nacalculatie.','02 / PRODUCTIE'],
 news:['Nieuws-AI','INTELLIGENCE','Nieuwsfiltering en relevantiemonitoring voor het MKB.','03'],
 cocanvas:['CoCanvas','ENGINEERING','Technische ontwerpen omzetten naar bruikbare materiaallijsten.','04 / ENGINEERING']
};
function openCase(id,updateHash=true){
 if(!descriptions[id])return;
 window.ArcNodeCube?.destroy();
 activeCase=id;
 const [title,kicker,subtitle,idx]=descriptions[id];
 $('#home-view').classList.add('is-hidden');$('#detail-view').classList.remove('is-hidden');$('#detail-view').classList.toggle('news-detail-mode', id==='news');
 $('#detail-title').textContent=title;$('#detail-kicker').textContent=idx+' / '+kicker;$('#detail-subtitle').textContent=subtitle;
 if(id==='production')renderProduction();else if(id==='news')renderNews();else if(id==='cube')renderCube();else if(id==='cocanvas')renderCocanvas();
 if(updateHash)history.replaceState(null,'','#'+id);
 window.scrollTo(0,0);
}
function goHome(updateHash=true){
 window.ArcNodeCube?.destroy();
 activeCase=null;$('#detail-view').classList.add('is-hidden');$('#home-view').classList.remove('is-hidden');
 if(updateHash)history.replaceState(null,'',window.location.pathname);
 window.scrollTo(0,0);
}
document.querySelectorAll('[data-case]').forEach(btn=>btn.addEventListener('click',()=>openCase(btn.dataset.case)));
$('#go-home').addEventListener('click',()=>goHome());$('#brand-home').addEventListener('click',()=>goHome());
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(descriptions[id])openCase(id,false);else goHome(false);});
if(descriptions[location.hash.slice(1)])openCase(location.hash.slice(1),false);
