import { SINGAPORE_TOWNS } from '../data/singaporeHousingData';
import { GeocoderResult } from '../types/housing';

// Simplified Singapore Main Island Coastline SVG coordinate path (0-100 coordinate space)
export const SINGAPORE_MAINLAND_OUTLINE = `
  M 12 55
  C 14 42, 22 30, 32 20
  C 38 15, 48 10, 58 16
  C 64 20, 72 24, 82 25
  C 92 28, 96 35, 95 42
  C 93 48, 88 56, 78 62
  C 68 68, 58 72, 48 76
  C 38 78, 28 72, 20 68
  C 14 64, 11 60, 12 55
  Z
`;

// Regional subzones for boundary visualization
export const REGIONAL_BOUNDARIES: Record<string, string> = {
  Central: 'M 40 50 C 44 44, 56 44, 60 52 C 60 66, 42 74, 38 64 Z',
  East: 'M 68 38 C 78 30, 94 32, 92 50 C 86 60, 72 62, 66 52 Z',
  North: 'M 30 18 C 42 12, 54 14, 56 26 C 48 30, 36 30, 28 24 Z',
  'North-East': 'M 54 28 C 66 22, 74 30, 70 44 C 60 48, 52 42, 54 28 Z',
  West: 'M 14 44 C 20 32, 32 32, 34 50 C 32 64, 18 68, 14 54 Z',
};

// SVY21 Standard Parameters (Singapore National Grid EPSG:3414)
// Origin: 1° 22' 00" N, 103° 50' 00" E
// False Easting: 28001.642 m, False Northing: 38744.572 m
export function convertWgs84ToSvy21(lat: number, lng: number): { easting: number; northing: number } {
  const originLat = 1.366666;
  const originLng = 103.833333;
  const deltaLat = lat - originLat;
  const deltaLng = lng - originLng;

  // Approximate affine projection locally for Singapore bounds
  const easting = Math.round(28001.642 + (deltaLng * 111320 * Math.cos(lat * Math.PI / 180)));
  const northing = Math.round(38744.572 + (deltaLat * 110574));

  return { easting, northing };
}

// Convert SVY21 or Lat/Lng to normalized Map Canvas Percentage (0 to 100)
export function latLngToCanvasXY(lat: number, lng: number): { x: number; y: number } {
  // Singapore bounds: Lat 1.22 to 1.48, Lng 103.60 to 104.04
  const minLat = 1.22;
  const maxLat = 1.47;
  const minLng = 103.62;
  const maxLng = 104.02;

  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = 100 - (((lat - minLat) / (maxLat - minLat)) * 100);

  return {
    x: Math.max(5, Math.min(95, +x.toFixed(2))),
    y: Math.max(5, Math.min(95, +y.toFixed(2))),
  };
}

// Tab05 Geocoder Lookup Simulator
export function geocodeAddress(query: string): GeocoderResult | null {
  if (!query || query.trim().length === 0) return null;
  const clean = query.trim().toUpperCase();

  // 1. Direct town matching
  for (const [townName, townData] of Object.entries(SINGAPORE_TOWNS)) {
    if (clean.includes(townName) || townName.includes(clean)) {
      return {
        query,
        matchedTown: townName,
        lat: townData.lat,
        lng: townData.lng,
        svy21_x: townData.svy21_e,
        svy21_y: townData.svy21_n,
        confidence: 0.95,
        source: 'Tab05_Master_Geocoder',
      };
    }
  }

  // 2. Keyword matching (e.g. "Tampines", "Orchard", "Jurong", "Yishun")
  for (const [townName, townData] of Object.entries(SINGAPORE_TOWNS)) {
    const parts = townName.split(' ');
    if (parts.some(p => p.length > 3 && clean.includes(p))) {
      return {
        query,
        matchedTown: townName,
        lat: townData.lat,
        lng: townData.lng,
        svy21_x: townData.svy21_e,
        svy21_y: townData.svy21_n,
        confidence: 0.88,
        source: 'Tab05_Master_Geocoder',
      };
    }
  }

  // 3. Fallback default to central Singapore
  const bishan = SINGAPORE_TOWNS['BISHAN'];
  return {
    query,
    matchedTown: 'BISHAN',
    lat: bishan.lat,
    lng: bishan.lng,
    svy21_x: bishan.svy21_e,
    svy21_y: bishan.svy21_n,
    confidence: 0.50,
    source: 'SLA_Address_Index',
  };
}

// Generate animated SVG auto-draw step sequences
export interface DrawSequenceStep {
  id: string;
  name: string;
  type: 'contour' | 'zone' | 'arteries' | 'centroids' | 'complete';
  progress: number;
}
