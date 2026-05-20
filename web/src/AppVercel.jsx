import { useState } from 'react';
import axios from 'axios';
import {
  Download, Link as LinkIcon, Loader2, Play, Video, Music, X, Sparkles,
  Monitor, FileAudio, FileVideo, CheckCircle2, AlertTriangle,
  Compass, Shield, Flame, PlayCircle, Server
} from 'lucide-react';

const VERCEL_API_BASE = 'https://mediach-one.vercel.app';

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
    <div className="min-h-screen bg-slate-950 text-white w-full p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      {/* Animated Glowing Nebula Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-900/20 blur-[150px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-5xl flex-grow flex flex-col items-center relative z-10">

        {/* Toggle Version Banner */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-slate-400">Vercel Proxy Mode</span>
          </div>
          <button
            onClick={onSwitch}
            className="px-3.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
          >
            Switch to Celestial Direct (Client-Side) &rarr;
          </button>
        </div>

        {/* Header */}
        <header className="mb-10 text-center w-full">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md mb-4 animate-fade-in">
            <Server className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-violet-300 uppercase">Vercel API Gateway</span>
            <Server className="w-4 h-4 text-violet-400 animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-3 bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent tracking-tight leading-none drop-shadow-sm">
            Mediach Vercel
          </h1>
          <p className="text-slate-400 text-lg font-light max-w-lg mx-auto">
            Media downloader powered by Vercel serverless functions and Cobalt redirection.
          </p>
        </header>

        {/* Search Panel */}
        <div className="w-full max-w-3xl mb-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl relative group">
            <div className="absolute inset-[-1px] rounded-3xl bg-gradient-to-r from-violet-500/30 to-cyan-500/30 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-violet-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-10 py-4 bg-slate-950/80 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-violet-500/50 focus:border-transparent outline-none transition-all text-white placeholder-slate-500 font-medium"
                  placeholder="Paste video or audio link here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
                />
                {url && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded-full p-1" />
                  </button>
                )}
              </div>
              <button
                onClick={fetchInfo}
                disabled={loading || !url}
                className="py-4 px-8 bg-gradient-to-r from-violet-500 to-cyan-600 hover:from-violet-400 hover:to-cyan-500 disabled:from-slate-800 disabled:to-slate-900 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center min-w-[140px] shadow-lg shadow-violet-500/10 hover:shadow-violet-400/25 disabled:shadow-none hover:scale-[1.01] active:scale-95 disabled:text-slate-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    <span>Querying Vercel...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 text-yellow-300" />
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="w-full max-w-3xl bg-red-950/20 border border-red-500/30 text-red-200 p-5 rounded-2xl mb-8 shadow-xl backdrop-blur-md animate-fade-in flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Vercel API Error</p>
              <p className="text-sm text-red-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Media Preview & Formats Card */}
        {videoInfo && (
          <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl animate-fade-in mb-12">
            <div className="lg:flex">
              {/* Left Column: Preview */}
              <div className="lg:w-5/12 bg-slate-950/40 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-center relative min-h-[300px] p-6">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 shadow-lg group">
                  {isPlaying ? (
                    <div className="w-full h-full flex items-center justify-center bg-black relative">
                      {streamLoading ? (
                        <div className="flex flex-col items-center gap-2 text-center p-4">
                          <Loader2 className="animate-spin text-violet-400 w-8 h-8" />
                          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Constructing preview stream...</p>
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
                        className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 p-2 rounded-full text-white transition-all backdrop-blur-sm border border-white/10 z-20"
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
                      <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={handlePlayStream}
                          className="bg-violet-500 hover:bg-violet-400 text-white hover:scale-110 active:scale-95 shadow-xl shadow-violet-500/20 p-4 rounded-full transition-all duration-300 flex items-center justify-center group-hover:shadow-violet-400/40"
                        >
                          <Play className="w-8 h-8 fill-current translate-x-[2px]" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {streamError && (
                  <div className="mt-3 p-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{streamError}</span>
                  </div>
                )}

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-violet-400">
                      {videoInfo.source}
                    </span>
                    <button
                      onClick={handlePlayStream}
                      className="text-xs text-slate-400 hover:text-violet-400 transition-colors flex items-center gap-1 font-medium"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Play Preview Mode</span>
                    </button>
                  </div>

                  <h2 className="text-xl font-bold tracking-tight text-slate-100 leading-snug line-clamp-3">
                    {videoInfo.title}
                  </h2>
                  <p className="text-sm text-slate-400 font-medium">
                    Creator: <span className="text-slate-300">{videoInfo.author}</span>
                  </p>
                </div>
              </div>

              {/* Right Column: Formats list fetched from Vercel */}
              <div className="lg:w-7/12 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex border-b border-slate-800 mb-6 gap-2">
                    <button
                      onClick={() => setActiveTab('video')}
                      className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'video'
                        ? 'border-violet-400 text-violet-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>Video Presets</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('audio')}
                      className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'audio'
                        ? 'border-indigo-400 text-indigo-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      <Music className="w-4 h-4" />
                      <span>Audio Presets</span>
                    </button>
                  </div>

                  {activeTab === 'video' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {videoInfo.formats.filter(f => f.type === 'video').map((item) => (
                          <button
                            key={item.format_id}
                            onClick={() => handleDownload(item.format_id)}
                            className="flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-violet-500/40 rounded-2xl text-left transition-all duration-300 group hover:scale-[1.01]"
                          >
                            <div>
                              <p className="font-semibold text-slate-200 text-sm group-hover:text-violet-300 transition-colors">{item.quality}</p>
                              <span className="text-[10px] text-slate-500">Container: {item.container}</span>
                            </div>
                            <Download className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'audio' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {videoInfo.formats.filter(f => f.type === 'audio').map((item) => (
                          <button
                            key={item.format_id}
                            onClick={() => handleDownload(item.format_id)}
                            className="flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl text-left transition-all duration-300 group hover:scale-[1.01]"
                          >
                            <div>
                              <p className="font-semibold text-slate-200 text-sm group-hover:text-indigo-300 transition-colors">{item.quality}</p>
                              <span className="text-[10px] text-slate-500">Format: {item.container}</span>
                            </div>
                            <Download className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-500">
                  <Shield className="w-4 h-4 text-emerald-500/70" />
                  <span>Downloads are proxied safely via server redirects.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Grid / Default View */}
        {!videoInfo && !loading && !error && (
          <div className="w-full mt-10 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-md hover:border-slate-800 transition-all duration-300">
                <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl flex items-center justify-center mb-4">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-200 mb-2">Vercel Backend</h3>
                <p className="text-sm text-slate-400">Powered by serverless routes to fetch clean oEmbed and Cobalt redirection targets.</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-md hover:border-slate-800 transition-all duration-300">
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-200 mb-2">Proxy Redirection</h3>
                <p className="text-sm text-slate-400">Avoids 4.5MB payload size caps on Vercel by utilizing client-side download redirection tunnels.</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-md hover:border-slate-800 transition-all duration-300">
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center mb-4">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-200 mb-2">Multi-Format Presets</h3>
                <p className="text-sm text-slate-400">Supports standard video qualities up to 1080p and high bitrate MP3 audio extraction.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-slate-500 text-xs border-t border-slate-900/80 w-full max-w-5xl z-10">
        <div className="flex items-center justify-center gap-2 mb-2 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-violet-500/80" />
          <span>Powered by Vercel API Gateway</span>
        </div>
        <p className="text-slate-600">&copy; 2026 Celestial Media Hub. Hosted serverless, crafted with cosmic energy.</p>
      </footer>
    </div>
  );
}

export default AppVercel;
