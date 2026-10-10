"use strict";
// News titles, dates and links originate in the supplied historical reference material.
// Classifications and confidence scores are fixed example values, not a live LLM.
const industryNews = [{"id": "in-01", "title": "Luchtvaartbedrijf Aeronamic wil nieuwe fabriek in Almelo bouwen, maar buren zetten de hakken in het zand", "source": "tubantia.nl", "date": "09-04-2026", "category": "Uitbreiding", "confidence": 9, "why": "De voorgenomen fabriek is een mogelijk signaal van nieuwe productiecapaciteit en toekomstige toeleveringsvraag.", "url": "https://www.tubantia.nl/almelo/luchtvaartbedrijf-aeronamic-wil-nieuwe-fabriek-in-almelo-bouwen-maar-buren-zetten-de-hakken-in-het-zand~a6ea37c0/", "domain": "tubantia.nl"}, {"id": "in-02", "title": "Twents TKF doet ‘grootste investering ooit’ in nieuwe fabriek", "source": "Tubantia", "date": "19-09-2024", "category": "Investering", "confidence": 9, "why": "Een investering in een nieuwe fabriek is een sterk signaal van capaciteitsontwikkeling in de maakindustrie.", "url": "https://news.google.com/rss/articles/CBMipAFBVV95cUxPOW8wQWNFU2NCcDN3dXVhLUxwRjI5MHR0eVdXVUdfcW4yOVZ2YTN0cTVmRkJHTk5lZkhkMlRpOFdjMGlhdmpEejEtU2g3OF9kRlJHSHFrUndtblk0dXR4aWpVVnJ3X2JqLVV6czNZZDNUUWZNWExYSVVIUURwRkN2QS1WN3hMck5FdHdaRTNHT2ZhbzJOR1lBY2FLVlpKSWxxcVN5eQ?oc=5", "domain": "tubantia"}, {"id": "in-03", "title": "Nieuwe productielijn Bioneedle Drug Delivery bij ontwikkel- en investeringspartner Demcon", "source": "Kijk op Oost Nederland", "date": "07-03-2023", "category": "Productielijn", "confidence": 8, "why": "De vermelde productielijn kan wijzen op nieuwe of gewijzigde eisen aan onderdelen en assemblage.", "url": "https://www.kijkopoostnederland.nl/nieuwe-productielijn-bioneedle-drug-delivery-bij-demcon/", "domain": "kijkopoostnederland.nl"}, {"id": "in-04", "title": "Bond3D wordt onderdeel van de Demcon group", "source": "Vraag & Aanbod", "date": "12-12-2024", "category": "Overname", "confidence": 8, "why": "De aansluiting van een technologiebedrijf bij een groep kan veranderingen in leveranciersrelaties meebrengen.", "url": "https://www.vraagenaanbod.nl/bond3d-wordt-onderdeel-van-de-demcon-group/", "domain": "vraag&aanbod"}, {"id": "in-05", "title": "Oreel maakt statement en zoekt 25 nieuwe medewerkers voor vast", "source": "MetaalNieuws", "date": "21-08-2021", "category": "Personeel", "confidence": 7, "why": "Werving kan duiden op een capaciteitsvraag, al bewijst een vacature op zichzelf geen groei.", "url": "https://www.metaalnieuws.nl/oreel-maakt-statement-en-zoekt-25-nieuwe-medewerkers-voor-vast/", "domain": "metaalnieuws"}, {"id": "in-06", "title": "DVO | Almex Metaal bouwt nieuwe vestiging in Hoogstraten", "source": "dvo.be", "date": "23-04-2019", "category": "Vestiging", "confidence": 7, "why": "Een nieuwe vestiging is een mogelijk signaal van investering en gewijzigde logistieke behoeften.", "url": "https://www.dvo.be/artikel/64920-almex-metaal-bouwt-nieuwe-vestiging-in-hoogstraten", "domain": "dvo.be"}];
const escapeHtml = input => String(input ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signalState = {search:'', category:'Alle', min:6, selected:industryNews[0].id};
const categoryList = ['Alle', ...new Set(industryNews.map(a=>a.category))];
function visibleSignals(){return industryNews.filter(a=>a.confidence>=signalState.min && (signalState.category==='Alle'||a.category===signalState.category) && (a.title+' '+a.source+' '+a.category+' '+a.why).toLocaleLowerCase('nl').includes(signalState.search.toLocaleLowerCase('nl')))}
function renderCard(a){
 return `<article class="signal-card ${a.id===signalState.selected?'selected':''}"><button type="button" class="signal-select" data-select="${a.id}" aria-pressed="${a.id===signalState.selected}"><span class="signal-top"><span class="signal-category">${escapeHtml(a.category)}</span><span class="signal-confidence">${a.confidence}/10</span></span><strong class="signal-title">${escapeHtml(a.title)}</strong><span class="signal-meta">${escapeHtml(a.source)} · ${escapeHtml(a.date)}</span><span class="signal-reason">${escapeHtml(a.why)}</span></button></article>`;
}
let screenshotSerial=0;
function sourceView(a){
 if(!a) return '<div class="source-empty">Selecteer een artikel links.</div>';
 return `<div class="source-browser"><div class="browser-top"><span class="browser-dot"></span><span class="browser-domain">${escapeHtml(a.source)}</span><a href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer">Open artikel ↗</a></div><div class="source-image-wrap"><div class="preview-message" role="status">Bronpagina wordt geladen…</div><button type="button" class="preview-enlarge" aria-label="Vergroot schermafdruk van ${escapeHtml(a.source)}" hidden><img class="article-screenshot" alt="Schermafdruk van de originele nieuwswebsite" /></button></div></div>`;
}
async function loadSourceScreenshot(a){
 const request=++screenshotSerial;
 if(!a)return;
 const root=document.querySelector('.news-workspace');
 if(!root)return;
 const wrap=root.querySelector('.source-view');
 const isCurrent=()=>request===screenshotSerial && document.querySelector('.news-workspace')===root && signalState.selected===a.id;
 const status=wrap.querySelector('.preview-message');
 const btn=wrap.querySelector('.preview-enlarge');
 for(let attempt=0;attempt<35;attempt++){
  if(!isCurrent())return;
  try{
   const res=await fetch(`/showcase/api/preview/${encodeURIComponent(a.id)}`,{cache:'no-store'});
   if(!res.ok)throw new Error(`HTTP ${res.status}`);
   const result=await res.json();
   if(!isCurrent())return;
   if(result.status==='ready'){
    const img=btn.querySelector('img');
    img.onload=()=>{if(!isCurrent())return;status.hidden=true;btn.hidden=false;};
    img.onerror=()=>{if(isCurrent())setPreviewUnavailable(status,wrap,a);};
    // De backend geeft /api/image/ID terug. Via Netlify loopt dit onder /showcase/.
    if(!/^\/api\/image\/[a-z0-9-]+$/.test(result.image))throw new Error('Onverwacht afbeeldingspad');
    const imageUrl='/showcase'+result.image;
    img.src=imageUrl;
    btn.onclick=()=>openScreenshotModal(imageUrl,a);
    return;
   }
   if(result.status==='failed'){
    setPreviewUnavailable(status,wrap,a);
    return;
   }
  }catch(e){
    if(isCurrent())setPreviewUnavailable(status,wrap,a);
    return;
  }
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 if(isCurrent())setPreviewUnavailable(status,wrap,a);
}
function setPreviewUnavailable(status,wrap,a){
 status.textContent='Bronvoorvertoning niet beschikbaar.';
 if(wrap.querySelector('.preview-retry'))return;
 const retry=document.createElement('button');retry.className='preview-retry';retry.type='button';retry.textContent='Opnieuw proberen';
 retry.addEventListener('click',()=>{if(signalState.selected!==a.id)return;wrap.querySelector('.preview-enlarge').hidden=true;status.textContent='Bronpagina wordt geladen…';retry.remove();loadSourceScreenshot(a);});
 wrap.querySelector('.source-image-wrap').append(retry);
}
function openScreenshotModal(src,a){
 const previous=document.querySelector('#screenshot-modal');if(previous)previous.remove();
 const modal=document.createElement('div');modal.id='screenshot-modal';modal.className='screenshot-modal';
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Bronvoorvertoning');
 const panel=document.createElement('div');panel.className='screenshot-modal-panel';
 const top=document.createElement('div');top.className='screenshot-modal-top';
 const link=document.createElement('a');link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=`${a.source} · Open bron ↗`;
 const close=document.createElement('button');close.type='button';close.textContent='Sluiten';
 const image=document.createElement('img');image.src=src;image.alt=`Schermafdruk van ${a.source}`;
 top.append(link,close);panel.append(top,image);modal.append(panel);document.body.append(modal);
 function dismiss(){modal.remove();document.removeEventListener('keydown',onEsc)}
 function onEsc(e){if(e.key==='Escape')dismiss()}
 close.onclick=dismiss;modal.addEventListener('click',e=>{if(e.target===modal)dismiss()});document.addEventListener('keydown',onEsc);close.focus();
}

function cbsHtml(){
 // Verified CBS reports, published 9 Oct and 30 Sep 2026.
 return `<section class="sector-panel" aria-label="CBS sectorcijfers industrie"><div class="sector-title"><div><span class="sector-eyebrow">CBS · NEDERLAND</span><strong>Industrie in cijfers</strong></div><a href="https://www.cbs.nl/nl-nl/visualisaties/dashboard-economie/" target="_blank" rel="noopener noreferrer" title="CBS dashboard economie">↗</a></div><div class="sector-metrics">
 <a class="metric" href="https://www.cbs.nl/nl-nl/nieuws/2026/41/productie-industrie-in-augustus-12-procent-hoger-dan-jaar-eerder" target="_blank" rel="noopener noreferrer"><small>Productie · augustus</small><strong>+12,0%</strong><span>t.o.v. augustus 2025</span></a>
 <a class="metric" href="https://www.cbs.nl/nl-nl/nieuws/2026/40/afzetprijzen-industrie-bijna-7-procent-hoger-in-augustus" target="_blank" rel="noopener noreferrer"><small>Afzetprijzen · augustus</small><strong>+6,8%</strong><span>t.o.v. augustus 2025</span></a>
 <a class="metric" href="https://www.cbs.nl/nl-nl/nieuws/2026/41/productie-industrie-in-augustus-12-procent-hoger-dan-jaar-eerder" target="_blank" rel="noopener noreferrer"><small>Producentenvertrouwen · sep.</small><strong>+4,2</strong><span>seizoengecorrigeerd saldo</span></a></div><div class="sector-source">Bron: CBS · publicaties 30 september en 9 oktober 2026</div></section>`;
}
function filtersMarkup(){return `<div class="signals-toolbar"><label class="signal-search"><span class="visually-hidden">Zoek artikelen</span><input id="signal-search" type="search" placeholder="Zoek in artikelen…" value="${escapeHtml(signalState.search)}" autocomplete="off"></label><label class="signal-threshold">Score ≥ <output id="signal-score">${signalState.min}</output><input id="signal-min" type="range" min="1" max="10" step="1" value="${signalState.min}"></label></div><div class="signal-categories">${categoryList.map(cat=>`<button type="button" class="${signalState.category===cat?'active':''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`).join('')}</div>`}
function updateSignals(){const root=document.querySelector('.news-workspace');if(!root)return;const articles=visibleSignals();if(!articles.some(a=>a.id===signalState.selected))signalState.selected=articles[0]?.id||null;root.querySelector('#signal-count').textContent=`${articles.length} artikelen`;root.querySelector('.signal-list').innerHTML=articles.map(renderCard).join('')||'<div class="source-empty">Geen resultaten.</div>';const selected=articles.find(a=>a.id===signalState.selected);root.querySelector('.source-view').innerHTML=sourceView(selected);loadSourceScreenshot(selected);root.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click',()=>{signalState.selected=b.dataset.select;updateSignals();}));}
function renderNews(){const root=document.querySelector('#detail-body');if(!root)return;root.innerHTML=`<div class="news-workspace"><header class="news-strip"><div><span class="news-eyebrow">NOORDLICHT COMPONENTS</span><strong>Marktmonitor <span>· Maakindustrie</span></strong></div><span id="signal-count">6 artikelen</span></header><div class="news-columns"><section class="news-left" aria-label="Gevonden artikelen">${filtersMarkup()}<div class="signal-list"></div></section><aside class="news-right" aria-label="Bronartikel en sectorcijfers"><div class="source-title">BRONARTIKEL</div><div class="source-view"></div>${cbsHtml()}</aside></div></div>`;
 root.querySelector('#signal-search').addEventListener('input',e=>{signalState.search=e.target.value;updateSignals()});root.querySelector('#signal-min').addEventListener('input',e=>{signalState.min=+e.target.value;root.querySelector('#signal-score').textContent=String(signalState.min);updateSignals()});root.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{signalState.category=b.dataset.category;root.querySelectorAll('[data-category]').forEach(c=>c.classList.toggle('active',c===b));updateSignals()}));updateSignals();
}
