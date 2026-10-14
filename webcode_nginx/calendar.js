import { csvFolder, months } from "./variables.js";
let selectedDate = new Date();
selectedDate.setDate(1);
let calendarMap;
async function main() {
    let params = new URLSearchParams(document.location.search);
    let id = params.get("id");
    calendarMap = await getCalendarMap(id);
    let prevButton = document.getElementById("prevMonthButton");
    prevButton.addEventListener("click", () => {
        selectedDate.setMonth(selectedDate.getMonth()-1);
        setCalendarToMonth(selectedDate);
    });
    let nextButton = document.getElementById("nextMonthButton");
    nextButton.addEventListener("click", () => {
        selectedDate.setMonth(selectedDate.getMonth()+1);
        setCalendarToMonth(selectedDate);
    });
    setCalendarToMonth(selectedDate);
}

function setCalendarToMonth(selectedDate) {
    let date = new Date(selectedDate);
    date.setDate(1);
    let calendarHeader = document.getElementById("calendarHeaderText");
    calendarHeader.textContent = getGermanMonthName(date.getMonth()) + " " + date.getFullYear();
    let calendarBody = document.getElementById("calendarBody");
    calendarBody.innerHTML = "";
    
    let tr = document.createElement("tr");
    calendarBody.appendChild(tr);
    // create empty tds to offset if the first is not on a monday
    for(let i = 0; i < (date.getDay()+6)%7; i++) {
        tr.appendChild(document.createElement("td"));
    }

    
    let currentMonth = date.getMonth();
    // iterate through the days of the month until we hit the next month
    while(date.getMonth() === currentMonth) {
        console.log(calendarMap);
        let calendarData = calendarMap.get(getDateString(date));
        
        let td = document.createElement("td");
        if(calendarData) {
            if(calendarData.available === "f") {
                td.classList.add("b");
            } else if(calendarData.available === "t") {
                td.classList.add("v");
            }
        }
        td.textContent = date.getDate();
        tr.appendChild(td);
        // Sunday - Saturday : 0 - 6
        date.setDate(date.getDate() + 1);
        // Next day to add is a monday, so we need a new row unless its the next month
        if(date.getDay() === 1 && date.getMonth() === currentMonth) {
            tr = document.createElement("tr");
            calendarBody.appendChild(tr);
        }
    }
    
    // add empty cells if the last week isnt finished
    let firstOfNextMonth = (date.getDay()+6)%7;
    for(let i = firstOfNextMonth; i < 7 && i !== 0; i++) {
        tr.appendChild(document.createElement("td"));
    }
}

function getGermanMonthName(dateMonth) {
    return months[dateMonth];
}

async function getCalendarMap(id) {
    // let calendarcsv = await parseCsv("/csv/" + csvFolder + "calendar.csv");
    let calendarcsv = {data: await fetch('http://localhost:8081/getcalendar').then(r => r.json())};
    let calendarMap = new Map();
    let calendarData = calendarcsv.data.filter((row) => {
        return row.listing_id === id;
    });
    for(let calendarDate of calendarData) {
        let date = new Date(calendarDate.date);
        calendarMap.set(getDateString(date), calendarDate);
    }
    return calendarMap;
}

function getDateString(date) {
    return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
}
main();