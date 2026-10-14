async function main() {

    // URL auslesen
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    console.log("Booking ID:", id);

    // CSV laden
    // const listingscsv = await parseCsv("/csv/barossa/listings.csv");
    let listingscsv = {data: await fetch('http://localhost:8081/getlistings').then(r => r.json())};

    // Alle Wohnungen aus CSV holen
    const allApartments = listingscsv.data;

    // passende Wohnung suchen
    let apartment = null;

    for (let i = 0; i < allApartments.length; i++) {
        if (allApartments[i].id == id) {
            apartment = allApartments[i];
            break;
        }
    }

    console.log("Apartment:", apartment);

    // wenn nichts gefunden wurde
    if (apartment == null) {
        document.body.innerHTML = "<h2>Wohnung nicht gefunden</h2>";
        return;
    }

    // Daten ins HTML schreiben
    document.getElementById("apartmentImage").src = apartment.picture_url;
    document.getElementById("apartmentName").textContent = apartment.name;
    document.getElementById("pricePerNight").textContent = apartment.price;
    document.getElementById("maxGuests").textContent = apartment.accommodates;

    // Daten des angemeldeten Benutzers laden und vorausfüllen.
    try {
        const userResponse = await fetch(
            "http://localhost:8081/api/user-status",
            {
                credentials: "include"
            }
        );

        if (userResponse.ok) {
            const userData = await userResponse.json();

            if (userData.loggedIn) {
                document.getElementById("nameInput").value =
                    userData.fullName || "";
    
                document.getElementById("emailInput").value =
                    userData.email || "";
            } else {
                showPopup(
                    "Anmeldung erforderlich",
                    "Bitte melde dich zuerst an.",
                    "OK",
                    closePopup
                );
            }
        }
    } catch (error) {
        console.error(
            "Benutzerdaten konnten nicht geladen werden:",
            error
        );
    }

    // Hier wird festgelegt, wie viele Gäste maximal erlaubt sind.
    // Dann kann der Nutzer im Feld nicht einfach eine beliebige große Zahl nehmen.
    document.getElementById("guestsInput").max = apartment.accommodates;

    // Der Nutzer soll keine alten Tage auswählen können.
    // Deshalb setzen wir heute als kleinstes erlaubtes Datum.
    const today = new Date();
    const todayText = today.toISOString().split("T")[0];

    document.getElementById("fromDate").min = todayText;
    document.getElementById("toDate").min = todayText;


    setupLivePrice(apartment);

    // Button: startet den kompletten Buchungsprozess
    document.getElementById("confirmBookingBtn").onclick = async function () {

        // 1. Alle Eingaben vom User sammeln
        const bookingData = getBookingData(apartment);

        // 2. Prüfen ob alle Pflichtfelder ausgefüllt sind
        const isValid = validateBooking(bookingData);
        if (!isValid) return;

        // 3. Daten an Backend senden
        const success = await sendBooking(bookingData);

        // 4. Nur wenn Backend OK → Erfolg anzeigen
        if (success) {
            showPopup(
                "Buchung erfolgreich!",
                "Vielen Dank für Ihre Reservierung.",
                "Zu meinem Buchungen",
                function () {
                    window.location.href = "profil.html";
                }
            );
        }
    };

    // Holt alle Eingaben aus dem Formular
    function getBookingData(apartment) {
        return {
            apartmentId: apartment.id,
            apartmentName: apartment.name,
            apartmentImage: apartment.picture_url,
            apartmentPrice: apartment.price,
            name: document.getElementById("nameInput").value,
            email: document.getElementById("emailInput").value,
            fromDate: document.getElementById("fromDate").value,
            toDate: document.getElementById("toDate").value,
            guests: document.getElementById("guestsInput").value
        };
    }

    // Prüft ob alle wichtigen Felder ausgefüllt sind
    function validateBooking(data) {
        if (!data.name || !data.email || !data.fromDate || !data.toDate) {
            showPopup(
                "Bitte alle Felder ausfüllen!",
                "Damit die Buchung gespeichert werden kann.",
                "OK",
                closePopup
            );

            return false;
        }

        if (
            !data.email.includes("@") ||
            !data.email.includes(".")
        ) {
            showPopup(
                "E-Mail ist falsch",
                "Bitte gib eine gültige E-Mail-Adresse ein.",
                "OK",
                closePopup
            );

            return false;
        }

        const numberOfGuests = Number(data.guests);
        const maximumGuests = Number(apartment.accommodates);

        if (
            !Number.isInteger(numberOfGuests) ||
            numberOfGuests < 1 ||
            numberOfGuests > maximumGuests
        ) {
            showPopup(
                "Gästeanzahl ungültig",
                "Für diese Wohnung sind höchstens " +
                    maximumGuests +
                    " Gäste erlaubt.",
                "OK",
                closePopup
            );

            return false;
        }

        return true;
    }

    // Sendet die Buchung ans Backend
    async function sendBooking(data) {
        try {
            const response = await fetch("http://localhost:8081/booking", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (!response.ok) {
                showPopup(
                    "Buchung nicht möglich",
                    responseData.message ||
                        "Die Buchung konnte leider nicht gespeichert werden.",
                    "OK",
                    closePopup
                );

                return false;
            }

            return true;

        } catch (error) {
            console.error(error);

            showPopup(
                "Buchung gerade nicht möglich.",
                "Die Buchung konnte gerade nicht gespeichert werden.",
                "OK",
                closePopup
            );

            return false;
        }
    }

    // Zeigt Popup an
    function showPopup(title, text, buttonText, buttonAction) {
        document.getElementById("bookingPopupTitle").textContent = title;
        document.getElementById("bookingPopupText").textContent = text;
        document.getElementById("backHomeBtn").textContent = buttonText;

        document.getElementById("bookingPopup").classList.add("active");

        document.getElementById("backHomeBtn").onclick = buttonAction;
    }

    // Schließt das Popup wieder
    function closePopup() {
        document.getElementById("bookingPopup").classList.remove("active");
    }
}


// Live Preis Update
function setupLivePrice(apartment) {

    const fromDateInput = document.getElementById("fromDate");
    const toDateInput = document.getElementById("toDate");

    fromDateInput.addEventListener("change", function () {
        calculatePrice(apartment);
    });

    toDateInput.addEventListener("change", function () {
        calculatePrice(apartment);
    });
}


// Preis berechnen
function calculatePrice(apartment) {

    const fromValue = document.getElementById("fromDate").value;
    const toValue = document.getElementById("toDate").value;

    if (fromValue == "" || toValue == "") {
        return;
    }

    const startDate = new Date(fromValue);
    const endDate = new Date(toValue);

    const nights = (endDate - startDate) / (1000 * 60 * 60 * 24);

    if (nights <= 0) {
        document.getElementById("nightsText").textContent = "Ungültige Daten";
        document.getElementById("totalPrice").textContent = "Gesamt: -";
        return;
    }

    const pricePerNight = parseFloat(apartment.price.replace("$", ""));

    const totalPrice = pricePerNight * nights;

    document.getElementById("nightsText").textContent = nights + " Nächte";
    document.getElementById("totalPrice").textContent =
        "Gesamt: " + totalPrice.toFixed(2) + " $";
}

main();