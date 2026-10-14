document.addEventListener("DOMContentLoaded", async () => {
  const uploadNav = document.getElementById("uploadNav");

  if (!uploadNav) return;

  try {
    const response = await fetch("http://localhost:8081/api/user-status", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const isAdmin = data.isAdmin === true || data.role === "admin";

    if (data.loggedIn && isAdmin) {
      uploadNav.style.display = "block";
    } else {
      uploadNav.style.display = "none";
    }
  } catch (error) {
    console.error("Fehler beim Laden des Upload-Buttons:", error);
    uploadNav.style.display = "none";
  }
});
