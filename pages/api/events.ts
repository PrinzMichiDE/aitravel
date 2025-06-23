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

// Hilfsfunktion: Geocoding (Adresse zu lat/lon)
async function geocodeAddress(address: string): Promise<{ lat: number, lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'aitravel/1.0' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data[0]) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

// Meetup Provider
async function fetchMeetupEvents(params: any): Promise<Event[]> {
  const apiKey = process.env.MEETUP_API_KEY;
  if (!apiKey) return [];
  const { q, origin, radius } = params;
  const address = origin && typeof origin === 'string' && origin.trim() !== '' ? origin : `Hauptbahnhof ${q}`;
  const geo = await geocodeAddress(address);
  if (!geo) return [];
  // Meetup erwartet Radius in Meilen
  const radiusMiles = radius && typeof radius === 'string' && radius.trim() !== '' ? (parseFloat(radius) * 0.621371).toFixed(1) : '18.6'; // 30km ≈ 18.6mi
  const url = `https://api.meetup.com/find/upcoming_events?key=${apiKey}&sign=true&lon=${geo.lon}&lat=${geo.lat}&radius=${radiusMiles}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.events || []).map((ev: any) => ({
    id: 'mu-' + ev.id,
    provider: 'meetup',
    name: ev.name,
    url: ev.link,
    start: ev.local_date + 'T' + ev.local_time,
    end: '',
    image: ev.featured_photo?.photo_link,
    description: ev.description,
    venue: ev.venue?.name || ev.group?.name
  }));
}

// Ticketmaster Provider
async function fetchTicketmasterEvents(params: any): Promise<Event[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return [];
  const { q, origin, radius } = params;
  // Stadtname aus origin extrahieren (einfach: alles nach letztem Komma, sonst q)
  let city = q;
  if (origin && typeof origin === 'string' && origin.includes(',')) {
    const parts = origin.split(',');
    city = parts[parts.length - 1].trim();
  }
  const within = radius && typeof radius === 'string' && radius.trim() !== '' ? radius : '30';
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=${encodeURIComponent(city)}&radius=${within}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const events = (data._embedded?.events || []).map((ev: any) => ({
    id: 'tm-' + ev.id,
    provider: 'ticketmaster',
    name: ev.name,
    url: ev.url,
    start: ev.dates?.start?.dateTime || '',
    end: '',
    image: ev.images?.[0]?.url,
    description: ev.info || ev.description,
    venue: ev._embedded?.venues?.[0]?.name
  }));
  return events;
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