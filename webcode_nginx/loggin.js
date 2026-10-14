document.addEventListener("DOMContentLoaded", () => {
  const loginOverlay = document.getElementById("loginOverlay");
  const registerOverlay = document.getElementById("registerOverlay");

  const openLoginBtn = document.getElementById("openLoginBtn");
  const switchToRegister = document.getElementById("switchToRegister");

  function zeigeFehlerImModal(titel, text) {
    const altPopup = document.getElementById("tempErrorPopup");
    if (altPopup) altPopup.remove();

    const overlay = document.createElement("div");
    overlay.id = "tempErrorPopup";
    overlay.className = "popup-overlay";
    overlay.style.display = "flex";

    overlay.innerHTML = `
      <div class="popup-box profile-popup-box">
        <h2>${titel}</h2>
        <p>${text}</p>
        <div class="popup-buttons">
          <button type="button" id="closeTempErrorBtn">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = document.getElementById("closeTempErrorBtn");
    if (closeBtn) {
      closeBtn.onclick = () => {
        overlay.remove();
      };
    }

    overlay.onclick = (event) => {
      if (event.target === overlay) {
        overlay.remove();
      }
    };
  }

  if (openLoginBtn) {
    openLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loginOverlay.style.display = "flex";
    });
  }

  if (switchToRegister) {
    switchToRegister.addEventListener("click", () => {
      loginOverlay.style.display = "none";
      registerOverlay.style.display = "flex";
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target === loginOverlay) {
      loginOverlay.style.display = "none";
    }
    if (event.target === registerOverlay) {
      registerOverlay.style.display = "none";
    }
  });

  async function checkLoginStatus() {
    try {
      const response = await fetch("http://localhost:8081/api/user-status", {
        credentials: "include", // wichtig für Cookies
      });

      if (!response.ok) return;

      const data = await response.json();
      
      if (data.loggedIn) {
        if (openLoginBtn) {
          const loginNavText = openLoginBtn.querySelector(".text");
          if (loginNavText) {
            loginNavText.innerText = "Logout";
          } else {
            openLoginBtn.innerText = "Logout";
          }

          const logoutBtn = openLoginBtn.cloneNode(true);
          openLoginBtn.parentNode.replaceChild(logoutBtn, openLoginBtn);

          logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "http://localhost:8081/logout-backend";
          });
        }
        //Namen ändern im profil
        const profileNameField = document.getElementById("profileName");
        if (profileNameField && data.fullName) {
          profileNameField.innerText = data.fullName;
        }
        //adresse ändern im profil
        const profileAddressField = document.getElementById("profileAddress");
        if (profileAddressField && data.address) {
          profileAddressField.innerText = data.address;
        }
      }
    } catch (error) {
      console.error("Fehler beim Prüfen des Session-Cookies:", error);
    }
  }
  //falscher loggin
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'login') {
    
    zeigeFehlerImModal(
      "Login fehlgeschlagen!", 
      "Die eingegebenen Daten sind fehlerhaft!"
    );
    
    if (loginOverlay) {
      loginOverlay.style.display = "flex";
    }
  }

  checkLoginStatus();
});