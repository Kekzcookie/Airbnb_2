import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./index.js";

export { register, login, getCurrentUser, isAdmin };

if (!process.env.JwtPasswort) {
  console.error("Kein JWT Passwort Festgelegt!");
  process.exit(1);
}
const JwtPasswort = process.env.JwtPasswort;

async function register(req, res) {
  const username = req.body.username;
  const fullName = req.body.fullName;
  const password = req.body.password;
  const email = req.body.email;
  const telefon = req.body.telefon;
  const adresse = req.body.adresse;

  try {
    const crypedPasswort = await bcrypt.hash(password, 10);
    const insert = db.prepare(
      "insert into users (benutzername, vollerName, passwort, email, telefon, addresse) values (?, ?, ?, ?, ?, ?)",
    );
    insert.run(username, fullName, crypedPasswort, email, telefon, adresse);
    res.redirect("http://localhost:8080/index.html?registered=true");
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      return res.status(400).send("Benutzername ist schon vergeben.");
    }
    console.error(error);
    res.status(500).send("Serverfehler bei der Registrierung.");
  }
}

async function login(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const user = db
      .prepare("SELECT * FROM users WHERE benutzername = ?")
      .get(username);

    if (user && (await bcrypt.compare(password, user.passwort))) {
      console.log("Erfolgreicher Login für:", user.benutzername);

      // JWT Token erstellen
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.benutzername,
          isAdmin: user.is_admin,
        },
        JwtPasswort,
        { expiresIn: "24h" },
      );

      // als Cookie setzen
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24, //24h
        sameSite: "lax",
      });

      res.redirect("http://localhost:8080/index.html?login=true");
    } else {
      return res.redirect("http://localhost:8080/index.html?error=login");
    }
  } catch (error) {
    console.error("Login Fehler im Backend:", error);
    res.status(500).send("Serverfehler beim Login.");
  }
}
async function getCurrentUser(req, res) {
  const token = req.cookies.token; //holt cookie

  if (!token) {
    return res.json({ loggedIn: false, role: 'guest' });
  }

  try {
    const decoded = jwt.verify(token, JwtPasswort);
    // wenn der user admin ist wird 1 wiedergegeben
    const role = decoded.isAdmin ? 'admin' : 'user'; 
    
    res.json({ loggedIn: true, username: decoded.username, role: role });
  } catch (error) {
    res.json({ loggedIn: false, role: 'guest' });
  }
}

function isAdmin(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send("Nicht autorisiert. Bitte einloggen.");
  }

  try {
    const decoded = jwt.verify(token, JwtPasswort);
    
    if (decoded.isAdmin) {
      req.user = decoded; //speichert userdaten
      next();
    } else {
      res.status(403).send("Zugriff verweigert. Nur für Admins.");
    }
  } catch (error) {
    res.status(401).send("Ungültiges Token.");
  }
}