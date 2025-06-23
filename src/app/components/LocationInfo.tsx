import React, { useEffect, useState } from 'react';

interface LocationInfoProps {
  name: string;
  lat: number;
  lon: number;
}

interface WeatherData {
  weather: { description: string; icon: string }[];
  main: { temp: number; humidity: number };
  wind: { speed: number };
}

interface WikiData {
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page: string } };
  type?: string; // für Fehler/404
}

const cache: Record<string, { weather?: WeatherData; wiki?: WikiData | 'notfound' }> = {};

const MAX_WIKI_LENGTH = 220;

const LocationInfo: React.FC<LocationInfoProps> = ({ name, lat, lon }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
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
        if (cache[cacheKey]?.weather && typeof cache[cacheKey].wiki !== 'undefined') {
          setWeather(cache[cacheKey].weather!);
          setWiki(cache[cacheKey].wiki!);
          setLoading(false);
          return;
        }
        const [weatherRes, wikiRes] = await Promise.all([
          fetch(`/api/weather?lat=${lat}&lon=${lon}`),
          fetch(`/api/wiki?title=${encodeURIComponent(name)}`),
        ]);
        if (!weatherRes.ok) throw new Error('Wetterdaten konnten nicht geladen werden.');
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
        const weatherData = await weatherRes.json();
        if (!cancelled) {
          setWeather(weatherData);
          setWiki(wikiData);
          cache[cacheKey] = { weather: weatherData, wiki: wikiData };
        }
      } catch (err: any) {
        if (!cancelled) setError('Daten konnten nicht geladen werden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [name, lat, lon]);

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm animate-pulse min-h-[60px]">
      <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
      Lädt Wetter- & Wikipedia-Infos...
    </div>
  );
  if (error) return <div className="text-red-500 text-sm flex items-center gap-2"><span>⚠️</span>{error}</div>;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-1 mb-2 text-sm flex flex-col md:flex-row md:gap-6 gap-2">
      {/* Wetter */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {weather && (
          <>
            <span className="font-semibold">Wetter:</span>
            {weather.weather[0]?.icon && (
              <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`} alt="Wettericon" className="inline w-6 h-6 align-middle" />
            )}
            <span className="truncate">{weather.weather[0]?.description}, {weather.main.temp}°C, Wind {weather.wind.speed} m/s</span>
          </>
        )}
      </div>
      {/* Wikipedia */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="font-semibold">Wikipedia:</span>
        {wiki === 'notfound' ? (
          <span className="text-gray-400">Kein Artikel gefunden</span>
        ) : wiki ? (
          <>
            {wiki.thumbnail && (
              <img src={wiki.thumbnail.source} alt="Wiki-Bild" className="inline w-8 h-8 align-middle mr-2 rounded" />
            )}
            <span className="truncate">
              {wiki.extract.length > MAX_WIKI_LENGTH
                ? wiki.extract.slice(0, MAX_WIKI_LENGTH) + '...'
                : wiki.extract}
            </span>
            {wiki.content_urls?.desktop?.page && (
              <a href={wiki.content_urls.desktop.page} target="_blank" rel="noopener noreferrer" className="ml-2 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors text-xs font-semibold whitespace-nowrap">Mehr auf Wikipedia</a>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default LocationInfo; 