import { useState } from 'react';
import axios from 'axios';
import {
  Download, Link as LinkIcon, Loader2, Play, Video, Music, X, Sparkles,
  Monitor, FileAudio, FileVideo, CheckCircle2, AlertTriangle,
  Compass, Shield, Flame, PlayCircle, Server, Layers
} from 'lucide-react';

const VERCEL_API_BASE = 'https://Achmed-one.vercel.app';

const DEFAULT_COBALT_INSTANCES = [
  'https://cobaltapi.squair.xyz',
  'https://fox.kittycat.boo',
  'https://dog.kittycat.boo',
  'https://api.dl.woof.monster',
  'https://cobaltapi.kittycat.boo',
  'https://api.cobalt.tools'
];

function AppVercel({ onSwitch }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  const [downloadingQuality, setDownloadingQuality] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState('');

  const fetchInfo = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setDownloadError('');
    setVideoInfo(null);
    setIsPlaying(false);
    setStreamUrl('');
    setStreamError('');

    try {
      // Query the Vercel API for media info
      const res = await axios.get(`${VERCEL_API_BASE}/info?url=${encodeURIComponent(url)}`);
      if (res.data && !res.data.error) {
        // Clean up format mappings to align with Cobalt qualities
        const cleanFormats = (res.data.formats || []).map(f => {
          if (f.format_id === '485') {
            return { ...f, format_id: '480' }; // Map the legacy format ID to valid quality
          }
          return f;
        });

        setVideoInfo({
          title: res.data.title || 'Vercel Media File',
          author: res.data.author || 'Unknown Creator',
          thumbnail: res.data.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
          source: res.data.source || 'Web Link',
          formats: cleanFormats
        });
      } else {
        throw new Error(res.data.error || 'Invalid metadata returned');
      }
    } catch (err) {
      console.error('Vercel API metadata error:', err);
      setError('Could not retrieve metadata from Vercel API. Make sure the backend is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (formatId) => {
    // Direct Vercel redirect trigger
    const downloadEndpoint = `${VERCEL_API_BASE}/download?url=${encodeURIComponent(url)}&format_id=${formatId}`;
    window.open(downloadEndpoint, '_blank');
  };

  const handlePlayStream = async () => {
    setIsPlaying(true);
    setStreamLoading(true);
    setStreamError('');

    // Resolve dynamic active list of mirrors
    let instances = [...DEFAULT_COBALT_INSTANCES];
    try {
      const response = await axios.get('https://cobalt.directory/api/working?type=api', { timeout: 4000 });
      if (response.data && response.data.data) {
        const ytApis = response.data.data.youtube || [];
        const soundcloudApis = response.data.data.soundcloud || [];
        const merged = Array.from(new Set([...ytApis, ...soundcloudApis, ...DEFAULT_COBALT_INSTANCES]));
        if (merged.length > 0) {
          instances = merged;
        }
      }
    } catch (err) {
      console.warn('Failed to load online instances list for preview streaming, using defaults');
    }

    const requestBody = {
      url,
      downloadMode: 'auto',
      videoQuality: '720'
    };

    let lastError = '';
    for (const instance of instances) {
      try {
        const res = await axios.post(`${instance}/`, requestBody, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 6000
        });
        if (res.data && res.data.url) {
          setStreamUrl(res.data.url);
          setStreamLoading(false);
          return;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    setStreamError('Could not initialize streaming tunnel. Reason: ' + lastError);
    setIsPlaying(false);
    setStreamLoading(false);
  };

  const clearSearch = () => {
    setUrl('');
    setVideoInfo(null);
    setError('');
    setIsPlaying(false);
    setStreamUrl('');
    setStreamError('');
  };

  return (
    <div className="min-h-screen bg-[#050000] text-[#f8fafc] w-full p-4 md:p-8 flex flex-col items-center relative overflow-hidden">

      {/* Hellish Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Deep Crimson Pit Glow */}
        <div className="absolute top-[-15%] left-[-10%] w-[65%] h-[65%] rounded-full bg-red-950/20 blur-[150px] animate-pulse-ember"></div>
        {/* Burning Magma Orange Glow */}
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[150px] animate-pulse-ember"></div>
        {/* Dark Ash/Charcoal Smoke Area */}
        <div className="absolute top-[30%] right-[10%] w-[45%] h-[45%] rounded-full bg-neutral-950/50 blur-[120px]"></div>

        {/* Floating Red-Orange Embers */}
        <div className="absolute inset-0 bg-[radial-gradient(1.5px_1.5px_at_80px_100px,#ef4444_100%,transparent_0),radial-gradient(2px_2px_at_200px_350px,#f97316_100%,transparent_0),radial-gradient(1px_1px_at_120px_20px,#ef4444_100%,transparent_0),radial-gradient(2.5px_2.5px_at_280px_180px,#ea580c_80%,transparent_0)] bg-[size:450px_450px] opacity-25 animate-stars-blink"></div>

        {/* Heavy grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3f0f0f_0.5px,transparent_0.5px),linear-gradient(to_bottom,#3f0f0f_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-20"></div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-5xl flex-grow flex flex-col items-center relative z-10">

        {/* Toggle Version Banner */}
        <div className="w-full flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.25)]">Vercel Proxy Mode</span>
          </div>
          <button
            onClick={onSwitch}
            className="px-4 py-2 bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 hover:from-cyan-900/30 hover:to-indigo-900/30 text-cyan-400 border border-cyan-500/25 rounded-2xl text-xs font-extrabold transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:border-cyan-500/50 hover:text-cyan-300 flex items-center gap-2"
          >
            <span>Ascend to Celestial Direct (Heaven Mode)</span> &rarr;
          </button>
        </div>

        {/* Header */}
        <header className="mb-12 text-center w-full mt-4 flex flex-col items-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-red-950/30 border border-red-500/20 rounded-full backdrop-blur-md mb-5 shadow-[0_0_15px_rgba(239,68,68,0.08)]">
            <Server className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="text-[10px] font-extrabold tracking-widest text-red-400 uppercase">🔥 Vercel API Gateway 🔥</span>
            <Server className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-red-600 via-orange-400 to-red-500 bg-clip-text text-transparent tracking-tight leading-none drop-shadow-[0_0_30px_rgba(239,68,68,0.25)]">
            Achmed Vercel
          </h1>
          <p className="text-slate-400 text-base md:text-lg font-light max-w-lg mx-auto tracking-wide leading-relaxed">
            Media downloader powered by Vercel serverless functions and Cobalt redirection.
          </p>
        </header>

        {/* Search Panel */}
        <div className="w-full max-w-3xl mb-8">
          <div className="bg-[#0e0202]/60 border border-red-500/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.05)] relative group">

            {/* Glowing border ring on focus */}
            <div className="absolute inset-[-1px] rounded-3xl bg-gradient-to-r from-red-500/20 to-orange-550/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>

            <div className="flex flex-col sm:flex-row gap-3.5 relative z-10">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4.5 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-red-500" />
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-12 py-4 bg-neutral-950/80 border border-red-500/15 focus:border-orange-500/40 rounded-2xl focus:ring-2 focus:ring-red-500/15 outline-none transition-all duration-300 text-white placeholder-neutral-600 font-medium text-sm"
                  placeholder="Paste video or audio link here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
                />
                {url && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-3.5 flex items-center text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-5 h-5 bg-neutral-900 hover:bg-neutral-800 rounded-full p-1 border border-red-500/10" />
                  </button>
                )}
              </div>
              <button
                onClick={fetchInfo}
                disabled={loading || !url}
                className="py-4 px-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-neutral-900 disabled:to-neutral-950 text-white font-extrabold rounded-2xl transition-all duration-300 flex items-center justify-center min-w-[140px] shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.35)] disabled:shadow-none hover:scale-[1.02] active:scale-95 disabled:text-neutral-500 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    <span>Querying...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4.5 w-4.5 text-yellow-300" />
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="w-full max-w-3xl bg-red-950/10 border border-red-500/30 text-red-200 p-5 rounded-3xl mb-8 shadow-[0_0_20px_rgba(239,68,68,0.1)] backdrop-blur-md animate-fade-in flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300 text-sm">Vercel API Gateway Blocked</p>
              <p className="text-xs text-red-400 mt-1 font-light leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Media Preview & Formats Card */}
        {videoInfo && (
          <div className="w-full bg-[#0d0202]/40 border border-red-500/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl animate-fade-in mb-12">
            <div className="lg:flex">
              {/* Left Column: Preview */}
              <div className="lg:w-5/12 bg-neutral-950/40 border-b lg:border-b-0 lg:border-r border-red-500/10 flex flex-col justify-center relative min-h-[320px] p-6">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 shadow-xl group border border-red-500/10">
                  {isPlaying ? (
                    <div className="w-full h-full flex items-center justify-center bg-black relative">
                      {streamLoading ? (
                        <div className="flex flex-col items-center gap-2 text-center p-4">
                          <Loader2 className="animate-spin text-red-500 w-8 h-8" />
                          <p className="text-xs text-neutral-400 font-semibold tracking-wider uppercase mt-2">Opening stream channel...</p>
                        </div>
                      ) : streamUrl ? (
                        <video
                          src={streamUrl}
                          controls
                          autoPlay
                          className="w-full h-full object-contain"
                        />
                      ) : null}
                      <button
                        onClick={() => setIsPlaying(false)}
                        className="absolute top-3 right-3 bg-black/70 hover:bg-neutral-850 p-2 rounded-full text-white transition-all backdrop-blur-sm border border-white/10 z-20 cursor-pointer"
                        title="Close Player"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <img
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-neutral-950/40 group-hover:bg-neutral-950/20 transition-colors duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={handlePlayStream}
                          className="bg-red-600 hover:bg-red-500 text-white hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)] p-4 rounded-full transition-all duration-300 flex items-center justify-center group-hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] cursor-pointer"
                        >
                          <Play className="w-7 h-7 fill-current translate-x-[2px]" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {streamError && (
                  <div className="mt-3 p-3.5 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2 font-light">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{streamError}</span>
                  </div>
                )}

                <div className="mt-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3.5 py-1 bg-gradient-to-r from-red-600/10 to-orange-600/10 border border-red-500/25 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.08)]">
                      {videoInfo.source}
                    </span>
                    <button
                      onClick={handlePlayStream}
                      className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 text-red-550" />
                      <span>Play Preview Mode</span>
                    </button>
                  </div>

                  <h2 className="text-lg font-bold tracking-tight text-slate-100 leading-snug line-clamp-3">
                    {videoInfo.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Creator: <span className="text-slate-300 font-semibold">{videoInfo.author}</span>
                  </p>
                </div>
              </div>

              {/* Right Column: Formats list fetched from Vercel */}
              <div className="lg:w-7/12 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex border-b border-red-500/10 mb-6 gap-2">
                    <button
                      onClick={() => setActiveTab('video')}
                      className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'video'
                          ? 'border-red-500 text-red-450 drop-shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                          : 'border-transparent text-neutral-400 hover:text-neutral-200'
                        }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>Video Presets</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('audio')}
                      className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'audio'
                          ? 'border-orange-500 text-orange-450 drop-shadow-[0_0_8px_rgba(249,115,22,0.15)]'
                          : 'border-transparent text-neutral-400 hover:text-neutral-200'
                        }`}
                    >
                      <Music className="w-4 h-4" />
                      <span>Audio Presets</span>
                    </button>
                  </div>

                  {activeTab === 'video' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {videoInfo.formats.filter(f => f.type === 'video').map((item) => (
                          <button
                            key={item.format_id}
                            onClick={() => handleDownload(item.format_id)}
                            className="flex items-center justify-between p-4 bg-neutral-950/60 hover:bg-red-950/20 border border-red-500/10 hover:border-red-550/40 rounded-2xl text-left transition-all duration-300 group hover:scale-[1.01] cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-slate-200 text-sm group-hover:text-red-400 transition-colors">{item.quality}</p>
                              <span className="text-[10px] text-neutral-500">Container: {item.container}</span>
                            </div>
                            <Download className="w-5 h-5 text-slate-500 group-hover:text-red-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'audio' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {videoInfo.formats.filter(f => f.type === 'audio').map((item) => (
                          <button
                            key={item.format_id}
                            onClick={() => handleDownload(item.format_id)}
                            className="flex items-center justify-between p-4 bg-neutral-950/60 hover:bg-red-950/20 border border-red-500/10 hover:border-orange-550/40 rounded-2xl text-left transition-all duration-300 group hover:scale-[1.01] cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-slate-200 text-sm group-hover:text-orange-400 transition-colors">{item.quality}</p>
                              <span className="text-[10px] text-neutral-500">Format: {item.container}</span>
                            </div>
                            <Download className="w-5 h-5 text-slate-500 group-hover:text-orange-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-red-500/10 flex items-center gap-2 text-[11px] text-slate-500">
                  <Shield className="w-4 h-4 text-emerald-500/75 drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]" />
                  <span className="font-light">Downloads are proxied safely via server redirection.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Grid / Default View */}
        {!videoInfo && !loading && !error && (
          <div className="w-full mt-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

              <div className="bg-[#0e0202]/40 border border-red-500/10 p-6 rounded-3xl backdrop-blur-md hover:border-orange-500/25 hover:shadow-[0_0_30px_rgba(239,68,68,0.04)] hover:-translate-y-1 transition-all duration-500">
                <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center mb-4.5 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-200 mb-2 text-sm tracking-wide uppercase">Vercel Backend</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">Powered by serverless routes to fetch clean oEmbed and Cobalt redirection targets.</p>
              </div>

              <div className="bg-[#0e0202]/40 border border-red-500/10 p-6 rounded-3xl backdrop-blur-md hover:border-orange-500/25 hover:shadow-[0_0_30px_rgba(239,68,68,0.04)] hover:-translate-y-1 transition-all duration-500">
                <div className="w-10 h-10 bg-orange-600/10 border border-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center mb-4.5 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-200 mb-2 text-sm tracking-wide uppercase">Proxy Redirection</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">Avoids 4.5MB payload size caps on Vercel by utilizing client-side download redirection tunnels.</p>
              </div>

              <div className="bg-[#0e0202]/40 border border-red-500/10 p-6 rounded-3xl backdrop-blur-md hover:border-orange-500/25 hover:shadow-[0_0_30px_rgba(239,68,68,0.04)] hover:-translate-y-1 transition-all duration-500">
                <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center mb-4.5 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-200 mb-2 text-sm tracking-wide uppercase">Multi-Format Presets</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">Supports standard video qualities up to 1080p and high bitrate MP3 audio extraction.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-slate-500 text-xs border-t border-red-500/5 w-full max-w-5xl z-10">
        <div className="flex items-center justify-center gap-2 mb-2.5 font-bold text-red-450 drop-shadow-[0_0_6px_rgba(239,68,68,0.15)]">
          <CheckCircle2 className="w-4 h-4 text-red-550" />
          <span>Powered by Vercel API Gateway</span>
        </div>
        <p className="text-slate-600 font-light">&copy; 2026 Celestial Media Hub. Hosted serverless, crafted with cosmic energy.</p>
      </footer>
    </div>
  );
}

export default AppVercel;
