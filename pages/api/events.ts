import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q, start, end, origin, radius } = req.query;
  const token = process.env.EVENTBRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'EVENTBRITE_TOKEN fehlt.' });
  }
  if (!q) {
    return res.status(400).json({ error: 'Suchbegriff (q) erforderlich.' });
  }
  // Fallbacks
  const address = origin && typeof origin === 'string' && origin.trim() !== '' ? origin : `Hauptbahnhof ${q}`;
  const within = radius && typeof radius === 'string' && radius.trim() !== '' ? `${radius}km` : '30km';
  try {
    let url = `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(address)}&location.within=${encodeURIComponent(within)}&expand=venue,logo&token=${token}`;
    if (start) url += `&start_date.range_start=${encodeURIComponent(start as string)}`;
    if (end) url += `&start_date.range_end=${encodeURIComponent(end as string)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Fehler beim Abrufen der Events.' });
    }
    const data = await response.json();
    const events = (data.events || []).map((ev: any) => ({
      id: ev.id,
      name: ev.name?.text,
      url: ev.url,
      start: ev.start?.local,
      end: ev.end?.local,
      image: ev.logo?.url,
      description: ev.description?.text,
      venue: ev.venue?.name
    }));
    res.status(200).json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Interner Serverfehler.', details: error instanceof Error ? error.message : String(error) });
  }
} 