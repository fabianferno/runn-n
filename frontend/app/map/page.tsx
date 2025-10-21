'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BottomNav } from '@/components/bottom-nav';

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapProps {
  className?: string;
}

const MapComponent: React.FC<MapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-74.5);
  const [lat, setLat] = useState(40);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: zoom
      });

      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'metric'
      }), 'bottom-left');

      // Listen for map events
      map.current.on('move', () => {
        if (map.current) {
          setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
          setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
          setZoom(parseFloat(map.current.getZoom().toFixed(2)));
        }
      });

      // Add a marker at the center
      new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Add a popup
      new mapboxgl.Popup({ offset: 25 })
        .setLngLat([lng, lat])
        .setHTML('<h3>Welcome to Territory!</h3><p>This is your fitness territory map.</p>')
        .addTo(map.current);
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm">
        <div className="text-sm">
          <div>Longitude: {lng}</div>
          <div>Latitude: {lat}</div>
          <div>Zoom: {zoom}</div>
        </div>
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
};

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Territory Map</h1>
          <p className="text-gray-300 text-lg">
            Explore territories and compete with clans in your fitness journey
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <MapComponent className="h-[600px]" />
        </div>
      </div>
      
     
    </div>
  );
}
