// login.js
// Handles login form submission, validation, and authentication response

import { showNotification } from './notifications.js';

document.addEventListener("DOMContentLoaded", () => {

  // Get login form element
  const loginForm = document.getElementById("loginForm");

  // Handle login form submit
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent page reload

    // Read and trim input values
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    // Validate required fields
    if (!username || !password) {
      showNotification("All fields are required!", "error");
      return;
    }

    try {
      // Send login request to backend
      const res = await fetch(`${currentUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      // Parse JSON response
      const data = await res.json();

      // Successful login: backend returns token + userId
      if (res.status === 200 && data.token) {

        // Store JWT token and user ID for authenticated requests
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);

        // Redirect to homepage after login
        window.location.href = "homepage.html";

      } else {
        // Login failed: show backend message or fallback text
        const msg = data?.message || "Wrong username or password";
        showNotification(msg, "error");

        // Clear password field for security
        document.getElementById("login-password").value = "";
      }

    } catch (err) {
      // Handle network/server connection errors
      console.error("Login fetch error:", err);
      showNotification(
        "Unable to connect to server. Please try again later.",
        "error"
      );
    }
  });
});
