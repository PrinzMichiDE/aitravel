import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;
  const key = process.env.PIXABAY_KEY;
  if (!key) {
    return res.status(500).json({ error: 'PIXABAY_KEY fehlt.' });
  }
  if (!q) {
    return res.status(400).json({ error: 'Suchbegriff (q) erforderlich.' });
  }
  try {
    const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(q as string)}&image_type=photo&per_page=8&lang=de`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Fehler beim Abrufen der Pixabay-Bilder.' });
    }
    const data = await response.json();
    const images = data.hits.map((img: any) => img.webformatURL).filter(Boolean);
    res.status(200).json({ images });
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
} 