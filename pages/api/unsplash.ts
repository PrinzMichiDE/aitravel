import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req;
  const { q } = query;
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return res.status(500).json({ error: 'UNSPLASH_ACCESS_KEY fehlt.' });
  }
  if (!q) {
    return res.status(400).json({ error: 'Suchbegriff (q) erforderlich.' });
  }
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q as string)}&per_page=8&client_id=${accessKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Fehler beim Abrufen der Unsplash-Bilder.' });
    }
    const data = await response.json();
    const images = data.results.map((img: any) => img.urls?.regular).filter(Boolean);
    res.status(200).json({ images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Interner Serverfehler.', details: error instanceof Error ? error.message : String(error) });
  }
} 