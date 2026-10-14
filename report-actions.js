// Shared presentation/export adapters. Existing calculation and save handlers remain intact.
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const filename=decodeURIComponent(location.pathname).split('/').pop();
const icons={view:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',print:'<path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6Z"/><path d="M17 11h1"/>',pdf:'<path d="M5 2h9l5 5v15H5Z M14 2v6h5"/><text x="6" y="17" font-size="7" fill="currentColor" stroke="none">PDF</text>',excel:'<path d="M4 2h12l4 4v16H4Z M16 2v5h4 M8 10l7 8 M15 10l-7 8"/>',word:'<path d="M4 2h12l4 4v16H4Z M16 2v5h4 M7 11l2 7 3-6 3 6 2-7"/>',whatsapp:'<path d="M4 20l1-4a9 9 0 1 1 4 4Z"/><path d="M8 8c1 4 3 6 7 7l2-2-3-2-1 1-2-2 1-1-2-3Z"/>'};
const labels=Object.fromEntries(Object.entries({view:'View',print:'Print',pdf:'PDF',excel:'Excel',word:'Word',whatsapp:'WhatsApp'}).map(([key,name])=>[key,`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[key]}</svg><span>${name}</span>`]));
const mapping={
 'Consumption Particulars.html':{print:'printDaily',excel:'excelDaily',whatsapp:'shareWhatsApp',word:'wordDaily'},
 'index.html':{print:'printDaily',excel:'excelDaily',whatsapp:'shareWhatsApp',word:'wordDaily'},
 'energy-meter.html':{print:'printEnergy',excel:'excelEnergy',whatsapp:'whatsappEnergy',word:'wordEnergy'},
 'monthly-energy.html':{print:'printMonthly'},'monthly-register.html':{print:'printMonthly'},
 'consolidated-report.html':{view:'viewConsolidated',print:'printConsolidated',excel:'excelConsolidated',whatsapp:'whatsappConsolidated',word:'wordConsolidated'},
 'interruptions.html':{},'home.html':{}
};
const native=mapping[filename];
if(native){
 const bar=document.createElement('section');bar.className='report-action-bar';bar.setAttribute('aria-label','Report actions');
 bar.innerHTML=`<div class="report-action-buttons">${['view','print','pdf','excel','word','whatsapp'].map(kind=>`<button type="button" data-report-action="${kind}" class="report-action-${kind}" title="${kind==='pdf'?'Open print dialog and choose Save as PDF':kind==='view'?'Preview the current report':kind}">${labels[kind]}</button>`).join('')}</div><span class="report-action-status" role="status"></span>`;
 document.body.append(bar);document.body.classList.add('has-report-actions');
 const status=bar.querySelector('[role="status"]');
 if(filename==='interruptions.html')document.querySelector('.report-back[href="home.html"]')?.addEventListener('click',event=>{try{if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1){event.preventDefault();history.back();}}catch{}});
 function cloneReport(node){
  const copy=node.cloneNode(true);const originals=node.querySelectorAll('input,select,textarea');
  copy.querySelectorAll('input,select,textarea').forEach((el,i)=>{const original=originals[i];const span=document.createElement('span');span.textContent=original.tagName==='SELECT'?original.selectedOptions[0]?.textContent||'—':original.value||'—';el.replaceWith(span);});
  copy.querySelectorAll('button,script,.register-actions,.demand-actions,.int-action-column,.int-row-actions,[hidden]').forEach(e=>e.remove());
  copy.removeAttribute('hidden');copy.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));copy.removeAttribute('id');return copy;
 }
 function table(headers,rows){return '<table><thead><tr>'+headers.map(v=>'<th>'+esc(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
 function interruptionSource(){
  const report=window.interruptionReport;if(!report)throw new Error('Choose a valid period.');
  const minutes=r=>r.from&&r.to?Math.round((Date.parse(r.to+'+05:30')-Date.parse(r.from+'+05:30'))/60000):null;
  const duration=n=>n===null?'Review needed':`${Math.floor(n/60)} h ${n%60} min`;
  const rows=report.records.map(r=>[r.date,r.equipment,r.from?.replace('T',' ')||'Confirm time',r.to?.replace('T',' ')||'Confirm time',duration(minutes(r)),r.reason,r.source,r.review||'']);
  const detail=table(['Date','Equipment','From (IST)','To (IST)','Duration','Reason','Source','Review'],rows);
  const groups=[...new Set(report.records.map(r=>r.equipment))].map(e=>{const list=report.records.filter(r=>r.equipment===e),known=list.map(minutes).filter(n=>n!==null);return [e,list.length,duration(known.reduce((a,b)=>a+b,0)),list.length-known.length];});
  const note=`${report.range.from||'First saved date'} to ${report.range.to||'Latest saved date'}. ${report.totals.count} interruptions. Confirmed duration: ${duration(report.totals.minutes)}. Awaiting confirmation: ${report.totals.pending}. Durations are summed per equipment; simultaneous outages count separately.`;
  return {title:report.title,html:'<p>'+esc(note)+'</p>'+detail+'<h2>Equipment totals</h2>'+table(['Equipment','Interruptions','Confirmed duration','Pending'],groups),note};
 }
 function source(){
  if(filename==='interruptions.html')return interruptionSource();
  if(filename==='home.html'){
   const panel=document.querySelector('.demand-group:not([hidden])');if(!panel||$('mdSoFarContent')?.hidden)throw new Error('Select 400 KV MD or 220 KV MD first.');
   return {title:panel.querySelector('h2').textContent+' — MD SO FAR',html:cloneReport(panel).outerHTML,note:'Current displayed maximum demand records. Unsaved edits, if any, are previewed.'};
  }
  if(filename==='Consumption Particulars.html'||filename==='index.html'){
   const report=window.lastReport||$('reportOutput')?.textContent;if(!report?.trim())throw new Error('Select a saved daily report first.');
   return {title:'DAILY CONSUMPTION — '+($('reportDate')?.value||''),html:'<pre>'+esc(report.replace(/\*/g,''))+'</pre>',note:'Saved daily report preview.'};
  }
  const config=filename==='energy-meter.html'?['energyTables','ENERGY METER READINGS — '+($('energyDate')?.value||'')]:filename==='consolidated-report.html'?['consolidatedReportBody','CONSOLIDATED ENERGY METER READINGS — '+($('consolidatedDate')?.value||'')]:['registerPanel',($('registerTitle')?.textContent||'MONTHLY ENERGY REGISTER')];
  const node=$(config[0]);if(!node||node.hidden||!node.querySelector('table'))throw new Error('Select and load the report first.');
  return {title:config[1],html:cloneReport(node).outerHTML,note:'Current displayed readings. Unsaved changes, if any, are included in this preview.'};
 }
 function ready(){
  if(filename==='interruptions.html')return !!window.interruptionReport&&$('intCloudStatus')?.textContent.includes('Saved daily reports loaded')&&$('intCloudStatus')?.textContent.includes('Manual entries connected');
  if(filename==='home.html')return !$('mdSoFarContent')?.hidden&&$('demandConnection')?.textContent.includes('Saved records loaded');
  const button=$(native.print);return !!button&&!button.disabled&&(filename!=='consolidated-report.html'||!$('consolidatedReportBody')?.hidden);
 }
 function update(){
  for(const [kind,id] of Object.entries(native)){const button=$(id);if(button&&kind!=='view')button.classList.add('report-native-action');}
  if($('intPrint'))$('intPrint').classList.add('report-native-action');
  const ok=ready();bar.querySelectorAll('[data-report-action]').forEach(button=>{const kind=button.dataset.reportAction;button.disabled=kind==='view'&&native.view?!$(native.view)||$(native.view).disabled:!ok;});
  bar.hidden=filename==='home.html'&&$('mdSoFarContent')?.hidden;
  const height=bar.hidden?0:bar.getBoundingClientRect().height;document.body.style.setProperty('--report-actions-height',height+'px');
  document.body.classList.toggle('report-has-save-bar',!!document.querySelector('#dailySaveBar,#energySaveBar,#monthlySaveBar'));
 }
 function preview(report,print){
  const popup=window.open('','_blank','width=1150,height=850');if(!popup)throw new Error('Allow browser pop-ups for report preview.');
  popup.document.write(`<!doctype html><html><head><meta charset="UTF-8"><title>${esc(report.title)}</title><style>body{font:14px Arial,sans-serif;color:#173858;padding:25px;line-height:1.5}h1,h2{text-align:center}table{border-collapse:collapse;width:100%;margin:15px 0;font-size:12px}th,td{border:1px solid #b8c9d8;padding:7px;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#e8f0f8}pre{white-space:pre-wrap;font:14px 'Courier New',monospace}.tools{position:sticky;top:0;background:#fff;padding:10px}button{padding:10px 16px;background:#173858;color:white;border:0;border-radius:6px}.report-note{color:#637b90;font-size:12px}@media print{.tools{display:none}body{padding:0;color:black}thead{display:table-header-group}tr{break-inside:avoid}@page{size:A4 landscape;margin:12mm}}</style></head><body><div class="tools"><button onclick="window.print()">Print / Save as PDF</button></div><h2>APTRANSCO · 400 KV SUBSTATION KALIKIRI</h2><h1>${esc(report.title)}</h1><p class="report-note">${esc(report.note||'')}</p>${report.html}</body></html>`);popup.document.close();if(print){popup.focus();popup.requestAnimationFrame(()=>popup.requestAnimationFrame(()=>popup.print()));}
 }
 let excelPromise;
 function excelJS(){if(window.ExcelJS)return Promise.resolve(window.ExcelJS);if(excelPromise)return excelPromise;excelPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';script.onload=()=>window.ExcelJS?resolve(window.ExcelJS):reject(new Error('Excel library unavailable.'));script.onerror=()=>{excelPromise=null;reject(new Error('Excel download requires an internet connection. Please retry.'));};document.head.append(script);});return excelPromise;}
 async function exportExcel(report){
  const ExcelJS=await excelJS(),book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Report');sheet.addRow(['APTRANSCO — 400 KV SUBSTATION KALIKIRI']);sheet.addRow([report.title]);sheet.addRow([report.note||'']);sheet.addRow([]);
  const doc=new DOMParser().parseFromString(report.html,'text/html');
  const tables=doc.querySelectorAll('table');
  if(!tables.length){for(const line of doc.body.textContent.split('\n'))sheet.addRow([line]);}
  else tables.forEach(table=>{const reserved=new Set();const base=sheet.rowCount+1;Array.from(table.rows).forEach((tr,ri)=>{let col=1;Array.from(tr.cells).forEach(td=>{while(reserved.has((base+ri)+':'+col))col++;const raw=td.textContent.trim();const cell=sheet.getCell(base+ri,col);cell.value=/^-?\d+(\.\d+)?$/.test(raw)?Number(raw):raw;cell.alignment={wrapText:true,vertical:'top'};cell.border={top:{style:'thin',color:{argb:'FFCBD6E0'}},bottom:{style:'thin',color:{argb:'FFCBD6E0'}}};if(td.tagName==='TH'){cell.font={bold:true,color:{argb:'FF173858'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE8F0F8'}};}const rs=td.rowSpan||1,cs=td.colSpan||1;if(rs>1||cs>1)sheet.mergeCells(base+ri,col,base+ri+rs-1,col+cs-1);for(let r=0;r<rs;r++)for(let c=0;c<cs;c++)reserved.add((base+ri+r)+':'+(col+c));col+=cs;});});sheet.addRow([]);});
  for(let i=1;i<=Math.max(sheet.columnCount,1);i++)sheet.getColumn(i).width=i===1?24:30;sheet.getRow(1).font={bold:true,size:16};sheet.getRow(2).font={bold:true,size:14};sheet.views=[{state:'frozen',ySplit:4}];
  const buffer=await book.xlsx.writeBuffer(),url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download=report.title.replace(/[^a-zA-Z0-9-]+/g,'_').slice(0,80)+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 }
 async function share(report){const doc=new DOMParser().parseFromString(report.html,'text/html');const tables=doc.querySelectorAll('table');const lines=tables.length?Array.from(tables).flatMap(table=>Array.from(table.rows).map(tr=>Array.from(tr.cells).map(td=>td.textContent.trim()).join(' | '))):[doc.body.textContent];const text='APTRANSCO — 400 KV SS KALIKIRI\n'+report.title+'\n'+(report.note||'')+'\n\n'+lines.join('\n');if(text.length>12000){if(!navigator.clipboard)throw new Error('Report too long for a WhatsApp link. Use Word / Excel to share the full report.');await navigator.clipboard.writeText(text);window.open('https://wa.me/','_blank');status.textContent='Full report copied. Paste it in your WhatsApp chat.';}else window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');}
 bar.addEventListener('click',async event=>{const button=event.target.closest('[data-report-action]');if(!button||button.disabled)return;const kind=button.dataset.reportAction;status.textContent='';try{
  // Keep existing native export formats and data guards.
  const target=kind==='pdf'?native.print:native[kind];
  if(target&&kind!=='view'){$(target).click();if(kind==='pdf')status.textContent='In the print dialog, select Save as PDF.';return;}
  if(kind==='view'&&native.view){$(native.view).click();return;}
  const report=source();if(kind==='view')preview(report,false);else if(kind==='print'||kind==='pdf'){preview(report,true);if(kind==='pdf')status.textContent='In the print dialog, select Save as PDF.';}else if(kind==='excel'){button.disabled=true;status.textContent='Preparing Excel…';await exportExcel(report);status.textContent='Excel downloaded.';}else if(kind==='word'){const html='<!doctype html><html><head><meta charset="UTF-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px;white-space:pre-wrap}</style></head><body><h2>APTRANSCO — 400 KV SS KALIKIRI</h2><h1>'+esc(report.title)+'</h1><p>'+esc(report.note||'')+'</p>'+report.html+'</body></html>';const url=URL.createObjectURL(new Blob(['\ufeff',html],{type:'application/msword'}));const a=document.createElement('a');a.href=url;a.download=report.title.replace(/[^a-zA-Z0-9-]+/g,'_').slice(0,80)+'.doc';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}else if(kind==='whatsapp')await share(report);
 }catch(e){status.textContent=e.message;}finally{update();}});
 for(const name of ['report-actions-changed','daily-cloud-changed','energy-page-state','monthly-register-state','dashboard-access-changed'])window.addEventListener(name,update);
 new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;update();});}}).observe(document.querySelector('main')||document.body,{subtree:true,attributes:true,attributeFilter:['hidden','disabled','data-monthly-ready'],childList:true});
 let queued=false;window.addEventListener('resize',update);update();
}
