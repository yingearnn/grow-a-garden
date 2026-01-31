import { showNotification } from './notifications.js';

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!username || !password) {
      showNotification("All fields are required!", "error");
      return;
    }

    try {
      const res = await fetch(`${currentUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.status === 200 && data.token) {
        // Correct credentials → login
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        window.location.href = "homepage.html";
      } else {
        // Wrong username or password
        const msg = data?.message || "Wrong username or password";
        showNotification(msg, "error");
        document.getElementById("login-password").value = ""; // clear password
      }
    } catch (err) {
      console.error("Login fetch error:", err);
    }
  });
});