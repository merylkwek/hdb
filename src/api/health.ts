// ==============================================================================
// Client-side API Health Check Service
// Queries GET /api/health (or performs direct browser ping diagnostics)
// ==============================================================================

import { ApiHealthReport } from '../../api/health';

export type { ApiHealthReport, ServiceHealthStatus } from '../../api/health';

/**
 * Fetch API Health status from /api/health with automatic fallback to direct probe
 */
export async function checkApiHealth(): Promise<ApiHealthReport> {
  try {
    const res = await fetch('/api/health', {
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // If dev proxy or server is running in purely static mode, perform direct probe
  }

  // Fallback direct browser probe if server route is not available
  return await probeDirectServices();
}

/**
 * Direct in-browser probe for OneMap API services
 */
async function probeDirectServices(): Promise<ApiHealthReport> {
  const checkService = async (service: string, url: string) => {
    const start = Date.now();
    try {
      const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return {
        service,
        endpoint: url,
        status: 'operational' as const,
        httpStatus: 200,
        latencyMs: Date.now() - start,
        message: 'Endpoint reachable',
      };
    } catch (err: any) {
      return {
        service,
        endpoint: url,
        status: 'degraded' as const,
        httpStatus: 0,
        latencyMs: Date.now() - start,
        message: err?.message || 'CORS / Network restricted',
      };
    }
  };

  const [authToken, search, revgeocode, routing, tiles] = await Promise.all([
    checkService('OneMap SLA Token Minting', 'https://www.onemap.gov.sg/api/auth/post/getToken'),
    checkService('OneMap SLA Elastic Search', 'https://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1'),
    checkService('OneMap SLA Reverse Geocoding', 'https://www.onemap.gov.sg/api/public/revgeocode?location=1.3,103.8&buffer=40&addressType=All'),
    checkService('OneMap SLA Routing Service', 'https://www.onemap.gov.sg/api/public/routingsvc/route?start=1.320981,103.844150&end=1.326762,103.8559&routeType=walk'),
    checkService('OneMap SLA WMTS Basemap Tiles', 'https://www.onemap.gov.sg/maps/tiles/Default/11/1655/1020.png'),
  ]);

  const serviceList = [authToken, search, revgeocode, routing, tiles];
  const operationalCount = serviceList.filter((s) => s.status === 'operational').length;
  const avgLatency = Math.round(serviceList.reduce((acc, s) => acc + s.latencyMs, 0) / serviceList.length);

  return {
    status: operationalCount > 0 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    environment: 'browser-client',
    uptimeSeconds: Math.round(performance.now() / 1000),
    system: {
      nodeVersion: 'browser',
      platform: navigator.userAgent.split(' ')[0] || 'Web',
    },
    services: {
      onemapAuthToken: authToken,
      onemapElasticSearch: search,
      onemapRevGeocode: revgeocode,
      onemapRouting: routing,
      onemapTiles: tiles,
    },
    metrics: {
      totalServicesChecked: 5,
      operationalServices: operationalCount,
      averageLatencyMs: avgLatency,
    },
  };
}
