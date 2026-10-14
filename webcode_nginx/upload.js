import { showMessage } from "./profil.js";

const uploadEndpoint = window.location.hostname === 'localhost'? 'http://localhost:8081/upload': '/upload';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const submitButton = document.getElementById('uploadbutton');
  const regionInput = document.getElementById('region');
  
  const fileInputs = [
    document.getElementById('listingUpload'),
    document.getElementById('reviewupload'),
    document.getElementById('calendarupload'),
  ].filter(Boolean);

  if (!form || !submitButton) {
    return;
  }

  submitButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const formData = new FormData();
    const regionValue = regionInput?.value?.trim();

    if (regionValue) {
      formData.append('region', regionValue);
    }

    const selectedFiles = fileInputs.flatMap((input) => {
      const file = input.files?.[0];
      return file ? [file] : [];
    });

    if (selectedFiles.length === 0) {

      showMessage(
        "Keine Datei Ausgewählt!",
        "Wähle zumindest eine Datei zum Hochladen aus.",
        false
      );
      return;
    }

    selectedFiles.forEach((file) => {
      formData.append('filetoupload', file);
    });

    try {
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Upload fehlgeschlagen.');
      }

      showMessage(
        "Erfolgreich hochgeladen!",
        "Die Daten sind erfolgreich geändert worden",
        true
      );
      form.reset();

    } catch (error) {

      showMessage(
        "Backend sagt Nein!",
        "Mögliches fehlen an Adminrechten, überprüfe deine Zugangsrechte",
        false
      );
    }
  });
});