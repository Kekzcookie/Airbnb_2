import { csvFolder, months } from "./variables.js";
let showingAll = false;
let numberOfReviewsSliced = 10;
let userCoords = null;
let fewo = null;

async function main() {
  let region = (await fetch('http://localhost:8081/getregionname').then(r => r.json())).region;
  document.title = "Ferienwohnungen " + region;
  document.getElementById("titleHeadline").innerText = "Ferienwohnungen " + region;
  document.getElementById("copyrightText").innerText = "© 2026 Ferienwohnungen " + region;

  //navigator = browser infos | geo... = abfrage für die location
  //wenn der nutzer das akzeptiert werden die coords gespeichert
  navigator.geolocation.getCurrentPosition((pos) => {
    userCoords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    console.log("Geo-Location vorhanden.");
  });
  // let listingscsv = await parseCsv("/csv/" + csvFolder + "listings.csv");
  let listingscsv = {data: await fetch('http://localhost:8081/getlistings').then(r => r.json())};
  // let reviewsscsv = await parseCsv("/csv/" + csvFolder + "reviews.csv");
  let reviewsscsv = {data: await fetch('http://localhost:8081/getreviews').then(r => r.json())};
  let params = new URLSearchParams(document.location.search);
  let id = params.get("id");
  let reviews = reviewsscsv.data.filter((row) => {
    return row.listing_id === id;
  });

  console.log(id);
  let data = listingscsv.data.filter((row) => {
    return row.id === id;
  });
  if (data.length > 0) {
    fewo = data[0];
    console.log(fewo);
    loadFewodata(fewo);
  }
  loadReviewsData(reviews.slice(0, numberOfReviewsSliced));
  // hide the "show all" button if there are 10 reviews or less
  if (reviews.length <= numberOfReviewsSliced) {
    document
      .getElementById("toggleReviewsButton")
      .classList.add("display-none");
  }

  document
    .getElementById("toggleReviewsButton")
    .addEventListener("click", (event) => {
      if (showingAll) {
        loadReviewsData(reviews.slice(0, numberOfReviewsSliced));
        showingAll = false;
        event.target.innerHTML = "Alle Bewertungen anzeigen";
      } else {
        loadReviewsData(reviews);
        showingAll = true;
        event.target.innerHTML = "Weniger Bewertungen Anzeigen";
      }
    });
}

function loadFewodata(fewo) {
  document.title = fewo.name;

  let title = document.getElementById("fewoTitle");
  title.textContent = fewo.name;

  let description = document.getElementById("description");
  description.innerHTML = fewo.description;

  let img = document.getElementById("fewopicture");
  img.src = fewo.picture_url;

  let amenities = JSON.parse(fewo.amenities);
  let ausstattung = document.getElementById("ausstattung");
  for (let amenity of amenities) {
    let li = document.createElement("li");
    li.textContent = amenity;
    ausstattung.appendChild(li);
  }

  document.getElementById("neighborhoodBullet").textContent =
    fewo.neighbourhood_cleansed;
  document.getElementById("propertyTypeBullet").textContent =
    fewo.property_type;
  document.getElementById("bedroomsBullet").textContent = fewo.bedrooms;
  document.getElementById("bedsBullet").textContent = fewo.beds;
  document.getElementById("bathroomsBullet").textContent = fewo.bathrooms;
  document.getElementById("maxGuestsBullet").textContent = fewo.accommodates;
  document.getElementById("minimumNightsBullet").textContent =
    fewo.minimum_nights;
  document.getElementById("maximumNightsBullet").textContent =
    fewo.maximum_nights;

  // if there is no price, show a "-" instead
  let price = fewo.price === "" ? "-" : fewo.price;
  document.getElementById("preis").textContent = price + " pro Nacht";

  let bookButton = document.getElementById("bookButton");

if (bookButton) {
  bookButton.onclick = () => {
    window.location.href = "booking.html?id=" + fewo.id;
  };
}

  let latitude = parseFloat(fewo.latitude);
  let longitude = parseFloat(fewo.longitude);
  let delta = 0.01;
  console.log(longitude);

  let mapIframe = document.getElementById("mapIframe");
  mapIframe.src =
    "https://www.openstreetmap.org/export/embed.html?" +
    "bbox=" +
    (longitude - delta) +
    "%2C" +
    (latitude - delta) +
    "%2C" +
    (longitude + delta) +
    "%2C" +
    (latitude + delta) +
    "&" +
    "layer=mapnik&marker=" +
    latitude +
    "%2C" +
    longitude;

  document.getElementById("mapAnchor").href =
    "https://www.openstreetmap.org/?mlat=" +
    latitude +
    "&mlon=" +
    longitude +
    "#map=16/" +
    latitude +
    "/" +
    longitude;

  document.getElementById("reviewHeadline").textContent =
    "Bewertung: " +
    fewo.review_scores_rating +
    " Sterne (" +
    fewo.number_of_reviews +
    " Bewertungen)";

  document.getElementById("hostHeadline").textContent =
    "Gastgeber:in " + fewo.host_name;
  let hostPicture = document.getElementById("hostPicture");
  hostPicture.src = fewo.host_picture_url;
  document.getElementById("hostDescription").innerHTML = fewo.host_about;
  document.getElementById("responseTime").textContent = fewo.host_response_time;
  document.getElementById("hostLocation").textContent = fewo.host_location;

  if (userCoords) {
    EntfernungZurLocation(userCoords.lat, userCoords.lng, latitude, longitude);
  }
}

function loadReviewsData(reviews) {
  let reviewsContainer = document.getElementById("reviewsContainer");
  reviewsContainer.innerHTML = "";
  reviews.forEach((review) => {
    let reviewDiv = document.createElement("div");
    reviewDiv.classList.add("review");

    let reviewh2 = document.createElement("h2");
    reviewh2.textContent = review.reviewer_name;

    let reviewDate = document.createElement("p");
    let dateSplit = review.date.split("-");
    let dateStr =
      dateSplit[2] + ". " + months[dateSplit[1] - 1] + " " + dateSplit[0];
    reviewDate.textContent = dateStr;
    reviewDate.classList.add("review-date");

    let reviewText = document.createElement("p");
    reviewText.classList.add("review-text");
    reviewText.innerHTML = review.comments;

    reviewDiv.appendChild(reviewh2);
    reviewDiv.appendChild(reviewDate);
    reviewDiv.appendChild(reviewText);
    reviewsContainer.appendChild(reviewDiv);
  });
}
//mathe formel ist geklaut
function berechneEntfernung(lat1, lon1, lat2, lon2) {
  const R = 6371; //raduis der erde
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
  //toFixed macht ein string mit (nachkommastellen)
}
function EntfernungZurLocation(userLat, userLng, fewoLat, fewoLng) {
  const entfernungsText = document.getElementById("Entfernung");
  if (entfernungsText) {
    let km = berechneEntfernung(userLat, userLng, fewoLat, fewoLng);
    entfernungsText.textContent = `Ferienwohnung ist ${km} km entfernt.`;
  }
}

main();
