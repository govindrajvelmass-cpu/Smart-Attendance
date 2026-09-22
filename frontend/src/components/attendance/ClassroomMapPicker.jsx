import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet marker icon resolution in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function ClassroomMapPicker({
  latitude = 12.9715987,
  longitude = 77.5945627,
  radius = 100,
  onLocationChange,
  interactive = true,
  height = '360px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([latitude, longitude], 17);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Marker
      const marker = L.marker([latitude, longitude], {
        draggable: interactive
      }).addTo(map);

      marker.bindPopup(`<b>Classroom Location</b><br/>Lat: ${latitude.toFixed(6)}<br/>Lng: ${longitude.toFixed(6)}`).openPopup();

      // Circle
      const circle = L.circle([latitude, longitude], {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.25,
        radius: radius
      }).addTo(map);

      if (interactive) {
        // Drag marker
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          circle.setLatLng(pos);
          marker.getPopup().setContent(`<b>Classroom Location</b><br/>Lat: ${pos.lat.toFixed(6)}<br/>Lng: ${pos.lng.toFixed(6)}`).openPopup();
          if (onLocationChange) {
            onLocationChange(pos.lat, pos.lng);
          }
        });

        // Click on map
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          circle.setLatLng([lat, lng]);
          marker.getPopup().setContent(`<b>Classroom Location</b><br/>Lat: ${lat.toFixed(6)}<br/>Lng: ${lng.toFixed(6)}`).openPopup();
          if (onLocationChange) {
            onLocationChange(lat, lng);
          }
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    }

    return () => {
      // Map instance preserved or cleaned on unmount
    };
  }, []);

  // Update position if props change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      const curPos = markerRef.current.getLatLng();
      if (Math.abs(curPos.lat - latitude) > 0.00001 || Math.abs(curPos.lng - longitude) > 0.00001) {
        markerRef.current.setLatLng([latitude, longitude]);
        circleRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude]);
      }
      circleRef.current.setRadius(radius);
    }
  }, [latitude, longitude, radius]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
      {interactive && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(255,255,255,0.92)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        >
          📍 Click map or drag pin to update classroom position
        </div>
      )}
    </div>
  );
}
