// ==============================================================================
// Houselytics API Health Check Handler
// Endpoint: GET /api/health
// Provides real-time health diagnostics for System, Housing Dataset,
// and SLA OneMap v2 Services (Token, Search, RevGeocode, Routing, Tiles).
// ==============================================================================

export interface ServiceHealthStatus {
  service: string;
  endpoint: string;
  status: 'operational' | 'degraded' | 'down';
  httpStatus?: number;
  latencyMs: number;
  message?: string;
}

export interface ApiHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  system: {
    nodeVersion: string;
    platform: string;
    memoryUsageMb?: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
  services: {
    onemapAuthToken: ServiceHealthStatus;
    onemapElasticSearch: ServiceHealthStatus;
    onemapRevGeocode: ServiceHealthStatus;
    onemapRouting: ServiceHealthStatus;
    onemapTiles: ServiceHealthStatus;
  };
  metrics: {
    totalServicesChecked: number;
    operationalServices: number;
    averageLatencyMs: number;
  };
}

/**
 * Measure latency and HTTP response status for an external API endpoint
 */
async function pingEndpoint(
  service: string,
  url: string,
  options: { method?: string; headers?: Record<string, string>; timeoutMs?: number } = {}
): Promise<ServiceHealthStatus> {
  const start = Date.now();
  const method = options.method || 'GET';
  const timeoutMs = options.timeoutMs || 4000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method,
      headers: options.headers || { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    // Both 200 OK and 400/401 (meaning API is up and active, requiring creds) are proof the endpoint is operational
    const isOperational = res.status < 500;

    return {
      service,
      endpoint: url,
      status: isOperational ? 'operational' : 'degraded',
      httpStatus: res.status,
      latencyMs,
      message: res.ok 
        ? 'Service responding normally' 
        : `Service active (HTTP ${res.status})`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const isTimeout = err?.name === 'AbortError';

    return {
      service,
      endpoint: url,
      status: 'down',
      latencyMs,
      message: isTimeout 
        ? `Request timed out after ${timeoutMs}ms` 
        : err?.message || 'Connection failed',
    };
  }
}

/**
 * Perform comprehensive health check on all subsystems
 */
export async function getApiHealth(): Promise<ApiHealthReport> {
  const [authToken, search, revgeocode, routing, tiles] = await Promise.all([
    // 1. OneMap Token Minting Service
    pingEndpoint(
      'OneMap SLA Token Minting',
      'https://www.onemap.gov.sg/api/auth/post/getToken',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    ),
    // 2. OneMap Elastic Search Service (Official raffles place probe)
    pingEndpoint(
      'OneMap SLA Elastic Search',
      'https://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1'
    ),
    // 3. OneMap Reverse Geocoding Service (40m Buffer probe)
    pingEndpoint(
      'OneMap SLA Reverse Geocoding',
      'https://www.onemap.gov.sg/api/public/revgeocode?location=1.3,103.8&buffer=40&addressType=All'
    ),
    // 4. OneMap Routing Service (Balestier to Whampoa walk probe)
    pingEndpoint(
      'OneMap SLA Routing Service',
      'https://www.onemap.gov.sg/api/public/routingsvc/route?start=1.320981,103.844150&end=1.326762,103.8559&routeType=walk'
    ),
    // 5. OneMap WMTS Tile Server
    pingEndpoint(
      'OneMap SLA WMTS Basemap Tiles',
      'https://www.onemap.gov.sg/maps/tiles/Default/11/1655/1020.png'
    ),
  ]);

  const serviceList = [authToken, search, revgeocode, routing, tiles];
  const operationalCount = serviceList.filter((s) => s.status === 'operational').length;
  const totalLatency = serviceList.reduce((acc, s) => acc + s.latencyMs, 0);
  const avgLatency = Math.round(totalLatency / serviceList.length);

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (operationalCount === 0) {
    overallStatus = 'unhealthy';
  } else if (operationalCount < serviceList.length) {
    overallStatus = 'degraded';
  }

  const mem = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() : null;

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    environment: typeof process !== 'undefined' && process.env?.NODE_ENV ? process.env.NODE_ENV : 'development',
    uptimeSeconds: typeof process !== 'undefined' && process.uptime ? Math.round(process.uptime()) : 0,
    system: {
      nodeVersion: typeof process !== 'undefined' ? process.version : 'browser-runtime',
      platform: typeof process !== 'undefined' ? process.platform : 'browser',
      memoryUsageMb: mem ? {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      } : undefined,
    },
    services: {
      onemapAuthToken: authToken,
      onemapElasticSearch: search,
      onemapRevGeocode: revgeocode,
      onemapRouting: routing,
      onemapTiles: tiles,
    },
    metrics: {
      totalServicesChecked: serviceList.length,
      operationalServices: operationalCount,
      averageLatencyMs: avgLatency,
    },
  };
}

/**
 * Standard HTTP Request handler for Express / Node / Vite middlewares
 */
export async function handleHealthRequest(req: any, res: any) {
  try {
    const report = await getApiHealth();
    const httpCode = report.status === 'healthy' ? 200 : report.status === 'degraded' ? 207 : 503;

    res.statusCode = httpCode;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.end(JSON.stringify(report, null, 2));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'unhealthy',
      error: err?.message || 'Health check execution failed',
      timestamp: new Date().toISOString(),
    }));
  }
}
