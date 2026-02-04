// login.js
import { showNotification } from './notifications.js';

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
      const res = await fetch(`${currentUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showNotification(data.message || "Login failed", "error");
        document.getElementById("login-password").value = "";
        return;
      }

      // success
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        window.location.href = "homepage.html";
        return;
      }

      // unexpected success response without token
      showNotification(data.message || "Login failed", "error");
      document.getElementById("login-password").value = "";

    } catch (err) {
      console.error("Login fetch error:", err);
      showNotification("Unable to connect to server. Please try again later.", "error");
    }
  });
});
