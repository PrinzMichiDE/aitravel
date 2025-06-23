'use client';

import { useState } from 'react';

// Temporäre Komponente für den Reiseplaner.
// Wird später in eine eigene Datei ausgelagert.
const TravelPlanner = () => {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [interests, setInterests] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Hier wird später die Gemini API aufgerufen
    console.log({ destination, duration, interests });
    alert('Reiseplan wird erstellt... (Funktionalität wird noch implementiert)');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Plane deine Traumreise</h2>
      <div className="mb-4">
        <label htmlFor="destination" className="block text-gray-700 text-sm font-bold mb-2">
          Reiseziel
        </label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="z.B. Paris, Frankreich"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="duration" className="block text-gray-700 text-sm font-bold mb-2">
          Reisedauer (in Tagen)
        </label>
        <input
          id="duration"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="z.B. 7"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      <div className="mb-6">
        <label htmlFor="interests" className="block text-gray-700 text-sm font-bold mb-2">
          Interessen & Vorlieben
        </label>
        <textarea
          id="interests"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="z.B. Kunstmuseen, historische Stätten, vegetarisches Essen"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
          rows={4}
          required
        />
      </div>
      <div className="flex items-center justify-center">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Reiseplan erstellen
        </button>
      </div>
    </form>
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
