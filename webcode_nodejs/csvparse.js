import papa from "papaparse";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export { parseCsv, parseCsvToJsonResponse };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveCsvPath(filePath) {
  if (!filePath) return null;
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(__dirname, filePath.replace(/^\.\//, ""));
}

async function parseCsv(url) {
  return new Promise((resolve, reject) => {
    papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results),
      error: (error) => reject(error),
    });
  });
}

async function parseCsvToJsonResponse(req, res, filePath) {
  const absolutePath = resolveCsvPath(filePath);

  if (!absolutePath) {
    return res.status(400).json({ error: "Kein CSV-Pfad angegeben." });
  }

  if (!fs.existsSync(absolutePath)) {
    console.warn("CSV-Datei nicht gefunden, sende leere Liste:", absolutePath);
    return res.status(200).json([]);
  }

  try {
    const fileContent = fs.readFileSync(absolutePath, "utf8");
    const result = papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => (typeof value === "string" ? value.trim() : value),
    });

    if (result.errors?.length) {
      console.warn("CSV-Parsing-Warnungen:", result.errors);
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error("Fehler beim Lesen der CSV-Datei:", error);
    return res.status(500).json({ error: "CSV konnte nicht gelesen werden." });
  }
}