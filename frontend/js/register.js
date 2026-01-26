document.addEventListener("DOMContentLoaded", function () {
     localStorage.clear();
    sessionStorage.clear();
  // Callback for handling backend responses
  const callback = (responseStatus, responseData) => {
    console.log("responseStatus:", responseStatus);
    console.log("responseData:", responseData);

    if (responseStatus === 200) { 
           if (responseData.token) {
            // Store the token in local storage
            localStorage.setItem("token", responseData.token);
            localStorage.setItem("userId", responseData.userId);
            // Redirect or perform further actions for logged-in user
             window.location.href = "homepage.html";
          }

    } else {
      // Show warning in alert if no warningCard in HTML
      if (document.getElementById("warningCard") && document.getElementById("warningText")) {
        const warningCard = document.getElementById("warningCard");
        const warningText = document.getElementById("warningText");
        warningCard.classList.remove("d-none");
        warningText.innerText = responseData.message || "Registration failed!";
      } else {
        alert(responseData.message || "Registration failed!");
      }
    }
  };

  // Form element
  const registerForm = document.getElementById("registerForm");

  // Handle form submission
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault(); // prevent page reload

    // Get form values
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();

    if (!username || !email || !password) {
      alert("All fields are required!");
      return;
    }

    const data = {
      username: username,
      email: email,
      password: password // backend will hash it
    };

    // Use your fetchMethod and currentUrl
    fetchMethod(currentUrl + "/register", callback, "POST", data);

    // Reset form fields
    registerForm.reset();
  });
});
