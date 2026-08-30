'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

interface ProjectMapProps {
  lat: number | null;
  lng: number | null;
  height?: number;
  /** When provided, clicking the map reports a picked location. */
  onPick?: (lat: number, lng: number) => void;
}

/** Free OpenStreetMap map via Leaflet (BUILD_SPEC §8.5 — no paid key). */
export default function ProjectMap({ lat, lng, height = 200, onPick }: ProjectMapProps) {
  const center: LatLngExpression = [lat ?? -34.6037, lng ?? -58.3816]; // CABA default

  return (
    <div style={{ height }} className="overflow-hidden rounded-card border border-border">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {lat != null && lng != null && (
          <CircleMarker
            center={[lat, lng]}
            radius={11}
            pathOptions={{ color: '#0E7A52', fillColor: '#1FB57A', fillOpacity: 0.7, weight: 2 }}
          />
        )}
        {onPick && <ClickPicker onPick={onPick} />}
      </MapContainer>
    </div>
  );
}

function ClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
