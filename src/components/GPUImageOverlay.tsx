import React from 'react';
import { motion } from 'framer-motion';

interface GPUImageOverlayProps {
  src: string;
  alt: string;
  className?: string;
  power?: number;
  showScanner?: boolean;
}

const GPUImageOverlay: React.FC<GPUImageOverlayProps> = ({
  src,
  alt,
  className = '',
  power = 0,
  showScanner = true,
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Base image with enhanced contrast */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{
          filter: 'contrast(1.1) saturate(1.2)',
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement!.innerHTML = `
            <div class="w-full h-full bg-gradient-to-br from-amber-600 to-emerald-600 flex items-center justify-center">
              <div class="text-center">
                <div class="text-3xl font-display font-bold text-white">${alt}</div>
                <div class="text-sm text-white/60">${power} TFLOPS</div>
              </div>
            </div>
          `;
        }}
      />

      {/* Neon border glow */}
      <div className="absolute inset-0 rounded-inherit pointer-events-none">
        <div className="absolute inset-0 border-2 border-amber-500/25 rounded-inherit" />
        <div className="absolute inset-0 border border-emerald-400/20 rounded-inherit" />
      </div>

      {/* Scanner animation */}
      {showScanner && (
        <motion.div
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 right-0 h-16 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(124, 58, 237, 0.1), rgba(6, 182, 212, 0.1), transparent)',
          }}
        />
      )}

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-amber-400/30 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-emerald-400/30 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-emerald-400/30 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-amber-400/30 rounded-br-lg" />

      {/* Power indicator overlay */}
      {power > 0 && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-[#0c101c]/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center justify-between">
            <span className="text-[9px] text-amber-300 uppercase tracking-wider">Power</span>
            <span className="font-display text-xs text-emerald-400 font-bold">{power} TF</span>
          </div>
        </div>
      )}

      {/* Holographic shimmer */}
      <motion.div
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-emerald-500/10 pointer-events-none"
      />
    </div>
  );
};

export default GPUImageOverlay;
