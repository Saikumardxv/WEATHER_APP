const elements = {
  form: document.querySelector("#search-form"),
  input: document.querySelector("#city-input"),
  search: document.querySelector(".primary-button"),
  history: document.querySelector("#search-history"),
  clearInputBtn: document.querySelector("#clear-input-btn"),
  status: document.querySelector("#status"),
  panel: document.querySelector("#result-panel"),
  clock: document.querySelector("#clock"),
  themeToggle: document.querySelector("#theme-toggle"),
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
  clear: "☀️", clouds: "☁️", rain: "🌧️", drizzle: "🌦️",
  thunderstorm: "⛈️", snow: "❄️", mist: "🌫️", fog: "🌫️", haze: "🌫️",
  smoke: "🌫️", dust: "🌫️", sand: "🌫️", ash: "🌋", squall: "💨", tornado: "🌪️",
};
let loadingTimer = null;
let lastCity = "";
const SEARCH_HISTORY_KEY = "weather-search-history";

function getSearchHistory() {
  try {
    const savedHistory = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
    return Array.isArray(savedHistory) ? savedHistory.filter(Boolean).slice(0, 6) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(city) {
  const trimmedCity = city.trim();
  if (!trimmedCity) return;

  const history = getSearchHistory().filter((item) => item.toLowerCase() !== trimmedCity.toLowerCase());
  history.unshift(trimmedCity);
  const nextHistory = history.slice(0, 6);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
  renderSearchHistory(elements.input.value);
}

function renderSearchHistory(query = "") {
  const list = getSearchHistory().filter((item) => item.toLowerCase().includes(query.trim().toLowerCase()));

  if (!list.length) {
    elements.history.innerHTML = "";
    elements.history.hidden = true;
    return;
  }

  elements.history.innerHTML = list
    .map((item) => `<button type="button" class="search-history-item" data-city="${item}">${item}</button>`)
    .join("");
  elements.history.hidden = false;

  elements.history.querySelectorAll(".search-history-item").forEach((button) => {
    button.addEventListener("click", () => {
      elements.input.value = button.dataset.city;
      elements.history.hidden = true;
      getWeather(button.dataset.city);
    });
  });
}

function setStatus(message, state = "") {
  elements.status.textContent = message;
  elements.status.className = `status ${state}`;
}

function startLoadingAnimation() {
  let dots = 0;
  const base = "Checking the latest conditions";
  if (loadingTimer) clearInterval(loadingTimer);
  loadingTimer = setInterval(() => {
    dots = (dots + 1) % 4;
    elements.status.textContent = base + ".".repeat(dots);
  }, 350);
}

function stopLoadingAnimation() {
  if (loadingTimer) {
    clearInterval(loadingTimer);
    loadingTimer = null;
  }
}

function updateClock() {
  elements.clock.textContent = new Intl.DateTimeFormat("en", {
    weekday: "long", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date()).replace(",", "  /");
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("theme-light", isLight);
  elements.themeToggle.setAttribute("aria-pressed", String(isLight));
  elements.themeToggle.querySelector(".theme-toggle-text").textContent = isLight ? "White" : "Black";
  localStorage.setItem("weather-theme", theme);
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains("theme-light") ? "light" : "dark";
  applyTheme(currentTheme === "light" ? "dark" : "light");
}

function showWeather(data) {
  const weather = data.weather[0];
  const main = data.main;
  const iconKey = weather.main.toLowerCase();
  elements.icon.textContent = weatherIcons[iconKey] || "🌡️";
  elements.location.textContent = `${data.name}, ${data.sys.country}`;
  elements.condition.textContent = weather.description.replace(/^./, (letter) => letter.toUpperCase());
  elements.temperature.textContent = `${Math.round(main.temp)}°`;
  elements.feelsLike.textContent = `${Math.round(main.feels_like)}°C`;
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
  saveSearchHistory(trimmedCity);
  elements.search.disabled = true;
  setStatus("Checking the latest conditions", "loading");
  startLoadingAnimation();
  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(trimmedCity)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Weather request failed.");
    showWeather(payload);
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    stopLoadingAnimation();
    elements.search.disabled = false;
  }
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  getWeather(elements.input.value);
});
elements.input.addEventListener("input", () => {
  elements.clearInputBtn.hidden = elements.input.value.length === 0;
  renderSearchHistory(elements.input.value);
});
elements.input.addEventListener("focus", () => {
  elements.clearInputBtn.hidden = elements.input.value.length === 0;
  renderSearchHistory(elements.input.value);
});
elements.clearInputBtn.addEventListener("click", () => {
  elements.input.value = "";
  elements.clearInputBtn.hidden = true;
  elements.history.hidden = true;
  elements.input.focus();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest("#city-input") && !event.target.closest("#search-history") && !event.target.closest("#clear-input-btn")) {
    elements.history.hidden = true;
  }
});
document.querySelectorAll("[data-city]").forEach((button) => {
  button.addEventListener("click", () => {
    elements.input.value = button.dataset.city;
    getWeather(button.dataset.city);
  });
});
elements.themeToggle.addEventListener("click", toggleTheme);
document.querySelector("#refresh-button").addEventListener("click", () => getWeather(lastCity || elements.input.value));
document.querySelector("#clear-button").addEventListener("click", () => {
  elements.input.value = "";
  elements.history.hidden = true;
  elements.panel.hidden = true;
  lastCity = "";
  setStatus("Ready for a new city");
  elements.input.focus();
});
const savedTheme = localStorage.getItem("weather-theme") || "dark";
applyTheme(savedTheme);
renderSearchHistory(elements.input.value);
elements.clearInputBtn.hidden = elements.input.value.length === 0;
updateClock();
setInterval(updateClock, 1000);
