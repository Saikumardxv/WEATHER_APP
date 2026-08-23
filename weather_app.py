import os
import queue
import threading
import tkinter as tk
from datetime import datetime
from tkinter import messagebox, ttk

import requests

BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
COLORS = {
    "background": "#eef3f5",
    "navy": "#172b3a",
    "teal": "#287f83",
    "teal_dark": "#1e6468",
    "muted": "#667983",
    "white": "#ffffff",
    "line": "#d6e0e3",
    "orange": "#ee8b32",
}

result_queue = queue.Queue()
loading_job = None
last_city = ""

WEATHER_ICONS = {
    "clear": "☀",
    "clouds": "☁",
    "rain": "☂",
    "drizzle": "☂",
    "thunderstorm": "ϟ",
    "snow": "❄",
    "mist": "≋",
    "fog": "≋",
    "haze": "≋",
}


def fetch_weather(city, api_key):
    try:
        response = requests.get(
            BASE_URL,
            params={"q": city, "appid": api_key, "units": "metric"},
            timeout=10,
        )
        if response.status_code == 400:
            raise ValueError("Please enter a valid city name.")
        if response.status_code == 404:
            raise ValueError("City not found. Try a nearby city name.")
        if response.status_code == 401:
            raise ValueError("Invalid API key. Check your OpenWeatherMap key.")
        if response.status_code == 429:
            raise ValueError("API request limit reached. Try again later.")
        if response.status_code >= 500:
            raise ValueError("Weather service is unavailable. Try again later.")
        response.raise_for_status()
        data = response.json()
        result_queue.put(("success", data))
    except requests.exceptions.ConnectionError:
        result_queue.put(("error", "No internet connection."))
    except requests.exceptions.Timeout:
        result_queue.put(("error", "Request timed out. Try again."))
    except (requests.exceptions.RequestException, ValueError) as error:
        result_queue.put(("error", str(error)))
    except (KeyError, IndexError, TypeError):
        result_queue.put(("error", "Unexpected data from the weather service."))


def get_weather(event=None):
    global last_city
    city = city_entry.get().strip()
    api_key = os.getenv("OPENWEATHER_API_KEY", "").strip()
    if not city:
        set_status("Enter a city to begin your search.", "error")
        city_entry.focus_set()
        return
    if not api_key or api_key.lower() in {"your_actual_key_here", "your_api_key"}:
        set_status("Add a valid OPENWEATHER_API_KEY first.", "error")
        messagebox.showerror(
            "Configuration error",
            "Set OPENWEATHER_API_KEY to your real OpenWeatherMap API key.",
        )
        return

    search_button.configure(state="disabled")
    last_city = city
    set_status("Checking the latest conditions", "loading")
    animate_loading()
    threading.Thread(
        target=fetch_weather,
        args=(city, api_key),
        daemon=True,
    ).start()
    root.after(100, check_result)


def check_result():
    try:
        result_type, result = result_queue.get_nowait()
    except queue.Empty:
        root.after(100, check_result)
        return
    stop_loading()
    search_button.configure(state="normal")
    if result_type == "error":
        set_status(result, "error")
        messagebox.showerror("Weather request", result)
        return
    show_weather(result)


def show_weather(data):
    main_data = data["main"]
    weather_data = data["weather"][0]
    weather_icon_label.configure(
        text=WEATHER_ICONS.get(weather_data["main"].lower(), "•")
    )
    location_label.configure(text=f"{data['name']}, {data['sys']['country']}")
    condition_label.configure(text=weather_data["description"].title())
    temperature_label.configure(text=f"{round(main_data['temp'])}°")
    metric_values["Feels like"].configure(text=f"{round(main_data['feels_like'])} °C")
    metric_values["Humidity"].configure(text=f"{main_data['humidity']}%")
    metric_values["Wind speed"].configure(text=f"{data['wind']['speed']} m/s")
    metric_values["Pressure"].configure(text=f"{main_data['pressure']} hPa")
    result_panel.pack(fill="x", pady=(22, 0))
    set_status("Updated just now", "success")


def refresh_weather():
    if last_city:
        city_entry.delete(0, tk.END)
        city_entry.insert(0, last_city)
        get_weather()
    else:
        get_weather()


def choose_city(city):
    city_entry.delete(0, tk.END)
    city_entry.insert(0, city)
    get_weather()


def update_clock():
    clock_label.configure(text=datetime.now().strftime("%A  %d %b  •  %H:%M"))
    root.after(1000, update_clock)


def clear_weather():
    city_entry.delete(0, tk.END)
    result_panel.pack_forget()
    set_status("Ready for a new city", "normal")
    city_entry.focus_set()


def set_status(text, state):
    status_label.configure(text=text)
    status_label.configure(foreground={
        "error": "#c45151",
        "loading": COLORS["orange"],
        "success": COLORS["teal_dark"],
    }.get(state, COLORS["muted"]))


def animate_loading(step=0):
    global loading_job
    if search_button["state"] != "disabled":
        return
    set_status("Checking the latest conditions" + "." * (step % 4), "loading")
    loading_job = root.after(350, animate_loading, step + 1)


def stop_loading():
    global loading_job
    if loading_job:
        root.after_cancel(loading_job)
        loading_job = None


root = tk.Tk()
root.title("Weather App")
root.geometry("620x790")
root.minsize(540, 680)
root.configure(bg=COLORS["background"])

style = ttk.Style(root)
style.theme_use("clam")
style.configure("Card.TFrame", background=COLORS["white"])
style.configure(
    "Search.TEntry", padding=12, fieldbackground=COLORS["white"],
    foreground=COLORS["navy"], insertcolor=COLORS["navy"],
)
style.configure(
    "Search.TButton",
    background=COLORS["teal"],
    foreground=COLORS["white"],
    font=("Segoe UI", 11, "bold"),
    padding=(18, 12),
    borderwidth=0,
)
style.map("Search.TButton", background=[("active", COLORS["teal_dark"])])
style.configure(
    "Clear.TButton",
    background=COLORS["white"],
    foreground=COLORS["muted"],
    font=("Segoe UI", 10),
    padding=(12, 8),
    borderwidth=1,
)
style.configure(
    "Quick.TButton",
    background=COLORS["white"],
    foreground=COLORS["muted"],
    font=("Segoe UI", 9),
    padding=(8, 5),
    borderwidth=1,
)
style.map("Quick.TButton", foreground=[("active", COLORS["white"])])

content = tk.Frame(root, bg=COLORS["background"])
content.pack(fill="both", expand=True, padx=36, pady=30)

top_bar = tk.Frame(content, bg=COLORS["background"])
top_bar.pack(fill="x", pady=(0, 22))
tk.Label(
    top_bar, text="LIVE WEATHER", bg=COLORS["background"],
    fg=COLORS["teal_dark"], font=("Segoe UI", 9, "bold"),
).pack(side="left")
clock_label = tk.Label(
    top_bar, text="", bg=COLORS["background"], fg=COLORS["muted"],
    font=("Segoe UI", 9),
)
clock_label.pack(side="right")

tk.Label(
    content, text="WEATHER / NOW", bg=COLORS["background"],
    fg=COLORS["teal_dark"], font=("Segoe UI", 10, "bold"),
).pack(anchor="w")
tk.Label(
    content, text="Forecast at a glance", bg=COLORS["background"],
    fg=COLORS["navy"], font=("Segoe UI", 28, "bold"),
).pack(anchor="w", pady=(4, 2))
tk.Label(
    content, text="Live conditions for any city around the world.",
    bg=COLORS["background"], fg=COLORS["muted"], font=("Segoe UI", 11),
).pack(anchor="w", pady=(0, 24))

search_row = tk.Frame(content, bg=COLORS["background"])
search_row.pack(fill="x")
city_entry = ttk.Entry(search_row, style="Search.TEntry", font=("Segoe UI", 13))
city_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
city_entry.insert(0, "London")
city_entry.bind("<Return>", get_weather)
city_entry.bind("<Escape>", lambda event: clear_weather())
search_button = ttk.Button(
    search_row, text="Search", style="Search.TButton", command=get_weather,
)
search_button.pack(side="right")

quick_row = tk.Frame(content, bg=COLORS["background"])
quick_row.pack(fill="x", pady=(13, 0))
tk.Label(
    quick_row, text="QUICK SEARCH", bg=COLORS["background"],
    fg=COLORS["muted"], font=("Segoe UI", 8, "bold"),
).pack(side="left", padx=(0, 10))
for quick_city in ("London", "New York", "Tokyo", "Sydney"):
    ttk.Button(
        quick_row, text=quick_city,
        style="Quick.TButton",
        command=lambda city=quick_city: choose_city(city),
    ).pack(side="left", padx=(0, 6))

status_label = tk.Label(
    content, text="Ready for a new city", bg=COLORS["background"],
    fg=COLORS["muted"], font=("Segoe UI", 10),
)
status_label.pack(anchor="w", pady=(10, 0))

result_panel = ttk.Frame(content, style="Card.TFrame", padding=24)
weather_icon_label = tk.Label(
    result_panel, text="", bg=COLORS["white"], fg=COLORS["orange"],
    font=("Segoe UI Symbol", 40),
)
weather_icon_label.pack(anchor="w", pady=(0, 2))
location_label = tk.Label(
    result_panel, text="", bg=COLORS["white"], fg=COLORS["navy"],
    font=("Segoe UI", 21, "bold"),
)
location_label.pack(anchor="w")
condition_label = tk.Label(
    result_panel, text="", bg=COLORS["white"], fg=COLORS["muted"],
    font=("Segoe UI", 11),
)
condition_label.pack(anchor="w", pady=(2, 14))
temperature_label = tk.Label(
    result_panel, text="", bg=COLORS["white"], fg=COLORS["orange"],
    font=("Segoe UI", 54, "bold"),
)
temperature_label.pack(anchor="w")

metrics_frame = tk.Frame(result_panel, bg=COLORS["white"])
metrics_frame.pack(fill="x", pady=(20, 0))
metric_values = {}
for index, (name, value) in enumerate([
    ("Feels like", "--"), ("Humidity", "--"),
    ("Wind speed", "--"), ("Pressure", "--"),
]):
    row, column = divmod(index, 2)
    tile = tk.Frame(metrics_frame, bg="#f3f7f7", padx=14, pady=11,
                    height=66)
    tile.grid(row=row, column=column, sticky="nsew",
              padx=(0, 7) if column == 0 else (7, 0),
              pady=(0, 7) if row == 0 else (7, 0))
    tile.grid_propagate(False)
    metrics_frame.columnconfigure(column, weight=1, uniform="metric")
    tk.Label(tile, text=name.upper(), bg="#f3f7f7", fg=COLORS["muted"],
             font=("Segoe UI", 8, "bold")).pack(anchor="w")
    metric_values[name] = tk.Label(tile, text=value, bg="#f3f7f7",
                                   fg=COLORS["navy"], font=("Segoe UI", 11, "bold"))
    metric_values[name].pack(anchor="w", pady=(4, 0))

actions = tk.Frame(content, bg=COLORS["background"])
actions.pack(fill="x", pady=(16, 0))
ttk.Button(actions, text="Refresh", style="Clear.TButton", command=refresh_weather).pack(side="right", padx=(6, 0))
ttk.Button(actions, text="Clear", style="Clear.TButton", command=clear_weather).pack(side="right")
tk.Label(
    actions, text="Metric units • OpenWeatherMap", bg=COLORS["background"],
    fg=COLORS["muted"], font=("Segoe UI", 9),
).pack(side="left")

update_clock()
root.mainloop()
