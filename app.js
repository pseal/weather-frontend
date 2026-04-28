const API_URL = "https://weather-backend-production-0667.up.railway.app/api/weather?q=";

// MAIN FUNCTION
async function getWeather() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) return;

    try {
        const response = await fetch(API_URL + city);
        const data = await response.json();

        updateHero(data);
        updateHourly(data.next12Hours);
        updateWeekly(data.next7Days);

    } catch (error) {
        console.error("Error fetching weather:", error);
    }
}

// HERO SECTION UPDATE
function updateHero(data) {
    document.getElementById("locationName").textContent =
        `${data.location.name}, ${data.location.country}`;

    const current = data.next12Hours[0]; // first hour = current

    document.getElementById("currentTemp").textContent =
        `${current.temp}°C`;

    document.getElementById("currentCondition").textContent =
        `${current.condition}`;
}

// HOURLY FORECAST UPDATE
function updateHourly(hours) {
    const container = document.getElementById("hourlyForecast");
    container.innerHTML = "";

    hours.forEach(hour => {
        const card = document.createElement("div");
        card.className = "hour-card";

        card.innerHTML = `
            <div>${formatHour(hour.time)}</div>
            <img src="https:${hour.icon}" alt="">
            <div>${hour.temp}°C</div>
            <div style="font-size:12px; opacity:0.8;">${hour.condition}</div>
        `;

        container.appendChild(card);
    });
}

// WEEKLY FORECAST UPDATE
function updateWeekly(days) {
    const grid = document.getElementById("weeklyForecast");
    grid.innerHTML = "";

    days.forEach(day => {
        const card = document.createElement("div");
        card.className = "day-card";

        card.innerHTML = `
            <div>${day.date}</div>
            <img src="https:${day.icon}" alt="">
            <div>${day.condition}</div>
            <div><strong>${day.max}°C</strong> / ${day.min}°C</div>
        `;

        grid.appendChild(card);
    });
}

// TIME FORMATTER
function formatHour(timeString) {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
