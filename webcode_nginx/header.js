
document.addEventListener("DOMContentLoaded", async () => {
    const uploadNav = document.getElementById("uploadNav");

    try {

        const response = await fetch('http://localhost:8081/api/user-status', { 
            credentials: 'include' 
        });
        const data = await response.json();

        if (data.loggedIn && data.isAdmin) {
            if (uploadNav) uploadNav.style.display = "block";
        } else {
            if (uploadNav) uploadNav.style.display = "none";
        }
    } catch (error) {
        console.error("Fehler beim Laden des Upload-Butoon:", error);
        if (uploadNav) uploadNav.style.display = "none";
    }
});