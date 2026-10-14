import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import Database from "better-sqlite3";
import fs from "node:fs";
import papa from "papaparse";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import formidable from "formidable";
import expressSession from "express-session";
import expressws from "express-ws";
import { handleUpload, regionName } from "./upload.js";
import {createBookingTable, createBooking, getBookings, updateBookingDates, deleteBooking} from "./booking.js";
import { register, login, getCurrentUser, isAdmin } from './auth.js';
import { parseCsv, parseCsvToJsonResponse } from "./csvparse.js";
import { setTimeout } from "timers/promises";
import { db } from "./database.js";
export { db, regionName };

const app = express();
const wsInstance = expressws(app);
app.use(express.json());
app.use(cookieParser());

if (!process.env.JwtPasswort) {
  console.error("Kein JWT Passwort Festgelegt!");
  process.exit(1);
}
const JwtPasswort = process.env.JwtPasswort;
const reservedFewos = new Set();

app.use(expressSession({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: false }
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// cookies erlauben
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  }),
);

// Die Buchungstabelle wird beim Start des Backends erstellt.
createBookingTable();

// Websocket für Buchungsnachrichten und temporäre Reservierungen
app.ws("/bookingbroadcast", (ws, req) => {
    console.log(`New session subscribed: ${req.session.id}`);
    ws.on('message', (data) => {
      const reserved = JSON.parse(data);
      console.log(data);
      // add reverved id for 2 minutes
      addToReservedForTwoMinutes(reserved.reservedId);
    })
    ws.on('close', () => console.log(`Session closed: ${req.session.id}`))
});

app.get("/getreservedfewos", (req, res) => {
  return res.json({ reservedFewos: [...reservedFewos]});
});

function broadcastNewBooking(booking) {
  for(let client of wsInstance.getWss().clients) {
    console.log("Broadcast message was sent");
    client.send(JSON.stringify({ booking: booking}));
  }
}

function broadcastReservedChanged() {
  for(let client of wsInstance.getWss().clients) {
    console.log("Broadcast message was sent");
    client.send(JSON.stringify({ reservedFewos: [...reservedFewos]}));
  }
}

async function addToReservedForTwoMinutes(id) {
  console.log("id:" + id);
  // Only add and delete if the id is not reserved yet
  if(!reservedFewos.has(id)) {
    reservedFewos.add(id);
    console.log("Added id:" + id);
    broadcastReservedChanged();
    await setTimeout(120000);
    reservedFewos.delete(id);
    console.log("Removed id:" + id);
    broadcastReservedChanged();
  }
}

// --- JWT ---
app.get("/api/user-status", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, JwtPasswort);

    const user = db
      .prepare(
        "SELECT benutzername, email, addresse, vollerName, is_admin FROM users WHERE benutzername = ?",
      )
      .get(decoded.username);

    if (user) {
      res.json({
        loggedIn: true,
        username: user.benutzername,
        email: user.email,
        address: user.addresse,
        fullName: user.vollerName,
        isAdmin: user.is_admin === 1 // Gibt true oder false an das Frontend bezüglich des admin status
      });
    } else {
      res.json({ loggedIn: false });
    }
  } catch (error) {
    console.error("JWT Fehler:", error.message);
    res.json({ loggedIn: false });
  }
});

// --- jwt ---
app.get("/logout-backend", (req, res) => {
  res.clearCookie("token");
  res.redirect("http://localhost:8080/index.html?logout=true");
});

app.post("/register-backend", async (req, res) => {
  register(req, res);
});

app.post("/login-backend", async (req, res) => {
  login(req, res);
});

// Prüft, ob ein Benutzer eingeloggt ist.
function requireLogin(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send({
      success: false,
      message: "Bitte melde dich zuerst an."
    });
  }

  try {
    const decoded = jwt.verify(token, JwtPasswort);

    // Die Daten aus dem Token werden für die Buchungsfunktionen gespeichert.
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Fehler beim Prüfen des Logins:", error.message);

    return res.status(401).send({
      success: false,
      message: "Deine Anmeldung ist ungültig oder abgelaufen."
    });
  }
}


// --- Bookings ---
app.post("/booking", requireLogin, (req, res) => {
  const booking = createBooking(req, res);
  if(booking) {
    broadcastNewBooking(booking);
  }
});

app.get("/booking", requireLogin, (req, res) => {
  getBookings(req, res);
});

app.put("/booking/:id", requireLogin, (req, res) => {
  updateBookingDates(req, res);
});

app.delete("/booking/:id", requireLogin, (req, res) => {
  deleteBooking(req, res);
});


// prüft ob user ein admin ist!
function requireAdmin(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Loggen Sie sich bitte ein." });
  }

  try {
    const decoded = jwt.verify(token, JwtPasswort);

    const user = db
      .prepare("SELECT is_admin FROM users WHERE benutzername = ?")
      .get(decoded.username);

    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ error: "Keine Adminrechte!" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Fehler beim Prüfen des Admin:", error.message);
    return res.status(401).json({ error: "Bitte einloggen." });
  }
}
app.get('/current-user', getCurrentUser);

// --- Upload and CSV ---
app.post("/upload", requireAdmin, (sql, res) => {
  handleUpload(sql, res);
});

app.get("/getlistings", (req, res) => {
  parseCsvToJsonResponse(req, res, "./uploads/listings.csv");
});

app.get("/getreviews", (req, res) => {
  parseCsvToJsonResponse(req, res, "./uploads/reviews.csv");
});

app.get("/getcalendar", (req, res) => {
  parseCsvToJsonResponse(req, res, "./uploads/calendar.csv");
});

app.get("/getregionname", (req, res) => {
  res.send({ region: regionName });
});

app.listen(80);
