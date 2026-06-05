'use client';
import { useEffect, useRef, useCallback } from 'react';

interface Destination {
  name: string;
  state: string;
  finalScore: number;
  distanceKm: number;
  estimatedTotalCost: number;
  location: { coordinates: [number, number] };
  weatherData?: { temp: number; weatherDescription: string };
}

interface MapProps {
  userLocation: { lat: number; lng: number } | null;
  destinations: Destination[];
  onDestinationClick: (dest: Destination) => void;
  onMapClick?: (lat: number, lng: number, cityName: string) => void;
}

// Reverse geocode using Nominatim (free, no key)
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'User-Agent': 'TripWiseAI/1.0' } }
    );
    const data = await res.json();
    // Extract city/town/village name
    const addr = data.address;
    return addr.city || addr.town || addr.village || addr.county || addr.state || 'Selected Location';
  } catch {
    return 'Selected Location';
  }
};

export default function Map({ userLocation, destinations, onDestinationClick, onMapClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLinesRef = useRef<any[]>([]);
  const clickMarkerRef = useRef<any>(null);
  const onMapClickRef = useRef(onMapClick);

  // Keep callback ref updated without re-running effects
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize map ONCE
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Inject Leaflet CSS if not already present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (mapInstanceRef.current) return;

      const map = L.map(mapRef.current!, {
        center: [22.5, 78.9],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: false  // We'll use double-click for pin dropping instead
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // Click-to-set-location handler
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;

        // Remove old click marker
        if (clickMarkerRef.current) {
          clickMarkerRef.current.remove();
          clickMarkerRef.current = null;
        }

        // Drop a pin
        const pinIcon = L.divIcon({
          html: `<div style="position:relative">
            <div style="background:#ef4444;width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>
          </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 20],
          className: ''
        });

        const marker = L.marker([lat, lng], { icon: pinIcon })
          .addTo(map)
          .bindPopup('📍 Fetching location name...')
          .openPopup();
        clickMarkerRef.current = marker;

        // Reverse geocode
        const cityName = await reverseGeocode(lat, lng);
        marker.setPopupContent(`📍 <b>${cityName}</b><br><small>Click "Find My Trips" to search from here</small>`);
        marker.openPopup();

        // Notify parent
        if (onMapClickRef.current) {
          onMapClickRef.current(lat, lng, cityName);
        }
      });

      // Fix map size after render (prevents grey tiles)
      setTimeout(() => map.invalidateSize(), 200);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when destinations or userLocation change
  useEffect(() => {
    if (typeof window === 'undefined' || !mapInstanceRef.current) return;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      // Clear old markers and route lines
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      routeLinesRef.current.forEach(l => l.remove());
      routeLinesRef.current = [];

      // User location marker (blue dot)
      if (userLocation) {
        const userIcon = L.divIcon({
          html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          className: ''
        });
        const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>📍 Your Location</b>');
        markersRef.current.push(userMarker);

        // Only auto-zoom if we have no destinations yet
        if (destinations.length === 0) {
          map.setView([userLocation.lat, userLocation.lng], 7);
        }
      }

      // Destination markers
      if (destinations.length > 0) {
        const bounds: [number, number][] = [];

        if (userLocation) {
          bounds.push([userLocation.lat, userLocation.lng]);
        }

        destinations.forEach((dest, i) => {
          const lat = dest.location.coordinates[1];
          const lng = dest.location.coordinates[0];
          bounds.push([lat, lng]);

          const color = i === 0 ? '#10b981' : i < 3 ? '#f59e0b' : '#6b7280';
          const size = i === 0 ? 24 : i < 3 ? 20 : 16;

          const icon = L.divIcon({
            html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;cursor:pointer">${i + 1}</div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            className: ''
          });

          const marker = L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(`<b>${dest.name}</b><br>${dest.state}<br>Score: ${dest.finalScore}<br>₹${dest.estimatedTotalCost?.toLocaleString()}<br>${dest.distanceKm}km away`)
            .on('click', () => onDestinationClick(dest));

          markersRef.current.push(marker);
        });

        // Draw route lines from user location to destinations
        if (userLocation) {
          destinations.forEach((dest, i) => {
            const destLat = dest.location.coordinates[1];
            const destLng = dest.location.coordinates[0];
            const color = i === 0 ? '#10b981' : i < 3 ? '#f59e0b' : '#475569';
            const weight = i === 0 ? 3 : i < 3 ? 2 : 1;
            const dashArray = i < 3 ? undefined : '6, 8';

            const line = L.polyline(
              [[userLocation.lat, userLocation.lng], [destLat, destLng]],
              { color, weight, opacity: i < 3 ? 0.7 : 0.3, dashArray }
            ).addTo(map);
            routeLinesRef.current.push(line);
          });
        }

        // Fit map to show all markers
        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
        }

        // Remove click marker when results are shown (user already selected location)
        if (clickMarkerRef.current) {
          clickMarkerRef.current.remove();
          clickMarkerRef.current = null;
        }
      }
    };

    updateMarkers();
  }, [destinations, userLocation, onDestinationClick]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '12px', minHeight: '400px' }} />;
}
