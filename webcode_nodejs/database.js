import Database from "better-sqlite3";
import bcrypt from "bcrypt";

const db = new Database("foobar.db");
db.pragma("journal_mode = WAL");

db.exec(`
  create table if not exists users (
    id integer primary key autoincrement,
    benutzername text unique not null,
    vollerName text not null,
    passwort text not null,
    email text not null,
    telefon text not null,
    addresse text not null,
    is_admin integer default 0
  );
`);

const erstelleVorgefertigeNutzer = async () => {
  try {
    // Admin anlegen
    const adminPasswort = await bcrypt.hash("admin123", 10);
    const insertAdmin = db.prepare(`
      INSERT OR IGNORE INTO users (benutzername, vollerName, passwort, email, telefon, addresse, is_admin) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run("admin", "Martin Petal", adminPasswort, "admin@barossa.de", "8297498264", "Admin Straße 7", 1);

    // User anlegen
    const userPasswort = await bcrypt.hash("user123", 10);
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (benutzername, vollerName, passwort, email, telefon, addresse, is_admin) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run("user", "Viktor Oles", userPasswort, "user@email.de", "32335232", "User Straße 2a", 0);
    
    console.log("Datenbank-Nutzer erfolgreich überprüft/initialisiert.");
  } catch (error) {
    console.error("Fehler bei der Initialisierung der Standard-Nutzer:", error);
  }
};

erstelleVorgefertigeNutzer();

export { db };
