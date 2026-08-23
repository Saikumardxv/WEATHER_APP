export default async function handler(request, response) {
  const city = typeof request.query.city === "string" ? request.query.city.trim() : "";
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!city) return response.status(400).json({ error: "Please enter a city name." });
  if (!apiKey) return response.status(500).json({ error: "Weather service is not configured." });

  try {
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
    );
    const data = await weatherResponse.json();
    if (!weatherResponse.ok) {
      const errors = { 404: "City not found. Try a nearby city name.", 401: "Weather service configuration is invalid.", 429: "API request limit reached. Try again later." };
      return response.status(weatherResponse.status).json({ error: errors[weatherResponse.status] || "Weather service is unavailable." });
    }
    return response.status(200).json(data);
  } catch {
    return response.status(502).json({ error: "Unable to reach the weather service." });
  }
}
