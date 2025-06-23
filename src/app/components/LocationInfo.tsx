import React, { useEffect, useState } from 'react';

interface LocationInfoProps {
  name: string;
  lat: number;
  lon: number;
}

interface WikiData {
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page: string } };
  description?: string;
  type?: string; // für Fehler/404
}

const cache: Record<string, { wiki?: WikiData | 'notfound' }> = {};

const MAX_WIKI_LENGTH = 320;

function extractOpeningHours(text: string): string | null {
  // Einfache Heuristik: Suche nach "Öffnungszeiten" oder "geöffnet"
  const regex = /(Öffnungszeiten|geöffnet[^.]*\.)/i;
  const match = text.match(regex);
  return match ? match[0] : null;
}

const LocationInfo: React.FC<LocationInfoProps> = ({ name, lat, lon }) => {
  const [wiki, setWiki] = useState<WikiData | 'notfound'>('notfound');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `${name}_${lat}_${lon}`;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (typeof cache[cacheKey]?.wiki !== 'undefined') {
          setWiki(cache[cacheKey].wiki!);
          setLoading(false);
          return;
        }
        const wikiRes = await fetch(`/api/wiki?title=${encodeURIComponent(name)}`);
        let wikiData: WikiData | 'notfound' = 'notfound';
        if (wikiRes.status === 404) {
          wikiData = 'notfound';
        } else if (!wikiRes.ok) {
          throw new Error('Wikipedia-Daten konnten nicht geladen werden.');
        } else {
          const data = await wikiRes.json();
          if (data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
            wikiData = 'notfound';
          } else {
            wikiData = data;
          }
        }
        if (!cancelled) {
          setWiki(wikiData);
          cache[cacheKey] = { wiki: wikiData };
        }
      } catch (err: any) {
        if (!cancelled) setError('Daten konnten nicht geladen werden.');
      }
      if (!cancelled) setLoading(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, [name, lat, lon]);

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm animate-pulse min-h-[120px]">
      <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
      Lädt Wikipedia-Infos...
    </div>
  );
  if (error) return <div className="text-red-500 text-sm flex items-center gap-2"><span>⚠️</span>{error}</div>;

  if (wiki === 'notfound') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[120px]">
        <span className="text-gray-400 text-sm">Kein Wikipedia-Artikel gefunden</span>
      </div>
    );
  }

  const openingHours = extractOpeningHours(wiki.extract || '');

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 min-h-[120px]">
      {wiki.thumbnail && (
        <img src={wiki.thumbnail.source} alt="Wiki-Bild" className="w-24 h-24 object-cover rounded-lg shadow mb-2" />
      )}
      <span className="font-bold text-base text-blue-900 text-center mb-1">{name}</span>
      {wiki.description && <span className="text-xs text-blue-700 mb-1 text-center">{wiki.description}</span>}
      <span className="text-sm text-gray-700 text-center">
        {wiki.extract.length > MAX_WIKI_LENGTH
          ? wiki.extract.slice(0, MAX_WIKI_LENGTH) + '...'
          : wiki.extract}
      </span>
      {openingHours && (
        <span className="text-xs text-green-700 font-semibold mt-1">{openingHours}</span>
      )}
      {wiki.content_urls?.desktop?.page && (
        <a href={wiki.content_urls.desktop.page} target="_blank" rel="noopener noreferrer" className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow text-xs font-semibold transition-colors">Mehr auf Wikipedia</a>
      )}
    </div>
  );
};

export default LocationInfo; 