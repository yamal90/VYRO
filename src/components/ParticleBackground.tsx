import React from 'react';

const ParticleBackgroundInner: React.FC<{ intensity?: 'low' | 'medium' | 'high' }> = ({
  intensity = 'medium',
}) => {
  const opacityMap = { low: 0.2, medium: 0.35, high: 0.5 };
  const opacity = opacityMap[intensity];
  const showThirdOrb = intensity !== 'low';
  const animatedGrid = intensity === 'high';

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity }}
      aria-hidden="true"
    >
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-amber-600/14 rounded-full blur-2xl animate-float-gentle" />
      <div
        className="absolute top-1/3 right-1/4 w-60 h-60 bg-emerald-500/8 rounded-full blur-2xl animate-float-gentle"
        style={{ animationDelay: '-2s' }}
      />
      {showThirdOrb && (
        <div
          className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl animate-float-gentle"
          style={{ animationDelay: '-4s' }}
        />
      )}
      <div className={`absolute inset-0 ${animatedGrid ? 'cyber-grid' : 'cyber-grid-static'}`} />
    </div>
  );
};

const ParticleBackground = React.memo(ParticleBackgroundInner);

export default ParticleBackground;
