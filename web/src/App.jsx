import { useState } from 'react';
import axios from 'axios';
import { Download, Link as LinkIcon, Loader2, Play, Video, Music, X } from 'lucide-react';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchInfo = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setVideoInfo(null);
    setIsPlaying(false);
    try {
      const response = await axios.get(`http://localhost:5002/info?url=${encodeURIComponent(url)}`, {
        timeout: 45000 // Increase to 45 seconds
      });
      setVideoInfo(response.data);
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('The request timed out. High-quality media extraction can sometimes take longer. Please try again or use a different link.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch video info. The server might be busy, please try again in a few seconds.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format_id) => {
    window.open(`http://localhost:5002/download?url=${encodeURIComponent(url)}&format_id=${format_id}`, '_blank');
  };

  const getStreamUrl = (originalUrl) => {
    return `http://localhost:5002/stream?url=${encodeURIComponent(originalUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white w-full p-4 md:p-8 flex flex-col items-center">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          mediach
        </h1>
        <p className="text-gray-400 text-lg">The Universal Media Hub for YouTube & Dailymotion</p>
      </header>

      <main className="w-full max-w-3xl">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white"
              placeholder="Paste YouTube or Dailymotion URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
            />
          </div>
          <button
            onClick={fetchInfo}
            disabled={loading || !url}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-xl font-bold transition-colors flex items-center justify-center min-w-[140px]"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {videoInfo && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="md:flex">
              <div className="md:w-1/3 relative group bg-black flex items-center justify-center min-h-[200px]">
                {isPlaying ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video 
                      src={getStreamUrl(videoInfo.formats.find(f => (f.container === 'mp4' || f.container === 'webm') && !f.url.includes('m3u8'))?.url || videoInfo.formats[0]?.url)} 
                      controls 
                      autoPlay 
                      className="max-w-full max-h-full aspect-video"
                    />
                    <button 
                      onClick={() => setIsPlaying(false)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 p-1.5 rounded-full text-white transition-colors z-20"
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
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={() => setIsPlaying(true)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="w-12 h-12 text-white fill-current" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-mono z-10">
                  {Math.floor(videoInfo.duration / 60)}:{String(videoInfo.duration % 60).padStart(2, '0')}
                </div>
              </div>
              <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      videoInfo.source === 'YouTube' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                      {videoInfo.source}
                    </span>
                    <span className="text-gray-400 text-sm">{videoInfo.author}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-4 line-clamp-2">{videoInfo.title}</h2>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Available Formats</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {videoInfo.formats.slice(0, 6).map((format, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDownload(format.format_id)}
                        className="flex items-center justify-between px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition-colors group"
                      >
                        <span className="flex items-center gap-1.5">
                          {format.quality ? <Video className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                          {format.quality || 'Audio'}
                        </span>
                        <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!videoInfo && !loading && !error && (
          <div className="mt-16 text-center">
            <div className="flex justify-center gap-8 mb-6 opacity-20">
              <Video size={48} />
              <Music size={48} />
              <Download size={48} />
            </div>
            <p className="text-gray-500 italic">Enter a URL to start exploring media...</p>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-12 text-gray-600 text-sm">
        &copy; 2026 mediach Media Hub. Built for the modern web.
      </footer>
    </div>
  );
}

export default App;
