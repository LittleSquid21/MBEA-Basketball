import React, { useState, useEffect } from 'react';

interface NewsImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  newsId: string;
  imageUrl?: string;
  title: string;
  className?: string;
}

export default function NewsImage({ newsId, imageUrl, title, className, ...props }: NewsImageProps) {
  const [src, setSrc] = useState<string | undefined>(imageUrl || undefined);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (imageUrl) {
      setSrc(imageUrl);
      setError(false);
      setLoading(true);
    } else {
      setError(true);
      setLoading(false);
    }
  }, [imageUrl, newsId]);

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  // Select a preset high-fidelity localized gradient style based on news ID / title length
  const getGradientPlaceholder = () => {
    const key = (title || newsId || '').length;
    const gradients = [
      'from-orange-600/80 to-amber-950/95', // Basketball orange
      'from-slate-900 via-neutral-900 to-zinc-950', // Premium slate black
      'from-emerald-700/80 to-teal-980/95', // Knights emerald
      'from-indigo-800/80 to-zinc-950/95', // Hermon deep blue-indigo
    ];
    return gradients[key % gradients.length];
  };

  if (error) {
    const gradient = getGradientPlaceholder();
    return (
      <div className={`relative flex flex-col justify-end p-6 bg-gradient-to-br ${gradient} aspect-[16/10] w-full h-full border border-white/5`}>
        {/* Decorative subtle basketball seam path */}
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-200 via-stone-800 to-black"></div>
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
          <svg className="w-48 h-48 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <circle cx="12" cy="12" r="10" />
            <path d="M6.2 6.2c2.4 2.4 2.4 6.2 0 8.6M17.8 6.2c-2.4 2.4-2.4 6.2 0 8.6M2 12h20M12 2v20" />
          </svg>
        </div>
        
        {/* Elegant overlay badge */}
        <div className="relative z-10 space-y-2 select-none">
          <div className="inline-block px-2.5 py-1 rounded-md bg-accent-gold/20 border border-accent-gold/30 text-[10px] text-accent-gold font-black uppercase tracking-wider">
            MEBA NEWS
          </div>
          <p className="text-white/40 text-[11px] font-mono tracking-widest font-black uppercase">
            Official Middle-Earth League Info
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} bg-slate-950 overflow-hidden`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20">
          <div className="w-6 h-6 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        onError={handleError}
        onLoad={handleLoad}
        referrerPolicy="no-referrer"
        alt={title}
        className="w-full h-full object-cover"
        {...props}
      />
    </div>
  );
}
