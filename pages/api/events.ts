import type { NextApiRequest, NextApiResponse } from 'next';

// Einheitliches Event-Format
type Event = {
  id: string;
  provider: string;
  name: string;
  url: string;
  start: string;
  end: string;
  image?: string;
  description?: string;
  venue?: string;
};

// Eventbrite Provider
async function fetchEventbriteEvents(params: any): Promise<Event[]> {
  const token = process.env.EVENTBRITE_TOKEN;
  if (!token) return [];
  const { q, origin, radius, start, end } = params;
  const address = origin && typeof origin === 'string' && origin.trim() !== '' ? origin : `Hauptbahnhof ${q}`;
  const within = radius && typeof radius === 'string' && radius.trim() !== '' ? `${radius}km` : '30km';
  let url = `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(address)}&location.within=${encodeURIComponent(within)}&expand=venue,logo&token=${token}`;
  if (start) url += `&start_date.range_start=${encodeURIComponent(start)}`;
  if (end) url += `&start_date.range_end=${encodeURIComponent(end)}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return (data.events || []).map((ev: any) => ({
    id: 'eb-' + ev.id,
    provider: 'eventbrite',
    name: ev.name?.text,
    url: ev.url,
    start: ev.start?.local,
    end: ev.end?.local,
    image: ev.logo?.url,
    description: ev.description?.text,
    venue: ev.venue?.name
  }));
}

// Meetup Provider (Platzhalter)
async function fetchMeetupEvents(params: any): Promise<Event[]> {
  // TODO: API-Key und echte Implementierung
  // const apiKey = process.env.MEETUP_API_KEY;
  // ...
  return [];
}

// Ticketmaster Provider (Platzhalter)
async function fetchTicketmasterEvents(params: any): Promise<Event[]> {
  // TODO: API-Key und echte Implementierung
  // const apiKey = process.env.TICKETMASTER_API_KEY;
  // ...
  return [];
}

// Eventim Provider (Scraping, Platzhalter)
async function fetchEventimEvents(params: any): Promise<Event[]> {
  // TODO: Scraping-Implementierung (Cheerio/Puppeteer)
  return [];
}

const PROVIDERS: Record<string, (params: any) => Promise<Event[]>> = {
  eventbrite: fetchEventbriteEvents,
  meetup: fetchMeetupEvents,
  ticketmaster: fetchTicketmasterEvents,
  eventim: fetchEventimEvents,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q, start, end, origin, radius, provider } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Suchbegriff (q) erforderlich.' });
  }
  // Provider-Auswahl
  let selectedProviders: string[];
  if (!provider || provider === 'all') {
    selectedProviders = Object.keys(PROVIDERS);
  } else if (typeof provider === 'string') {
    selectedProviders = provider.split(',').map(p => p.trim()).filter(p => PROVIDERS[p]);
    if (selectedProviders.length === 0) selectedProviders = Object.keys(PROVIDERS);
  } else {
    selectedProviders = Object.keys(PROVIDERS);
  }
  try {
    // Alle Provider parallel abfragen
    const results = await Promise.all(
      selectedProviders.map(p => PROVIDERS[p]({ q, start, end, origin, radius }))
    );
    // Ergebnisse zusammenführen
    const events = results.flat();
    res.status(200).json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Interner Serverfehler.', details: error instanceof Error ? error.message : String(error) });
  }
} 