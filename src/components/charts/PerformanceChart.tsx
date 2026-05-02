import React from 'react';
import { motion } from 'framer-motion';

interface PerformanceChartProps {
  data: number[];
  height?: number;
  showLabels?: boolean;
  gradient?: 'purple' | 'green' | 'cyan';
}

const gradients = {
  purple: ['#7c3aed', '#a855f7'],
  green: ['#10b981', '#34d399'],
  cyan: ['#06b6d4', '#22d3ee'],
};

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  height = 120,
  gradient = 'purple',
}) => {
  const max = Math.max(...data, 1);
  const colors = gradients[gradient];

  return (
    <div className="w-full" style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${data.length * 20} ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`chart-gradient-${gradient}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors[1]} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`bar-gradient-${gradient}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[0]} />
          </linearGradient>
        </defs>

        {/* Area */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          d={`
            M 0 ${height}
            L 0 ${height - (data[0] / max) * (height - 20)}
            ${data.map((v, i) => `L ${i * 20 + 10} ${height - (v / max) * (height - 20)}`).join(' ')}
            L ${(data.length - 1) * 20 + 20} ${height}
            Z
          `}
          fill={`url(#chart-gradient-${gradient})`}
        />

        {/* Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          d={`
            M 0 ${height - (data[0] / max) * (height - 20)}
            ${data.map((v, i) => `L ${i * 20 + 10} ${height - (v / max) * (height - 20)}`).join(' ')}
          `}
          fill="none"
          stroke={colors[0]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((v, i) => (
          <motion.circle
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            cx={i * 20 + 10}
            cy={height - (v / max) * (height - 20)}
            r="3"
            fill={colors[1]}
            stroke={colors[0]}
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
};

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 100 }) => {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between gap-1 h-full">
        {data.map((item, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
            className="flex-1 rounded-t-sm"
            style={{
              background: item.color || `linear-gradient(to top, #7c3aed, #a855f7)`,
              minHeight: 4,
            }}
          />
        ))}
      </div>
      {data[0]?.label && (
        <div className="flex justify-between mt-1">
          {data.map((item, i) => (
            <span key={i} className="text-[9px] text-slate-500 flex-1 text-center">
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ 
  data, 
  size = 120, 
  thickness = 20 
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const offsets = data.reduce<number[]>((acc, item) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    const dashLength = ((item.value / total) * 100 / 100) * circumference;
    acc.push(prev + dashLength);
    return acc;
  }, []);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, i) => {
          const percent = (item.value / total) * 100;
          const dashLength = (percent / 100) * circumference;
          const dashOffset = i > 0 ? offsets[i - 1] : 0;

          return (
            <motion.circle
              key={i}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dashLength} ${circumference - dashLength}` }}
              transition={{ duration: 1, delay: i * 0.1 }}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={thickness}
              strokeDashoffset={-dashOffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display font-bold text-white text-lg">{total}</p>
          <p className="text-[10px] text-slate-400">Totale</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
