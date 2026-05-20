import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Download, Link as LinkIcon, Loader2, Play, Video, Music, X, Sparkles,
  Monitor, FileAudio, FileVideo, RefreshCw, CheckCircle2, AlertTriangle,
  Compass, Shield, Flame, PlayCircle, Settings, HelpCircle, Globe, Layers
} from 'lucide-react';

const DEFAULT_COBALT_INSTANCES = [
  'https://nuko-c.meowing.de',
  'https://cobaltapi.squair.xyz',
  'https://fox.kittycat.boo',
  'https://dog.kittycat.boo',
  'https://api.dl.woof.monster',
  'https://cobaltapi.kittycat.boo',
  'https://api.qwkuns.me',
  'https://api.cobalt.tools'
];

function App({ onSwitch }) {
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
  const [pickerItems, setPickerItems] = useState([]);

  // Custom API configuration states
  const [instances, setInstances] = useState(DEFAULT_COBALT_INSTANCES);
  const [customInstance, setCustomInstance] = useState(() => {
    return localStorage.getItem('custom_cobalt_instance') || '';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [directoryStatus, setDirectoryStatus] = useState('loading');

  // Load active instances from cobalt.directory dynamically on mount
  useEffect(() => {
    const fetchActiveInstances = async () => {
      try {
        setDirectoryStatus('loading');
        const response = await axios.get('https://cobalt.directory/api/working?type=api', { timeout: 6000 });
        if (response.data && response.data.data) {
          const ytApis = response.data.data.youtube || [];
          const soundcloudApis = response.data.data.soundcloud || [];
          const merged = Array.from(new Set([...ytApis, ...soundcloudApis, ...DEFAULT_COBALT_INSTANCES]));
          if (merged.length > 0) {
            setInstances(merged);
            setDirectoryStatus('online');
            console.log('Loaded active Cobalt mirrors:', merged);
          }
        }
      } catch (err) {
        console.warn('Failed to load online instances list, using default failovers:', err.message);
        setDirectoryStatus('offline');
      }
    };
    fetchActiveInstances();
  }, []);

  // Save custom instance settings
  const handleSaveCustomInstance = (value) => {
    setCustomInstance(value);
    localStorage.setItem('custom_cobalt_instance', value);
  };

  // Extract metadata via oEmbed endpoints for YouTube, Dailymotion, etc.
  const getMediaMetadata = async (mediaUrl) => {
    const isYouTube = mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be');
    const isDailymotion = mediaUrl.includes('dailymotion.com') || mediaUrl.includes('dai.ly');
    const isVimeo = mediaUrl.includes('vimeo.com');
    const isSoundCloud = mediaUrl.includes('soundcloud.com');
    const isTikTok = mediaUrl.includes('tiktok.com');

    let oembedUrl = '';
    let source = 'Online Video';

    if (isYouTube) {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(mediaUrl)}&format=json`;
      source = 'YouTube';
    } else if (isDailymotion) {
      oembedUrl = `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(mediaUrl)}&format=json`;
      source = 'Dailymotion';
    } else if (isVimeo) {
      oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(mediaUrl)}`;
      source = 'Vimeo';
    } else if (isTikTok) {
      oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(mediaUrl)}`;
      source = 'TikTok';
    } else if (isSoundCloud) {
      oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(mediaUrl)}&format=json`;
      source = 'SoundCloud';
    }

    if (oembedUrl) {
      try {
        const res = await axios.get(oembedUrl);
        return {
          title: res.data.title || 'Celestial Media Stream',
          author: res.data.author_name || 'Celestial Creator',
          thumbnail: res.data.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
          source: source
        };
      } catch (e) {
        console.warn('oEmbed failed, using fallback extraction method', e);
      }
    }

    // Generic host-name fallback
    let host = 'Media Source';
    try {
      const urlObj = new URL(mediaUrl);
      host = urlObj.hostname.replace('www.', '');
      host = host.charAt(0).toUpperCase() + host.slice(1);
    } catch (e) { }

    return {
      title: 'Celestial Media File',
      author: 'Unknown Space Explorer',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
      source: host
    };
  };

  // Safe and self-healing Cobalt API request with sequential failover
  const fetchFromCobalt = async (targetUrl, options = {}) => {
    let lastError = null;

    // Resolve dynamic list prioritising custom instance if present
    const instancesToTry = [];
    if (customInstance.trim()) {
      const cleanCustom = customInstance.trim().replace(/\/$/, '');
      instancesToTry.push(cleanCustom);
    }
    instancesToTry.push(...instances);

    const uniqueInstances = Array.from(new Set(instancesToTry));
    console.log('Resolving Cobalt mirrors pipeline:', uniqueInstances);

    // Map parameters to the new Cobalt v7 API schema
    const isAudio = !!options.isAudioOnly;
    const requestBody = {
      url: targetUrl,
      downloadMode: isAudio ? 'audio' : 'auto',
      ...(isAudio ? {
        audioFormat: options.aFormat === 'm4a' ? 'best' : (options.aFormat || 'mp3'),
        audioBitrate: '320'
      } : {
        videoQuality: options.vQuality || '720'
      })
    };

    for (const instance of uniqueInstances) {
      try {
        console.log(`Attempting download with Cobalt instance: ${instance}`, requestBody);
        const response = await axios.post(`${instance}/`, requestBody, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 12000 // 12 seconds timeout per instance to fail fast and fallback
        });

        if (response.data && response.data.status !== 'error') {
          return response.data;
        } else {
          lastError = response.data?.error?.code || 'Instance returned an error';
          console.warn(`Instance ${instance} error:`, lastError);
        }
      } catch (err) {
        lastError = err.response?.data?.error || err.message;
        console.warn(`Instance ${instance} failed:`, err.message);
      }
    }
    throw new Error(`All download servers are currently busy or rate-limited. Try again in a minute. (Reason: ${lastError})`);
  };

  const fetchInfo = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setDownloadError('');
    setVideoInfo(null);
    setIsPlaying(false);
    setStreamUrl('');
    setPickerItems([]);
    setStreamError('');

    try {
      const metadata = await getMediaMetadata(url);
      setVideoInfo(metadata);
    } catch (err) {
      console.error('Metadata fetch error:', err);
      setError('Could not extract media info. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (options, label) => {
    setDownloadingQuality(label);
    setDownloadError('');
    try {
      const data = await fetchFromCobalt(url, options);
      if (data.status === 'redirect' || data.status === 'tunnel') {
        const downloadUrl = data.url;
        // Trigger file download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (data.status === 'picker') {
        setPickerItems(data.picker);
        setActiveTab('picker');
      } else {
        throw new Error('Unsupported response status from server');
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadError(err.message || 'Failed to download format. Please try another quality.');
    } finally {
      setDownloadingQuality(null);
    }
  };

  const handlePlayStream = async () => {
    setIsPlaying(true);
    setStreamLoading(true);
    setStreamError('');
    try {
      const data = await fetchFromCobalt(url, {
        vQuality: '720',
        isAudioOnly: false
      });
      if (data.url) {
        setStreamUrl(data.url);
      } else {
        throw new Error('No stream URL returned');
      }
    } catch (err) {
      console.error('Stream play error:', err);
      setStreamError('Could not play preview stream. Try a different format or download directly.');
      setIsPlaying(false);
    } finally {
      setStreamLoading(false);
    }
  };

  const clearSearch = () => {
    setUrl('');
    setVideoInfo(null);
    setError('');
    setIsPlaying(false);
    setStreamUrl('');
    setPickerItems([]);
  };

  return (
    <div className="min-h-screen bg-[#030010] text-[#f8fafc] w-full p-4 md:p-8 flex flex-col items-center relative overflow-hidden">

      {/* Heavenly/Celestial Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Glowing Golden Light (Nebula) */}
        <div className="absolute top-[-15%] left-[-10%] w-[65%] h-[65%] rounded-full bg-amber-500/10 blur-[150px] animate-float-slow"></div>
        {/* Heavenly Cyan Glow */}
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-400/10 blur-[150px] animate-pulse-ember"></div>
        {/* Soft Violet Nebula */}
        <div className="absolute top-[30%] right-[10%] w-[45%] h-[45%] rounded-full bg-indigo-500/10 blur-[120px] animate-float-slow"></div>

        {/* Twinkling Stars Background */}
        <div className="absolute inset-0 bg-[radial-gradient(1.5px_1.5px_at_50px_80px,#fff_100%,transparent_0),radial-gradient(2px_2px_at_150px_200px,#ffffff_100%,transparent_0),radial-gradient(1px_1px_at_250px_10px,#fff_100%,transparent_0),radial-gradient(2.5px_2.5px_at_350px_150px,#ffffff_80%,transparent_0)] bg-[size:500px_500px] opacity-40 animate-stars-blink"></div>

        {/* Light grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_0.5px,transparent_0.5px),linear-gradient(to_bottom,#1e1b4b_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-20"></div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-5xl flex-grow flex flex-col items-center relative z-10">

        {/* Switch Mode Banner */}
        <div className="w-full flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Celestial Direct Mode</span>
          </div>
          <button
            onClick={onSwitch}
            className="px-4 py-2 bg-gradient-to-r from-red-950/20 to-orange-950/20 hover:from-red-900/30 hover:to-orange-900/30 text-orange-400 border border-orange-500/25 rounded-2xl text-xs font-extrabold transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:border-red-500/50 hover:text-red-400 flex items-center gap-2"
          >
            <span>Descend to Vercel Gateway (Hell Mode)</span> &rarr;
          </button>
        </div>

        {/* Header */}
        <header className="mb-12 text-center w-full mt-4 flex flex-col items-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-amber-400/5 border border-amber-400/20 rounded-full backdrop-blur-md mb-5 shadow-[0_0_15px_rgba(251,191,36,0.05)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span className="text-[10px] font-extrabold tracking-widest text-amber-300 uppercase">✧ Celestial Engine v2.1 ✧</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-amber-300 via-slate-100 to-cyan-300 bg-clip-text text-transparent tracking-tight leading-none drop-shadow-[0_0_30px_rgba(251,191,36,0.12)]">
            Achmed Cobalt
          </h1>
          <p className="text-slate-400 text-base md:text-lg font-light max-w-lg mx-auto tracking-wide leading-relaxed">
            Stream, play and download high-speed media from the heavens with zero ads.
          </p>
        </header>

        {/* Search Panel & Custom Settings Wrapper */}
        <div className="w-full max-w-3xl mb-8 flex flex-col gap-3">
          <div className="bg-[#0b081e]/60 border border-cyan-500/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.05)] relative group">

            {/* Glowing border ring on focus */}
            <div className="absolute inset-[-1px] rounded-3xl bg-gradient-to-r from-amber-400/20 to-cyan-400/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>

            <div className="flex flex-col sm:flex-row gap-3.5 relative z-10">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4.5 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-cyan-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-12 py-4 bg-slate-950/80 border border-cyan-500/15 focus:border-amber-400/40 rounded-2xl focus:ring-2 focus:ring-amber-400/15 outline-none transition-all duration-300 text-white placeholder-slate-500 font-medium text-sm"
                  placeholder="Paste YouTube, SoundCloud, TikTok, or Dailymotion link here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
                />
                {url && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-3.5 flex items-center text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    <X className="w-5 h-5 bg-slate-900 hover:bg-slate-800 rounded-full p-1 border border-cyan-500/10" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={fetchInfo}
                  disabled={loading || !url}
                  className="py-4 px-6 bg-gradient-to-r from-amber-400 to-cyan-500 hover:from-amber-300 hover:to-cyan-400 disabled:from-slate-900 disabled:to-slate-950 text-slate-950 font-black rounded-2xl transition-all duration-300 flex items-center justify-center min-w-[125px] shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.3)] disabled:shadow-none hover:scale-[1.02] active:scale-95 disabled:text-slate-500 flex-1 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      <span>Ascending...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4.5 w-4.5 text-slate-950" />
                      <span>Analyze</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-4 border rounded-2xl transition-all duration-300 cursor-pointer ${showSettings
                    ? 'bg-amber-400/10 border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                    : 'bg-slate-950/80 border-cyan-500/15 text-cyan-400 hover:text-amber-300 hover:border-amber-400/30'
                    }`}
                  title="Configure Downloader Mirrors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Mirrors Panel */}
          {showSettings && (
            <div className="bg-[#0b0821]/50 border border-cyan-500/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl animate-float-slow space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-slate-200">Mirror Downloader Pipeline</h4>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${directoryStatus === 'online'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : directoryStatus === 'loading'
                    ? 'bg-slate-500/10 text-slate-400 border-slate-500/20 animate-pulse'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${directoryStatus === 'online' ? 'bg-emerald-400' : directoryStatus === 'loading' ? 'bg-slate-400' : 'bg-amber-400 animate-ping'}`}></span>
                  {directoryStatus === 'online' ? 'Directory Connected' : directoryStatus === 'loading' ? 'Checking pipeline...' : 'Static Fallbacks Active'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold block">
                  Custom Cobalt Mirror Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInstance}
                    onChange={(e) => handleSaveCustomInstance(e.target.value)}
                    placeholder="E.g., https://your-cobalt-instance.up.railway.app"
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-950/80 border border-cyan-500/15 rounded-xl focus:ring-1 focus:ring-amber-400 focus:border-transparent outline-none text-slate-200 font-mono"
                  />
                  {customInstance && (
                    <button
                      onClick={() => handleSaveCustomInstance('')}
                      className="px-4 text-xs bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all font-bold border border-cyan-500/10"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                  Leave blank to automatically connect to active mirrors list. Deploy your own instance of Cobalt on Railway or Docker if public mirrors become rate-limited in your region.
                </p>
              </div>

              <div className="pt-2">
                <div className="text-[10px] font-bold text-amber-400 mb-2.5 uppercase tracking-widest">Active Channels ({instances.length})</div>
                <div className="flex flex-wrap gap-2 max-h-[90px] overflow-y-auto pr-1">
                  {customInstance && (
                    <span className="text-[9px] px-3 py-1 bg-cyan-950/30 text-cyan-300 border border-cyan-400/20 rounded-lg font-mono font-bold shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                      [Custom] {customInstance.replace(/\/$/, '')}
                    </span>
                  )}
                  {instances.slice(0, 10).map((api, idx) => (
                    <span key={idx} className="text-[9px] px-3 py-1 bg-slate-950/50 text-slate-400 border border-cyan-500/5 rounded-lg font-mono">
                      {api}
                    </span>
                  ))}
                  {instances.length > 10 && (
                    <span className="text-[9px] px-2.5 py-1 text-cyan-400 font-bold bg-cyan-950/10 rounded-lg">+{instances.length - 10} more</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Messaging */}
        {error && (
          <div className="w-full max-w-3xl bg-red-950/10 border border-red-500/30 text-red-200 p-5 rounded-3xl mb-8 shadow-[0_0_20px_rgba(239,68,68,0.1)] backdrop-blur-md animate-fade-in flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300 text-sm">Celestial Analysis Blocked</p>
              <p className="text-xs text-red-400 mt-1 font-light leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Download Error Message */}
        {downloadError && (
          <div className="w-full max-w-3xl bg-amber-950/10 border border-amber-500/30 text-amber-200 p-5 rounded-3xl mb-8 shadow-[0_0_20px_rgba(245,158,11,0.1)] backdrop-blur-md animate-fade-in flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 text-sm">Mirror Redirection Warning</p>
              <p className="text-xs text-amber-400 mt-1 font-light leading-relaxed">{downloadError}</p>
            </div>
          </div>
        )}

        {/* Main Workspace (Video Info and Formats) */}
        {videoInfo && (
          <div className="w-full bg-[#0b081e]/40 border border-cyan-500/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl animate-fade-in mb-12">
            <div className="lg:flex">
              {/* Media Preview Column */}
              <div className="lg:w-5/12 bg-slate-950/40 border-b lg:border-b-0 lg:border-r border-cyan-500/10 flex flex-col justify-center relative min-h-[320px] p-6">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 shadow-xl group border border-cyan-500/10">
                  {isPlaying ? (
                    <div className="w-full h-full flex items-center justify-center bg-black relative">
                      {streamLoading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                          <span className="text-xs text-slate-400 font-medium">Channeling celestial stream...</span>
                        </div>
                      ) : streamError ? (
                        <div className="p-4 text-center">
                          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-300 font-light">{streamError}</p>
                        </div>
                      ) : (
                        <video
                          src={streamUrl}
                          controls
                          autoPlay
                          className="w-full h-full object-contain"
                        />
                      )}
                      <button
                        onClick={() => setIsPlaying(false)}
                        className="absolute top-3 right-3 bg-black/70 hover:bg-cyan-550 p-2 rounded-full text-white transition-all backdrop-blur-sm border border-white/10 z-20 cursor-pointer"
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
                          className="bg-amber-400 hover:bg-amber-300 text-slate-950 hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(251,191,36,0.3)] p-4 rounded-full transition-all duration-300 flex items-center justify-center group-hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] cursor-pointer"
                          title="Stream Video"
                        >
                          <Play className="w-7 h-7 fill-current translate-x-[2px]" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3.5 py-1 bg-gradient-to-r from-amber-400/10 to-cyan-500/10 border border-amber-400/20 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.08)]">
                      {videoInfo.source}
                    </span>
                    <button
                      onClick={handlePlayStream}
                      className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 text-cyan-400" />
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

              {/* Formats and Quality Selection Column */}
              <div className="lg:w-7/12 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  {/* Selector Tabs */}
                  <div className="flex border-b border-cyan-500/10 mb-6 gap-2">
                    <button
                      onClick={() => setActiveTab('video')}
                      className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'video'
                        ? 'border-amber-400 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.15)]'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>Video Qualities</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('audio')}
                      className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'audio'
                        ? 'border-cyan-400 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      <Music className="w-4 h-4" />
                      <span>Audio Formats</span>
                    </button>
                    {pickerItems.length > 0 && (
                      <button
                        onClick={() => setActiveTab('picker')}
                        className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'picker'
                          ? 'border-indigo-400 text-indigo-300'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span>Media Pack ({pickerItems.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Tab Contents: Video Download Buttons */}
                  {activeTab === 'video' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold tracking-widest uppercase">
                        <Monitor className="w-4 h-4 text-amber-400" />
                        <span>Select Video Preset</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: '1080p Full HD', value: '1080', badge: 'Best Quality' },
                          { label: '720p HD', value: '720', badge: 'Recommended' },
                          { label: '480p SD', value: '480', badge: 'Compact size' },
                          { label: '360p Mobile', value: '360', badge: 'Ultra light' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => handleDownload({ vQuality: item.value, isAudioOnly: false }, `video-${item.value}`)}
                            disabled={downloadingQuality !== null}
                            className="flex items-center justify-between p-4 bg-slate-950/60 hover:bg-cyan-950/20 border border-cyan-500/10 hover:border-amber-400/40 rounded-2xl text-left transition-all duration-300 group hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-slate-200 text-sm group-hover:text-amber-300 transition-colors">{item.label}</p>
                              <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-light">{item.badge}</span>
                            </div>
                            {downloadingQuality === `video-${item.value}` ? (
                              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                            ) : (
                              <Download className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab Contents: Audio Download Buttons */}
                  {activeTab === 'audio' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold tracking-widest uppercase">
                        <Music className="w-4 h-4 text-cyan-400" />
                        <span>Select Audio Preset</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'MP3 Audio (High)', format: 'mp3', desc: 'Stereo audio track' },
                          { label: 'M4A Audio (AAC)', format: 'm4a', desc: 'High fidelity AAC' },
                          { label: 'WAV Audio (Lossless)', format: 'wav', desc: 'Uncompressed wave' },
                          { label: 'OPUS Audio', format: 'opus', desc: 'Optimized voice/music' },
                        ].map((item) => (
                          <button
                            key={item.format}
                            onClick={() => handleDownload({ isAudioOnly: true, aFormat: item.format }, `audio-${item.format}`)}
                            disabled={downloadingQuality !== null}
                            className="flex items-center justify-between p-4 bg-slate-950/60 hover:bg-cyan-950/20 border border-cyan-500/10 hover:border-cyan-400/40 rounded-2xl text-left transition-all duration-300 group hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-slate-200 text-sm group-hover:text-cyan-300 transition-colors">{item.label}</p>
                              <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-light">{item.desc}</span>
                            </div>
                            {downloadingQuality === `audio-${item.format}` ? (
                              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                            ) : (
                              <Download className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab Contents: Slides / Multi Item Picker */}
                  {activeTab === 'picker' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold tracking-widest uppercase">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span>Download individual assets</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                        {pickerItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-slate-950/60 border border-cyan-500/10 rounded-2xl"
                          >
                            <div className="flex items-center gap-3">
                              {item.thumb ? (
                                <img src={item.thumb} className="w-10 h-10 object-cover rounded-lg bg-black/40 border border-cyan-500/10" />
                              ) : (
                                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-cyan-500/5">
                                  {item.type === 'audio' ? <Music className="w-5 h-5 text-cyan-400" /> : <Video className="w-5 h-5 text-amber-400" />}
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-slate-200 capitalize">{item.type || 'Asset'} #{idx + 1}</p>
                                <span className="text-[9px] text-slate-500 font-light">Ready to download</span>
                              </div>
                            </div>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/15 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 rounded-xl transition-all"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-cyan-500/10 flex items-center gap-2 text-[11px] text-slate-500">
                  <Shield className="w-4 h-4 text-emerald-500/75 drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]" />
                  <span className="font-light">Secure, direct and ad-free tunnel to media nodes.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Grid / Default View */}
        {!videoInfo && !loading && !error && (
          <div className="w-full mt-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">

              <div className="bg-[#0b081e]/40 border border-cyan-500/10 p-6 rounded-3xl backdrop-blur-md hover:border-amber-400/25 hover:shadow-[0_0_30px_rgba(251,191,36,0.04)] hover:-translate-y-1 transition-all duration-500">
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center mb-4.5 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-200 mb-2 text-sm tracking-wide uppercase">Universal Support</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">Works with YouTube, SoundCloud, TikTok, Dailymotion, Instagram, Twitter/X and more platforms.</p>
              </div>

              <div className="bg-[#0b081e]/40 border border-cyan-500/10 p-6 rounded-3xl backdrop-blur-md hover:border-amber-400/25 hover:shadow-[0_0_30px_rgba(251,191,36,0.04)] hover:-translate-y-1 transition-all duration-500">
                <div className="w-10 h-10 bg-amber-400/10 border border-amber-400/20 text-amber-300 rounded-xl flex items-center justify-center mb-4.5 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-200 mb-2 text-sm tracking-wide uppercase">Zero Tracking</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">Pure client-side downloading. No data is stored, cached, or tracked. Privacy by design.</p>
              </div>

              <div className="bg-[#0b081e]/40 border border-cyan-500/10 p-6 rounded-3xl backdrop-blur-md hover:border-amber-400/25 hover:shadow-[0_0_30px_rgba(251,191,36,0.04)] hover:-translate-y-1 transition-all duration-500">
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center mb-4.5 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-200 mb-2 text-sm tracking-wide uppercase">High Quality Presets</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">Download high-definition videos up to 1080p/4K or convert streams to MP3/M4A audio packages.</p>
              </div>
            </div>

            {/* Compatible Network Grid */}
            <div className="text-center mb-10">
              <p className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase mb-5">Compatible Networks</p>
              <div className="flex flex-wrap justify-center items-center gap-3 max-w-2xl mx-auto opacity-75 hover:opacity-100 transition-opacity duration-300">
                {['YouTube', 'SoundCloud', 'TikTok', 'Dailymotion', 'Instagram', 'Twitter/X', 'Vimeo', 'Pinterest'].map((net) => (
                  <span key={net} className="text-xs font-semibold text-cyan-300 border border-cyan-500/15 bg-cyan-950/20 px-4 py-1.5 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.02)] hover:border-amber-400/35 hover:text-amber-300 transition-colors duration-300">{net}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-slate-500 text-xs border-t border-cyan-500/5 w-full max-w-5xl z-10">
        <div className="flex items-center justify-center gap-2 mb-2.5 font-bold text-amber-300/80 drop-shadow-[0_0_6px_rgba(245,158,11,0.08)]">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>No cookies or local database files required.</span>
        </div>
        <p className="text-slate-600 font-light">&copy; 2026 Celestial Media Hub. Hosted serverless, crafted with cosmic energy.</p>
      </footer>
    </div>
  );
}

export default App;
