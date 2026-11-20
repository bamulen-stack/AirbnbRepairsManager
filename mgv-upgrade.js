/* MGV v9.50 add-on: Long Term PDF report and Android back navigation */
(function(){
'use strict';
const css=`#mgv-print-report{position:fixed;inset:0;z-index:999999;overflow:auto;background:white;color:#14253c;padding:18px;font:15px Arial,sans-serif}#mgv-print-report header{background:#0a3760;color:white;padding:22px;border-radius:12px}#mgv-print-report h1{font-size:30px;margin:0}#mgv-print-report h1 small{font-size:11px;display:block}#mgv-print-report h3{color:#1160aa;border-bottom:2px solid #cde4f6;padding:8px 0}#mgv-print-report section{margin:18px 0;break-inside:avoid}#mgv-print-report table{border-collapse:collapse;width:100%}#mgv-print-report th,#mgv-print-report td{border:1px solid #ddd;padding:8px;text-align:left}#mgv-print-report th{background:#e9f3fd}#mgv-print-report .mgv-report-photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#mgv-print-report figure{margin:0;break-inside:avoid}#mgv-print-report figure img{width:100%;max-height:340px;object-fit:contain}#mgv-print-report footer{border-top:1px solid #ddd;color:#777;padding:12px;font-size:11px}#mgv-print-report .mgv-report-actions{display:flex;gap:10px}#mgv-print-report .mgv-report-actions button{background:#0b63ce;color:white;border:0;border-radius:8px;padding:12px}@media print{body>*:not(#mgv-print-report){display:none!important}html,body{background:white!important}#mgv-print-report{position:static!important;overflow:visible!important;padding:0!important}#mgv-print-report .mgv-report-actions{display:none!important}#mgv-print-report header{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4;margin:13mm}}`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const escapeHTML=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Print a self-contained document to avoid the main app's global @media print rules.
window.mgvPrintReport=function(){
 const report=document.getElementById('mgv-print-report');if(!report)return;
 // Open a real browser document rather than printing a 1px offscreen iframe.
 // Android Chrome frequently prints that hidden iframe as blank pages.
 const tab=window.open('','_blank');
 if(!tab){alert('Allow pop-ups for this site, then try PDF Report again.');return;}
 const copy=report.cloneNode(true);
 copy.querySelectorAll('.mgv-report-actions').forEach(n=>n.remove());
 const printCss=`@page{size:A4;margin:14mm}html,body{margin:0;padding:0;background:#fff;color:#14253c;font:14px Arial,sans-serif}*{box-sizing:border-box}body{padding:12mm}header{background:#0a3760;color:white;padding:18px;border-radius:8px;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1{font-size:26px;margin:0}h3{color:#1160aa;border-bottom:2px solid #cde4f6;padding:8px 0}section{margin:14px 0;break-inside:avoid}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:7px;text-align:left}.mgv-report-photos{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0;break-inside:avoid}figure img{width:100%;max-height:300px;object-fit:contain}footer{border-top:1px solid #ddd;color:#777;padding:12px;font-size:11px}#mgv-print-report{position:static!important;inset:auto!important;overflow:visible!important;background:#fff!important;color:#14253c!important;padding:0!important}#print-action{position:sticky;top:0;background:#fff;padding:12px;z-index:2}#print-action button{background:#0b63ce;color:white;border:0;border-radius:8px;padding:12px 20px;font-size:16px}@media print{body{padding:0}#print-action{display:none!important}}`;
 const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>MGV Task Report</title><style>'+printCss+'</style></head><body><div id="print-action"><button onclick="window.print()">📄 Save as PDF / Print</button></div>'+copy.outerHTML+'</body></html>';
 tab.document.open();tab.document.write(html);tab.document.close();tab.focus();
};
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
 wrap.innerHTML='<div class="mgv-report-actions"><button onclick="window.mgvPrintReport()">📄 Print / Save PDF</button><button onclick="document.getElementById(\'mgv-print-report\').remove()">✕ Close</button></div>'+
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

// Per-task time entries. Stored separately to avoid modifying the existing application database.
const HOURS_KEY='mgv_task_work_hours_v1';
function hoursRead(){try{const v=JSON.parse(localStorage.getItem(HOURS_KEY)||'{}');return v&&typeof v==='object'?v:{}}catch(e){return {}}}
function hoursFor(kind,id){return hoursRead()[kind+':'+id]||[]}
function hoursWrite(kind,id,entries){const all=hoursRead();all[kind+':'+id]=entries;try{localStorage.setItem(HOURS_KEY,JSON.stringify(all));return true}catch(e){alert('Unable to save work hours. Check available storage and export a backup.');return false}}
function hoursDuration(x){const [sh,sm]=(x.start||'00:00').split(':').map(Number),[eh,em]=(x.end||'00:00').split(':').map(Number);let minutes=(eh*60+em)-(sh*60+sm);if(minutes<0)minutes+=1440;return Math.max(0,minutes-(Number(x.breakMinutes)||0))}
function hoursText(minutes){return Math.floor(minutes/60)+'h '+String(minutes%60).padStart(2,'0')+'m'}
function hoursEscape(x){return escapeHTML(x)}
function hoursRefresh(kind,id){
 const node=document.getElementById('mgv-task-hours');if(!node)return;
 const entries=hoursFor(kind,id),total=entries.reduce((sum,x)=>sum+hoursDuration(x),0);
 node.innerHTML='<div class="section-head"><h2>⏱️ Work Hours</h2><button type="button" class="small-btn primary" id="mgv-add-hours">+ Add Hours</button></div>'+
 '<div class="card" style="padding:14px"><b>Total: '+hoursText(total)+'</b><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="small-btn soft" onclick="mgvExportHours()">Backup Hours</button><button type="button" class="small-btn soft" onclick="mgvImportHours()">Restore Hours</button></div>'+
 (entries.length?entries.map(x=>'<div style="border-top:1px solid #38526a;padding:12px 0;margin-top:10px"><b>'+hoursEscape(x.date)+'</b> · '+hoursEscape(x.technician||'Technician')+'<div class="meta">'+hoursEscape(x.start)+'–'+hoursEscape(x.end)+' · Break '+(x.breakMinutes||0)+' min · <b>'+hoursText(hoursDuration(x))+'</b></div><div class="row" style="gap:8px;margin-top:8px"><button type="button" class="small-btn soft mgv-edit-hours" data-id="'+hoursEscape(x.id)+'">Edit</button><button type="button" class="small-btn danger mgv-delete-hours" data-id="'+hoursEscape(x.id)+'">Delete</button></div></div>').join(''):'<p class="meta">No work hours recorded yet.</p>')+'</div>';
 node.querySelector('#mgv-add-hours').onclick=()=>hoursEdit(kind,id);
 node.querySelectorAll('.mgv-edit-hours').forEach(b=>b.onclick=()=>hoursEdit(kind,id,b.dataset.id));
 node.querySelectorAll('.mgv-delete-hours').forEach(b=>b.onclick=()=>{if(confirm('Delete this work hours entry?')){hoursWrite(kind,id,entries.filter(x=>x.id!==b.dataset.id));hoursRefresh(kind,id)}});
}
function hoursEdit(kind,id,entryId){
 const entry=hoursFor(kind,id).find(x=>x.id===entryId)||{};
 document.getElementById('mgv-hours-dialog')?.remove();
 const shade=document.createElement('div');shade.id='mgv-hours-dialog';shade.style.cssText='position:fixed;inset:0;z-index:999998;background:#0009;display:flex;align-items:flex-end;justify-content:center';
 const today=new Date().toLocaleDateString('en-CA');
 shade.innerHTML='<form style="width:min(100%,520px);max-height:90vh;overflow:auto;background:#102c48;color:white;border-radius:22px 22px 0 0;padding:22px;box-sizing:border-box"><h2>⏱️ '+(entryId?'Edit':'Add')+' Work Hours</h2>'+
 [['date','Date','date',entry.date||today],['technician','Technician','text',entry.technician||(kind==='long'?ltTask(id)?.technician:data.tasks.find(t=>t.id===id)?.technician)||''],['start','Start time','time',entry.start||'09:00'],['end','End time','time',entry.end||'17:00'],['breakMinutes','Break (minutes)','number',entry.breakMinutes??0]].map(([name,label,type,value])=>'<label style="display:block;margin:10px 0">'+label+'<input name="'+name+'" type="'+type+'" '+(name==='breakMinutes'?'min="0" max="1440"':'')+' required value="'+hoursEscape(value)+'" style="display:block;width:100%;box-sizing:border-box;padding:12px;border-radius:9px;border:1px solid #7992a8;margin-top:5px;font-size:16px"></label>').join('')+
 '<div class="row" style="gap:8px"><button class="btn primary" type="submit">Save Hours</button><button class="btn soft" type="button" id="mgv-hours-cancel">Cancel</button></div></form>';
 document.body.appendChild(shade);shade.querySelector('#mgv-hours-cancel').onclick=()=>shade.remove();shade.onclick=e=>{if(e.target===shade)shade.remove()};
 shade.querySelector('form').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget),record={id:entryId||('h'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),date:String(fd.get('date')),technician:String(fd.get('technician')),start:String(fd.get('start')),end:String(fd.get('end')),breakMinutes:Number(fd.get('breakMinutes'))||0};const list=hoursFor(kind,id);const updated=entryId?list.map(x=>x.id===entryId?record:x):[...list,record];if(hoursWrite(kind,id,updated)){shade.remove();hoursRefresh(kind,id)}};
}
function hoursMount(kind,id){const view=document.getElementById('view');if(!view)return;view.querySelector('#mgv-task-hours')?.remove();const section=document.createElement('section');section.id='mgv-task-hours';section.style.margin='18px 0';const controls=view.querySelector('.row:last-child');if(controls)controls.before(section);else view.appendChild(section);hoursRefresh(kind,id)}
function hoursReportSection(kind,id){const entries=hoursFor(kind,id);return '<section><h3>Work Hours</h3>'+(entries.length?'<table><thead><tr><th>Date</th><th>Technician</th><th>Start–End</th><th>Break</th><th>Hours</th></tr></thead><tbody>'+entries.map(x=>'<tr><td>'+hoursEscape(x.date)+'</td><td>'+hoursEscape(x.technician)+'</td><td>'+hoursEscape(x.start)+'–'+hoursEscape(x.end)+'</td><td>'+(x.breakMinutes||0)+' min</td><td>'+hoursText(hoursDuration(x))+'</td></tr>').join('')+'</tbody></table><p><b>Total hours: '+hoursText(entries.reduce((n,x)=>n+hoursDuration(x),0))+'</b></p>':'<p>No work hours recorded.</p>')+'</section>'}
const priorLongTask=window.showLongTermTask;
if(typeof priorLongTask==='function')window.showLongTermTask=async function(id){const result=await priorLongTask.apply(this,arguments);hoursMount('long',id);return result};
const priorTask=window.showTask;
if(typeof priorTask==='function')window.showTask=function(id){const result=priorTask.apply(this,arguments);hoursMount('airbnb',id);return result};
const priorPdf=window.mgvLongTermPDF;
window.mgvLongTermPDF=async function(id){await priorPdf(id);const report=document.getElementById('mgv-print-report');if(report){const foot=report.querySelector('footer');if(foot)foot.insertAdjacentHTML('beforebegin',hoursReportSection('long',id));else report.insertAdjacentHTML('beforeend',hoursReportSection('long',id))}};
// Export a complete standalone hours backup; the main app backup does not include this add-on storage.
window.mgvExportHours=function(){const blob=new Blob([JSON.stringify({version:1,workHours:hoursRead()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='MGV_Work_Hours_Backup_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
window.mgvImportHours=function(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const obj=JSON.parse(await input.files[0].text());if(!obj.workHours||typeof obj.workHours!=='object')throw Error('Invalid hours backup');if(!confirm('Restore work hours from this backup? Existing work hours will be replaced.'))return;localStorage.setItem(HOURS_KEY,JSON.stringify(obj.workHours));alert('Work hours restored. Open the task again.')}catch(e){alert('Restore failed: '+e.message)}};input.click()};
// Backup controls are available inside each task's Work Hours section only.
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
