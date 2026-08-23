const elements = {
  form: document.querySelector("#search-form"),
  input: document.querySelector("#city-input"),
  search: document.querySelector(".primary-button"),
  status: document.querySelector("#status"),
  panel: document.querySelector("#result-panel"),
  clock: document.querySelector("#clock"),
  icon: document.querySelector("#weather-icon"),
  location: document.querySelector("#location"),
  condition: document.querySelector("#condition"),
  temperature: document.querySelector("#temperature"),
  feelsLike: document.querySelector("#feels-like"),
  humidity: document.querySelector("#humidity"),
  windSpeed: document.querySelector("#wind-speed"),
  pressure: document.querySelector("#pressure"),
};

const weatherIcons = {
  clear: "SUN", clouds: "CLOUD", rain: "RAIN", drizzle: "RAIN",
  thunderstorm: "STORM", snow: "SNOW", mist: "MIST", fog: "MIST", haze: "MIST",
};
let lastCity = "";

function setStatus(message, state = "") {
  elements.status.textContent = message;
  elements.status.className = `status ${state}`;
}

function updateClock() {
  elements.clock.textContent = new Intl.DateTimeFormat("en", {
    weekday: "long", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date()).replace(",", "  /");
}

function showWeather(data) {
  const weather = data.weather[0];
  const main = data.main;
  elements.icon.textContent = weatherIcons[weather.main.toLowerCase()] || "WEATHER";
  elements.location.textContent = `${data.name}, ${data.sys.country}`;
  elements.condition.textContent = weather.description.replace(/^./, (letter) => letter.toUpperCase());
  elements.temperature.textContent = `${Math.round(main.temp)}°`;
  elements.feelsLike.textContent = `${Math.round(main.feels_like)} °C`;
  elements.humidity.textContent = `${main.humidity}%`;
  elements.windSpeed.textContent = `${data.wind.speed} m/s`;
  elements.pressure.textContent = `${main.pressure} hPa`;
  elements.panel.hidden = false;
  setStatus("Updated just now", "success");
}

async function getWeather(city) {
  const trimmedCity = city.trim();
  if (!trimmedCity) {
    setStatus("Enter a city to begin your search.", "error");
    elements.input.focus();
    return;
  }
  lastCity = trimmedCity;
  elements.search.disabled = true;
  setStatus("Checking the latest conditions...", "loading");
  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(trimmedCity)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Weather request failed.");
    showWeather(payload);
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    elements.search.disabled = false;
  }
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  getWeather(elements.input.value);
});
document.querySelectorAll("[data-city]").forEach((button) => {
  button.addEventListener("click", () => {
    elements.input.value = button.dataset.city;
    getWeather(button.dataset.city);
  });
});
document.querySelector("#refresh-button").addEventListener("click", () => getWeather(lastCity || elements.input.value));
document.querySelector("#clear-button").addEventListener("click", () => {
  elements.input.value = "";
  elements.panel.hidden = true;
  lastCity = "";
  setStatus("Ready for a new city");
  elements.input.focus();
});
updateClock();
setInterval(updateClock, 1000);
