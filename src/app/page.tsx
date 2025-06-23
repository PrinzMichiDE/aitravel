'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import LocationInfo from './components/LocationInfo';

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
        <div className="mt-6 bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800">Dein persönlicher Reiseplan</h3>
            {!isPlanSaved && (
              <button
                onClick={handleSavePlan}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-green-300"
                disabled={loading}
              >
                {loading ? 'Wird gespeichert...' : 'Diesen Plan speichern'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg overflow-x-auto h-[600px]">
              {plan.planText}
            </pre>
            <div className="h-[600px]">
              <MapDisplay locations={plan.locations} />
            </div>
          </div>
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
    <div className="mt-8 bg-white p-8 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Dein gespeicherter Reiseplan</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-[600px] overflow-y-auto">
          <div className="prose prose-blue max-w-none">
            <ReactMarkdown>{savedPlan.planText}</ReactMarkdown>
          </div>
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Orte & Links</h4>
            {savedPlan.locations.map((loc, idx) => (
              <div key={idx} className="mb-2 flex flex-col md:flex-row md:items-center md:gap-2">
                <span className="font-medium">{loc.name}</span>
                <LocationInfo name={loc.name} lat={loc.lat} lon={loc.lon} />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline ml-2"
                >
                  Google Maps
                </a>
                <a
                  href={`https://de.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(loc.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 underline ml-2"
                >
                  Wikipedia
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="h-[600px]">
          <MapDisplay locations={savedPlan.locations} />
        </div>
      </div>
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
