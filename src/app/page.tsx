'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

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

const TravelPlanner = () => {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [interests, setInterests] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TravelPlan | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlan(null);

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

  return (
    <div className="w-full max-w-7xl">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Plane deine Traumreise</h2>
        <form onSubmit={handleSubmit}>
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
              {loading ? 'Reiseplan wird erstellt...' : 'Reiseplan erstellen'}
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
          <h3 className="text-2xl font-bold mb-4 text-gray-800">Dein persönlicher Reiseplan</h3>
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
    </main>
  );
}
