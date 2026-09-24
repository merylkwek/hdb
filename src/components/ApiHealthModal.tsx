import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  X,
  Server,
  Cpu,
  Clock,
  Zap,
  Globe
} from 'lucide-react';
import { checkApiHealth, ApiHealthReport } from '../api/health';

interface ApiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<ApiHealthReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'json'>('overview');

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await checkApiHealth();
      setReport(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const services = report?.services ? Object.values(report.services) : [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-md ${
              report?.status === 'healthy' 
                ? 'bg-emerald-100 text-emerald-700' 
                : report?.status === 'degraded' 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-rose-100 text-rose-700'
            }`}>
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>API Health Status Monitor</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  /api/health
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Live endpoint probes, latency telemetry &amp; SLA microservices status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              title="Refresh Health Status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">System Status:</span>
            {loading ? (
              <span className="text-sky-400 animate-pulse font-semibold">Probing Endpoints...</span>
            ) : report?.status === 'healthy' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Services Operational
              </span>
            ) : report?.status === 'degraded' ? (
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" /> Partially Degraded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                <XCircle className="w-3.5 h-3.5" /> Service Unreachable
              </span>
            )}
          </div>

          {report && (
            <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
              <span>Avg Latency: <strong className="text-sky-300">{report.metrics.averageLatencyMs}ms</strong></span>
              <span>Uptime: <strong className="text-emerald-300">{report.uptimeSeconds}s</strong></span>
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 px-5 pt-3 bg-white">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Service Endpoints ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
              activeTab === 'json'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Raw JSON Output
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'overview' ? (
            <>
              {/* Quick Telemetry Cards */}
              {report && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                    <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Server className="w-3 h-3 text-slate-400" /> Environment
                    </div>
                    <div className="font-semibold text-slate-900 capitalize font-mono">
                      {report.environment}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                    <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Cpu className="w-3 h-3 text-slate-400" /> Runtime
                    </div>
                    <div className="font-semibold text-slate-900 font-mono truncate">
                      {report.system.nodeVersion}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                    <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Zap className="w-3 h-3 text-slate-400" /> Operational
                    </div>
                    <div className="font-semibold text-emerald-600 font-mono">
                      {report.metrics.operationalServices} / {report.metrics.totalServicesChecked}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                    <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" /> Last Checked
                    </div>
                    <div className="font-semibold text-slate-900 font-mono text-[10px]">
                      {new Date(report.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Endpoints List */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Monitored Services &amp; SLA Endpoints
                </h3>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {services.map((item, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            item.status === 'operational' ? 'bg-emerald-500' : item.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          <span className="font-bold text-slate-900 truncate">
                            {item.service}
                          </span>
                          {item.httpStatus ? (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              HTTP {item.httpStatus}
                            </span>
                          ) : null}
                        </div>

                        <div className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                          {item.endpoint}
                        </div>

                        {item.message && (
                          <div className="text-[11px] text-slate-600 mt-1">
                            {item.message}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900">
                          {item.latencyMs} ms
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          item.status === 'operational' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : item.status === 'degraded' 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">Response from GET /api/health</span>
                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-200 rounded font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Singapore Land Authority OneMap v2.0 Platform</span>
          </div>

          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Testing API...' : 'Run Diagnostics'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
