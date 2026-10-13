import { initializeApp,getApp,getApps } from
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
    getFirestore,
    doc,
    onSnapshot
} from
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDe2q19jgNfbVsKFEorbFrMz6bafx2Inhg",
    authDomain: "kalikiri-consumption.firebaseapp.com",
    projectId: "kalikiri-consumption",
    storageBucket: "kalikiri-consumption.firebasestorage.app",
    messagingSenderId: "990485021817",
    appId: "1:990485021817:web:bce85c175b248f7740c0a8"
};

const app = getApps().some(app => app.name === "[DEFAULT]")
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const permissionsDb = getFirestore(app);

const emailDisplay =
    document.getElementById("loggedInEmail");

const logoutButton =
    document.getElementById("logoutBtn");

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    if (emailDisplay) {
        emailDisplay.textContent =
            user.email || "Signed in";
    }
});

if (logoutButton) {
    const dialog = document.createElement("dialog");

    dialog.id = "logoutDialog";

    dialog.setAttribute(
        "aria-labelledby",
        "logoutQuestion"
    );

    dialog.innerHTML = `
        <p id="logoutQuestion">
            Are you sure to logout?
        </p>

        <div class="logout-actions">
            <button type="button" id="confirmLogoutYes">
                Yes
            </button>

            <button type="button" id="confirmLogoutNo"
                autofocus>
                No
            </button>
        </div>
    `;

    document.body.appendChild(dialog);

    const yesButton =
        dialog.querySelector("#confirmLogoutYes");

    const noButton =
        dialog.querySelector("#confirmLogoutNo");

    let loggingOut = false;

    logoutButton.addEventListener("click", () => {
        if (!dialog.open && !loggingOut) {
            dialog.showModal();
        }
    });

    noButton.addEventListener("click", () => {
        dialog.close();
    });

    dialog.addEventListener("close", () => {
        if (!loggingOut) {
            logoutButton.focus();
        }
    });

    dialog.addEventListener("cancel", (event) => {
        if (loggingOut) {
            event.preventDefault();
        }
    });

    yesButton.addEventListener("click", async () => {
        if (loggingOut) {
            return;
        }

        loggingOut = true;

        yesButton.disabled = true;
        noButton.disabled = true;
        logoutButton.disabled = true;

        try {
            await signOut(auth);
            window.location.replace("login.html");
        } catch (error) {
            console.error("Logout failed:", error);

            loggingOut = false;

            yesButton.disabled = false;
            noButton.disabled = false;
            logoutButton.disabled = false;

            dialog.close();

            alert("Logout failed. Please try again.");
        }
    });
}
export { app, auth };
/* WATCH VIEW / EDIT PERMISSIONS */
export function watchDashboardAccess(callback) {
    let stopRoleWatch = null;

    const stopAuthWatch = onAuthStateChanged(auth, user => {
        if (stopRoleWatch) {
            stopRoleWatch();
            stopRoleWatch = null;
        }

        /* Editing stays blocked while checking permission. */
        callback({
            user,
            role: "viewer",
            canEdit: false,
            ready: !user,
            error: null
        });

        if (!user) return;

        const reference = doc(
            permissionsDb,
            "allowedUsers",
            user.uid
        );

        stopRoleWatch = onSnapshot(
            reference,
            snapshot => {
                const data = snapshot.exists()
                    ? snapshot.data()
                    : {};

                const canEdit =
                    data.enabled === true &&
                    ["admin", "editor"].includes(data.role);

                callback({
                    user,
                    role: canEdit ? data.role : "viewer",
                    canEdit,
                    ready: true,
                    error: null
                });
            },
            error => {
                console.error("Permission check failed:", error);

                callback({
                    user,
                    role: "viewer",
                    canEdit: false,
                    ready: true,
                    error
                });
            }
        );
    });

    return () => {
        stopAuthWatch();
        if (stopRoleWatch) stopRoleWatch();
    };
}