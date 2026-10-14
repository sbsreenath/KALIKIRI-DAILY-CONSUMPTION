import {GROUPS,EQUIPMENT,combineRecords,durationMinutes,formatDuration,monthlyRecords,summary,duplicateRecord,periodRange,rangeRecords,equipmentOrder} from './interruptions-core.js';
import {subscribe,saveEntry,removeEntry,state} from './interruptions-cloud.js';
const $=id=>document.getElementById(id);
let records=[],editing=null,busy=false;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=GROUPS.map(g=>`<optgroup label="${g.name}">${g.items.map(e=>`<option>${e}</option>`).join('')}</optgroup>`).join('');
$('intEntryEquipment').innerHTML='<option value="">Select equipment</option>'+options;
$('intFilterEquipment').innerHTML='<option value="">All equipment</option>'+options;
const params=new URLSearchParams(location.search);
if(EQUIPMENT.includes(params.get('equipment'))){$('intFilterEquipment').value=params.get('equipment');$('intEntryEquipment').value=params.get('equipment');}
if(params.get('view')==='month')$('intView').value='month';
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
const part=type=>parts.find(p=>p.type===type).value;
const date=`${part('year')}-${part('month')}-${part('day')}`;
$('intMonth').value=date.slice(0,7);$('intRangeTo').value=date;$('intRangeFrom').value=date.slice(0,7)+'-01';if(params.get('view')==='month')$('intPeriod').value='month';
$('intFrom').value=date+'T00:00';$('intTo').value=date+'T00:00';
function duration(){const n=durationMinutes($('intFrom').value,$('intTo').value);$('intDuration').textContent='Duration: '+formatDuration(n);}
function controls(){const s=state();const allow=s.access.ready&&s.access.canEdit&&s.manualReady&&!busy;
 $('intSave').disabled=!allow;
 $('intForm').querySelectorAll('input,select,textarea').forEach(e=>e.disabled=!allow);
 $('intCancel').disabled=busy;
}
function displayTime(s){return s?s.slice(0,10).split('-').reverse().join('/')+' '+s.slice(11):'Confirm time';}
function selectedRange(){return periodRange($('intPeriod').value,$('intRangeTo').value,$('intMonth').value,$('intRangeFrom').value,$('intRangeTo').value);}
function filtered(){const view=$('intView').value;const list=rangeRecords(records,selectedRange());return view==='month'?list:view==='review'?list.filter(r=>r.review):list.filter(r=>!$('intFilterEquipment').value||r.equipment===$('intFilterEquipment').value);}

function render(){
 controls();duration();
 const view=$('intView').value;
 $('intEquipmentLabel').hidden=view!=='equipment';$('intMonthLabel').hidden=$('intPeriod').value!=='month';$('intFromLabel').hidden=$('intPeriod').value!=='custom';$('intToLabel').hidden=!['custom','m1','m3','m6','y1'].includes($('intPeriod').value);$('intMonthNote').hidden=false;
 let list,range;try{range=selectedRange();list=filtered().sort(equipmentOrder);}catch(e){$('intSummary').textContent=e.message;$('intRows').innerHTML='';$('intMonthlySummary').innerHTML='';window.interruptionReport=null;return;}
 $('intTableTitle').textContent=view==='month'?`All equipment — ${range.label}`:view==='review'?'Review needed':`${$('intFilterEquipment').value||'All equipment'} — Interruption history`;
 const totals=summary(list);window.interruptionReport={title:$('intTableTitle').textContent,range,records:list,totals};window.dispatchEvent(new CustomEvent('report-actions-changed'));
 $('intSummary').textContent=`${range.from?range.from+' to '+range.to+' · ':''}${totals.count} interruptions · Confirmed duration: ${formatDuration(totals.minutes)}${totals.pending?' · '+totals.pending+' awaiting time confirmation':''}`;
 const canEdit=state().access.canEdit&&state().manualReady&&!busy;
 $('intRows').innerHTML=list.map(r=>`<tr class="${r.review?'int-row-review':''}"><td>${escape(r.date.split('-').reverse().join('/'))}</td><td>${escape(r.equipment)}</td><td>${escape(displayTime(r.from))}</td><td>${escape(displayTime(r.to))}</td><td>${escape(formatDuration(durationMinutes(r.from,r.to)))}</td><td class="int-reason">${escape(r.reason)}${r.review?'<p><strong>'+escape(r.review)+'</strong></p>':''}</td><td>${escape(r.source)}</td><td class="int-action-column"><div class="int-row-actions">${canEdit?`<button type="button" data-edit="${escape(r.id)}">${r.mode==='automatic'?'Review':'Edit'}</button>${r.mode!=='automatic'?`<button type="button" data-delete="${escape(r.id)}">${r.mode==='correction'?'Reset review':'Delete'}</button>`:''}`:''}</div></td></tr>`).join('')||'<tr><td colspan="8" class="int-empty">No interruptions in this view.</td></tr>';
 $('intMonthlySummary').innerHTML=view==='month'&&list.length?'<h2>Equipment totals</h2><div class="int-table-wrap"><table><thead><tr><th>Equipment</th><th>Interruptions</th><th>Confirmed duration</th><th>Needs review</th></tr></thead><tbody>'+[...new Set(list.map(r=>r.equipment))].map(e=>{const t=summary(list.filter(r=>r.equipment===e));return `<tr><td>${escape(e)}</td><td>${t.count}</td><td>${formatDuration(t.minutes)}</td><td>${t.pending}</td></tr>`;}).join('')+'</tbody></table></div>':'';
}
function reset(){editing=null;$('intFormTitle').textContent='Manual Entry';$('intCancel').hidden=true;$('intReason').value='';$('intFormStatus').textContent='';render();}
$('intCancel').onclick=reset;
$('intRows').onclick=async event=>{
 const edit=event.target.closest('[data-edit]');const del=event.target.closest('[data-delete]');
 if(edit){const r=records.find(r=>r.id===edit.dataset.edit);if(!r)return;editing=r;
 $('intFormTitle').textContent=r.mode==='automatic'?'Review Daily Interruption':'Edit Interruption';
 $('intEntryEquipment').value=EQUIPMENT.includes(r.equipment)?r.equipment:'';
 // Do not fabricate missing timings. User must enter them before review can be saved.
 $('intFrom').value=r.from||'';$('intTo').value=r.to||'';$('intReason').value=r.reason;
 $('intCancel').hidden=false;$('intFormStatus').textContent=r.mode==='automatic'?'This review is saved separately. The Daily Consumption report stays as entered.':'';
 duration();$('intForm').scrollIntoView({behavior:'smooth',block:'center'});$('intEntryEquipment').focus();
 }
 if(del){const r=records.find(r=>r.id===del.dataset.delete);if(!r||!confirm(r.mode==='correction'?'Reset this review and show original daily text?':'Delete this manual interruption?'))return;
 busy=true;render();try{await removeEntry(r.id);if(editing?.id===r.id)reset();$('intFormStatus').textContent='Entry removed.';}catch(e){$('intFormStatus').textContent=e.message;}finally{busy=false;render();}
 }
};
$('intForm').onsubmit=async event=>{
 event.preventDefault();if(busy||!$('intForm').reportValidity())return;
 const entry={equipment:$('intEntryEquipment').value,from:$('intFrom').value,to:$('intTo').value,reason:$('intReason').value};
 if(durationMinutes(entry.from,entry.to)===null){$('intFormStatus').textContent='To date/time must be on or after From. Enter the next date for overnight interruptions.';return;}
 const duplicate=duplicateRecord(records,entry,editing?.id);
 if(duplicate){$('intFormStatus').textContent='This equipment and From / To already exist ('+duplicate.source+'). Edit that entry instead.';return;}
 if(editing?.mode==='automatic'){entry.mode='correction';entry.sourceKey=editing.id;entry.sourceDate=editing.sourceDate;}
 else if(editing?.mode==='correction'){entry.mode='correction';entry.sourceKey=editing.sourceKey;entry.sourceDate=editing.sourceDate;}
 else entry.mode='manual';
 if(editing?.mode==='automatic'&&!records.some(r=>r.id===editing.id)){ $('intFormStatus').textContent='Daily report changed. Reload and review the updated entry.';return; }
 busy=true;render();$('intFormStatus').textContent='Saving…';
 try{await saveEntry(entry,editing?.mode==='automatic'?'review_'+editing.id:editing?.id);reset();$('intFormStatus').textContent='Saved to cloud. Included in equipment history and its start-month report.';}
 catch(e){$('intFormStatus').textContent='Not saved: '+e.message;}
 finally{busy=false;render();}
};
['intView','intFilterEquipment','intMonth','intPeriod','intRangeFrom','intRangeTo'].forEach(id=>$(id).addEventListener('change',render));
['intFrom','intTo'].forEach(id=>$(id).addEventListener('input',duration));
$('intPrint').onclick=()=>window.print();
subscribe(s=>{
 records=combineRecords(s.daily,s.manual);
 $('intErrors').textContent=Object.values(s.errors).join('\n');
 $('intCloudStatus').textContent=`${s.dailyReady?'Saved daily reports loaded':'Waiting for daily reports'} · ${s.manualReady?'Manual entries connected':'Manual entries not connected'} · ${s.access.ready?(s.access.canEdit?'Editor access':'View-only access'):'Checking access'}`;
 render();
});
