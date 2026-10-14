import { csvFolder } from "./variables.js";

async function fetchJsonWithRetry(url, options = {}, retries = 8, delay = 500) {
    let lastError;

    for (let attempt = 0; attempt < retries; attempt += 1) {
        try {
            const response = await fetch(url, { ...options, credentials: "include" });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();

        } catch (error) {
            lastError = error;
            
            if (attempt < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}
let reservedfewos = [];

function markReserved(ids) {
    document.querySelectorAll(".reserved-fewo").forEach(element => {
        element.classList.remove("reserved-fewo");
    });
    ids.forEach(element => {
        console.log(element);
        let div = document.querySelector("div[fewoid=\"" + element + "\"]");
        if(div) {
            div.classList.add("reserved-fewo");
        }
    });
}

// Set up websocket for broadcasts
const socket = new WebSocket('ws://localhost:8081/bookingbroadcast')
socket.onmessage = event => {
    let jsonParse = JSON.parse(event.data);
    if(jsonParse.booking) {
        // Notification anzeigen, wenn eine neue Wohnung gebucht wurde
        document.getElementById("booking-notification-content").textContent = "Die Wohnung \"" + jsonParse.booking.apartmentName + "\" wurde gerade gebucht";
        document.getElementById("booking-notification").style.display = "block";
    } else if(jsonParse.reservedFewos) {
        // What to do when the server sends reservedFewos
        console.log("Received reservedFewos: " + jsonParse.reservedFewos);
        console.log(jsonParse);
        reservedfewos = [...jsonParse.reservedFewos];
        markReserved(reservedfewos);
    }
}

socket.addEventListener('open', () => {
    // Send a notification to reserve a fewo to the server if the user has entered the booking page
    if(window.location.href.includes("/booking.html")) {
        // URL auslesen
        const urlParams = new URLSearchParams(window.location.search);
        let id = urlParams.get("id");
        console.log("sending id to server: " + id);
        socket.send(JSON.stringify({reservedId: id}));
    }
});


let currentLimit = 10; //anzahl wie viele hinzugefügt werden
let displayedCount = 0; //anzahl der angezeigten
let activeList = [];
let filtersApplied = false;
const indexStateKey = "indexPageState";

// Speichert den Zustand der Startseite im lokalen Browserspeicher.
function saveIndexState() {
    if (!document.getElementById("filterContainer")) {
        return;
    }

    const indexState = {
        name: document.getElementById("nameSearchTextfield").value,
        propertyType: document.getElementById("propertyTypeSelect").value,
        neighborhood: document.getElementById("neighborhoodTypeSelect").value,
        minimumRating: document.getElementById("minimumRating").value,
        maximumRating: document.getElementById("maximumRating").value,
        minimumPrice: document.getElementById("minimumPrice").value,
        maximumPrice: document.getElementById("maximumPrice").value,
        showWithoutPrice: document.getElementById("showWithoutPriceCheckbox").checked,
        showWithoutRating: document.getElementById("showWithoutRatingCheckbox").checked,
        sorting: document.getElementById("sortSelect").value,
        filtersApplied: filtersApplied,
        displayedCount: displayedCount,
        scrollPosition: window.scrollY
    };

    localStorage.setItem(
        indexStateKey,
        JSON.stringify(indexState)
    );
}

function renderNextChunk() {
    const contentContainer = document.getElementById("content");
    const mehrWohnungenLaden = document.getElementById("weitere-wohnungen-anzeigen");

    // holt den nächsten splice
    const nextChunk = activeList.slice(displayedCount, displayedCount + currentLimit);
    
    nextChunk.forEach(row => {
        contentContainer.appendChild(createFewoListingHtml(row));
    });

    displayedCount += nextChunk.length;

    // Button ausblenden
    if (displayedCount >= activeList.length) {
        mehrWohnungenLaden.style.display = "none";

    } else {
        mehrWohnungenLaden.style.display = "inline-block";
    }
}

//array zurücksetzten nach nutzung eines filters
function resetAndRender(newList) {
    document.getElementById("content").innerHTML = "";
    activeList = newList;
    displayedCount = 0;
    renderNextChunk();
}


async function main() {
    try {
        const regionData = await fetchJsonWithRetry('http://localhost:8081/getregionname');
        let region = regionData.region || "Barossa Valley";
        document.title = "Ferienwohnungen " + region;
        document.getElementById("titleHeadline").innerText = "Ferienwohnungen " + region;
        document.getElementById("copyrightText").innerText = "© 2026 Ferienwohnungen " + region;

        const listingsData = await fetchJsonWithRetry('http://localhost:8081/getlistings');
        let listingscsv = { data: Array.isArray(listingsData) ? listingsData : [] };
        console.log(listingscsv);
        let neighborhoodSet = new Set();

        let propertyTypeSet = new Set();

        listingscsv.data.forEach((row) => {
            propertyTypeSet.add(row.property_type);
            neighborhoodSet.add(row.neighbourhood_cleansed);
        });

        document.getElementById("closebtn-booking-notification").addEventListener("click", () => {
            document.getElementById("booking-notification").style.display = "none";
        });

        let neighborhoodArr = Array.from(neighborhoodSet).sort();
        let typeArr = Array.from(propertyTypeSet).sort();

        let propertyTypeSelect = document.getElementById("propertyTypeSelect");
        typeArr.forEach((type) => {
            let typeOption = document.createElement("option");
            typeOption.value = type;
            typeOption.innerText = type;
            propertyTypeSelect.appendChild(typeOption);
        });

        let neighborhoodSelect = document.getElementById("neighborhoodTypeSelect");
        neighborhoodArr.forEach((neighborhood) => {
            let neighborhoodOption = document.createElement("option");
            neighborhoodOption.value = neighborhood;
            neighborhoodOption.innerText = neighborhood;
            neighborhoodSelect.appendChild(neighborhoodOption);
        });
        

        let filteredList = [...listingscsv.data];

        let inputMinRating = document.getElementById("minimumRating");
        let valueMinRating = document.getElementById("minimumRatingValueText");
        valueMinRating.textContent = inputMinRating.value + " ⭐";
        inputMinRating.addEventListener("input", (event) => {
            valueMinRating.textContent = event.target.value + " ⭐";
        });

        let inputMaxRating = document.getElementById("maximumRating");
        let valueMaxRating = document.getElementById("maximumRatingValueText");
        valueMaxRating.textContent = inputMaxRating.value + " ⭐";;
        inputMaxRating.addEventListener("input", (event) => {
            valueMaxRating.textContent = event.target.value + " ⭐";;
        });

        let input = document.getElementById("minimumPrice");
        let value = document.getElementById("minimumPriceValueText");
        value.textContent = input.value + "$";
        input.addEventListener("input", (event) => {
            value.textContent = event.target.value + "$";
        });

        let inputMax = document.getElementById("maximumPrice");
        let valueMax = document.getElementById("maximumPriceValueText");
        valueMax.textContent = inputMax.value + "$";
        inputMax.addEventListener("input", (event) => {
            valueMax.textContent = event.target.value + "$";
        });


        document.getElementById("weitere-wohnungen-anzeigen").addEventListener("click", () => {
            renderNextChunk();
            saveIndexState();
        });

        document.getElementById("filterButton").addEventListener("click", () => {
            //kopie vom array
            filteredList = [...listingscsv.data];

            let nameFilter = document.getElementById("nameSearchTextfield").value;

            filteredList = filteredList.filter((row) => {
 
                return new RegExp(nameFilter, "i").test(row.name);
            });

            let showNoRating = document.getElementById("showWithoutRatingCheckbox").checked;
            let ratingLowerBound = document.getElementById("minimumRating").value;
            let ratingUpperBound = document.getElementById("maximumRating").value;

            filteredList = filteredList.filter((row) => {

                let rating = parseFloat(row.review_scores_rating);

                if(showNoRating && rating === "") {
                    return true;
                }
                return ratingLowerBound <= rating && rating <= ratingUpperBound;
            });

            let showNoPrice = document.getElementById("showWithoutPriceCheckbox").checked;
            let priceLowerBound = parseFloat(document.getElementById("minimumPrice").value);
            let priceUpperBound = parseFloat(document.getElementById("maximumPrice").value);

            filteredList = filteredList.filter((row) => {
                // preis
                let priceMatch = row.price.replaceAll(",", "").match(/\d+(\.\d+)?/);

                if(priceMatch) {
                    let price = parseFloat(priceMatch[0]);
                    return priceLowerBound <= price && price <= priceUpperBound;
                } else {
                    return showNoPrice;
                }
                
            });

            let propertyTypeFilter = document.getElementById("propertyTypeSelect").value;
            filteredList = filteredList.filter((row) => {
                return new RegExp(propertyTypeFilter, "i").test(row.property_type);
            });

            let neighborhoodFilter = document.getElementById("neighborhoodTypeSelect").value;
            filteredList = filteredList.filter((row) => {
                return new RegExp(neighborhoodFilter, "i").test(row.neighbourhood_cleansed);
            });

            let sorting = document.getElementById("sortSelect").value;

            if(sorting === "ratingAsc") {

                filteredList = filteredList.sort((a, b) => {
                    return a.review_scores_rating - b.review_scores_rating;
                });

            } else if(sorting === "ratingDesc") {

                filteredList = filteredList.sort((a, b) => {
                    return b.review_scores_rating - a.review_scores_rating;
                });

            } else if(sorting === "priceDesc") {

                filteredList = filteredList.sort((a, b) => {

                    let priceMatchA = a.price.replaceAll(",", "").match(/\d+(\.\d+)?/);
                    let priceMatchB = b.price.replaceAll(",", "").match(/\d+(\.\d+)?/);

                    if(priceMatchA && priceMatchB) {

                        let priceA = parseFloat(priceMatchA[0]);
                        let priceB = parseFloat(priceMatchB[0]);

                        return priceB - priceA;

                    } else if(priceMatchA) {
                        return -1;

                    } else if(priceMatchB) {
                        return 1;

                    } else {
                        return 0;
                    }
                });

            } else if(sorting === "priceAsc") {

                filteredList = filteredList.sort((a, b) => {
                    
                    let priceMatchA = a.price.replaceAll(",", "").match(/\d+(\.\d+)?/);
                    let priceMatchB = b.price.replaceAll(",", "").match(/\d+(\.\d+)?/);

                    if(priceMatchA && priceMatchB) {

                        let priceA = parseFloat(priceMatchA[0]);
                        let priceB = parseFloat(priceMatchB[0]);

                        return  priceA - priceB;

                    } else if(priceMatchA) {
                        return 1;

                    } else if(priceMatchB) {
                        return -1;

                    } else {
                        return 0;
                    }
                });
            }

            filtersApplied = true;
            resetAndRender(filteredList);
            saveIndexState();
        });

        document.getElementById("showAllButton").addEventListener("click", (event) => {

            filtersApplied = false;
            resetAndRender(listingscsv.data);
            saveIndexState();
        });

        const savedIndexState = localStorage.getItem(
            indexStateKey
        );

        if (savedIndexState) {
            const indexState = JSON.parse(savedIndexState);

            document.getElementById("nameSearchTextfield").value = indexState.name || "";
            document.getElementById("propertyTypeSelect").value = indexState.propertyType || "";
            document.getElementById("neighborhoodTypeSelect").value = indexState.neighborhood || "";
            document.getElementById("minimumRating").value = indexState.minimumRating || "1";
            document.getElementById("maximumRating").value = indexState.maximumRating || "5";
            document.getElementById("minimumPrice").value = indexState.minimumPrice || "0";
            document.getElementById("maximumPrice").value = indexState.maximumPrice || "900";
            document.getElementById("showWithoutPriceCheckbox").checked = indexState.showWithoutPrice !== false;
            document.getElementById("showWithoutRatingCheckbox").checked = indexState.showWithoutRating !== false;
            document.getElementById("sortSelect").value = indexState.sorting || "";

            // Aktualisiert die Texte neben den vier Schiebereglern.
            valueMinRating.textContent = inputMinRating.value + " ⭐";
            valueMaxRating.textContent = inputMaxRating.value + " ⭐";
            value.textContent = input.value + "$";
            valueMax.textContent = inputMax.value + "$";

            filtersApplied = indexState.filtersApplied === true;

            if (filtersApplied) {
                document.getElementById("filterButton").click();
            } else {
                resetAndRender(listingscsv.data);
            }

            const savedDisplayedCount = Number(indexState.displayedCount);

            while (
                displayedCount < savedDisplayedCount &&
                displayedCount < activeList.length
            ) {
                renderNextChunk();
            }

            setTimeout(() => {
                window.scrollTo(
                    0,
                    Number(indexState.scrollPosition) || 0
                );
            }, 100);
        } else {
            resetAndRender(filteredList);
        }
        
        // Mark the currently reserved Fewos
        const reservedFewosData = await fetchJsonWithRetry('http://localhost:8081/getreservedfewos');
        if(reservedFewosData.reservedFewos && Array.isArray(reservedFewosData.reservedFewos)) {
            reservedfewos = [...reservedFewosData.reservedFewos];
            markReserved(reservedfewos);
        }

    } catch (error) {
        console.error("Konnte Wohnungsdaten nicht laden:", error);
        const content = document.getElementById("content");
        if (content) {
            content.innerHTML = "<p>Die Wohnungen werden gerade geladen … bitte kurz warten.</p>";
        }
    }
}

function createFewoListingHtml(datarow) {
    let fewodiv = document.createElement("div");
    fewodiv.classList.add("fewo");
    if(reservedfewos.includes(datarow.id)) {
        fewodiv.classList.add("reserved-fewo");
    }
    fewodiv.setAttribute("fewoId", datarow.id);

    let img = document.createElement("img");
    img.src = datarow.picture_url;
    img.alt = datarow.name;
    img.classList.add("fewo-bg");
    fewodiv.appendChild(img);

    let fewoInfo = document.createElement("div");
    fewoInfo.classList.add("fewo-info");
    fewodiv.appendChild(fewoInfo);

    let fewoh3 = document.createElement("h3");
    fewoh3.textContent = datarow.name;
    fewoInfo.appendChild(fewoh3);

    let fewop1 = document.createElement("p");
    fewop1.textContent = "Typ: " + datarow.property_type;
    fewoInfo.appendChild(fewop1);

    let fewop2 = document.createElement("p");
    fewop2.textContent = "Stadtteil: " + datarow.neighbourhood_cleansed;
    fewoInfo.appendChild(fewop2);

    let fewop3 = document.createElement("p");
    fewop3.textContent = "Preis pro Nacht: " + datarow.price;
    fewoInfo.appendChild(fewop3);

    let fewop4 = document.createElement("p");
    fewop4.textContent = "Bewertung: " + datarow.review_scores_rating + " Sterne (" + datarow.number_of_reviews + " Bewertungen)";
    fewoInfo.appendChild(fewop4);

    let fewoDetailsLink = document.createElement("a");
    fewoDetailsLink.href = "fewodetails.html?id=" + datarow.id;
    fewoDetailsLink.textContent = "Details ansehen";
    fewoInfo.appendChild(fewoDetailsLink);

    return fewodiv;
}

// Beim Verlassen der Seite wird der letzte Zustand gespeichert.
window.addEventListener("pagehide", saveIndexState);

main();