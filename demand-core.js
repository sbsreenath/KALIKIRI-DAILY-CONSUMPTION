export const DEMAND_GROUPS=[
 {label:'400 kV Lines & ICTs',items:[['rtpp1','RTPP-1'],['rtpp2','RTPP-2'],['chittoor1','Chittoor-1'],['chittoor2','Chittoor-2'],['ict1','ICT-1'],['ict2','ICT-2']]},
 {label:'220 kV Feeders',items:[['kalikiri1','Kalikiri-1'],['kalikiri2','Kalikiri-2'],['madanapalli1','Madanapalli-1'],['madanapalli2','Madanapalli-2']]}
];
export const DEMAND_ITEMS=DEMAND_GROUPS.flatMap(g=>g.items);
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
export function validateMetric(value,date,time,label){
 if(value.trim()===''&&date===''&&time==='')return null;
 if(value.trim()===''||!Number.isFinite(Number(value))||Number(value)<0)throw new Error(label+': enter a valid MW value (0 or above).');
 if(!validDate(date))throw new Error(label+': enter its record date.');
 if(time&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error(label+': check time.');
 return {mw:Number(value),date,time};
}
export function validateRecord(raw){
 const max=validateMetric(raw.maxMW,raw.maxDate,raw.maxTime,'MAX Demand');
 const min=validateMetric(raw.minMW,raw.minDate,raw.minTime,'MIN Demand');
 if(max&&min&&min.mw>max.mw)throw new Error('MIN MW cannot exceed MAX MW.');
 return {max,min};
}
export function recordInputs(record){const result={};for(const kind of ['max','min']){const v=record?.[kind];result[kind+'MW']=v&&Number.isFinite(v.mw)?String(v.mw):'';result[kind+'Date']=v?.date||'';result[kind+'Time']=v?.time||'';}return result;}
