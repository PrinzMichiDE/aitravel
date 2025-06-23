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

const RoadtripView: React.FC<{ plan: TravelPlan }> = ({ plan }) => {
  const days = splitPlanByDays(plan.planText);
  // Optionale Zuordnung: Locations pro Tag (vereinfachte Heuristik)
  // Hier: Alle Locations werden unter jedem Tag angezeigt (besser: NLP, aber für Demo reicht das)
  return (
    <div className="flex flex-col gap-8 mt-8">
      <AnimatePresence>
        {days.map((day, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-blue-100 relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shadow-sm animate-bounce-slow">
                {idx + 1}
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-blue-800 tracking-tight">{day.title}</h3>
            </div>
            <div className="prose max-w-none mb-4">
              <ReactMarkdown>{day.content}</ReactMarkdown>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {plan.locations.map((loc, lidx) => (
                <div key={lidx} className="min-w-[220px] max-w-xs flex-1">
                  <span className="font-semibold text-gray-700">{loc.name}</span>
                  <LocationInfo name={loc.name} lat={loc.lat} lon={loc.lon} />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
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
