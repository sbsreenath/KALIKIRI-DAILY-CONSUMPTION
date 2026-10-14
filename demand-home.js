import {DEMAND_GROUPS,DEMAND_ITEMS,validateRecord,recordInputs} from './demand-core.js';
import {demandState,watchDemand,saveDemand} from './demand-cloud.js';
const host=document.getElementById('demandHome');
const fields=['maxMW','maxDate','maxTime'];
const baseline=new Map(),versions=new Map(),busy=new Set();let lastUid=null;
if(host){
 host.innerHTML=`<div class="md-portal-menu"><button type="button" id="mdSoFarToggle" class="md-so-far-toggle" aria-expanded="false" aria-controls="mdSubmenu">MD SO FAR ▸</button><div id="mdSubmenu" class="md-subtabs" role="tablist" aria-label="Maximum demand groups"><button type="button" id="md400Tab" role="tab" aria-controls="mdGroup0" aria-selected="true" tabindex="0">400 KV MD</button><button type="button" id="md220Tab" role="tab" aria-controls="mdGroup1" aria-selected="false" tabindex="-1">220 KV MD</button></div></div><div id="mdSoFarContent" hidden><p id="demandConnection" role="status">Connecting…</p><p id="demandError" role="alert"></p><p class="demand-help">Enter MW and the date it occurred. Time is optional if unknown. Save each equipment separately.</p>${DEMAND_GROUPS.map((g,index)=>`<section class="demand-group" id="mdGroup${index}" role="tabpanel" aria-labelledby="${index===0?'md400Tab':'md220Tab'}" ${index===1?'hidden':''}><h2>${index===0?'400 KV LINES & ICTS':'220 KV FEEDERS'}</h2><div class="demand-scroll"><table class="demand-table"><thead><tr><th scope="col">Record</th>${g.items.map(([id,name])=>`<th scope="col">${name}</th>`).join('')}</tr></thead><tbody>${['max'].map(kind=>`<tr><th scope="row">${kind.toUpperCase()} DEMAND</th>${g.items.map(([id,name])=>`<td><label class="demand-mw-label">MW<input id="${id}_${kind}MW" type="number" min="0" step="any" placeholder="—" aria-label="${name} ${kind} MW"></label><label>Date<input id="${id}_${kind}Date" type="date" aria-label="${name} ${kind} date"></label><label>Time (IST)<input id="${id}_${kind}Time" type="time" aria-label="${name} ${kind} time"></label></td>`).join('')}</tr>`).join('')}<tr class="demand-actions"><th scope="row">SAVE</th>${g.items.map(([id,name])=>`<td><button type="button" id="${id}_save" data-demand-save="${id}" disabled>Save ${name}</button><button type="button" class="demand-reload" data-demand-reload="${id}">Reload saved</button><p id="${id}_status" role="status"></p></td>`).join('')}</tr></tbody></table></div></section>`).join('')}</div>`;
 const mdToggle=document.getElementById('mdSoFarToggle');
 const mdContent=document.getElementById('mdSoFarContent');
 const mdMenu=host.querySelector('.md-portal-menu');
 const openMD=value=>{mdMenu.classList.toggle('md-menu-open',value);mdToggle.setAttribute('aria-expanded',String(value));};
 mdToggle.onclick=()=>openMD(!mdMenu.classList.contains('md-menu-open'));
 mdMenu.addEventListener('mouseenter',()=>{if(matchMedia('(hover:hover)').matches)openMD(true);});
 mdMenu.addEventListener('mouseleave',()=>{if(matchMedia('(hover:hover)').matches)openMD(false);});
 mdMenu.addEventListener('keydown',e=>{if(e.key==='Escape'){openMD(false);mdToggle.focus();}});
 document.addEventListener('click',e=>{if(!mdMenu.contains(e.target))openMD(false);});
 const tabs=[document.getElementById('md400Tab'),document.getElementById('md220Tab')];
 function selectGroup(index){mdContent.hidden=false;mdToggle.classList.add('md-active');openMD(false);tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.getElementById('mdGroup'+i).hidden=i!==index;});}
 tabs.forEach((tab,index)=>{tab.onclick=()=>selectGroup(index);tab.onkeydown=event=>{let next=index;if(event.key==='ArrowRight'||event.key==='ArrowLeft')next=1-index;else if(event.key==='Home')next=0;else if(event.key==='End')next=1;else return;event.preventDefault();selectGroup(next);tabs[next].focus();};});
 const requestedMD=new URLSearchParams(location.search).get('md');if(requestedMD==='400'||requestedMD==='220')selectGroup(requestedMD==='400'?0:1);
 const homeLink=document.querySelector('.main-nav a[href="home.html"]');
 function fitMD(){if(!homeLink)return;const r=homeLink.getBoundingClientRect();mdMenu.style.width=r.width+'px';mdToggle.style.width='100%';mdToggle.style.height=r.height+'px';mdToggle.style.borderRadius=getComputedStyle(homeLink).borderRadius;const main=host.closest('main'),mr=main.getBoundingClientRect();mdMenu.style.marginLeft=(r.left-mr.left-(parseFloat(getComputedStyle(main).paddingLeft)||0))+'px';}
 requestAnimationFrame(fitMD);window.addEventListener('resize',fitMD);if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitMD).observe(homeLink);
 const input=(id,f)=>document.getElementById(id+'_'+f);
 const capture=id=>Object.fromEntries(fields.map(f=>[f,input(id,f).value]));
 const dirty=id=>baseline.has(id)&&JSON.stringify(capture(id))!==baseline.get(id);
 function hydrate(id,record){const values=recordInputs(record);fields.forEach(f=>input(id,f).value=values[f]);baseline.set(id,JSON.stringify(capture(id)));versions.set(id,record?.version||0);}
 function updateButtons(){const s=demandState();for(const [id] of DEMAND_ITEMS){const allow=s.ready&&s.access.ready&&s.access.canEdit&&!busy.has(id);
  fields.forEach(f=>input(id,f).disabled=!allow);document.getElementById(id+'_save').disabled=!allow||!dirty(id);
  host.querySelector(`[data-demand-reload="${id}"]`).disabled=!s.ready||busy.has(id);
 }}
 watchDemand(s=>{
  const account=s.access.user?.uid||null;
  if(account!==lastUid){lastUid=account;baseline.clear();versions.clear();DEMAND_ITEMS.forEach(([id])=>{hydrate(id,null);document.getElementById(id+'_status').textContent='';});}
  document.getElementById('demandError').textContent=s.error;
  document.getElementById('demandConnection').textContent=s.ready?(s.access.canEdit?'Saved records loaded · Editor access':'Saved records loaded · View-only access'):'Waiting for saved demand records…';
  if(s.ready)for(const [id] of DEMAND_ITEMS){
   const record=s.records[id];
   if(!dirty(id))hydrate(id,record);
   else if((record?.version||0)!==versions.get(id))document.getElementById(id+'_status').textContent='Changed on another device. Reload saved before saving.';
  }
  updateButtons();
 });
 host.addEventListener('input',event=>{const id=event.target.id.split('_')[0];if(!DEMAND_ITEMS.some(([key])=>key===id))return;document.getElementById(id+'_status').textContent=dirty(id)?'Unsaved changes':'';updateButtons();});
 host.addEventListener('click',async event=>{
  const reload=event.target.closest('[data-demand-reload]');if(reload){const id=reload.dataset.demandReload;if(dirty(id)&&!confirm('Discard unsaved changes for this equipment and reload?'))return;hydrate(id,demandState().records[id]);document.getElementById(id+'_status').textContent='Saved values loaded.';updateButtons();return;}
  const button=event.target.closest('[data-demand-save]');if(!button)return;const id=button.dataset.demandSave;const status=document.getElementById(id+'_status');
  const raw=capture(id);let values;
  try{fields.forEach(f=>{if(!input(id,f).checkValidity())throw new Error('Check MW, date and time fields.');});values=validateRecord({...raw,minMW:'',minDate:'',minTime:''});}
  catch(e){status.textContent=e.message;return;}
  if(!values.max&&!values.min&&demandState().records[id]&&!confirm('Clear the saved maximum demand record for this equipment?'))return;
  busy.add(id);updateButtons();status.textContent='Saving…';
  try{await saveDemand(id,values,versions.get(id)||0);baseline.set(id,JSON.stringify(raw));versions.set(id,(versions.get(id)||0)+1);status.textContent='Saved to cloud.';}
  catch(e){status.textContent='Not saved: '+e.message;}
  finally{busy.delete(id);updateButtons();}
 });
 window.addEventListener('beforeunload',event=>{if(busy.size||DEMAND_ITEMS.some(([id])=>dirty(id))){event.preventDefault();event.returnValue='';}});
}
