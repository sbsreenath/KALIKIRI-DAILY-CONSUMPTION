import {app,auth,watchDashboardAccess} from './auth-guard.js';
import {getFirestore,collection,onSnapshot,doc,setDoc,deleteDoc} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import {EQUIPMENT,durationMinutes} from './interruptions-core.js';
const db=getFirestore(app);
let access={ready:false,canEdit:false,user:null},daily=[],manual=[],dailyReady=false,manualReady=false,errors={},stopDaily,stopManual,uid=null;
const listeners=new Set();
export function state(){return {access,daily,manual,dailyReady,manualReady,errors};}
function notify(){listeners.forEach(fn=>fn(state()));}
export function subscribe(fn){listeners.add(fn);fn(state());return()=>listeners.delete(fn);}
watchDashboardAccess(next=>{
 access=next;
 if(next.user?.uid!==uid){
  uid=next.user?.uid||null;stopDaily?.();stopManual?.();daily=[];manual=[];dailyReady=false;manualReady=false;errors={};
  const account=uid;
  if(account){
   stopDaily=onSnapshot(collection(db,'dailyReports'),{includeMetadataChanges:true},snapshot=>{
    if(uid!==account||snapshot.metadata.fromCache)return;
    daily=snapshot.docs.filter(d=>!d.metadata.hasPendingWrites).map(d=>[d.id,d.data()]);dailyReady=true;delete errors.daily;notify();
   },error=>{if(uid!==account)return;dailyReady=false;errors.daily='Daily reports unavailable: '+error.code;notify();});
   stopManual=onSnapshot(collection(db,'interruptions'),{includeMetadataChanges:true},snapshot=>{
    if(uid!==account||snapshot.metadata.fromCache)return;
    manual=snapshot.docs.filter(d=>!d.metadata.hasPendingWrites).map(d=>({...d.data(),id:d.id}));manualReady=true;delete errors.manual;notify();
   },error=>{if(uid!==account)return;manualReady=false;errors.manual='Manual interruption access unavailable: '+error.code+'. Add the supplied interruptions rule to your existing Firebase rules.';notify();});
  }
 }
 notify();
});
function requireEditor(){if(!access.ready||!access.canEdit||access.user?.uid!==auth.currentUser?.uid||!manualReady)throw new Error('Manual saving needs editor access and a successful cloud connection.');}
export async function saveEntry(entry,id){
 requireEditor();
 if(!EQUIPMENT.includes(entry.equipment)||durationMinutes(entry.from,entry.to)===null||!entry.reason.trim())throw new Error('Check equipment, From / To and reason.');
 const key=id||crypto.randomUUID();
 const payload={equipment:entry.equipment,from:entry.from,to:entry.to,reason:entry.reason.trim(),mode:entry.mode||'manual',sourceKey:entry.sourceKey||'',sourceDate:entry.sourceDate||'',savedBy:auth.currentUser.uid,savedAt:new Date().toISOString()};
 await setDoc(doc(db,'interruptions',key),payload);
 return key;
}
export async function removeEntry(id){requireEditor();await deleteDoc(doc(db,'interruptions',id));}
