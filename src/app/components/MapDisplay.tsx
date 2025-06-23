'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Location } from '../page'; // Import aus page.tsx
import { useEffect } from 'react';

// Behebt ein bekanntes Problem mit Webpack und den Standard-Icon-Pfaden von Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// Eine Hilfskomponente, um die Kartengrenzen dynamisch anzupassen
const MapBoundsUpdater = ({ locations }: { locations: Location[] }) => {
    const map = useMap();
    useEffect(() => {
      if (locations && locations.length > 0) {
        const bounds = new L.LatLngBounds(locations.map(loc => [loc.lat, loc.lon]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [locations, map]);
    return null;
  };

// Typdefinition für die Props der Komponente
interface MapDisplayProps {
    locations: Location[];
}

const MapDisplay: React.FC<MapDisplayProps> = ({ locations }) => {
  const position: [number, number] = [51.505, -0.09]; // Standard-Position (London), falls keine Orte vorhanden

  return (
    <MapContainer center={position} zoom={locations && locations.length > 0 ? 13 : 5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations && locations.map((loc, index) => (
        <Marker key={index} position={[loc.lat, loc.lon]}>
          <Popup>
            {loc.name}
          </Popup>
        </Marker>
      ))}
      <MapBoundsUpdater locations={locations} />
    </MapContainer>
  );
};

export default MapDisplay; 