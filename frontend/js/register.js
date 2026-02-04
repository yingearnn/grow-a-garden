// register.js
import { showNotification } from './notifications.js';

document.addEventListener("DOMContentLoaded", function () {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  sessionStorage.clear();

  const registerForm = document.getElementById("registerForm");

  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();

    const data = { username, email, password };

    const callback = (responseStatus, responseData) => {
      if (responseStatus === 200 && responseData.token) {
        localStorage.setItem("token", responseData.token);
        localStorage.setItem("userId", responseData.userId);
        window.location.href = "homepage.html";
        return;
      }

      const msg = responseData?.message || "Registration failed!";
      const warningCard = document.getElementById("warningCard");
      const warningText = document.getElementById("warningText");

      if (warningCard && warningText) {
        warningCard.classList.remove("d-none");
        warningText.innerText = msg;
      } else {
        showNotification(msg, "error");
      }
    };

    fetchMethod(currentUrl + "/register", callback, "POST", data);
  });
});
