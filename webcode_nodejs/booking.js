import { db } from "./index.js";

export { createBookingTable, createBooking, getBookings, updateBookingDates, deleteBooking};


// Diese Funktion wird beim Start des Backends aufgerufen.
// Die Tabelle wird nur erstellt, wenn sie noch nicht existiert.
function createBookingTable() {
    db.exec(`
        create table if not exists bookings (
            id integer primary key autoincrement,
            userId integer not null,
            apartmentId text not null,
            apartmentName text not null,
            apartmentImage text,
            apartmentPrice text not null,
            name text not null,
            email text not null,
            fromDate text not null,
            toDate text not null,
            guests integer not null,
            totalPrice real not null,
            createdAt text default current_timestamp
        );
    `);
}

// Eine neue Buchung in der Datenbank speichern.
function createBooking(req, res) {
    const booking = req.body;
    const userId = req.user.userId;

    // Zuerst prüfen wir die Eingaben. So landet keine halbe Buchung in der Datenbank.
    const errorMessage = validateBooking(booking);

    if (errorMessage) {
        return res.status(400).send({
            success: false,
            message: errorMessage
        });
    }

    const numberOfGuests = Number(booking.guests);

    // Der Gesamtpreis wird im Backend noch einmal berechnet.
    const totalPrice = calculateTotalPrice(
        booking.apartmentPrice,
        booking.fromDate,
        booking.toDate
    );

    if (totalPrice === null) {
        return res.status(400).send({
            success: false,
            message: "Der Preis der Ferienwohnung ist ungültig."
        });
    }

    try {
        const insertBooking = db.prepare(`
            insert into bookings (
                userId,
                apartmentId,
                apartmentName,
                apartmentImage,
                apartmentPrice,
                name,
                email,
                fromDate,
                toDate,
                guests,
                totalPrice
            ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertBooking.run(
            userId,
            booking.apartmentId,
            booking.apartmentName,
            booking.apartmentImage || "",
            booking.apartmentPrice,
            booking.name,
            booking.email,
            booking.fromDate,
            booking.toDate,
            numberOfGuests,
            totalPrice
        );

        // Nach dem Speichern laden wir die neue Buchung noch einmal.
        // Dadurch enthält die Antwort auch die automatisch erstellte ID.
        const savedBooking = getBookingById(result.lastInsertRowid);

        console.log(
            "Buchung wurde gespeichert. ID:",
            result.lastInsertRowid
        );

        res.status(201).send({
            success: true,
            booking: savedBooking
        });
        return savedBooking;
    } catch (error) {
        console.error("Fehler beim Speichern der Buchung:", error);

        res.status(500).send({
            success: false,
            message: "Die Buchung konnte nicht gespeichert werden."
        });
    }
}


// Die Buchungen aus der Datenbank laden.
function getBookings(req, res) {
    const userId = req.user.userId;

    try {
        const bookings = db.prepare(`
            select
                id,
                apartmentId,
                apartmentName,
                apartmentImage,
                apartmentPrice,
                name,
                email,
                fromDate,
                toDate,
                guests,
                totalPrice,
                createdAt
            from bookings
            where userId = ?
            order by id desc
        `).all(userId);

        res.send(bookings);
    } catch (error) {
        console.error("Fehler beim Laden der Buchungen:", error);

        res.status(500).send({
            success: false,
            message: "Die Buchungen konnten nicht geladen werden."
        });
    }
}


// Das Anreise- und Abreisedatum einer Buchung ändern.
// Der Gesamtpreis wird danach ebenfalls neu berechnet.
function updateBookingDates(req, res) {
    const bookingId = Number(req.params.id);
    const userId = req.user.userId;

    const fromDate = req.body.fromDate;
    const toDate = req.body.toDate;

    // Prüfen, ob die Buchungs-ID gültig ist.
    if (!Number.isInteger(bookingId) || bookingId < 1) {
        return res.status(400).send({
            success: false,
            message: "Die Buchungs-ID ist ungültig."
        });
    }

    const dateErrorMessage = validateBookingDates(
        fromDate,
        toDate
    );

    if (dateErrorMessage) {
        return res.status(400).send({
            success: false,
            message: dateErrorMessage
        });
    }

    try {
        // Es wird nur eine Buchung gesucht, die dem eingeloggten Benutzer gehört.
        const oldBooking = db.prepare(`
            select
                id,
                apartmentPrice
            from bookings
            where id = ? and userId = ?
        `).get(bookingId, userId);

        if (!oldBooking) {
            return res.status(404).send({
                success: false,
                message: "Die Buchung wurde nicht gefunden."
            });
        }

        // Mit dem gespeicherten Preis wird der neue Gesamtpreis berechnet.
        const totalPrice = calculateTotalPrice(
            oldBooking.apartmentPrice,
            fromDate,
            toDate
        );

        if (totalPrice === null) {
            return res.status(400).send({
                success: false,
                message: "Der Preis der Ferienwohnung ist ungültig."
            });
        }

        const updateBooking = db.prepare(`
            update bookings
            set fromDate = ?, toDate = ?, totalPrice = ?
            where id = ? and userId = ?
        `);

        updateBooking.run(
            fromDate,
            toDate,
            totalPrice,
            bookingId,
            userId
        );

        const updatedBooking = db.prepare(`
            select
                id,
                apartmentId,
                apartmentName,
                apartmentImage,
                apartmentPrice,
                name,
                email,
                fromDate,
                toDate,
                guests,
                totalPrice,
                createdAt
            from bookings
            where id = ? and userId = ?
        `).get(bookingId, userId);

        res.send({
            success: true,
            booking: updatedBooking
        });
    } catch (error) {
        console.error(
            "Fehler beim Ändern der Buchung:",
            error
        );

        res.status(500).send({
            success: false,
            message: "Das Buchungsdatum konnte nicht geändert werden."
        });
    }
}


// Die Buchung über ihre ID löschen.
// Ein Benutzer darf nur seine eigene Buchung löschen.
function deleteBooking(req, res) {
    const bookingId = Number(req.params.id);
    const userId = req.user.userId;

    if (!Number.isInteger(bookingId) || bookingId < 1) {
        return res.status(400).send({
            success: false,
            message: "Die Buchungs-ID ist ungültig."
        });
    }

    try {
        const result = db.prepare(`
            delete from bookings
            where id = ? and userId = ?
        `).run(bookingId, userId);

        if (result.changes === 0) {
            return res.status(404).send({
                success: false,
                message: "Die Buchung wurde nicht gefunden."
            });
        }

        res.send({
            success: true,
            message: "Die Buchung wurde gelöscht."
        });
    } catch (error) {
        console.error(
            "Fehler beim Löschen der Buchung:",
            error
        );

        res.status(500).send({
            success: false,
            message: "Die Buchung konnte nicht gelöscht werden."
        });
    }
}


// Prüft die Daten einer neuen Buchung.
function validateBooking(booking) {
    if (
        !booking.apartmentId ||
        !booking.apartmentName ||
        !booking.apartmentPrice
    ) {
        return "Die Daten der Ferienwohnung fehlen.";
    }

    if (!booking.name || !booking.email) {
        return "Bitte gib deinen Namen und deine E-Mail-Adresse ein.";
    }

    if (
        !booking.email.includes("@") ||
        !booking.email.includes(".")
    ) {
        return "Bitte gib eine gültige E-Mail-Adresse ein.";
    }

    const numberOfGuests = Number(booking.guests);

    if (
        !Number.isInteger(numberOfGuests) ||
        numberOfGuests < 1
    ) {
        return "Die Gästeanzahl muss mindestens 1 sein.";
    }

    return validateBookingDates(
        booking.fromDate,
        booking.toDate
    );
}


// Prüft das Anreise- und Abreisedatum.
function validateBookingDates(fromDateText, toDateText) {
    if (!fromDateText || !toDateText) {
        return "Bitte wähle ein Anreise- und ein Abreisedatum aus.";
    }

    const fromDate = new Date(fromDateText);
    const toDate = new Date(toDateText);

    if (
        Number.isNaN(fromDate.getTime()) ||
        Number.isNaN(toDate.getTime())
    ) {
        return "Bitte gib gültige Datumswerte ein.";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate < today) {
        return "Das Anreisedatum darf nicht in der Vergangenheit liegen.";
    }

    if (toDate <= fromDate) {
        return "Das Abreisedatum muss nach dem Anreisedatum liegen.";
    }

    return "";
}


// Berechnet den Gesamtpreis.
// Gesamtpreis = Preis pro Nacht mal Anzahl der Nächte.
function calculateTotalPrice(apartmentPrice, fromDateText, toDateText) {
    const startDate = new Date(fromDateText);
    const endDate = new Date(toDateText);

    const nights = (endDate - startDate) / (1000 * 60 * 60 * 24);

    const pricePerNight = parseFloat(
        String(apartmentPrice)
            .replace("$", "")
            .replaceAll(",", "")
    );

    if (
        !Number.isFinite(pricePerNight) ||
        nights <= 0
    ) {
        return null;
    }

    const totalPrice = pricePerNight * nights;

    return Number(totalPrice.toFixed(2));
}


// Diese kleine Hilfsfunktion lädt eine einzelne Buchung.
// Sie wird nach dem Erstellen und Ändern gebraucht.
function getBookingById(bookingId) {
    return db.prepare(`
        select
            id,
            apartmentId,
            apartmentName,
            apartmentImage,
            apartmentPrice,
            name,
            email,
            fromDate,
            toDate,
            guests,
            totalPrice,
            createdAt
        from bookings
        where id = ?
    `).get(bookingId);
}