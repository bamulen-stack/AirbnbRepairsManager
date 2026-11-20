/* MGV v9.50 add-on: Long Term PDF report and Android back navigation */
(function(){
'use strict';
const css=`#mgv-print-report{position:fixed;inset:0;z-index:999999;overflow:auto;background:white;color:#14253c;padding:18px;font:15px Arial,sans-serif}#mgv-print-report header{background:#0a3760;color:white;padding:22px;border-radius:12px}#mgv-print-report h1{font-size:30px;margin:0}#mgv-print-report h1 small{font-size:11px;display:block}#mgv-print-report h3{color:#1160aa;border-bottom:2px solid #cde4f6;padding:8px 0}#mgv-print-report section{margin:18px 0;break-inside:avoid}#mgv-print-report table{border-collapse:collapse;width:100%}#mgv-print-report th,#mgv-print-report td{border:1px solid #ddd;padding:8px;text-align:left}#mgv-print-report th{background:#e9f3fd}#mgv-print-report .mgv-report-photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#mgv-print-report figure{margin:0;break-inside:avoid}#mgv-print-report figure img{width:100%;max-height:340px;object-fit:contain}#mgv-print-report footer{border-top:1px solid #ddd;color:#777;padding:12px;font-size:11px}#mgv-print-report .mgv-report-actions{display:flex;gap:10px}#mgv-print-report .mgv-report-actions button{background:#0b63ce;color:white;border:0;border-radius:8px;padding:12px}@media print{body>*:not(#mgv-print-report){display:none!important}html,body{background:white!important}#mgv-print-report{position:static!important;overflow:visible!important;padding:0!important}#mgv-print-report .mgv-report-actions{display:none!important}#mgv-print-report header{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4;margin:13mm}}`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const escapeHTML=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.mgvLongTermPDF=async function(taskId){
 const t=ltTask(taskId),a=t&&ltApt(t.apartmentId);if(!t||!a)return;
 await hydrateLTPhotos(t);
 const materials=ltTaskMaterials(taskId);
 const quotations=(data.longTermQuotations||[]).filter(q=>q.taskId===taskId);
 const images=await Promise.all((t.photos||[]).map(async p=>ltPhotoCache.get(p.id)||p.dataUrl||await getLTPhoto(p.id)||''));
 const rows=materials.map(m=>'<tr><td>'+escapeHTML(m.name)+'</td><td>'+escapeHTML(m.qty||1)+' '+escapeHTML(m.unit)+'</td><td>'+money(m.unitPrice||0)+'</td><td>'+money(Number(m.qty||1)*Number(m.unitPrice||0))+'</td></tr>').join('');
 const photos=images.map((src,j)=>src?'<figure><img src="'+src+'"><figcaption>Photo '+(j+1)+'</figcaption></figure>':'').join('');
 document.getElementById('mgv-print-report')?.remove();
 const wrap=document.createElement('div');wrap.id='mgv-print-report';
 wrap.innerHTML='<div class="mgv-report-actions"><button onclick="window.print()">📄 Print / Save PDF</button><button onclick="document.getElementById(\'mgv-print-report\').remove()">✕ Close</button></div>'+
 '<header><h1>MGV <small>MYGREEKVACATIONS</small></h1><h2>TECHNICAL WORK REPORT</h2><p>Long Term · '+escapeHTML(a.name)+'</p></header>'+
 '<section><h3>Property & Task</h3><p><b>Apartment:</b> '+escapeHTML(a.name)+'</p><p><b>Address:</b> '+escapeHTML(a.address||'—')+'</p><p><b>Floor:</b> '+escapeHTML(a.floor||'—')+'</p><p><b>Work:</b> '+escapeHTML(t.title)+'</p><p><b>Date:</b> '+fmt(t.date)+'</p><p><b>Technician:</b> '+escapeHTML(t.technician||'—')+'</p><p><b>Status:</b> '+escapeHTML(t.status||'Pending')+' · <b>Priority:</b> '+escapeHTML(t.priority||'Normal')+'</p></section>'+
 (t.description?'<section><h3>Description</h3><p>'+escapeHTML(t.description)+'</p></section>':'')+
 (t.notes?'<section><h3>Notes</h3><p>'+escapeHTML(t.notes)+'</p></section>':'')+
 '<section><h3>Materials & Costs</h3>'+(materials.length?'<table><thead><tr><th>Material</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead><tbody>'+rows+'</tbody></table>':'<p>No materials recorded.</p>')+'<p><b>Materials total: '+money(ltMaterialTotal(taskId))+'</b></p></section>'+
 (quotations.length?'<section><h3>Linked Quotations</h3>'+quotations.map(q=>'<p>'+escapeHTML(q.number||'Quotation')+' · '+fmt(q.date)+' · '+escapeHTML(q.status||'')+' · <b>'+money(Number(q.total)||longTermQuotationTotal(q))+'</b></p>').join('')+'</section>':'')+
 '<section><h3>Task Photos ('+images.length+')</h3>'+(photos?'<div class="mgv-report-photos">'+photos+'</div>':'<p>No photos attached.</p>')+'</section>'+
 '<footer>MGV · Property Maintenance System · '+new Date().toLocaleDateString('en-GB')+'</footer>';
 document.body.appendChild(wrap);wrap.scrollIntoView({block:'start'});
};
// Wrap the Long Term task page without changing the existing task or photo storage.
const originalLT=window.showLongTermTask;
if(typeof originalLT==='function')window.showLongTermTask=async function(i){
 const result=await originalLT.apply(this,arguments);
 const view=document.getElementById('view');
 if(view&&!view.querySelector('#mgv-pdf-button')){
  const btn=document.createElement('button');btn.id='mgv-pdf-button';btn.className='btn primary';btn.textContent='📄 PDF Report';btn.style.cssText='width:100%;margin:14px 0';btn.onclick=()=>window.mgvLongTermPDF(i);
  const controls=view.querySelector('.row:last-child');if(controls)controls.before(btn);else view.appendChild(btn);
 }
 return result;
};
// Maintain browser history for internal page navigation.
const pages=['showLongTerm','showLongTermApartment','showLongTermTask','showLongTermInspection','showLongTermMaterials','showLongTermQuotation','showTask','showApartment','showBuilding','showInspection'];
const originals={};let restoring=false,last='';
function remember(name,args){if(restoring)return;const key=JSON.stringify([name,args]);if(key===last)return;try{history.pushState({mgvPage:name,mgvArgs:args},'',location.href);last=key}catch(e){}}
for(const name of pages){const fn=window[name];if(typeof fn!=='function')continue;originals[name]=fn;window[name]=function(...args){remember(name,args);return fn.apply(this,args)}}
const originalRender=window.render;
if(typeof originalRender==='function'){originals.render=originalRender;window.render=function(...args){remember('render',[route]);return originalRender.apply(this,args)}}
try{history.replaceState({mgvPage:'render',mgvArgs:['home']},'',location.href)}catch(e){}
window.addEventListener('popstate',event=>{
 const st=event.state;if(!st||!st.mgvPage)return;
 const print=document.getElementById('mgv-print-report');if(print)print.remove();
 restoring=true;
 try{if(st.mgvPage==='render'){route=st.mgvArgs[0];originals.render?.()}else originals[st.mgvPage]?.(...(st.mgvArgs||[]));last=JSON.stringify([st.mgvPage,st.mgvArgs||[]])}finally{restoring=false}
});
})();
