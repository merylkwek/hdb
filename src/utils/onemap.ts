// ==============================================================================
// OneMap Singapore (SLA) Integration Utility
// # Mint a token (POST, JSON body {"email":"...","password":"..."}; lasts 3 days):
// https://www.onemap.gov.sg/api/auth/post/getToken
//
// # Geocode / search (Authorization header now officially required):
// https://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1
// ==============================================================================

export interface OneMapTokenResult {
  success: boolean;
  token?: string;
  expiryTimestamp?: string;
  error?: string;
}

export interface StoredOneMapAuth {
  token: string | null;
  expiryTimestamp: number | null;
  email: string | null;
  isExpired: boolean;
  hoursRemaining: number;
}

export interface OneMapSearchResultItem {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string; // SVY21 Easting (m)
  Y: string; // SVY21 Northing (m)
  LATITUDE: string;
  LONGITUDE: string;
}

export interface OneMapSearchResponse {
  found?: number;
  totalNumPages?: number;
  pageNum?: number;
  results?: OneMapSearchResultItem[];
  error?: string;
}

export interface OneMapSearchExecution {
  items: OneMapSearchResultItem[];
  totalFound: number;
  isAuthorized: boolean;
  errorMessage?: string;
}

const STORAGE_KEY_TOKEN = 'houselytics_onemap_token';
const STORAGE_KEY_EXPIRY = 'houselytics_onemap_expiry';
const STORAGE_KEY_EMAIL = 'houselytics_onemap_email';

/**
 * Mint a 3-day OneMap access token from SLA API.
 * POST https://www.onemap.gov.sg/api/auth/post/getToken
 * Body: {"email": "...", "password": "..."}
 */
export async function mintOneMapToken(email: string, password: string): Promise<OneMapTokenResult> {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const payload = JSON.stringify({ email: email.trim(), password });

  // Try via local proxy first, then fallback to direct endpoint (CORS supported)
  const endpoints = [
    '/api/onemap/token',
    'https://www.onemap.gov.sg/api/auth/post/getToken',
  ];

  let lastError = 'Failed to connect to OneMap authentication service.';

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: payload,
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        // Calculate expiration timestamp (3 days / 72 hours if not provided explicitly)
        const expiry = data.expiry_timestamp 
          ? new Date(data.expiry_timestamp).getTime()
          : Date.now() + (3 * 24 * 60 * 60 * 1000);

        saveOneMapToken(data.access_token, expiry, email.trim());

        return {
          success: true,
          token: data.access_token,
          expiryTimestamp: new Date(expiry).toISOString(),
        };
      } else if (data.error) {
        lastError = data.error;
      } else if (data.message) {
        lastError = data.message;
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error reaching OneMap API';
    }
  }

  return { success: false, error: lastError };
}

/**
 * Save token and expiry into localStorage
 */
export function saveOneMapToken(token: string, expiryTimestamp?: number | string, email?: string): void {
  try {
    const expiry = typeof expiryTimestamp === 'string' 
      ? new Date(expiryTimestamp).getTime() 
      : (expiryTimestamp || Date.now() + 3 * 24 * 60 * 60 * 1000);

    localStorage.setItem(STORAGE_KEY_TOKEN, token.trim());
    localStorage.setItem(STORAGE_KEY_EXPIRY, expiry.toString());
    if (email) {
      localStorage.setItem(STORAGE_KEY_EMAIL, email);
    }
  } catch (e) {
    console.warn('localStorage unavailable for OneMap token persistence', e);
  }
}

/**
 * Get stored token information and calculate 72-hour countdown
 */
export function getStoredOneMapToken(): StoredOneMapAuth {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiryStr = localStorage.getItem(STORAGE_KEY_EXPIRY);
    const email = localStorage.getItem(STORAGE_KEY_EMAIL);

    if (!token) {
      return { token: null, expiryTimestamp: null, email: null, isExpired: true, hoursRemaining: 0 };
    }

    const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
    const now = Date.now();
    const isExpired = expiry > 0 && now >= expiry;
    const hoursRemaining = Math.max(0, Math.round((expiry - now) / (1000 * 60 * 60)));

    return {
      token,
      expiryTimestamp: expiry || null,
      email: email || null,
      isExpired,
      hoursRemaining,
    };
  } catch {
    return { token: null, expiryTimestamp: null, email: null, isExpired: true, hoursRemaining: 0 };
  }
}

/**
 * Clear stored OneMap credentials
 */
export function clearOneMapToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRY);
    localStorage.removeItem(STORAGE_KEY_EMAIL);
  } catch (e) {
    console.warn('Could not clear OneMap token', e);
  }
}

/**
 * Geocode / Search Singapore addresses using OneMap Elastic Search API.
 * # Geocode / search (Authorization header now officially required):
 * https://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1
 */
export async function searchOneMapWithMeta(
  query: string, 
  token?: string | null, 
  pageNum: number = 1
): Promise<OneMapSearchExecution> {
  if (!query || query.trim().length === 0) {
    return { items: [], totalFound: 0, isAuthorized: !!token };
  }

  const encodedVal = encodeURIComponent(query.trim());
  const queryString = `searchVal=${encodedVal}&returnGeom=Y&getAddrDetails=Y&pageNum=${pageNum}`;

  const endpoints = [
    `https://www.onemap.gov.sg/api/common/elastic/search?${queryString}`,
    `/api/onemap/search?${queryString}`,
  ];

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  // OneMap officially expects 'Authorization: <token>' or 'Authorization: Bearer <token>'
  if (token) {
    headers['Authorization'] = token;
  }

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers });
      const data: OneMapSearchResponse = await res.json();

      const hasAuthError = !!(data.error && data.error.toLowerCase().includes('token'));
      const items = Array.isArray(data.results) ? data.results : [];
      const totalFound = data.found || items.length;

      return {
        items,
        totalFound,
        isAuthorized: !hasAuthError && !!token,
        errorMessage: data.error,
      };
    } catch (e) {
      // Continue to next endpoint fallback
    }
  }

  return {
    items: [],
    totalFound: 0,
    isAuthorized: false,
    errorMessage: 'Network error communicating with OneMap Geocode API.',
  };
}

/**
 * Simplified address search helper returning array of results
 */
export async function searchOneMap(query: string, token?: string | null): Promise<OneMapSearchResultItem[]> {
  const result = await searchOneMapWithMeta(query, token);
  return result.items;
}

/**
 * Live test OneMap search endpoint using the official sample:
 * "raffles place" (Authorization header officially required)
 */
export async function testOneMapRafflesPlaceSearch(token?: string | null): Promise<OneMapSearchExecution> {
  return searchOneMapWithMeta('raffles place', token, 1);
}

/**
 * Generate a demo 72-hour simulated sandbox token for testing
 */
export function activateDemoOneMapToken(): StoredOneMapAuth {
  const fakeToken = `om_sandbox_sla_${Math.random().toString(36).substring(2)}${Date.now()}`;
  const expiry = Date.now() + 3 * 24 * 60 * 60 * 1000;
  saveOneMapToken(fakeToken, expiry, 'developer@sla.gov.sg (Demo)');
  return getStoredOneMapToken();
}

/**
 * OneMap Basemap raster tile template URLs (WMTS / Slippy Map format)
 */
export const ONEMAP_TILE_URLS = {
  Default: 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png',
  Night: 'https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png',
  Grey: 'https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png',
  Original: 'https://www.onemap.gov.sg/maps/tiles/Original/{z}/{x}/{y}.png',
};
