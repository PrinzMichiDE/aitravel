import React, { useEffect, useState } from 'react';

interface LocationInfoProps {
  name: string;
  lat: number;
  lon: number;
}

interface WikiData {
  extract: string;
  thumbnail?: { source: string };
  originalimage?: { source: string };
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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

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
          const imgs = getImagesFromWiki(cache[cacheKey].wiki!);
          setGalleryImages(imgs);
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
          const imgs = getImagesFromWiki(wikiData);
          setGalleryImages(imgs);
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

  function getImagesFromWiki(wiki: WikiData | 'notfound'): string[] {
    if (!wiki || wiki === 'notfound') return [];
    const images: string[] = [];
    if (wiki.originalimage?.source) images.push(wiki.originalimage.source);
    if (wiki.thumbnail?.source && (!images.length || images[0] !== wiki.thumbnail.source)) images.push(wiki.thumbnail.source);
    return images;
  }

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

  const showGallery = galleryImages.length > 0;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 min-h-[120px]">
      {showGallery && (
        <div className="w-full flex flex-col items-center mb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {galleryImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Bild ${idx + 1}`}
                className={`w-24 h-24 object-cover rounded-lg shadow cursor-pointer border-2 ${galleryIdx === idx ? 'border-blue-500' : 'border-transparent'}`}
                onClick={() => { setGalleryIdx(idx); setGalleryOpen(true); }}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') { setGalleryIdx(idx); setGalleryOpen(true); }}}
              />
            ))}
          </div>
        </div>
      )}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setGalleryOpen(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img src={galleryImages[galleryIdx]} alt="Großansicht" className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl" />
            <button className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100" onClick={() => setGalleryOpen(false)} aria-label="Schließen">✕</button>
            {galleryImages.length > 1 && (
              <>
                <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100" onClick={() => setGalleryIdx((galleryIdx - 1 + galleryImages.length) % galleryImages.length)} aria-label="Vorheriges Bild">◀</button>
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100" onClick={() => setGalleryIdx((galleryIdx + 1) % galleryImages.length)} aria-label="Nächstes Bild">▶</button>
              </>
            )}
          </div>
        </div>
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