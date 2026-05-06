// =========================
//  LANGUAGE TOGGLE
// =========================

let currentLang = "en";

const LANG = {
    en: {
        todaySummary: "Today Summary",
        feelsLike: "Feels Like",
        humidity: "Humidity",
        wind: "Wind",
        rainChance: "Rain Chance",
        sunrise: "Sunrise",
        sunset: "Sunset",
        windDirection: "Wind Direction",
        uvIndex: "UV Index",
        tempTrend: "Temperature Trend (Next 12h)",
        rainTrend: "Rain Chance Trend (Next 12h)",
        next10Hours: "Next 10 Hours",
        next7Days: "Next 7 Days",
        searchPlaceholder: "Enter city name...",
        searchButton: "Search"
    },

    fi: {
        todaySummary: "Päivän yhteenveto",
        feelsLike: "Tuntuu kuin",
        humidity: "Kosteus",
        wind: "Tuuli",
        rainChance: "Sateen todennäköisyys",
        sunrise: "Auringonnousu",
        sunset: "Auringonlasku",
        windDirection: "Tuulen suunta",
        uvIndex: "UV-indeksi",
        tempTrend: "Lämpötilatrendi (12h)",
        rainTrend: "Sateen todennäköisyys (12h)",
        next10Hours: "Seuraavat 10 tuntia",
        next7Days: "Seuraavat 7 päivää",
        searchPlaceholder: "Syötä kaupungin nimi...",
        searchButton: "Hae"
    }
};

// =========================
//  CONDITION TRANSLATION
// =========================

const CONDITION_FI = {
    "Sunny": "Aurinkoista",
    "Clear": "Selkeää",
    "Partly cloudy": "Puolipilvistä",
    "Cloudy": "Pilvistä",
    "Overcast": "Ylipilvistä",
    "Mist": "Utuista",
    "Fog": "Sumuista",
    "Patchy rain possible": "Mahdollisesti sadetta",
    "Light rain": "Kevyttä sadetta",
    "Moderate rain": "Kohtalaista sadetta",
    "Heavy rain": "Voimakasta sadetta",
    "Light snow": "Kevyttä lunta",
    "Moderate snow": "Kohtalaista lunta",
    "Heavy snow": "Voimakasta lunta",
    "Patchy snow possible": "Mahdollisesti lunta",
    "Thundery outbreaks possible": "Mahdollisia ukkoskuuroja",
    "Blizzard": "Lumimyrsky",
    "Freezing fog": "Jäätävää sumua",
    "Ice pellets": "Jäätihkua",
    "Light sleet": "Kevyttä räntää",
    "Moderate or heavy sleet": "Voimakasta räntää"
};

function translateCondition(text) {
    if (currentLang === "fi") {
        return CONDITION_FI[text] || text;
    }
    return text;
}

// =========================
//  APPLY LANGUAGE
// =========================

function applyLanguage() {
    const t = LANG[currentLang];

    document.querySelector("h3").textContent = t.todaySummary;

    document.getElementById("sumFeels").previousElementSibling.textContent = t.feelsLike + ":";
    document.getElementById("sumHumidity").previousElementSibling.textContent = t.humidity + ":";
    document.getElementById("sumWind").previousElementSibling.textContent = t.wind + ":";
    document.getElementById("sumRain").previousElementSibling.textContent = t.rainChance + ":";
    document.getElementById("sumSunrise").previousElementSibling.textContent = t.sunrise + ":";
    document.getElementById("sumSunset").previousElementSibling.textContent = t.sunset + ":";

    document.querySelector(".summary-card h3:nth-of-type(2)").textContent = t.windDirection;
    document.querySelector(".summary-card h3:nth-of-type(3)").textContent = t.uvIndex;

    document.querySelector('#cityInput').placeholder = t.searchPlaceholder;
    document.querySelector('.search-container button').textContent = t.searchButton;

    document.querySelectorAll(".chart-card h3")[0].textContent = t.tempTrend;
    document.querySelectorAll(".chart-card h3")[1].textContent = t.rainTrend;

    document.querySelectorAll(".section-title")[0].textContent = t.next10Hours;
    document.querySelectorAll(".section-title")[1].textContent = t.next7Days;
}

function toggleLanguage() {
    currentLang = currentLang === "en" ? "fi" : "en";
    applyLanguage();
    if (window.lastWeatherData) renderWeather(window.lastWeatherData);
}

// =========================
//  FETCH WEATHER
// =========================

const API_URL = "https://weather-backend-production-0667.up.railway.app/api/weather?q=";

async function fetchWeather() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) return;

    const res = await fetch(API_URL + city);
    const data = await res.json();

    window.lastWeatherData = data;
    renderWeather(data);
}

// =========================
//  RENDER WEATHER
// =========================

function renderWeather(data) {
    const current = data.current;
    const hours = data.next12Hours;
    const days = data.next7Days;

    // HERO
    document.getElementById("currentTemp").textContent = `${current.temp}°C`;
    document.getElementById("currentCondition").innerHTML =
        `<img class="animated-icon" src="https:${current.icon}" alt="">${translateCondition(current.condition)}`;
    document.getElementById("currentFeels").textContent = `${current.feels_like}°C`;
    document.getElementById("currentHumidity").textContent = `${current.humidity}%`;

    // NEXT 2 HOURS
    const next2 = document.getElementById("next2Hours");
    next2.innerHTML = "";
    hours.slice(0, 2).forEach(h => {
        next2.innerHTML += `
            <div class="hour-card">
                <div>${h.time}</div>
                <div>${h.temp}°C</div>
                <div>${translateCondition(h.condition)}</div>
                <div>Feels like ${h.feels_like}°C · ${h.humidity}%</div>
            </div>
        `;
    });

    // NEXT 10 HOURS
    const next10 = document.getElementById("next10Hours");
    next10.innerHTML = "";
    hours.forEach(h => {
        next10.innerHTML += `
            <div class="hour-scroll-card">
                <div>${h.time}</div>
                <div>${h.temp}°C</div>
                <div style="font-size:13px">${translateCondition(h.condition)}</div>
                <div style="font-size:12px">Feels like ${h.feels_like}°C</div>
            </div>
        `;
    });

    // WEEKLY FORECAST
    const week = document.getElementById("weeklyForecast");
    week.innerHTML = "";
    days.forEach(d => {
        week.innerHTML += `
            <div class="day-card">
                <div>${d.date}</div>
                <div>${translateCondition(d.condition)}</div>
                <div>${d.max}°C / ${d.min}°C</div>
            </div>
        `;
    });
}

// =========================
//  INIT
// =========================

window.addEventListener("DOMContentLoaded", applyLanguage);
