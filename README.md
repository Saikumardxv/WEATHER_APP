# Weather / Now

A browser-based weather dashboard backed by OpenWeatherMap. The original Tkinter desktop app remains in `weather_app.py`; the Vercel version uses the files in the project root and `api/weather.js`.

## Run locally

The static page needs the Vercel serverless route for weather requests. Install the Vercel CLI, log in, and run:

```powershell
npm install -g vercel
vercel dev
```

Set `OPENWEATHER_API_KEY` when prompted, or add it to a local `.env` file:

```text
OPENWEATHER_API_KEY=your_openweathermap_key
```

Then open the local URL printed by Vercel.

## Deploy on Vercel

1. Import `https://github.com/Saikumardxv/WEATHER_APP` in the Vercel dashboard.
2. Keep the project root as the Root Directory and use the default framework preset.
3. Add `OPENWEATHER_API_KEY` under Project Settings > Environment Variables for Production and Preview.
4. Deploy. Future pushes to `main` deploy automatically.

The API key is read only by `api/weather.js` and is never sent to the browser.