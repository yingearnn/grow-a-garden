// register.js
// Handles registration form submission, validation, and backend response UI.

import { showNotification } from './notifications.js';

document.addEventListener("DOMContentLoaded", function () {

 
 
 localStorage.removeItem("token");
localStorage.removeItem("userId");
sessionStorage.clear();

  // Callback to handle backend response from /register request
  const callback = (responseStatus, responseData) => {
    console.log("responseStatus:", responseStatus);
    console.log("responseData:", responseData);

    // Success: backend returns token + userId (auto-login after registration)
    if (responseStatus === 200) {
      if (responseData.token) {
        // Save JWT token + user id for authenticated requests
        localStorage.setItem("token", responseData.token);
        localStorage.setItem("userId", responseData.userId);

        // Redirect to homepage after successful registration/login
        window.location.href = "homepage.html";
      }

    } else {
      // Failure: show message either in a warning card (if exists) or as a notification
      const warningCard = document.getElementById("warningCard");
      const warningText = document.getElementById("warningText");

      if (warningCard && warningText) {
        // Show warning UI in page
        warningCard.classList.remove("d-none");
        warningText.innerText = responseData.message || "Registration failed!";
      } else {
        // Fallback: show toast/notification
        showNotification(responseData.message || "Registration failed!", 'error');
      }
    }
  };

  // Get the registration form element
  const registerForm = document.getElementById("registerForm");

  // Handle user submitting the form
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent page reload

    // Read and trim input values
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();

    // Simple required field validation
    if (!username || !email || !password) {
      showNotification("All fields are required!", 'error');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification("Please enter a valid email address!", "error");
      return;
    }

    // Data sent to backend (backend will hash password)
    const data = {
      username: username,
      email: email,
      password: password
    };

    // Send request to backend register endpoint
    // Assumes fetchMethod + currentUrl are defined globally (e.g. in another script)
    fetchMethod(currentUrl + "/register", callback, "POST", data);

    // Clear input fields after submitting
    registerForm.reset();
  });
});
