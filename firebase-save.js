import { app, auth, watchDashboardAccess } from "./auth-guard.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocFromServer, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);
let reports = {};
let ready = false;
let stopReports = null;
let access = {user:null,canEdit:false,ready:false};
window.dashboardAccess = access;

function notify() {
    window.dailySavedCompletion = Object.fromEntries(
        Object.entries(reports).map(([date, data]) => [date, data.complete !== false])
    );
    window.dispatchEvent(new CustomEvent("daily-cloud-changed"));
    if (typeof window.renderCalendar === "function") window.renderCalendar();
}
watchDashboardAccess(next => {
    access = next;
    window.dashboardAccess = next;
    window.dispatchEvent(new CustomEvent("dashboard-access-changed", {detail:next}));
});
onAuthStateChanged(auth, user => {
    stopReports?.();
    stopReports = null;
    reports = {};
    ready = false;
    localStorage.removeItem("kalikiriReports");
    localStorage.removeItem("kalikiriEntries");
    notify();
    if (!user) return;
    stopReports = onSnapshot(collection(db,"dailyReports"), {includeMetadataChanges:true}, snapshot => {
        if (auth.currentUser?.uid !== user.uid || snapshot.metadata.fromCache) return;
        const next = {};
        snapshot.forEach(item => {
            if (!item.metadata.hasPendingWrites) next[item.id] = item.data();
            else if (reports[item.id]) next[item.id] = reports[item.id];
        });
        reports = next;
        ready = true;
        const text = {};
        Object.entries(reports).forEach(([date,data]) => {
            if (typeof data.report === "string") text[date] = data.report;
        });
        localStorage.setItem("kalikiriReports",JSON.stringify(text));
        notify();
    }, error => {
        ready = false;
        console.error("Daily cloud reading failed:",error);
        window.dispatchEvent(new CustomEvent("daily-cloud-error",{detail:error.code || error.message}));
    });
});

export function dailyCloudState() { return {ready,user:auth.currentUser}; }
export function getSavedDaily(date) { return reports[date] || null; }

export async function saveDaily(date, data) {
    const user = auth.currentUser;
    if (!user || !access.ready || !access.canEdit || access.user?.uid !== user.uid) {
        throw new Error("You have view-only access. Saving is not allowed.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Select a valid date.");
    const saved = {...data,savedBy:user.uid,savedAt:new Date().toISOString(),schemaVersion:2};
    await setDoc(doc(db,"dailyReports",date),saved);
    if (auth.currentUser?.uid !== user.uid) throw new Error("Account changed while saving.");
    reports[date] = saved;
    const cache = {};
    Object.entries(reports).forEach(([key,value]) => {if(typeof value.report === "string") cache[key]=value.report;});
    localStorage.setItem("kalikiriReports",JSON.stringify(cache));
    notify();
    return saved;
}

export async function loadDailyEnergy(date) {
    if (!auth.currentUser) throw new Error("Login required.");
    const snapshot = await getDocFromServer(doc(db,"energyReadings",date));
    return snapshot.exists() ? snapshot.data() : null;
}
