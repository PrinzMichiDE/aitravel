'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import LocationInfo from './components/LocationInfo';
import { motion, AnimatePresence } from 'framer-motion';

// Typdefinition für einen Ort
export interface Location {
  name: string;
  lat: number;
  lon: number;
}

// Typdefinition für den gesamten Reiseplan
interface TravelPlan {
  planText: string;
  locations: Location[];
}

const MapDisplay = dynamic(() => import('./components/MapDisplay'), { 
  ssr: false,
  loading: () => <div style={{height: '400px', width: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><p>Karte wird geladen...</p></div>
});

const NotLoggedIn = () => (
  <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md text-center">
    <h2 className="text-2xl font-bold mb-4 text-gray-800">Willkommen beim Intelligenten Reiseführer!</h2>
    <p className="text-gray-600 mb-6">Bitte melden Sie sich an, um Ihren persönlichen Reiseplan zu erstellen.</p>
    <a
      href="/api/auth/login"
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Anmelden
    </a>
  </div>
);

const TravelPlanner = () => {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [interests, setInterests] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [isPlanSaved, setIsPlanSaved] = useState(true);

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlan(null);
    setIsPlanSaved(false);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destination, duration, interests }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ein unbekannter Fehler ist aufgetreten.');
      }

      setPlan(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!plan) return;
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/plan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      setIsPlanSaved(true);
    } catch (err) {
      setError('Fehler beim Speichern des Plans.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Plane deine Traumreise</h2>
        <form onSubmit={handleGenerateSubmit}>
          <div className="mb-4">
            <label htmlFor="destination" className="block text-gray-700 text-sm font-bold mb-2">Reiseziel</label>
            <input id="destination" type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="z.B. Paris, Frankreich" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>
          <div className="mb-4">
            <label htmlFor="duration" className="block text-gray-700 text-sm font-bold mb-2">Reisedauer (in Tagen)</label>
            <input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="z.B. 7" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>
          <div className="mb-6">
            <label htmlFor="interests" className="block text-gray-700 text-sm font-bold mb-2">Interessen & Vorlieben</label>
            <textarea id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="z.B. Kunstmuseen, historische Stätten, vegetarisches Essen" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" rows={4} required />
          </div>
          <div className="flex items-center justify-center">
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300" disabled={loading}>
              {loading && !plan ? 'Reiseplan wird erstellt...' : 'Neuen Reiseplan erstellen'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Fehler: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {plan && (
        <div className="mt-6">
          <RoadtripView plan={plan} />
        </div>
      )}
    </div>
  );
};

const SavedPlan: React.FC = () => {
  const [savedPlan, setSavedPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedPlan = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/plan/load');
        if (!res.ok) {
          throw new Error('Kein gespeicherter Plan gefunden oder nicht eingeloggt.');
        }
        const data = await res.json();
        setSavedPlan(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedPlan();
  }, []);

  if (loading) return <div className="mt-8">Gespeicherter Plan wird geladen...</div>;
  if (error) return <div className="mt-8 text-red-600">{error}</div>;
  if (!savedPlan) return <div className="mt-8 text-gray-500">Kein gespeicherter Plan vorhanden.</div>;

  return (
    <div className="mt-8">
      <RoadtripView plan={savedPlan} />
    </div>
  );
};

// Hilfsfunktion: Tagesabschnitte aus Markdown extrahieren
function splitPlanByDays(planText: string): { title: string, content: string }[] {
  const dayRegex = /^(#+\s*Tag\s*\d+[:\s-].*)$/gim;
  const matches = [...planText.matchAll(dayRegex)];
  if (matches.length === 0) return [{ title: 'Reiseplan', content: planText }];
  const result: { title: string, content: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!;
    const end = matches[i + 1]?.index ?? planText.length;
    const title = matches[i][1].replace(/^#+\s*/, '');
    const content = planText.slice(start + matches[i][1].length, end).trim();
    result.push({ title, content });
  }
  return result;
}

// Hilfsfunktion: Locations pro Tag zuordnen (einfache Heuristik: Name im Text)
function locationsForDay(dayContent: string, locations: Location[]): Location[] {
  const lower = dayContent.toLowerCase();
  return locations.filter(loc => lower.includes(loc.name.toLowerCase()));
}

// Hilfsfunktion: Google Maps Directions-Link für Tages-Locations
function googleMapsRouteLink(locations: Location[]): string | null {
  if (locations.length < 2) return null;
  const origin = `${locations[0].lat},${locations[0].lon}`;
  const destination = `${locations[locations.length - 1].lat},${locations[locations.length - 1].lon}`;
  const waypoints = locations.slice(1, -1).map(l => `${l.lat},${l.lon}`).join('|');
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
  return url;
}

const RoadtripView: React.FC<{ plan: TravelPlan }> = ({ plan }) => {
  const days = splitPlanByDays(plan.planText);
  return (
    <div className="flex flex-col gap-12 mt-8">
      <AnimatePresence>
        {days.map((day, idx) => {
          const dayLocations = locationsForDay(day.content, plan.locations);
          const routeLink = googleMapsRouteLink(dayLocations);
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="bg-white rounded-2xl shadow-lg p-8 border-l-8 border-blue-300 relative overflow-visible flex flex-col gap-4"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold text-2xl shadow-md border-4 border-white absolute -left-16 top-4 z-10">
                  {idx + 1}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-blue-900 tracking-tight ml-8">{day.title}</h3>
              </div>
              <div className="prose max-w-none mb-2 ml-8">
                <ReactMarkdown>{day.content}</ReactMarkdown>
              </div>
              {routeLink && (
                <div className="ml-8 mb-2">
                  <a
                    href={routeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors duration-150 mb-2"
                  >
                    Route auf Google Maps anzeigen
                  </a>
                </div>
              )}
              {dayLocations.length > 0 && (
                <div className="ml-8">
                  <div className="font-semibold text-gray-700 mb-2">Etappen & Highlights:</div>
                  {dayLocations.length === 1 ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="min-w-[220px] max-w-xs w-full bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                        <span className="font-semibold text-gray-800 mb-1 truncate text-lg">{dayLocations[0].name}</span>
                        <LocationInfo name={dayLocations[0].name} lat={dayLocations[0].lat} lon={dayLocations[0].lon} />
                      </div>
                      <div className="text-gray-400 text-sm mt-2">Für diesen Tag ist nur ein Highlight geplant.</div>
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                      {dayLocations.map((loc, lidx) => (
                        <div key={lidx} className="min-w-[260px] max-w-xs flex-shrink-0 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <span className="font-semibold text-gray-800 mb-1 truncate text-lg">{loc.name}</span>
                          <LocationInfo name={loc.name} lat={loc.lat} lon={loc.lon} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Intelligenter Reiseführer</h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          Erhalte personalisierte, dynamische und kontextbezogene Reisepläne, erstellt von unserer KI. Ein proaktiver, interaktiver Reisebegleiter, der sich in Echtzeit an deine Bedürfnisse anpasst.
        </p>
      </div>
      <TravelPlanner />
      <SavedPlan />
    </main>
  );
}
