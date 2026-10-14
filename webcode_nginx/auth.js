document.addEventListener("DOMContentLoaded", async () => {
    const uploadNav = document.getElementById("uploadNav");
    const profileName = document.getElementById("profileName");
    const profileAddress = document.getElementById("profileAddress");

    try {
        
        const response = await fetch('http://localhost:8081/api/user-status', { 
            credentials: 'include' 
        });
        const data = await response.json();

        if (data.loggedIn) {

            if (profileName) profileName.textContent = data.username;
            if (profileAddress) profileAddress.textContent = data.address;

            // admin rechte prüfen
            if (data.isAdmin) {
                uploadNav.style.display = "block";
            } else {
                uploadNav.style.display = "none";
            }
        } else {
            // Nicht eingeloggt -> upload verstecken
            if (uploadNav) uploadNav.style.display = "none";
        }
    } catch (error) {
        console.error("Fehler beim Laden des User-Status:", error);
        if (uploadNav) uploadNav.style.display = "none";
    }
});