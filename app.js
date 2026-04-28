const API_URL = "https://weather-backend-production-0667.up.railway.app/api/weather?q=";

// AUTO-DETECT LOCATION ON LOAD
window.addEventListener("DOMContentLoaded", () => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const query = `${latitude},${longitude}`;
                await fetchAndRender(API_URL + encodeURIComponent(query));
            },
            () => {
                console.warn("Geolocation denied. Waiting for manual search.");
            }
        );
    }
});

// MAIN SEARCH
async function getWeather() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) return;
    await fetchAndRender(API_URL + encodeURIComponent(city));
}

// FETCH + RENDER
async function fetchAndRender(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();

        const current = data.next12Hours[0];

        updateHero(data, current);
        updateTodaySummary(current, data.astro);
        updateWindCompass(current.wind_dir);
        updateUV(data.location.localtime, current);

        updateHourly(data.next12Hours);
        updateWeekly(data.next7Days);
        updateSunArc(data.location.localtime, data.astro.sunrise, data.astro.sunset);
        updateTempChart(data.next12Hours);
        updateRainChart(data.next12Hours);

    } catch (err) {
        console.error("Weather fetch error:", err);
    }
}

//
// HERO SECTION
//
function updateHero(data, current) {
    const hero = document.getElementById("heroSection");

    document.getElementById("locationName").textContent =
        `${data.location.name}, ${data.location.country}`;

    document.getElementById("currentTemp").textContent =
        `${current.temp}°C`;

    document.getElementById("currentCondition").innerHTML =
        `<img class="animated-icon" src="https:${current.icon}" alt="">${current.condition}`;

    document.getElementById("heroExtra").textContent =
        `Feels like ${current.feels_like}°C • Humidity ${current.humidity}%`;

    hero.classList.add("visible");
}

//
// TODAY SUMMARY
//
function updateTodaySummary(current, astro) {
    document.getElementById("sumFeels").textContent = `${current.feels_like}°C`;
    document.getElementById("sumHumidity").textContent = `${current.humidity}%`;
    document.getElementById("sumWind").textContent = `${current.wind_kph} kph`;
    document.getElementById("sumRain").textContent = `${current.rain_chance}%`;
    document.getElementById("sumSunrise").textContent = astro.sunrise;
    document.getElementById("sumSunset").textContent = astro.sunset;
}

//
// WIND COMPASS
//
function updateWindCompass(dir) {
    const needle = document.getElementById("windNeedle");

    const map = {
        N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
        E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
        S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
        W: 270, WNW: 292.5, NW: 315, NNW: 337.5
    };

    const angle = map[dir] ?? 0;
    needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
}

//
// UV INDEX (APPROXIMATION)
//
function updateUV(localtime, current) {
    const uv = estimateUV(localtime, current.rain_chance, current.condition);
    const pointer = document.getElementById("uvPointer");
    const uvText = document.getElementById("uvText");

    const maxUV = 11;
    const percent = Math.min(uv / maxUV, 1);
    pointer.style.left = `${percent * 100}%`;
    uvText.textContent = `UV: ${uv}`;
}

// Approximate UV based on time of day + rain chance + condition
function estimateUV(localtime, rainChance, condition) {
    // localtime: "YYYY-MM-DD HH:MM"
    const timePart = localtime.split(" ")[1];
    const [hourStr, minuteStr] = timePart.split(":");
    const hour = parseInt(hourStr, 10) + parseInt(minuteStr, 10) / 60;

    // Peak around 13:00, fade towards morning/evening
    let t = 1 - Math.abs(hour - 13) / 6; // 13±6 => 7..19
    t = Math.max(0, Math.min(1, t));

    // Cloud / rain factor
    let cloudFactor = 1 - (rainChance / 100) * 0.6;
    const condLower = condition.toLowerCase();
    if (condLower.includes("cloud")) cloudFactor *= 0.8;
    if (condLower.includes("rain")) cloudFactor *= 0.6;

    const uvRaw = 11 * t * cloudFactor;
    const uv = Math.round(Math.max(0, Math.min(11, uvRaw)));
    return uv;
}

//
// HOURLY FORECAST
//
function updateHourly(hours) {
    const container = document.getElementById("hourlyForecast");
    container.innerHTML = "";

    hours.forEach(h => {
        const card = document.createElement("div");
        card.className = "hour-card";

        card.innerHTML = `
            <div>${formatHour(h.time)}</div>
            <img src="https:${h.icon}" alt="">
            <div>${h.temp}°C</div>
            <div style="font-size:12px;opacity:0.8">${h.condition}</div>
        `;

        container.appendChild(card);
    });
}

//
// WEEKLY FORECAST
//
function updateWeekly(days) {
    const grid = document.getElementById("weeklyForecast");
    grid.innerHTML = "";

    days.forEach(d => {
        const card = document.createElement("div");
        card.className = "day-card";

        card.innerHTML = `
            <div>${d.date}</div>
            <img src="https:${d.icon}" alt="">
            <div>${d.condition}</div>
            <div><strong>${d.max}°C</strong> / ${d.min}°C</div>
        `;

        grid.appendChild(card);
    });
}

//
// SUNRISE / SUNSET ARC
//
function updateSunArc(localtime, sunriseStr, sunsetStr) {
    const canvas = document.getElementById("sunArcCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!localtime || !sunriseStr || !sunsetStr) return;

    const sunrise = parseSunTime(localtime, sunriseStr);
    const sunset = parseSunTime(localtime, sunsetStr);
    const now = new Date(localtime.replace(" ", "T"));

    document.getElementById("sunTimesText").textContent =
        `Sunrise ${sunriseStr} • Sunset ${sunsetStr}`;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h * 0.9;
    const r = Math.min(w, h) * 0.8 / 2;

    // Base arc
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 4;
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
    ctx.stroke();

    // Sun position
    const total = sunset - sunrise;
    const elapsed = Math.min(Math.max(now - sunrise, 0), total);
    const t = total > 0 ? elapsed / total : 0.5;

    const angle = Math.PI + t * Math.PI;
    const sunX = cx + r * Math.cos(angle);
    const sunY = cy + r * Math.sin(angle);

    ctx.beginPath();
    ctx.fillStyle = "#FFD54F";
    ctx.arc(sunX, sunY, 8, 0, 2 * Math.PI);
    ctx.fill();
}

function parseSunTime(localtime, hm) {
    // localtime: "YYYY-MM-DD HH:MM", hm: "05:27 AM"
    const [datePart] = localtime.split(" ");
    const iso = `${datePart} ${hm}`;
    return new Date(iso.replace(" ", "T"));
}

//
// TEMPERATURE TREND CHART
//
function updateTempChart(hours) {
    const canvas = document.getElementById("tempChart");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const temps = hours.map(h => h.temp);
    drawLineChart(ctx, canvas, temps, "#FFEB3B");
}

//
// RAIN CHANCE TREND CHART
//
function updateRainChart(hours) {
    const canvas = document.getElementById("rainChart");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rain = hours.map(h => h.rain_chance);
    drawLineChart(ctx, canvas, rain, "#80DEEA");
}

//
// GENERIC LINE CHART
//
function drawLineChart(ctx, canvas, values, color) {
    if (!values.length) return;

    const w = canvas.width;
    const h = canvas.height;
    const pad = 20;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const step = (w - pad * 2) / (values.length - 1);

    // Axis
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    // Line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    values.forEach((v, i) => {
        const x = pad + i * step;
        const y = h - pad - ((v - min) / range) * (h - pad * 2);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();
}

//
// HELPERS
//
function formatHour(t) {
    return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
