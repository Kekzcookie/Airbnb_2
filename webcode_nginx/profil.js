let bookingIdToDelete = null;
let reloadPageAfterMessage = false;
let popupAction = "";



async function main() {
    let region = (await fetch('http://localhost:8081/getregionname').then(r => r.json())).region;
    document.title = "Ferienwohnungen " + region;
    document.getElementById("titleHeadline").innerText = "Ferienwohnungen " + region;
    document.getElementById("copyrightText").innerText = "© 2026 Ferienwohnungen " + region;

    const bookingContainer = document.getElementById("bookingContainer");

    setupPopupButtons();

    try {
        const response = await fetch("http://localhost:8081/booking", {
            credentials: "include"
        });

        if (response.status === 401) {
            bookingContainer.innerHTML = `
                <p>Bitte melde dich an, um deine Buchungen zu sehen.</p>
            `;
            bookingContainer.style.display = "flex";
            bookingContainer.style.justifyContent = "center";
            bookingContainer.style.alignItems = "center";
            bookingContainer.style.width = "100%";
        
            showMessage(
                "Anmeldung erforderlich",
                "Bitte melde dich an, um deine Buchungen zu sehen.",
                false
            );
        
            return;
        }

        if (!response.ok) {
            bookingContainer.innerHTML = `
                <p>Die Buchungen konnten nicht geladen werden.</p>
            `;
            bookingContainer.style.display = "flex";
            bookingContainer.style.justifyContent = "center";
            bookingContainer.style.alignItems = "center";
            bookingContainer.style.width = "100%";

            showMessage(
                "Buchungen nicht geladen",
                "Die Buchungen konnten gerade nicht geladen werden.",
                false
            );

            return;
        }

        const bookings = await response.json();

        if (bookings.length > 0) {
            bookingContainer.innerHTML = "";

            bookings.forEach(booking => {
                bookingContainer.innerHTML += `
                    <div class="booking-card">

                        <div class="booking-image">
                            <img src="${booking.apartmentImage}" alt="Wohnung">
                        </div>

                        <div class="booking-info">
                            <p><b>Wohnung:</b> ${booking.apartmentName}</p>
                            <p><b>Von:</b> ${booking.fromDate}</p>
                            <p><b>Bis:</b> ${booking.toDate}</p>
                            <p><b>Gäste:</b> ${booking.guests}</p>
                            <p><b>Gesamtpreis:</b> ${Number(booking.totalPrice).toFixed(2)} $</p>
                        </div>

                        <div class="booking-buttons">

                            <button
                                type="button"
                                id="editBtn-${booking.id}"
                                class="btn-edit">
                                Bearbeiten
                            </button>

                            <button
                                type="button"
                                id="deleteBtn-${booking.id}"
                                class="btn-delete">
                                Löschen
                            </button>

                        </div>

                    </div>
                `;
            });


            // Die Buttons werden erst gesucht, nachdem die Buchungen in die Seite eingefügt wurden.
            bookings.forEach(booking => {
                const editButton = document.getElementById(
                    "editBtn-" + booking.id
                );

                const deleteButton = document.getElementById(
                    "deleteBtn-" + booking.id
                );

                if (editButton !== null) {
                    editButton.onclick = function () {
                        openEditPopup(booking);
                    };
                }

                if (deleteButton !== null) {
                    deleteButton.onclick = function () {
                        openDeletePopup(booking);
                    };
                }
            });

        } else {
            bookingContainer.innerHTML = `
                <p>Keine Buchung vorhanden.</p>
            `;
            bookingContainer.style.display = "flex";
            bookingContainer.style.justifyContent = "center";
            bookingContainer.style.alignItems = "center";
            bookingContainer.style.width = "100%";
        }

    } catch (error) {
        console.error(
            "Fehler beim Laden der Buchungen:",
            error
        );

        bookingContainer.innerHTML = `
            <p>Das Backend ist gerade nicht erreichbar.</p>
        `;

        showMessage(
            "Backend nicht erreichbar",
            "Die Buchungen konnten gerade nicht geladen werden.",
            false
        );
    }
}


// Öffnet das Popup zum Ändern des Buchungsdatums.
function openEditPopup(booking) {
    popupAction = "edit";
    reloadPageAfterMessage = false;

    const today = new Date();
    const todayText = today.toISOString().split("T")[0];

    document.getElementById("editBookingId").value = booking.id;

    document.getElementById("editFromDate").min = todayText;
    document.getElementById("editToDate").min = todayText;

    document.getElementById("editFromDate").value = booking.fromDate;
    document.getElementById("editToDate").value = booking.toDate;

    document.getElementById("profilePopupTitle").textContent =
        "Buchungsdatum ändern";

    document.getElementById("profilePopupText").textContent =
        "Bitte wähle das neue Anreise- und Abreisedatum aus.";

    document.getElementById("editBookingFields").hidden = false;

    document.getElementById("profilePopupCancelBtn").hidden = false;
    document.getElementById("profilePopupCancelBtn").textContent =
        "Abbrechen";

    const confirmButton = document.getElementById("profilePopupConfirmBtn");

    confirmButton.textContent = "Speichern";
    confirmButton.classList.remove("delete-confirm-button");

    document.getElementById("profilePopup").classList.add("active");
}


// Öffnet das Popup zum Löschen einer Buchung.
function openDeletePopup(booking) {
    popupAction = "delete";
    bookingIdToDelete = booking.id;
    reloadPageAfterMessage = false;

    document.getElementById("profilePopupTitle").textContent =
        "Buchung löschen";

    document.getElementById("profilePopupText").textContent =
        "Möchtest du diese Buchung wirklich löschen?";

    document.getElementById("editBookingFields").hidden = true;

    document.getElementById("profilePopupCancelBtn").hidden = false;
    document.getElementById("profilePopupCancelBtn").textContent =
        "Abbrechen";

    const confirmButton = document.getElementById("profilePopupConfirmBtn");

    confirmButton.textContent = "Buchung löschen";
    confirmButton.classList.add("delete-confirm-button");

    document.getElementById("profilePopup").classList.add("active");
}


// Schließt das Popup
function closeProfilePopup() {
    document.getElementById("profilePopup").classList.remove("active");
    document.getElementById("editBookingFields").hidden = true;

    document.getElementById("profilePopupConfirmBtn").classList.remove("delete-confirm-button");

    bookingIdToDelete = null;
    reloadPageAfterMessage = false;
    popupAction = "";
}



function setupPopupButtons() {
    document.getElementById("profilePopupCancelBtn").onclick = function () {
        closeProfilePopup();
    };


    document.getElementById("profilePopupConfirmBtn").onclick = async function () {
        if (popupAction === "edit") {
            const bookingId = document.getElementById("editBookingId").value;

            const fromDate = document.getElementById("editFromDate").value;

            const toDate = document.getElementById("editToDate").value;

            const success = await updateBookingDates(bookingId, fromDate, toDate);

            if (success) {
                showMessage(
                    "Buchung geändert!",
                    "Das neue Buchungsdatum wurde gespeichert.",
                    true
                );
            }

            return;
        }


        if (popupAction === "delete") {
            if (bookingIdToDelete === null) {
                return;
            }

            const success = await deleteBooking(
                bookingIdToDelete
            );

            if (success) {
                showMessage(
                    "Buchung gelöscht!",
                    "Die Buchung wurde erfolgreich gelöscht.",
                    true
                );
            }

            return;
        }


        if (popupAction === "message") {
            const shouldReload = reloadPageAfterMessage;

            closeProfilePopup();

            if (shouldReload) {
                location.reload();
            }
        }
    };
}


// Prüft die Datumswerte und sendet sie an das Backend.
async function updateBookingDates(bookingId, fromDate, toDate) {
    if (!fromDate || !toDate) {
        showMessage(
            "Datum fehlt",
            "Bitte wähle ein Anreise- und ein Abreisedatum aus.",
            false
        );

        return false;
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
        showMessage(
            "Datum nicht möglich",
            "Das Anreisedatum darf nicht in der Vergangenheit liegen.",
            false
        );

        return false;
    }

    if (endDate <= startDate) {
        showMessage(
            "Datum nicht möglich",
            "Das Abreisedatum muss nach dem Anreisedatum liegen.",
            false
        );

        return false;
    }

    try {
        const response = await fetch("http://localhost:8081/booking/" + bookingId, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fromDate: fromDate,
                    toDate: toDate
                })
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            showMessage(
                "Änderung nicht möglich",
                responseData.message ||
                "Das Buchungsdatum konnte nicht geändert werden.",
                false
            );

            return false;
        }

        return true;

    } catch (error) {
        console.error(
            "Fehler beim Ändern der Buchung:",
            error
        );

        showMessage(
            "Backend nicht erreichbar",
            "Das Buchungsdatum konnte gerade nicht geändert werden.",
            false
        );

        return false;
    }
}


// Löscht eine Buchung im Backend.
async function deleteBooking(bookingId) {
    try {
        const response = await fetch("http://localhost:8081/booking/" + bookingId, {
            method: "DELETE",
            credentials: "include"
        }
    );

        const responseData = await response.json();

        if (!response.ok) {
            showMessage(
                "Löschen nicht möglich",
                responseData.message ||
                "Die Buchung konnte nicht gelöscht werden.",
                false
            );

            return false;
        }

        return true;

    } catch (error) {
        console.error(
            "Fehler beim Löschen der Buchung:",
            error
        );

        showMessage(
            "Backend nicht erreichbar",
            "Die Buchung konnte gerade nicht gelöscht werden.",
            false
        );

        return false;
    }
}

// Zeigt ein Popup mit einer Erfolgs- oder Fehlermeldung.
export function showMessage(title, text, reloadAfterClosing) {
    popupAction = "message"; 
    
    document.getElementById("profilePopupTitle").textContent = title;
    document.getElementById("profilePopupText").textContent = text;

    document.getElementById("editBookingFields").hidden = true;
    document.getElementById("profilePopupCancelBtn").hidden = true;

    const confirmButton = document.getElementById("profilePopupConfirmBtn");
    confirmButton.textContent = "OK";
    confirmButton.classList.remove("delete-confirm-button");

    confirmButton.onclick = function() {
        document.getElementById("profilePopup").classList.remove("active");

        if (reloadAfterClosing) {
            window.location.reload();
        }
    };

    document.getElementById("profilePopup").classList.add("active");
}

if (document.getElementById("bookingContainer")) {
    main();
}
