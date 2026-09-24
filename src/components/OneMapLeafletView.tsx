import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SINGAPORE_TOWNS } from '../data/singaporeHousingData';
import { PlottedAddress } from '../utils/onemap';

interface OneMapLeafletViewProps {
  style: 'Default' | 'Night' | 'Grey' | 'Original';
  addresses: PlottedAddress[];
  selectedAddressId?: string | null;
  onSelectAddress?: (address: PlottedAddress) => void;
  selectedTown: string;
  onSelectTown: (town: string) => void;
  townSummaries: Array<{ name: string; medianPrice: number; medianPsm: number }>;
  routeCoordinates?: Array<[number, number]> | null;
  routeType?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onSetRoutePoint?: (point: 'start' | 'end', address: PlottedAddress) => void;
}

export const OneMapLeafletView: React.FC<OneMapLeafletViewProps> = ({
  style,
  addresses,
  selectedAddressId,
  onSelectAddress,
  selectedTown,
  onSelectTown,
  townSummaries,
  routeCoordinates,
  routeType = 'walk',
  onMapClick,
  onSetRoutePoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const townMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const addressMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

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
    townMarkersLayerRef.current = L.layerGroup().addTo(map);
    addressMarkersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Click handler on map for Reverse Geocoding
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

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
    if (!mapInstanceRef.current || !townMarkersLayerRef.current) return;

    townMarkersLayerRef.current.clearLayers();

    // If there are many specific addresses, hide town centroid badges to reduce clutter
    if (addresses.length > 5) return;

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
            opacity: 0.85;
          ">
            ${town.name} ($${Math.round(town.medianPrice / 1000)}k)
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([info.lat, info.lng], { icon: customIcon });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectTown(town.name);
      });

      townMarkersLayerRef.current?.addLayer(marker);
    });
  }, [townSummaries, selectedTown, onSelectTown, addresses.length]);

  // Render Multiple Specific Addresses
  useEffect(() => {
    if (!mapInstanceRef.current || !addressMarkersLayerRef.current) return;

    addressMarkersLayerRef.current.clearLayers();

    if (addresses.length === 0) return;

    const bounds = L.latLngBounds([]);

    addresses.forEach((addr, idx) => {
      const isSelected = selectedAddressId === addr.id;
      const isListing = addr.source === 'hdb_listing';
      const isSearch = addr.source === 'search';
      const isRevGeocode = addr.source === 'revgeocode';

      const badgeColor = addr.color || (isListing ? '#10b981' : isRevGeocode ? '#8b5cf6' : '#e11d48');
      const badgeIcon = isListing ? '🏠' : isRevGeocode ? '📍' : `${idx + 1}`;

      const iconHtml = `
        <div style="
          position: relative;
          transform: translate(-50%, -100%);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div style="
            background: ${badgeColor};
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 7px;
            border-radius: 6px;
            border: ${isSelected ? '2.5px solid #ffffff' : '1.5px solid rgba(255,255,255,0.85)'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            white-space: nowrap;
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            gap: 4px;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: transform 0.2s ease;
          ">
            <span>${badgeIcon}</span>
            <span>${addr.title}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid ${badgeColor};
            margin-top: -1px;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-address-marker',
        html: iconHtml,
        iconSize: [0, 0],
      });

      const marker = L.marker([addr.lat, addr.lng], { icon: customIcon });

      // Build Rich SLA Popup
      const popupContent = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; line-height: 1.4; color: #0f172a; min-width: 200px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
            ${addr.building && addr.building !== 'NIL' ? addr.building : addr.title}
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
            ${addr.address}
          </div>
          <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 4px; font-family: monospace; font-size: 10px; color: #334155; margin-bottom: 8px;">
            <div>Postal: ${addr.postal || 'N/A'}</div>
            <div>WGS84: ${addr.lat.toFixed(4)}, ${addr.lng.toFixed(4)}</div>
            ${addr.svy21_x ? `<div>SVY21: X:${addr.svy21_x} Y:${addr.svy21_y}</div>` : ''}
          </div>
          <div style="display: flex; gap: 4px; margin-top: 6px;">
            <button id="btn-route-start-${addr.id}" style="
              flex: 1;
              background: #0f172a;
              color: #ffffff;
              border: none;
              padding: 4px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
              cursor: pointer;
            ">
              Set Start (A)
            </button>
            <button id="btn-route-end-${addr.id}" style="
              flex: 1;
              background: #0284c7;
              color: #ffffff;
              border: none;
              padding: 4px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
              cursor: pointer;
            ">
              Set End (B)
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const startBtn = document.getElementById(`btn-route-start-${addr.id}`);
        const endBtn = document.getElementById(`btn-route-end-${addr.id}`);

        if (startBtn && onSetRoutePoint) {
          startBtn.onclick = () => onSetRoutePoint('start', addr);
        }
        if (endBtn && onSetRoutePoint) {
          endBtn.onclick = () => onSetRoutePoint('end', addr);
        }
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectAddress) {
          onSelectAddress(addr);
        }
      });

      addressMarkersLayerRef.current?.addLayer(marker);
      bounds.extend([addr.lat, addr.lng]);
    });

    // Auto-fit bounds if multiple addresses present and no active route
    if (!routeCoordinates && addresses.length > 1 && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (addresses.length === 1) {
      mapInstanceRef.current.flyTo([addresses[0].lat, addresses[0].lng], 15, { duration: 1 });
    }
  }, [addresses, selectedAddressId, onSelectAddress, onSetRoutePoint, routeCoordinates]);

  // Render Route Polyline
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 1) {
      const routeColor = routeType === 'drive' ? '#2563eb' : routeType === 'cycle' ? '#16a34a' : routeType === 'pt' ? '#9333ea' : '#e11d48';

      const polyline = L.polyline(routeCoordinates, {
        color: routeColor,
        weight: 5,
        opacity: 0.85,
        dashArray: routeType === 'walk' ? '6, 6' : undefined,
      }).addTo(map);

      routePolylineRef.current = polyline;

      map.fitBounds(polyline.getBounds(), { padding: [60, 60] });
    }
  }, [routeCoordinates, routeType]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] rounded-md z-0" />
      
      {/* Click-to-Reverse-Geocode Hint Tooltip */}
      <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded border border-slate-700 pointer-events-none">
        💡 Click anywhere on map to Reverse Geocode address (SLA 40m Buffer)
      </div>
    </div>
  );
};
