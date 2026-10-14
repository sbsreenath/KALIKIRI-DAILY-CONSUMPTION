import {app,auth,watchDashboardAccess} from './auth-guard.js';
import {getFirestore,collection,onSnapshot,doc,runTransaction} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import {DEMAND_ITEMS} from './demand-core.js';
const db=getFirestore(app),listeners=new Set();
let access={ready:false,canEdit:false,user:null},records={},ready=false,error='',uid=null,stop;
export function demandState(){return {access,records,ready,error};}
function notify(){for(const fn of listeners)fn(demandState());}
export function watchDemand(fn){listeners.add(fn);fn(demandState());return()=>listeners.delete(fn);}
watchDashboardAccess(next=>{
 access=next;
 if(next.user?.uid!==uid){uid=next.user?.uid||null;stop?.();records={};ready=false;error='';const account=uid;
  if(account)stop=onSnapshot(collection(db,'demandRecords'),{includeMetadataChanges:true},snapshot=>{
   if(uid!==account||snapshot.metadata.fromCache)return;
   records=Object.fromEntries(snapshot.docs.filter(d=>!d.metadata.hasPendingWrites).map(d=>[d.id,d.data()]));ready=true;error='';notify();
  },e=>{if(uid!==account)return;ready=false;error='Demand records unavailable ('+e.code+'). Add the supplied demandRecords rule to your existing Firestore rules.';notify();});
 }
 notify();
});
export async function saveDemand(key,values,expectedVersion){
 const user=auth.currentUser;
 if(!user||!access.ready||!access.canEdit||access.user?.uid!==user.uid||!ready)throw new Error('Cloud connection and editor access are required.');
 const item=DEMAND_ITEMS.find(([id])=>id===key);if(!item)throw new Error('Unknown equipment.');
 const reference=doc(db,'demandRecords',key);
 await runTransaction(db,async transaction=>{
  const snapshot=await transaction.get(reference);
  if((snapshot.exists()?snapshot.data().version:0)!==expectedVersion)throw new Error('This record was changed on another device. Reload saved values, then enter your change again.');
  transaction.set(reference,{equipment:item[1],max:values.max,min:values.min,version:expectedVersion+1,savedBy:user.uid,savedAt:new Date().toISOString()});
 });
 if(auth.currentUser?.uid===user.uid){records={...records,[key]:{equipment:item[1],max:values.max,min:values.min,version:expectedVersion+1,savedBy:user.uid,savedAt:new Date().toISOString()}};notify();}
}
