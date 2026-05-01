import React from 'react';

const ParticleBackground: React.FC<{ intensity?: 'low' | 'medium' | 'high' }> = ({
  intensity = 'medium',
}) => {
  const opacityMap = { low: 0.3, medium: 0.5, high: 0.7 };
  const opacity = opacityMap[intensity];

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity }}
      aria-hidden="true"
    >
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-float" />
      <div
        className="absolute top-1/3 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '-2s', animationDuration: '6s' }}
      />
      <div
        className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '-4s', animationDuration: '8s' }}
      />
      <div className="absolute inset-0 cyber-grid" />
    </div>
  );
};

export default ParticleBackground;
