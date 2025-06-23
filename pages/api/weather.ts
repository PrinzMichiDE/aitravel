import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude und Longitude sind erforderlich.' });
  }
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenWeatherMap API-Key fehlt.' });
  }
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat as string)}&lon=${encodeURIComponent(lon as string)}&appid=${apiKey}&units=metric&lang=de`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Fehler beim Abrufen der Wetterdaten.' });
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
} 