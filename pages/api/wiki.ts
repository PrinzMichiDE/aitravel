import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { title } = req.query;
  if (!title) {
    return res.status(400).json({ error: 'Title ist erforderlich.' });
  }
  try {
    const url = `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title as string)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Fehler beim Abrufen der Wikipedia-Daten.' });
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
} 