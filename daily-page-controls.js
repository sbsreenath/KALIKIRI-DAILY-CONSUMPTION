import {dailyCloudState,getSavedDaily,saveDaily,loadDailyEnergy} from "./firebase-save.js";

function startDailyControls() {
 const date=document.getElementById("reportDate");
 date.value=window.energyReportDate.get();
 const save=document.getElementById("saveDaily");
 const status=document.getElementById("dailySaveStatus");
 const title=document.getElementById("dailySaveTitle");
 const source=document.getElementById("dailyEnergyStatus");
 const dialog=document.getElementById("dailyUnsavedDialog");
 const message=document.getElementById("dailyUnsavedMessage");
 const continueSave=document.getElementById("dailySaveContinue");
 const stay=document.getElementById("dailyStayHere");
 const discard=document.getElementById("dailyDiscardContinue");
 const bar=document.getElementById("dailySaveBar");
 const ids=["rtpp1","rtpp2","chittoor1","chittoor2","import400","importict","totalImport","rtpp1export","rtpp2export","chittoor1export","chittoor2export","export400","exportict","totalexport","mdict","mdict1","mdict2","mdictime","totalgeneration","maxvoltage","minvoltage","maxvoltagetime","minvoltagetime","busreactor","Interruptions","reportName","mdict1time","mdict2time"];
 const mapped=["rtpp1","rtpp2","chittoor1","chittoor2","rtpp1export","rtpp2export","chittoor1export","chittoor2export","exportict","importict"];
 const derived=["import400","totalImport","export400","totalexport","totalgeneration","mdict"];
 let currentDate="", baseline=null, busy=false, version=0, manual=new Set(), selectedSaved=null;
 let pending=null, leaving=false, replayLogout=false;
 let currentSavedVersion="";
 const field=id=>document.getElementById(id);
 const capture=()=>Object.fromEntries(ids.map(id=>[id,field(id)?.value || ""]));
 const dirty=()=>baseline!==null && JSON.stringify(capture())!==baseline;
 const canEdit=()=>Boolean(window.dashboardAccess?.ready && window.dashboardAccess?.user && window.dashboardAccess?.canEdit);
 const dateText=value=>value ? value.split("-").reverse().join("/") : "Select a date";
 function recalculate(){ calculateImport();calculateexport400();calculatemdict();calculategeneration(); }
 function update(){
  const access=window.dashboardAccess;
  const editable=canEdit() && Boolean(currentDate) && !busy;
  ids.forEach(id=>{if(field(id))field(id).disabled=!editable;});
  document.querySelectorAll(".dashboard-main input[type='time']").forEach(input=>input.disabled=!editable);
  derived.forEach(id=>{if(field(id))field(id).readOnly=true;});
  field("testMessage").disabled=!canEdit() || busy;
  field("autoFill").disabled=!canEdit() || busy;
  date.disabled=busy || !access?.user;
  save.disabled=!editable || !dailyCloudState().ready;
  field("loadEnergyDaily").disabled=!editable;
  save.textContent=busy ? "Please wait..." : "Save Readings";
  title.textContent="DAILY CONSUMPTION · "+dateText(currentDate || date.value);
  ["printDaily","excelDaily","wordDaily","shareWhatsApp"].forEach(id=>field(id).disabled=busy || !access?.user || !selectedSaved);
  continueSave.disabled=save.disabled;
  bar.dataset.dirty=String(dirty());
 }
 function writeFields(values){ids.forEach(id=>{if(field(id))field(id).value=values?.[id] ?? (id==="Interruptions"?"Nil":id==="importict"?"0.00":"");});recalculate();}
 function legacyFields(report){
  const plain=report.replace(/\*/g,"");const result={};
  const imp=plain.match(/1[.)]\s*IMPORT([\s\S]*?)2[.)]\s*EXPORT/i)?.[1] || "";
  const exp=plain.match(/2[.)]\s*EXPORT([\s\S]*?)3[.)]\s*MD/i)?.[1] || "";
  const get=(text,label)=>text.match(new RegExp(label+"\\s*=\\s*([\\d.]+)","i"))?.[1] || "";
  [["rtpp1","RTPP-1"],["rtpp2","RTPP-2"],["chittoor1","Chittoor-1"],["chittoor2","Chittoor-2"]].forEach(([id,name])=>{result[id]=get(imp,name);result[id+"export"]=get(exp,name);});
  result.importict=get(imp,"ICTs Import") || "0.00";result.exportict=get(exp,"ICTs Export");
  result.mdict1=get(plain,"315 MVA ICT-1");result.mdict2=get(plain,"315 MVA ICT-2");
  result.mdictime=plain.match(/MD on ICTs\s*=\s*[\d.]+\s*MW\s*@\s*([\d:]+)/i)?.[1]?.replace(/^24:/,"00:") || "";
  result.maxvoltage=get(plain,"Maximum");result.minvoltage=get(plain,"Minimum");
  result.maxvoltagetime=plain.match(/Maximum\s*=\s*[\d.]+\s*KV\s*@\s*([\d:]+)/i)?.[1]?.replace(/^24:/,"00:") || "";
  result.minvoltagetime=plain.match(/Minimum\s*=\s*[\d.]+\s*KV\s*@\s*([\d:]+)/i)?.[1]?.replace(/^24:/,"00:") || "";
  result.busreactor=plain.match(/400KV Bus Reactor\s*:\s*([^\n]*)/i)?.[1] || "";
  const signature=plain.match(/\n\s*([^\n]+)\n\s*Deputy Executive Engineer/i);
  result.reportName=signature?.[1]?.trim() || "";
  result.Interruptions=plain.match(/Interruptions\s*:\s*([\s\S]*?)\n\s*[^\n]+\n\s*Deputy Executive Engineer/i)?.[1]?.trim() || "Nil";
  return result;
 }
 function hydrate(entry){
  selectedSaved=entry;
  currentSavedVersion=entry?.savedAt || "";
  writeFields(entry?.fields || (entry?.report ? legacyFields(entry.report):{}));
  manual=new Set(entry?.manualOverrides || (entry && !entry.fields ? mapped:[]));
  baseline=JSON.stringify(capture());
  field("reportOutput").textContent=entry?.report || "";
  window.lastReport=entry?.report || "";
 }
 function energyMU(data,key,mf){
  const item=data?.readings?.[key];
  if(!Number.isFinite(item?.start)||!Number.isFinite(item?.end)||item.start<0||item.end<item.start)return null;
  return Number(((item.end-item.start)*mf/1000000).toFixed(3));
 }
 function applyEnergy(data,force=false){
  const missing=[];
  ["rtpp1","rtpp2","chittoor1","chittoor2"].forEach(id=>["import","export"].forEach(flow=>{
   const target=id+(flow==="export"?"export":"");const value=energyMU(data,id+"_"+flow,1000000/3);
   if(value===null)missing.push(target);
   if((force || !manual.has(target)) && value!==null)field(target).value=value.toFixed(3);
  }));
  const lv1=energyMU(data,"ict1lv_export",1000),lv2=energyMU(data,"ict2lv_export",1000);
  if(lv1===null || lv2===null)missing.push("ICT LV export");
  else if(force || !manual.has("exportict"))field("exportict").value=(lv1+lv2).toFixed(3);
  if(force || !manual.has("importict"))field("importict").value="0.00";
  if(force)manual.clear();
  recalculate();
  source.textContent=data ? (missing.length ? "Some Energy readings are missing. Enter those values manually." : "Energy MU loaded for "+dateText(currentDate)+" (00:00–24:00). Manual editing is available.") : "No saved Energy readings for this date. Enter values manually.";
 }
 async function openDate(value){
  if(!dailyCloudState().ready){date.value=value;status.textContent="Waiting for saved reports to load...";return;}
  window.energyReportDate.set(value);
  const ticket=++version;currentDate=value;date.value=value;busy=true;update();
  const entry=getSavedDaily(value);hydrate(entry);
  status.textContent=entry?"Saved daily report loaded.":"Not saved yet. Review values and Save Readings.";
  source.textContent="Checking same-date Energy readings...";
  try{const energy=await loadDailyEnergy(value);if(ticket!==version)return;
   if(canEdit() || !entry)applyEnergy(energy);
   else source.textContent="Saved daily values displayed. View-only access.";
   if(!entry)baseline=JSON.stringify(capture());
   if(entry && dirty())status.textContent="Energy readings changed. Review the updated MU and save this daily report.";
  }catch(error){if(ticket===version)source.textContent="Energy readings could not load. Saved daily values are retained; manual entry is available.";}
  finally{if(ticket===version){busy=false;update();}}
 }
 function requestLeave(action){if(busy)return;if(!dirty()){action();return;}if(dialog.open)return;pending=action;message.textContent="You have unsaved readings. Save before leaving?";dialog.showModal();update();stay.focus();}
 function selectDate(value){if(!value)return;requestLeave(()=>openDate(value));}
 async function saveCurrent(){
  if(save.disabled)return false;
  for(const id of ids){
   const input=field(id);
   if(input?.type==='number' && input.value!=='' &&
      (!Number.isFinite(input.valueAsNumber) || input.valueAsNumber<0)){
    status.textContent="Enter a valid value for "+id+" before saving.";
    input.focus();update();return false;
   }
  }
  const invalid=ids.map(field).find(input=>input && !input.checkValidity());
  if(invalid){invalid.reportValidity();status.textContent="Please correct the highlighted value.";return false;}
  recalculate();
  const values={...capture(),reportDate:currentDate};
  const payload=window.buildDailySavedPayload(values);
  busy=true;status.textContent="Saving to Firebase...";update();
  try{
   const missingFields=ids.filter(id=>!derived.includes(id) &&
    !["mdict1time","mdict2time"].includes(id) && values[id]==="");
   const saved=await saveDaily(currentDate,{...payload,fields:values,manualOverrides:[...manual],
    complete:missingFields.length===0,missingFields});
   selectedSaved=saved;currentSavedVersion=saved.savedAt;baseline=JSON.stringify(capture());
   field("reportOutput").textContent=saved.report;window.lastReport=saved.report;
   status.textContent="Readings saved to Firebase successfully for "+dateText(currentDate)+"."+(saved.complete?"":" Partial report saved; remaining fields can be filled later.");
   return true;
  }catch(error){status.textContent="Save failed. Your entered values remain here. "+(error.code || error.message);return false;}
  finally{busy=false;update();}
 }
 function closeDialog(){pending=null;dialog.close();update();}
 stay.addEventListener("click",closeDialog);
 dialog.addEventListener("cancel",event=>{if(busy)event.preventDefault();else pending=null;});
 discard.addEventListener("click",()=>{if(busy)return;const action=pending;closeDialog();action?.();});
 continueSave.addEventListener("click",async()=>{
  if(continueSave.disabled)return;const action=pending;stay.disabled=true;discard.disabled=true;
  const saved=await saveCurrent();stay.disabled=false;discard.disabled=false;
  if(saved){closeDialog();action?.();}else message.textContent=status.textContent;
 });
 save.addEventListener("click",saveCurrent);
 date.addEventListener("change",event=>{event.stopImmediatePropagation();const chosen=date.value;date.value=currentDate;selectDate(chosen);},true);
 document.querySelector(".dashboard-main").addEventListener("input",event=>{
  if(!ids.includes(event.target.id))return;if(mapped.includes(event.target.id))manual.add(event.target.id);
  status.textContent=dirty()?"Unsaved changes. Save Readings to keep your changes.":"Readings unchanged.";update();
 });
 document.getElementById("autoFill").addEventListener("click",event=>{
  event.stopImmediatePropagation();if(!canEdit() || busy)return;
  const text=field("testMessage").value;
  const match=text.match(/consumption particulars on\s+(\d{2})[./-](\d{2})[./-](\d{4})/i);
  const target=match ? match[3]+"-"+match[2]+"-"+match[1]:currentDate;
  const fill=async()=>{
   if(target && target!==currentDate)await openDate(target);
   field("testMessage").value=text;autoFillReport();
   if(!date.value)date.value=currentDate;
   mapped.forEach(id=>manual.add(id));status.textContent="Test message filled. Review and Save Readings.";update();
  };
  if(target && target!==currentDate)requestLeave(fill);else fill();
 },true);
 field("loadEnergyDaily").addEventListener("click",()=>requestLeave(async()=>{
  busy=true;update();try{const data=await loadDailyEnergy(currentDate);if(data){applyEnergy(data,true);status.textContent="Energy MU reloaded. Review and Save Readings.";}else source.textContent="No saved Energy readings. Your entered values have been retained.";}
  catch(error){source.textContent="Could not reload Energy readings. Entered values have been retained.";}finally{busy=false;update();}
 }));
 function payloadFor(entry){if(entry.html && entry.excelHtml)return entry; if(entry.fields)return {...entry,...buildDailySavedPayload(entry.fields)};return null;}
 function exportSaved(kind){
  if(!selectedSaved || busy)return;
  const run=()=>{
   const entry=getSavedDaily(currentDate) || selectedSaved;
   if(dirty())hydrate(entry);
   if(kind==="whatsapp"){
    const text=dailyWhatsAppFormat(entry.report || "").replace(/\*/g,"").replace(/\n@/g," @");
    window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank");return;
   }
   const payload=payloadFor(entry);
   const fallback="<!doctype html><html><head><meta charset='UTF-8'></head><body><pre>"+escapeDailyHTML((entry.report || "").replace(/\*/g,""))+"</pre></body></html>";
   const html=payload?.html || fallback;
   if(kind==="word"){downloadWord(html);return;}
   if(kind==="excel"){
    const blob=new Blob([payload?.excelHtml || fallback],{type:"application/vnd.ms-excel"});
    const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="Kalikiri_Consumption_"+currentDate+".xls";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
   }
   const popup=window.open("","_blank","width=900,height=900");if(!popup){status.textContent="Allow pop-ups to open Print / PDF.";return;}
   popup.document.write(html);popup.document.close();popup.focus();popup.requestAnimationFrame(()=>popup.requestAnimationFrame(()=>popup.print()));
  };
  if(dirty())requestLeave(run);else run();
 }
 [["printDaily","print"],["excelDaily","excel"],["wordDaily","word"],["shareWhatsApp","whatsapp"]].forEach(([id,kind])=>field(id).addEventListener("click",()=>exportSaved(kind)));
 document.addEventListener("keydown",event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="s"){event.preventDefault();if(!dialog.open && !save.disabled)saveCurrent();}});
 document.addEventListener("click",event=>{
  const link=event.target.closest("a[href]");if(!link || event.button!==0 || event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.target==="_blank"||link.hasAttribute("download"))return;
  const url=new URL(link.href,location.href);if(url.origin!==location.origin || (url.pathname===location.pathname && url.search===location.search))return;
  event.preventDefault();requestLeave(()=>{leaving=true;location.assign(url.href);});
 },true);
 field("logoutBtn").addEventListener("click",event=>{if(replayLogout){replayLogout=false;return;}if(!dirty()&&!busy)return;event.stopImmediatePropagation();requestLeave(()=>{replayLogout=true;field("logoutBtn").click();});},true);
 window.addEventListener("beforeunload",event=>{if(!leaving&&(dirty()||busy)){event.preventDefault();event.returnValue="";}});
 window.addEventListener("dashboard-access-changed",()=>{
  if(!window.dashboardAccess?.user){version++;busy=false;currentDate="";baseline=null;selectedSaved=null;writeFields({});status.textContent="Login required.";}
  update();
 });
 window.addEventListener("daily-cloud-changed",()=>{
  if(!currentDate && date.value){openDate(date.value);return;}
  if(currentDate && !busy && !dirty()){
   const entry=getSavedDaily(currentDate);
   if((entry?.savedAt || "")!==currentSavedVersion){hydrate(entry);status.textContent=entry?"Saved daily report updated.":"No saved daily report for this date.";}
  }
  update();
 });
 window.addEventListener("daily-cloud-error",event=>{status.textContent="Saved reports could not load: "+event.detail;update();});
 if(window.ResizeObserver)new ResizeObserver(()=>document.body.style.setProperty("--daily-save-space",(bar.getBoundingClientRect().height+24)+"px")).observe(bar);
 window.dailyPageAccess={selectDate,save:saveCurrent,hasUnsaved:dirty,fields:capture};
 update();if(date.value)openDate(date.value);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startDailyControls,{once:true});else startDailyControls();
