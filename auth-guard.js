import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
