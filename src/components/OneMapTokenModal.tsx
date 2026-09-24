import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink,
  Sparkles,
  RefreshCw,
  Trash2,
  Search,
  CheckCircle2
} from 'lucide-react';
import { 
  mintOneMapToken, 
  saveOneMapToken, 
  clearOneMapToken, 
  activateDemoOneMapToken, 
  StoredOneMapAuth,
  testOneMapRafflesPlaceSearch,
  OneMapSearchExecution
} from '../utils/onemap';

interface OneMapTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenState: StoredOneMapAuth;
  onTokenUpdated: (newState: StoredOneMapAuth) => void;
}

export const OneMapTokenModal: React.FC<OneMapTokenModalProps> = ({
  isOpen,
  onClose,
  tokenState,
  onTokenUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'mint' | 'paste' | 'demo' | 'test'>('mint');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [pasteTokenInput, setPasteTokenInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedEndpoints, setCopiedEndpoints] = useState<boolean>(false);

  // Search Probe State
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<OneMapSearchExecution | null>(null);

  if (!isOpen) return null;

  const handleMintToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await mintOneMapToken(emailInput, passwordInput);
      if (result.success && result.token) {
        setSuccessMessage('Successfully minted 3-day OneMap SLA token! Map services are now authenticated.');
        onTokenUpdated({
          token: result.token,
          expiryTimestamp: result.expiryTimestamp ? new Date(result.expiryTimestamp).getTime() : Date.now() + 3 * 24 * 3600 * 1000,
          email: emailInput.trim(),
          isExpired: false,
          hoursRemaining: 72,
        });
        setEmailInput('');
        setPasswordInput('');
      } else {
        setErrorMessage(result.error || 'Failed to mint token. Please verify your OneMap email & password.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error occurred while contacting OneMap.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteTokenInput.trim()) return;

    saveOneMapToken(pasteTokenInput.trim(), undefined, 'Manual Token');
    onTokenUpdated({
      token: pasteTokenInput.trim(),
      expiryTimestamp: Date.now() + 3 * 24 * 3600 * 1000,
      email: 'Manual Entry',
      isExpired: false,
      hoursRemaining: 72,
    });
    setSuccessMessage('OneMap token saved! Active for 72 hours.');
    setPasteTokenInput('');
  };

  const handleActivateDemo = () => {
    const demo = activateDemoOneMapToken();
    onTokenUpdated(demo);
    setSuccessMessage('Activated 72-Hour OneMap Developer Sandbox session.');
  };

  const handleRevokeToken = () => {
    clearOneMapToken();
    onTokenUpdated({
      token: null,
      expiryTimestamp: null,
      email: null,
      isExpired: true,
      hoursRemaining: 0,
    });
    setSuccessMessage('OneMap token cleared.');
    setProbeResult(null);
  };

  const handleRunSearchProbe = async () => {
    setIsProbing(true);
    setErrorMessage(null);
    try {
      const res = await testOneMapRafflesPlaceSearch(tokenState.token);
      setProbeResult(res);
      if (res.isAuthorized) {
        setSuccessMessage(`Authorization verified! OneMap returned ${res.totalFound} results for 'raffles place'.`);
      } else if (res.errorMessage) {
        setErrorMessage(`Authorization Notice: ${res.errorMessage}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to probe search endpoint.');
    } finally {
      setIsProbing(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (tokenState.token) {
      navigator.clipboard.writeText(tokenState.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const copyEndpointsToClipboard = () => {
    const text = `# Mint a token (POST, JSON body {"email":"...","password":"..."}; lasts 3 days):\nhttps://www.onemap.gov.sg/api/auth/post/getToken\n\n# Geocode / search (Authorization header now officially required):\nhttps://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    navigator.clipboard.writeText(text);
    setCopiedEndpoints(true);
    setTimeout(() => setCopiedEndpoints(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border border-slate-200 max-w-xl w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-slate-800" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                OneMap SLA API Token & Search Auth
              </h2>
              <p className="text-xs text-slate-500">
                Singapore Land Authority Official Map Services Integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Specification Banner with Both Endpoints */}
        <div className="bg-slate-900 text-slate-200 p-3.5 text-xs font-mono border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>SLA OneMap API Contracts:</span>
            </div>
            <button
              onClick={copyEndpointsToClipboard}
              className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedEndpoints ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedEndpoints ? 'Copied' : 'Copy Both'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] space-y-1">
            <p className="text-slate-400">
              # Mint a token (POST, JSON body &#123;"email":"...","password":"..."&#125;; lasts 3 days):
            </p>
            <p className="text-sky-300 break-all select-all">
              https://www.onemap.gov.sg/api/auth/post/getToken
            </p>
          </div>

          <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] space-y-1">
            <p className="text-amber-400 font-medium">
              # Geocode / search (Authorization header now officially required):
            </p>
            <p className="text-sky-300 break-all select-all">
              https://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1
            </p>
          </div>
        </div>

        {/* Current Active Token Status */}
        <div className="p-4 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Authorization Status:</span>
            {tokenState.token && !tokenState.isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                Authorized ({tokenState.hoursRemaining}h remaining)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                Missing Header Token (Mint Required)
              </span>
            )}
          </div>

          {tokenState.token && (
            <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex items-center justify-between gap-2">
              <div className="truncate font-mono text-slate-600">
                <span className="text-slate-400 font-semibold">Header: </span>
                <span className="text-slate-900">Authorization: </span>
                {tokenState.token.substring(0, 22)}...
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={copyTokenToClipboard}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Copy token string"
                >
                  {copiedToken ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleRevokeToken}
                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  title="Revoke / Clear token"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Notice:</span> {errorMessage}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-4 pt-3 bg-slate-50 text-xs font-medium gap-2">
          <button
            onClick={() => setActiveTab('mint')}
            className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'mint'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Mint from SLA Credentials
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'test'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Test Search Probe
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'paste'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste Token
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'demo'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sandbox Mode
          </button>
        </div>

        {/* Tab 1: Mint Token */}
        {activeTab === 'mint' && (
          <form onSubmit={handleMintToken} className="p-4 space-y-3">
            <p className="text-xs text-slate-500">
              Enter your registered OneMap portal credentials to mint a 72-hour access token directly from Singapore Land Authority API.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                OneMap Account Email
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                OneMap Account Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-slate-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Must fulfill 3 of 4 conditions (lowercase, uppercase, number, special character; 8-60 characters).
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href="https://www.onemap.gov.sg/apidocs/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <span>Register at OneMap.gov.sg</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Minting Token...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Mint 3-Day OneMap Token</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Test Search Probe */}
        {activeTab === 'test' && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-600">
              Probes the official OneMap Elastic Search API using the test query <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">searchVal=raffles%20place</code> with your active <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">Authorization</code> header.
            </p>

            <button
              onClick={handleRunSearchProbe}
              disabled={isProbing}
              className="w-full py-2.5 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProbing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Search Probe...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Execute Search Probe: "raffles place"</span>
                </>
              )}
            </button>

            {probeResult && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Probe Response:</span>
                  <span className="font-mono text-slate-500">
                    {probeResult.totalFound} results matched
                  </span>
                </div>

                {probeResult.items.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1 font-mono text-[11px]">
                    {probeResult.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-slate-200">
                        <div className="font-semibold text-slate-900">{item.SEARCHVAL}</div>
                        <div className="text-slate-500 text-[10px]">{item.ADDRESS}</div>
                        <div className="text-slate-400 text-[10px] flex items-center gap-2 mt-0.5">
                          <span>SVY21: X:{Math.round(parseFloat(item.X))} Y:{Math.round(parseFloat(item.Y))}</span>
                          <span>·</span>
                          <span>WGS84: {parseFloat(item.LATITUDE).toFixed(4)}, {parseFloat(item.LONGITUDE).toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Paste Existing Token */}
        {activeTab === 'paste' && (
          <form onSubmit={handlePasteToken} className="p-4 space-y-3">
            <p className="text-xs text-slate-500">
              Already minted a token via cURL or Postman? Paste the Bearer token directly here to unlock OneMap features.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                OneMap Access Token
              </label>
              <textarea
                rows={3}
                required
                value={pasteTokenInput}
                onChange={(e) => setPasteTokenInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full p-2.5 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors cursor-pointer"
              >
                Save & Authenticate Map
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Sandbox */}
        {activeTab === 'demo' && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Don't have a registered OneMap SLA developer account yet? You can activate a 72-hour sandbox session to simulate all map capabilities, basemap styling, and geocoding.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1 font-mono text-slate-700">
              <div>Session: OneMap Developer Sandbox (EPSG:3414)</div>
              <div>Duration: 72 Hours (3 Days)</div>
              <div>Basemaps: Default, Night, Grey, Original</div>
            </div>

            <button
              onClick={handleActivateDemo}
              className="w-full py-2.5 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Activate 72-Hour Sandbox Token</span>
            </button>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>Official SLA OneMap v2 Endpoint</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
