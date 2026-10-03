import React, { useState } from 'react';
import { Api } from '../../services/api';
import { Sparkles, Download, X, RefreshCw, Palette } from 'lucide-react';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (imageUrl: string, prompt: string) => void;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('Photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<Array<{ url: string; prompt: string }>>([]);

  const styles = [
    'Photorealistic',
    'Cyberpunk Neo-Tokyo',
    'Minimalist Vector Art',
    'Cinematic 3D Render',
    'Watercolor Illustration',
    'Dark Fantasy Oil Painting',
  ];

  const aspectRatios = [
    { label: '1:1 Square', value: '1:1' },
    { label: '16:9 Landscape', value: '16:9' },
    { label: '9:16 Portrait', value: '9:16' },
    { label: '4:3 Standard', value: '4:3' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await Api.generateImage({
        prompt: prompt.trim(),
        aspectRatio,
        style,
      });

      if (res.imageUrl) {
        setGeneratedImage(res.imageUrl);
        setGallery((prev) => [{ url: res.imageUrl, prompt: prompt.trim() }, ...prev]);
      }
    } catch (err: any) {
      console.error('Image gen error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-image-${Date.now()}.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">AI Image Creation Studio</h2>
              <p className="text-xs text-neutral-400">
                Visual generation with custom styles, aspect ratios, and instant export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Prompt Form */}
          <form onSubmit={handleGenerate} className="space-y-3.5 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Image Concept &amp; Description
              </label>
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your scene, subject, lighting, mood (e.g. Glowing biomechanical dragonfly hovering over neon lily pads in night rain)..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-pink-500 resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Visual Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 focus:outline-none"
                >
                  {styles.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.value}
                      type="button"
                      onClick={() => setAspectRatio(ar.value)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition ${
                        aspectRatio === ar.value
                          ? 'bg-neutral-800 text-pink-300 border border-pink-500/40'
                          : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Visual Artwork...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Artwork</span>
                </>
              )}
            </button>
          </form>

          {/* Generated Result Preview */}
          {generatedImage && (
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col items-center">
              <div className="relative rounded-xl overflow-hidden border border-neutral-800 max-h-96 shadow-xl mb-3">
                <img
                  src={generatedImage}
                  alt="Generated artwork"
                  className="w-full max-h-96 object-contain"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(generatedImage)}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-pink-400" />
                  <span>Download Image</span>
                </button>

                {onSendToChat && (
                  <button
                    onClick={() => {
                      onSendToChat(generatedImage, prompt);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-medium transition"
                  >
                    Attach to Chat
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Gallery History */}
          {gallery.length > 1 && (
            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-pink-400" />
                <span>Session Gallery</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gallery.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setGeneratedImage(item.url)}
                    className="relative rounded-lg overflow-hidden border border-neutral-800 cursor-pointer hover:border-pink-500/50 transition group aspect-square"
                  >
                    <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-end p-1.5 text-[10px] text-white truncate">
                      {item.prompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
