import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDe2q19jgNfbVsKFEorbFrMz6bafx2Inhg",
  authDomain: "kalikiri-consumption.firebaseapp.com",
  projectId: "kalikiri-consumption",
  storageBucket: "kalikiri-consumption.firebasestorage.app",
  messagingSenderId: "990485021817",
  appId: "1:990485021817:web:bce85c175b248f7740c0a8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
window.saveReportToCloud = async function(date, report) {
    const user = auth.currentUser;

    if (!user) {
        console.error("Login required");
        return;
    }

    try {
        await setDoc(doc(db, "dailyReports", date), {
            report: report,
            savedBy: user.uid,
            savedAt: new Date().toISOString()
        });

        console.log("Cloud report saved successfully");
    } catch (error) {
        console.error("Cloud saving failed:", error);
    }
};
/* LOAD REPORTS FROM CLOUD */

let stopCloudListener = null;

onAuthStateChanged(auth, (user) => {
    if (stopCloudListener) {
        stopCloudListener();
        stopCloudListener = null;
    }

    if (!user) {
        return;
    }

    const reportsQuery = query(
        collection(db, "dailyReports"),
        where("savedBy", "==", user.uid)
    );

    stopCloudListener = onSnapshot(
        reportsQuery,
        (snapshot) => {
            if (auth.currentUser?.uid !== user.uid) {
                return;
            }

            try {
                const savedReports = JSON.parse(
                    localStorage.getItem("kalikiriReports") || "{}"
                );

                snapshot.forEach((reportDoc) => {
                    const data = reportDoc.data();

                    if (typeof data.report === "string") {
                        savedReports[reportDoc.id] = data.report;
                    }
                });

                localStorage.setItem(
                    "kalikiriReports",
                    JSON.stringify(savedReports)
                );

                if (typeof window.renderCalendar === "function") {
                    window.renderCalendar();
                }

                console.log("Cloud reports loaded successfully");
            } catch (error) {
                console.error("Report loading failed:", error);
            }
        },
        (error) => {
            console.error("Cloud reading failed:", error);
            alert("Cloud reports could not load: " + error.code);
        }
    );
});

/* SHOW REPORT WHEN DATE CHANGES */

document.getElementById("reportDate")
    .addEventListener("change", function () {
        const savedReports = JSON.parse(
            localStorage.getItem("kalikiriReports") || "{}"
        );

        const report = savedReports[this.value] || "";

        document.getElementById("reportOutput").textContent = report;
        window.lastReport = report;
    });
