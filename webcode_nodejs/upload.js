import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IncomingForm } from 'formidable';
export { handleUpload, regionName };

// This variable will be inserted in the frontend for the title, ect.
let regionName = "Barossa Valley";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function handleUpload(req, res) {
    // create Upload folder
    let uploadDir = path.join(__dirname, 'uploads');
    if(!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true, mode: '0777' });
    }
    
    const filterFunction = ({ name, originalFilename, mimetype }) => {
        if (!(originalFilename && name)) return 0;
        return 1;
    };
    
    const customOptions = { 
        uploadDir: uploadDir, 
        keepExtensions: true, 
        allowEmptyFiles: false, 
        maxFileSize: 5 * 1024 * 1024 * 1024, 
        multiples: true, 
        filter: filterFunction 
    };
    
    const form = new IncomingForm(customOptions);

    // parse with formidable
    form.parse(req, (err, fields, files) => {

        if (err) {
            console.error("Formidable Parsing Fehler:", err);
            return res.status(500).json({ message: 'Fehler beim Verarbeiten der Datei.' });
        }

        // Set the region name
        if (fields.region) {
            regionName = Array.isArray(fields.region) ? fields.region[0] : fields.region;
        }
        
        // Prüfen, ob überhaupt Dateien mit dem Namen 'filetoupload' geschickt wurden
        const uploadedFiles = files.filetoupload;
        if (!uploadedFiles) {
            return res.status(400).json({ message: 'Keine Datei ausgewählt' });
        }

        const fileList = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];

        try {
            //datein werden einzeln hochgeladen!
            fileList.forEach((file) => {
                const newFilepath = path.join(uploadDir, file.originalFilename);
                fs.renameSync(file.filepath, newFilepath);
            });
            
            return res.status(200).json({ message: 'Datei erfolgreich hochgeladen.' });
        } catch (renameError) {
            console.error("Fehler beim Verschieben der Datei:", renameError);
            return res.status(500).json({ message: 'Fehler beim Speichern der Datei auf dem Server.' });
        }
    });
}