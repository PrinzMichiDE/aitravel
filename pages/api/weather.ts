import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude und Longitude sind erforderlich.' });
  }
  const weatherApiKey = process.env.WEATHERAPI_KEY;
  const openWeatherKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!weatherApiKey && !openWeatherKey) {
    return res.status(500).json({ error: 'WeatherAPI- oder OpenWeatherMap-API-Key fehlt.' });
  }
  try {
    // WeatherAPI (primär)
    if (weatherApiKey) {
      const url = `http://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${lat},${lon}&aqi=no`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Normiertes Format wie OpenWeather
        return res.status(200).json({
          weather: [{
            main: data.current.condition.text,
            description: data.current.condition.text,
            icon: data.current.condition.icon.startsWith('//') ? 'https:' + data.current.condition.icon : data.current.condition.icon
          }],
          main: { temp: data.current.temp_c, humidity: data.current.humidity },
          wind: { speed: data.current.wind_kph / 3.6 },
          name: data.location.name
        });
      }
    }
    // Fallback: OpenWeather
    if (openWeatherKey) {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat as string)}&lon=${encodeURIComponent(lon as string)}&appid=${openWeatherKey}&units=metric&lang=de`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    }
    return res.status(500).json({ error: 'Wetterdaten konnten nicht geladen werden.' });
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
} 