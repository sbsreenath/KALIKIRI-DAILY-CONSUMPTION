// Pure interruption helpers; no changes to daily calculations or report storage.
export const GROUPS = [
 {name:'400 kV Lines',items:['RTPP-1','RTPP-2','Chittoor-1','Chittoor-2']},
 {name:'220 kV Lines',items:['Kalikiri-1','Kalikiri-2','Madanapalli-1','Madanapalli-2']},
 {name:'ICTs',items:['ICT-1','ICT-2']}
];
export const EQUIPMENT=GROUPS.flatMap(g=>g.items);
const token='(?:RTPP|Chittoor|Kalikiri|Madanapalli|ICT)\\s*[-–—]?\\s*[12](?!\\d)';
const known=new RegExp(token,'ig');
export function normalEquipment(text){return EQUIPMENT.find(e=>e.replace('-','').toLowerCase()===text.replace(/[\s–—-]/g,'').toLowerCase())||null;}
export function durationMinutes(from,to){
 if(!from||!to)return null;
 const a=Date.parse(from+'+05:30'),b=Date.parse(to+'+05:30');
 return Number.isFinite(a)&&Number.isFinite(b)&&b>=a?Math.round((b-a)/60000):null;
}
export function formatDuration(n){return n===null?'Review needed':n>=60?`${Math.floor(n/60)} h ${n%60} min`:`${n} min`;}
export function addDay(date){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(36);}
function legacyText(report){return String(report||'').replace(/\*/g,'').match(/(?:7[.)]\s*)?Interruptions\s*[:=]?\s*([\s\S]*?)(?=\n[^\n]*\n\s*Deputy Executive Engineer|\n\s*DEE\/|$)/i)?.[1]?.trim()||'';}
export function parseDaily(date,data){
 const text=String(data.fields?.Interruptions??legacyText(data.report)).trim();
 if(!text||/^(?:nil|none|no interruptions?)[.\s]*$/i.test(text))return [];
 // Split numbered entries or separate lines, but retain wrapped reason text.
 const blocks=[];
 for(const line of text.split(/\r?\n|;\s*(?=(?:\d+[.)]\s*)?(?:RTPP|Chittoor|Kalikiri|Madanapalli|ICT))/i)){
  if(!line.trim())continue;
  if(new RegExp(token,'i').test(line)||/^\s*\d+[.)]/.test(line)||!blocks.length)blocks.push(line.trim());
  else blocks[blocks.length-1]+='\n'+line.trim();
 }
 return blocks.flatMap((raw,index)=>{
  const names=[...raw.matchAll(known)].map(m=>normalEquipment(m[0])).filter(Boolean);
  const groupPair=raw.match(/(RTPP|Chittoor|Kalikiri|Madanapalli|ICT)\s*[-–—]?\s*1\s*(?:&|and|,)\s*2(?!\d)/i);
  if(groupPair){names.push(normalEquipment(groupPair[1]+'-1'),normalEquipment(groupPair[1]+'-2'));}
  const unique=[...new Set(names)].filter(Boolean);
  const times=[...raw.matchAll(/(?<!\d)([01]?\d|2[0-4])[:.]([0-5]\d)(?!\d)/g)];
  const dates=[...raw.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g)].map(m=>`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);
  let from='',to='',problem='';
  // Never guess which time range belongs to which equipment when there are multiple ranges.
  if(times.length===2&&times.every(t=>t[1]!=='24'||t[2]==='00')&&dates.length<=2&&dates.every(validDate)){
   let startDate=dates[0]||date,endDate=dates[1]||startDate;
   const time=t=>t[1].padStart(2,'0')+':'+t[2];
   let a=time(times[0]),b=time(times[1]);
   if(a==='24:00'){startDate=addDay(startDate);a='00:00';}
   if(b==='24:00'){endDate=addDay(endDate);b='00:00';}
   else if(dates.length<2&&b<a)endDate=addDay(endDate);
   from=startDate+'T'+a;to=endDate+'T'+b;
   if(durationMinutes(from,to)===null){from='';to='';problem='Check dates / times';}
  }else problem='Confirm From / To date and time';
  if(!unique.length)problem='Select equipment; '+problem;
  return (unique.length?unique:['Unassigned']).map(equipment=>({
   id:`daily_${date}_${index}_${hash(raw+'|'+equipment)}`,sourceDate:date,date:from.slice(0,10)||date,
   equipment,from,to,reason:raw,source:'Daily Consumption',review:problem,
   mode:'automatic',raw
  }));
 });
}
export function combineRecords(daily,stored){
 const corrections=new Map(stored.filter(r=>r.mode==='correction').map(r=>[r.sourceKey,r]));
 const auto=daily.flatMap(([date,data])=>parseDaily(date,data));
 const result=auto.map(r=>{const c=corrections.get(r.id);return c?{...c,id:c.id,date:c.from.slice(0,10),source:'Daily Consumption (reviewed)',review:'',original:r}:r;});
 return result.concat(stored.filter(r=>r.mode==='manual').map(r=>({...r,date:r.from.slice(0,10),source:'Manual',review:''})));
}
export function duplicateRecord(records,entry,ignoreId=''){
 return records.find(r=>r.id!==ignoreId&&r.equipment===entry.equipment&&r.from===entry.from&&r.to===entry.to);
}
export function monthlyRecords(records,month){return records.filter(r=>r.date?.slice(0,7)===month);}
export function summary(records){const known=records.filter(r=>durationMinutes(r.from,r.to)!==null);return {count:records.length,pending:records.length-known.length,minutes:known.reduce((n,r)=>n+durationMinutes(r.from,r.to),0)};}
// Inclusive date ranges. Rolling periods end on the selected To date (IST).
export function periodRange(mode,end,month,from,to){
 if(mode==='all')return {from:'',to:'',label:'All saved dates'};
 if(mode==='month'){
  if(!/^\d{4}-\d{2}$/.test(month)||!validDate(month+'-01'))throw new Error('Select a valid month.');
  const last=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);
  return {from:month+'-01',to:last,label:month};
 }
 if(mode==='custom'){
  if(!validDate(from)||!validDate(to)||from>to)throw new Error('Select valid From / To dates. To must be on or after From.');
  return {from,to,label:from+' to '+to};
 }
 if(!validDate(end))throw new Error('Select a valid period end date.');
 const months={m1:1,m3:3,m6:6,y1:12}[mode];if(!months)throw new Error('Select a period.');
 const d=new Date(end+'T00:00:00Z'),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-months);
 const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));
 return {from:addDay(d.toISOString().slice(0,10)),to:end,label:months===12?'Last 1 year':'Last '+months+' month'+(months===1?'':'s')};
}
export function rangeRecords(records,range){return records.filter(r=>(!range.from||r.date>=range.from)&&(!range.to||r.date<=range.to));}
export function equipmentOrder(a,b){const i=EQUIPMENT.indexOf(a.equipment),j=EQUIPMENT.indexOf(b.equipment);return (i<0?999:i)-(j<0?999:j)||(a.from||a.date).localeCompare(b.from||b.date);}
