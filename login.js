import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

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
document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("employeeId").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "Consumption%20Particulars.html";
    } catch (error) {
        message.textContent = "Login failed. Check your Email ID and Password.";
    }
});
