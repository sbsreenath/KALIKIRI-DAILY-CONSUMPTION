/* FIREBASE CONNECTION */
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, getDocFromServer, setDoc, serverTimestamp, collection, query, where, documentId, onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
const firebaseConfig = {
 apiKey:"AIzaSyDe2q19jgNfbVsKFEorbFrMz6bafx2Inhg",
 authDomain:"kalikiri-consumption.firebaseapp.com",
 projectId:"kalikiri-consumption",
 storageBucket:"kalikiri-consumption.firebasestorage.app",
 messagingSenderId:"990485021817",
 appId:"1:990485021817:web:bce85c175b248f7740c0a8"
};
const hasDefaultApp=getApps().some(app=>app.name==="[DEFAULT]");
const app=hasDefaultApp?getApp():initializeApp(firebaseConfig);
const auth=getAuth(app),db=getFirestore(app);
const meterIds=["rtpp1","rtpp2","chittoor1","chittoor2","ict1hv","ict1lv","ict2hv","ict2lv","kalikiri1","kalikiri2","madanapalli1","madanapalli2"];
function checkDate(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error("Select a valid date.");
 const parsed=new Date(date+"T00:00:00Z");
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)throw new Error("Select a valid date.");
}
export function previousEnergyDate(date){checkDate(date);const previous=new Date(date+"T00:00:00Z");previous.setUTCDate(previous.getUTCDate()-1);return previous.toISOString().slice(0,10);}
export function watchEnergyLogin(callback){return onAuthStateChanged(auth,callback);}
export async function loadEnergyDay(date){
 checkDate(date);if(!auth.currentUser)throw new Error("Login required.");
 const snapshot=await getDocFromServer(doc(db,"energyReadings",date));
 return snapshot.exists()?snapshot.data():null;
}
/* SAVE ENTERED CELLS; null means blank, never zero. */
export async function saveEnergyDay(date,readings){
 checkDate(date);const user=auth.currentUser;if(!user)throw new Error("Login required.");
 const cleanReadings={};let enteredCells=0,completedRows=0;
 for(const meterId of meterIds)for(const flow of ["import","export"]){
  const key=meterId+"_"+flow,reading=readings[key];
  if(!reading)continue;
  const start=reading.start==null?null:reading.start;
  const end=reading.end==null?null:reading.end;
  for(const value of [start,end]){
   if(value!==null && (!Number.isFinite(value)||value<0))throw new Error("Enter valid readings for "+key);
   if(value!==null)enteredCells++;
  }
  if(start!==null && end!==null){
   if(end<start)throw new Error("Closing reading must not be below opening reading for "+key);
   completedRows++;
  }
  if(start!==null || end!==null)cleanReadings[key]={start,end};
 }
 if(!enteredCells)throw new Error("Enter at least one reading before saving.");
 await setDoc(doc(db,"energyReadings",date),{
  date,readings:cleanReadings,savedBy:user.uid,savedAt:serverTimestamp(),schemaVersion:2,
  enteredCells,completedRows,totalRows:24,complete:completedRows===24
 });
}
/* WATCH SAVED DATES FOR ONE MONTH */
export function watchEnergyMonth(month,callback,onError){
 checkDate(month+"-01");if(!auth.currentUser)throw new Error("Login required.");
 const nextMonthDate=new Date(month+"-01T00:00:00Z");nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth()+1);
 const nextMonth=nextMonthDate.toISOString().slice(0,7);
 const monthQuery=query(collection(db,"energyReadings"),where(documentId(),">=",month+"-01"),where(documentId(),"<",nextMonth+"-01"));
 return onSnapshot(monthQuery,{includeMetadataChanges:true},snapshot=>{
  if(snapshot.metadata.fromCache)return;
  const savedDates=new Set();
  const completion={};
  snapshot.forEach(savedDay=>{
   if(savedDay.metadata.hasPendingWrites)return;
   savedDates.add(savedDay.id);
   const data=savedDay.data();
   completion[savedDay.id]=meterIds.every(meter=>["import","export"].every(flow=>{
    const reading=data.readings?.[meter+"_"+flow];
    return Number.isFinite(reading?.start) && Number.isFinite(reading?.end) &&
     reading.start>=0 && reading.end>=reading.start;
   }));
  });
  window.energySavedCompletion=completion;
  callback(savedDates);
  window.dispatchEvent(new CustomEvent("energy-calendar-completion"));
 },error=>{console.error("Energy calendar loading failed:",error);if(typeof onError==="function")onError(error);});
}
