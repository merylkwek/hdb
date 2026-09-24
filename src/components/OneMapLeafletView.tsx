import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SINGAPORE_TOWNS } from '../data/singaporeHousingData';
import { FlatTransaction } from '../types/housing';

interface OneMapLeafletViewProps {
  style: 'Default' | 'Night' | 'Grey' | 'Original';
  targetCoords?: { lat: number; lng: number; label: string } | null;
  selectedTown: string;
  onSelectTown: (town: string) => void;
  townSummaries: Array<{ name: string; medianPrice: number; medianPsm: number }>;
}

export const OneMapLeafletView: React.FC<OneMapLeafletViewProps> = ({
  style,
  targetCoords,
  selectedTown,
  onSelectTown,
  townSummaries,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Singapore center coordinates
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer from OneMap
    const tileLayer = L.tileLayer(`https://www.onemap.gov.sg/maps/tiles/${style}/{z}/{x}/{y}.png`, {
      detectRetina: true,
      maxZoom: 19,
      minZoom: 11,
      attribution:
        '<img src="https://www.onemap.gov.sg/docs/maps/images/oneMap64-01.png" style="height:14px;width:14px;vertical-align:middle;display:inline-block;margin-right:4px;" /> OneMap | &copy; Singapore Land Authority',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Style
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(`https://www.onemap.gov.sg/maps/tiles/${style}/{z}/{x}/{y}.png`);
  }, [style]);

  // Render Town Centroid Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    townSummaries.forEach((town) => {
      const info = SINGAPORE_TOWNS[town.name];
      if (!info) return;

      const isSelected = selectedTown === town.name;

      const customIcon = L.divIcon({
        className: 'custom-town-pin',
        html: `
          <div style="
            background: ${isSelected ? '#0284c7' : '#0f172a'};
            color: #ffffff;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            border: ${isSelected ? '2px solid #38bdf8' : '1px solid #475569'};
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            white-space: nowrap;
            transform: translate(-50%, -50%);
            cursor: pointer;
          ">
            ${town.name} ($${Math.round(town.medianPrice / 1000)}k)
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([info.lat, info.lng], { icon: customIcon });
      marker.on('click', () => {
        onSelectTown(town.name);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [townSummaries, selectedTown, onSelectTown]);

  // Update Geocoded Target Pin
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (targetMarkerRef.current) {
      map.removeLayer(targetMarkerRef.current);
      targetMarkerRef.current = null;
    }

    if (targetCoords) {
      const pinIcon = L.divIcon({
        className: 'custom-target-pin',
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            cursor: pointer;
            text-align: center;
          ">
            <div style="
              background: #e11d48;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 4px 10px rgba(225,29,72,0.4);
              white-space: nowrap;
              border: 1.5px solid white;
            ">
              📍 ${targetCoords.label}
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 8px solid #e11d48;
              margin: 0 auto;
            "></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([targetCoords.lat, targetCoords.lng], { icon: pinIcon }).addTo(map);
      targetMarkerRef.current = marker;

      // Pan to target
      map.flyTo([targetCoords.lat, targetCoords.lng], 15, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [targetCoords]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px] rounded-md z-0" />
    </div>
  );
};
