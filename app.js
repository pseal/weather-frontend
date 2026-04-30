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

        const hours = data.next12Hours || [];
        if (!hours.length) return;

        const current = hours[0];
        const next3 = hours.slice(0, 3);
        const next9 = hours.slice(3, 12);

        updateHero(data, current);
        updateTodaySummary(current, data.astro);
        updateWindCompass(current.wind_dir);
        updateUV(data.location.localtime, current);

        updateNext3Hours(next3);
        updateNext9Hours(next9);

        updateTempChart(hours);
        updateRainChart(hours);
        updateWeekly(data.next7Days || []);

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

function estimateUV(localtime, rainChance, condition) {
    const timePart = localtime.split(" ")[1];
    const [hourStr, minuteStr] = timePart.split(":");
    const hour = parseInt(hourStr, 10) + parseInt(minuteStr, 10) / 60;

    let t = 1 - Math.abs(hour - 13) / 6;
    t = Math.max(0, Math.min(1, t));

    let cloudFactor = 1 - (rainChance / 100) * 0.6;
    const condLower = condition.toLowerCase();
    if (condLower.includes("cloud")) cloudFactor *= 0.8;
    if (condLower.includes("rain")) cloudFactor *= 0.6;

    const uvRaw = 11 * t * cloudFactor;
    return Math.round(Math.max(0, Math.min(11, uvRaw)));
}

//
// NEXT 3 HOURS
//
function updateNext3Hours(hours) {
    const container = document.getElementById("next3Hours");
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
// NEXT 9 HOURS
//
function updateNext9Hours(hours) {
    const container = document.getElementById("next9Hours");
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
// NEXT 7 DAYS
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
// TEMPERATURE TREND CHART (NEXT 12H)
//
function updateTempChart(hours) {
    const canvas = document.getElementById("tempChart");
    const ctx = canvas.getContext("2d");
    const temps = hours.map(h => h.temp);
    const labels = hours.map(h => h.time);

    drawLineChart(ctx, canvas, temps, labels, "#FFEB3B", "°C");
}

//
// RAIN CHANCE TREND CHART (NEXT 12H)
//
function updateRainChart(hours) {
    const canvas = document.getElementById("rainChart");
    const ctx = canvas.getContext("2d");
    const rain = hours.map(h => h.rain_chance);
    const labels = hours.map(h => h.time);

    drawLineChart(ctx, canvas, rain, labels, "#80DEEA", "%");
}

//
// GENERIC LINE CHART
//
function drawLineChart(ctx, canvas, values, labels, color, yLabel) {
    if (!values.length) return;

    const w = canvas.width;
    const h = canvas.height;
    const pad = 35;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const step = (w - pad * 2) / (values.length - 1);

    ctx.clearRect(0, 0, w, h);

    // Y-axis label
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(yLabel, 5, 15);

    // X-axis label
    ctx.fillText("Time →", w - 70, h - 5);

    // Axis line
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    // Y-axis ticks
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "11px Arial";

    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
        const t = i / ticks;
        const value = min + t * range;
        const y = h - pad - t * (h - pad * 2);

        ctx.fillText(value.toFixed(1), 5, y + 3);

        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
    }

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

    // X-axis time labels
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "11px Arial";

    labels.forEach((t, i) => {
        if (i % 3 === 0 || i === labels.length - 1) {
            const x = pad + i * step;
            ctx.fillText(formatHourShort(t), x - 14, h - pad + 15);
        }
    });
}

//
// HELPERS
//
function formatHour(t) {
    return new Date(t.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHourShort(t) {
    return new Date(t.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit" });
}
