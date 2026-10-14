### Hinweis zum Betrieb

# Ausetzten des Projects
-    1. Clonen des Projekts von Gitlab
     2. In der .env das JWT Passwort anpassen oder neue .env mit Hilfe der .env.example erstellen.
     3. Nginx Docker Container aufbauen lassen: "docker compose -f docker-compose-nginx.yml up -d --build"
     4. Nodejs Docker Container aufbauen lassen: "docker compose -f docker-compose-nodejs.yml up -d --build"
     5. Es sollte nach dem Start des Servers die Datenbank im Dateisystem erstellt werden und die Standardnutzer sollten dort angelegt sein.

     Damit sollte das Projekt aufgesetzt sein.

### Vorangelegte Nutzer:

    1.  Benutzername: admin
        Passwort: admin123

    2.  Benutzername: user
        Passwort: user123

### JWT Passwort festlegen:

    1. Suche die Datei:   .env.example
    2. Kopiere diese und ändere den Namen in:  .env
    3. Lege ein Passwort fest.


##### Leistungen der Teammitglieder zu Sprint 3/Abgabe:
#    Ahmad:
        + Buchungsformular im Frontend und Buchungsverwaltung im Backend umgesetzt
        + Buchungen können nur von angemeldeten Nutzern angelegt, bearbeitet und gelöscht werden
        + Hinweis angezeigt, wenn ein Nutzer nicht angemeldet ist
        + Eingaben bei der Buchung geprüft: Name, E-Mail, Gästeanzahl und Datum
        + Fehlermeldungen bei falschen oder fehlenden Eingaben angezeigt
        + Gesamtpreis anhand des Preises pro Nacht und der Anzahl der Nächte berechnet
        + Buchungen in einer SQLite-Datenbank gespeichert statt in einer JSON-Datei 
           -(Nach Rücksprache mit dem Übungsleiter verwenden wir SQLite anstelle einer JSON-Datei 
           -Die persistente Speicherung der Buchungen ist damit erfüllt.)
        + Jeder Nutzer hat eine eigene Buchungshistorie auf der Profilseite und kann dort nur seine eigenen Buchungen verwalten
        + Gesamtpreis wird nach einer Datumsänderung neu berechnet
        + Filter, Sortierung, angezeigte Wohnungen und Scrollposition werden im localStorage gespeichert und beim Öffnen, Zurückkehren oder Neuladen der Seite wiederhergestellt.

#    Alessandro:
        + Implementierung einer sicheren Registrierungsfunktion und Loginfunktion im Frontend und Backend.
        + Token-basierte Authentifikation
        + Berechtigungsprüfung für den Upload (Admin vs. Normalen-Nutzer) durch serverseitigen Vergleich der Benutzerrollen in der Datenbank.
        + Berechnung und Anzeige (durch Zustimmung des Nutzers) der Distanz zwischen dem Nutzer und der Ferienwohnung auf der Detailseite.
        + Splicing der Wohnungen eingebaut welche durch einen Button erweitert wird
        + Alte Bild-Bibliotheken durch SVGs ersetzt.
        + Implementierung eines zusätzlichen Upload-Button Shortcut im Frontend
        + Upload Funktion erweitert und das UI/UX Design überarbeitet
        + Kleinigkeiten beim Responsive Design angepasst

#    Edwin:
        + CSV Upload mit Serverseitigem PapaParse
        + Bidirektionale Kommunikation mit Websockets
            -Notifikation von Nutzern, wenn eine Buchung angelegt wird
            -Reserviert Label in der Listenansicht, wenn die Buchungsseite für eine Fewo aufgerufen wird.
        + Einbinden des SQLite Moduls und erstellen von Beispielcode


# Dokumentation zu den Aufgabenteilen:
### "Registrierung fordern (Beschreibung in README ergänzen)"
Die Aufforderung sich anzumelden oder zu registrieren erfolgt, sobald der Nutzer versucht auf sein Profil zuzugreifen oder eine Buchungsseite aufruft.

### "Administrator und normaler Benutzer anlegen"
Beim Serverstart werden bereits zwei Nutzer angelegt (siehe oben). Ein Admin und ein normaler Nutzer. Weitere normale Nutzer können über die Registrierung auf der Webseite angelegt werden. Administratoren können momentan nur über Datenbankbefehle im Backend oder direkt in der Datenbank angelegt werden. Die Passwörter werden mit bcrypt verschlüsselt hinterlegt.

### "Token-basierte Authentifikation (JWT)"
Authentifikation wird mit JWT umgesetzt. Zugriffsrechte für relevante Routen im Backend werden darüber überprüft: Nutzer dürfen Buchungen anlegen, ansehen, modifizieren und löschen. Administratoren dürfen CSV-Dateien hochladen.

### "Administratoren ermöglichen, die in Aufgabe 2 genutzten CSV-Daten ins Backend einzulesen"
Über die upload.html können Administratoren CSV-Dateien einlesen und hochladen. Die Zugriffsrechte werden beim Hochladen an das Backend überprüft. Die Umsetzung benutzt "Formidable" um die Dateien aus dem übergebenen Formular auszulesen und das nodejs "fs" zum verschieben der temporären Dateien. Zusätzlich sollte ein Regionsname angegeben werden, welcher sich in Titeln und Überschriften auf der Webseite befindet. Dieser wird auf dem Server als Variable gespeichert.

### "Buchungen anlegen"
Um eine Buchung anzulegen navigiert man zu der gewünschten Ferienwohnung und klickt unter dem Kalender auf "Jetzt reservieren" und gelangt auf die Buchungsseite. Sollte man noch nicht angemeldet sein, wird man nun dazu aufgefordert. Name und E-mail werden aus den Registrierungsdaten vorausgefüllt, können aber noch geändert werden. Buchungsdaten können nicht in der Vergangenheit liegen und es muss mindestens eine Nacht gebucht werden. Anzahl der Gäste wird auch bereits clientseitig überprüft. Die Daten werden beim Abschicken serverseitig validiert und dann in der Datenbank gespeichert.

### "Buchungen löschen"
Buchungen können auf der Profilseite gelöscht werden. Vor dem Löschen wird noch einmal nachgefragt, damit eine Buchung nicht aus Versehen entfernt wird. Das Frontend sendet danach die ID der Buchung an das Backend. Im Backend wird zusätzlich geprüft, ob die Buchung dem angemeldeten Nutzer gehört. Dadurch kann jeder Nutzer nur seine eigenen Buchungen löschen.

### "Datum der Buchung modifizieren"
Auf der Profilseite kann man bei einer Buchung das Anreise- und Abreisedatum bearbeiten. Dabei wird geprüft, ob beide Daten eingetragen sind, das Anreisedatum nicht in der Vergangenheit liegt und das Abreisedatum nach dem Anreisedatum liegt. Die neuen Daten werden an das Backend geschickt und dort in der Datenbank geändert. Danach wird auch der Gesamtpreis mit der neuen Anzahl der Nächte neu berechnet.

### "Persistente Speicherung der Buchungen" - "Einträge in einer Datenbank (etwa SQLite) managen"
Die Buchungen werden nicht in einer JSON-Datei, sondern in einer SQLite-Datenbank gespeichert. Dafür wird die Datei foobar.db verwendet. Beim Start des Backends wird die Tabelle bookings erstellt, falls sie noch nicht vorhanden ist. In der Tabelle werden zum Beispiel die Wohnung, der Nutzer, die Reisedaten, die Gästeanzahl und der Gesamtpreis gespeichert. Die Daten bleiben auch nach einem Neustart der Docker-Container erhalten, solange die Datenbankdatei nicht gelöscht wird. Die Nutzung von SQLite anstelle einer JSON-Datei wurde mit dem Übungsleiter abgesprochen.

### "Buchungshistorie für jeden Nutzer auf einer Profilseite anzeigen."
Innerhalb des Profils werden alle Buchungen des angemeldeten Nutzers angezeigt.

### "Wenn eine Wohnung ausgewählt wird, wird sie 2 Minuten als reserviert gekennzeichnet."
Wenn über die Detailseite auf "Jetzt reservieren" geklickt wird, wird diese in der Listenansicht für 2 Minuten als "reserviert" gekennzeichnet. Der Client wird über das Websocket geupdated welche Wohnungen aktuell als reserviert zu kennzeichnen sind.

### Andere Benutzer der Website sollen live über ein Update (z.B. die von einem anderen Nutzergetätigte Buchung) informiert werden.
Die Benachrichtigung wird über einen Websocket versendet, sobald eine Buchung im Backend angelegt wird. Die Benachrichtigung erscheint unten rechts im Browserfenster.

### "Es sollen Inhalte des Frontend dynamisch nachgeladen werden (→ Paginierung, “LoadMore”-Button, Overscroll)."
Auf der Übersichtsseite (index.html) werden die Ferienwohnungen dynamisch nachgeladen. Anstatt alle Einträge auf einmal zu rendern, wird mit einem „LoadMore“-Button 10 weitere Wohnungen gerendert zu den 6 voreingestellten. Das Frontend fordert dabei mit fetch gezielt die nächsten Datensätze vom Backend an und hängt diese an die bestehende Liste an.

### "Wenn die Seite im selben Browser erneut aufgerufen wird, soll sie erscheinen wie der Usersie geschlossen hat (→ lokaler Browsercache)."
Auf der Startseite werden die eingestellten Filter, die Sortierung, die Anzahl der bereits angezeigten Wohnungen und die Scrollposition im localStorage gespeichert. Wenn der Nutzer den Browser schließt, die Seite neu lädt oder später wieder auf die Startseite zurückgeht, werden diese Werte wieder geladen.

### "Um Nutzer zu lokalisieren, kann die Geolocation verwendet werden."
Mithilfe der standardisierten HTML5 Geolocation API kann der Nutzer (nach expliziter Freigabe im Browser) lokalisiert werden. Das Frontend liest die geografischen Koordinaten (Breiten- und Längengrad) aus und sendet diese an das Backend. Daraufhin wird die Distanz vom Nutzer und der Ferienwohnung berechnet und unterhalb der Map angezeigt.


###### Routen im Backend:
## "/api/user-status" GET
    Gibt den Status des Nutzers zurück

## "/bookingbroadcast" Websocket
    Registriert die Listener für die Websocket Anwendung. Clients können ids hinschicken um Fewos für 2 Minuten als reserviert zu markieren.

## "/getreservedfewos" GET
    Gehört zur Websocket Funktionalität: Gibt die Liste der aktuell reservierten Fewos zurück. Wird verwendet, wenn die Listenseite neu geladen ist um den aktuellen Stand zu erfragen.

##  "/upload" POST
    Nimmt ein Formular mit mehreren (CSV) Dateien entgegen um diese auf dem Server abzulegen als Datengrundlage. Zudem wird der Regionsname hier gesetzt.

## "/getlistings", "/getreviews", "/getcalendar" GET
    Gibt die nach JSON geparseten CSV Dateien zurück. Hier wird papaparse verwendet.

##  "/getregionname" GET
    Name der aktuell hinterlegten Region. Diese wird in Titeln ect. im Frontend angezeigt.

## "/booking" POST/GET
    Mit POST wird eine neue Buchung angelegt. Die Eingaben werden im Backend geprüft und die Buchung wird in der SQLite-Datenbank gespeichert.

    Mit GET werden alle Buchungen des angemeldeten Nutzers zurückgegeben.

## "/booking/:id" PUT/DELETE
    Mit PUT können das Anreise- und Abreisedatum einer Buchung geändert werden. Danach wird der Gesamtpreis neu berechnet.

    Mit DELETE wird eine Buchung aus der Datenbank gelöscht.

    Ein Nutzer kann nur seine eigenen Buchungen ändern oder löschen.

Alle Buchungsrouten sind mit der Middleware requireLogin abgesichert. Um Buchungen anzulegen, abzurufen, zu bearbeiten oder zu löschen, muss man angemeldet sein.

## "/login-backend" POST
    Über die Route /login-backend wird der komplette Anmeldevorgang des Nutzers gesteuert. Zuerst sucht das Backend den eingegebenen Benutzernamen in der Datenbank und gleicht das eingegebene Passwort mithilfe von bcrypt sicher mit dem gespeicherten Passwort-Hash ab. Stimmen die Daten überein, generiert der Server ein JSON Web Token des Nutzers für die nächsten 24 Stunden. Je nachdem, ob die Anmeldung erfolgreich war oder fehlschlug, wird der Nutzer schließlich mit einem entsprechenden Parameter ("?login=true" oder "?error=login") automatisch zur Frontend-Startseite weitergeleitet.

## "/logout-backend" GET
    Über die Route /logout-backend wird der Abmeldevorgang des Nutzers gesteuert. Zuerst wird mit res.clearCookie("token") das Authentifizierungs-Token gelöscht, wodurch die Sitzung serverseitig beendet ist. Anschließend wird der Nutzer weitergeleitet mit (res.redirect) zurück zur Frontend-Startseite, wobei die URL logout=true übergeben wird, damit man im Frontend eine zusätzliche Information hat.

## "/register-backend" POST
    Bei der Registrierung werden die vom Benutzer eingegebenen Daten ans Backend gesendet. Um das Passwort sicher in der SQLite-Datenbank zu speichern, wird es über die Bibliothek bcrypt gehasht (bcrypt.hash). Falls der Benutzername bereits existiert, fängt der catch-Block den UNIQUE-Datenbankfehler ab und liefert eine entsprechende Fehlermeldung zurück. Nach erfolgreicher Registrierung wird der Nutzer zur Frontend-Startseite weitergeleitet.
