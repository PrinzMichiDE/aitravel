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
}

const cache: Record<string, { weather?: WeatherData; wiki?: WikiData }> = {};

const LocationInfo: React.FC<LocationInfoProps> = ({ name, lat, lon }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [wiki, setWiki] = useState<WikiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `${name}_${lat}_${lon}`;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (cache[cacheKey]?.weather && cache[cacheKey]?.wiki) {
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
        if (!wikiRes.ok) throw new Error('Wikipedia-Daten konnten nicht geladen werden.');
        const weatherData = await weatherRes.json();
        const wikiData = await wikiRes.json();
        if (!cancelled) {
          setWeather(weatherData);
          setWiki(wikiData);
          cache[cacheKey] = { weather: weatherData, wiki: wikiData };
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [name, lat, lon]);

  if (loading) return <div className="text-gray-400 text-sm">Lade Wetter- & Wikipedia-Infos...</div>;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 mb-2 text-sm flex flex-col gap-1">
      {weather && (
        <div className="flex items-center gap-2">
          <span className="font-semibold">Wetter:</span>
          {weather.weather[0]?.icon && (
            <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`} alt="Wettericon" className="inline w-6 h-6 align-middle" />
          )}
          <span>{weather.weather[0]?.description}, {weather.main.temp}°C, Wind {weather.wind.speed} m/s</span>
        </div>
      )}
      {wiki && (
        <div>
          <span className="font-semibold">Wikipedia:</span>{' '}
          {wiki.thumbnail && (
            <img src={wiki.thumbnail.source} alt="Wiki-Bild" className="inline w-8 h-8 align-middle mr-2 rounded" />
          )}
          <span>{wiki.extract}</span>
          {wiki.content_urls?.desktop?.page && (
            <a href={wiki.content_urls.desktop.page} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Mehr auf Wikipedia</a>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationInfo; 