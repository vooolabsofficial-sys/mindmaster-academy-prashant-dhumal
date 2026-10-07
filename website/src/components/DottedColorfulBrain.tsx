import React from 'react';

interface DottedColorfulBrainProps {
  className?: string;
  size?: number; // width in px
  showGlow?: boolean;
}

export const DottedColorfulBrain: React.FC<DottedColorfulBrainProps> = ({
  className = '',
  size = 360,
  showGlow = true,
}) => {
  // Coordinates generated for realistic anatomical brain silhouette
  // Left hemisphere (logic, math, calendar, cognition) & Right hemisphere (memory, intuition, speed, reflexes)
  const leftNodes = [
    // Frontal Lobe (Cyan & Electric Blue)
    { x: 140, y: 70, r: 4.5, color: '#00D4FF', delay: '0s', label: 'Logic' },
    { x: 110, y: 85, r: 3.5, color: '#00A3FF', delay: '0.4s' },
    { x: 85, y: 110, r: 4.0, color: '#0075FF', delay: '0.8s' },
    { x: 65, y: 145, r: 3.2, color: '#00D4FF', delay: '1.2s' },
    { x: 60, y: 185, r: 4.2, color: '#00F0FF', delay: '0.3s' },
    { x: 75, y: 225, r: 3.8, color: '#0052FF', delay: '0.7s' },
    { x: 105, y: 255, r: 4.5, color: '#00D4FF', delay: '1.1s' },

    // Parietal & Superior Cortex
    { x: 165, y: 55, r: 4.0, color: '#38BDF8', delay: '0.2s' },
    { x: 135, y: 115, r: 3.0, color: '#0284C7', delay: '0.6s' },
    { x: 110, y: 150, r: 3.5, color: '#0EA5E9', delay: '1.0s' },
    { x: 95, y: 190, r: 3.2, color: '#38BDF8', delay: '1.4s' },
    { x: 125, y: 220, r: 3.8, color: '#0284C7', delay: '0.5s' },

    // Inner Synaptic Network
    { x: 160, y: 95, r: 3.5, color: '#00F0FF', delay: '0.9s' },
    { x: 145, y: 140, r: 4.2, color: '#0052FF', delay: '1.3s' },
    { x: 130, y: 175, r: 3.0, color: '#38BDF8', delay: '0.1s' },
    { x: 155, y: 190, r: 3.8, color: '#00D4FF', delay: '0.7s' },
    { x: 160, y: 235, r: 3.5, color: '#00A3FF', delay: '1.5s' },

    // Temporal Lobe & Base
    { x: 80, y: 260, r: 3.2, color: '#10B981', delay: '0.3s' },
    { x: 110, y: 290, r: 4.0, color: '#059669', delay: '0.8s' },
    { x: 140, y: 310, r: 3.5, color: '#34D399', delay: '1.2s' },
    { x: 165, y: 280, r: 3.8, color: '#10B981', delay: '0.4s' },

    // Brain Stem Left
    { x: 180, y: 325, r: 3.2, color: '#0284C7', delay: '0.2s' },
    { x: 185, y: 355, r: 3.0, color: '#0052FF', delay: '0.6s' },
  ];

  const rightNodes = [
    // Frontal / Upper Parietal (Violet, Magenta & Amber)
    { x: 220, y: 70, r: 4.5, color: '#A855F7', delay: '0.2s', label: 'Memory' },
    { x: 250, y: 85, r: 3.5, color: '#C084FC', delay: '0.6s' },
    { x: 275, y: 110, r: 4.0, color: '#EC4899', delay: '1.0s' },
    { x: 295, y: 145, r: 3.2, color: '#F43F5E', delay: '1.4s' },
    { x: 300, y: 185, r: 4.2, color: '#FB7185', delay: '0.5s' },
    { x: 285, y: 225, r: 3.8, color: '#F59E0B', delay: '0.9s' },
    { x: 255, y: 255, r: 4.5, color: '#FBBF24', delay: '1.3s' },

    // Superior Cortex Right
    { x: 195, y: 55, r: 4.0, color: '#8B5CF6', delay: '0.1s' },
    { x: 225, y: 115, r: 3.0, color: '#D946EF', delay: '0.5s' },
    { x: 250, y: 150, r: 3.5, color: '#F43F5E', delay: '0.9s' },
    { x: 265, y: 190, r: 3.2, color: '#F59E0B', delay: '1.3s' },
    { x: 235, y: 220, r: 3.8, color: '#EC4899', delay: '0.3s' },

    // Inner Synaptic Network Right
    { x: 200, y: 95, r: 3.5, color: '#A855F7', delay: '0.7s' },
    { x: 215, y: 140, r: 4.2, color: '#8B5CF6', delay: '1.1s' },
    { x: 230, y: 175, r: 3.0, color: '#E879F9', delay: '1.5s' },
    { x: 205, y: 190, r: 3.8, color: '#D946EF', delay: '0.4s' },
    { x: 200, y: 235, r: 3.5, color: '#F59E0B', delay: '0.8s' },

    // Occipital & Cerebellum Right
    { x: 280, y: 260, r: 3.2, color: '#F59E0B', delay: '0.6s' },
    { x: 250, y: 290, r: 4.0, color: '#FBBF24', delay: '1.0s' },
    { x: 220, y: 310, r: 3.5, color: '#FCD34D', delay: '1.4s' },
    { x: 195, y: 280, r: 3.8, color: '#F59E0B', delay: '0.2s' },

    // Brain Stem Right
    { x: 180, y: 325, r: 3.2, color: '#8B5CF6', delay: '0.5s' },
    { x: 175, y: 355, r: 3.0, color: '#EC4899', delay: '0.9s' },
  ];

  // Connecting synaptic links
  const connections = [
    // Left Hemisphere Connections
    { x1: 140, y1: 70, x2: 110, y2: 85, color: '#00D4FF' },
    { x1: 110, y1: 85, x2: 85, y2: 110, color: '#00A3FF' },
    { x1: 85, y1: 110, x2: 65, y2: 145, color: '#0075FF' },
    { x1: 65, y1: 145, x2: 60, y2: 185, color: '#00F0FF' },
    { x1: 60, y1: 185, x2: 75, y2: 225, color: '#0052FF' },
    { x1: 75, y1: 225, x2: 105, y2: 255, color: '#00D4FF' },
    { x1: 165, y1: 55, x2: 140, y2: 70, color: '#38BDF8' },
    { x1: 140, y1: 70, x2: 160, y2: 95, color: '#00D4FF' },
    { x1: 160, y1: 95, x2: 135, y2: 115, color: '#00F0FF' },
    { x1: 135, y1: 115, x2: 110, y2: 150, color: '#0EA5E9' },
    { x1: 110, y1: 150, x2: 95, y2: 190, color: '#38BDF8' },
    { x1: 95, y1: 190, x2: 125, y2: 220, color: '#0284C7' },
    { x1: 160, y1: 95, x2: 145, y2: 140, color: '#0052FF' },
    { x1: 145, y1: 140, x2: 130, y2: 175, color: '#38BDF8' },
    { x1: 130, y1: 175, x2: 155, y2: 190, color: '#00D4FF' },
    { x1: 155, y1: 190, x2: 160, y2: 235, color: '#00A3FF' },
    { x1: 125, y1: 220, x2: 105, y2: 255, color: '#00D4FF' },
    { x1: 105, y1: 255, x2: 80, y2: 260, color: '#10B981' },
    { x1: 80, y1: 260, x2: 110, y2: 290, color: '#059669' },
    { x1: 110, y1: 290, x2: 140, y2: 310, color: '#34D399' },
    { x1: 140, y1: 310, x2: 165, y2: 280, color: '#10B981' },
    { x1: 165, y1: 280, x2: 180, y2: 325, color: '#0284C7' },
    { x1: 180, y1: 325, x2: 185, y2: 355, color: '#0052FF' },

    // Right Hemisphere Connections
    { x1: 220, y1: 70, x2: 250, y2: 85, color: '#A855F7' },
    { x1: 250, y1: 85, x2: 275, y2: 110, color: '#C084FC' },
    { x1: 275, y1: 110, x2: 295, y2: 145, color: '#EC4899' },
    { x1: 295, y1: 145, x2: 300, y2: 185, color: '#F43F5E' },
    { x1: 300, y1: 185, x2: 285, y2: 225, color: '#FB7185' },
    { x1: 285, y1: 225, x2: 255, y2: 255, color: '#F59E0B' },
    { x1: 195, y1: 55, x2: 220, y2: 70, color: '#8B5CF6' },
    { x1: 220, y1: 70, x2: 200, y2: 95, color: '#A855F7' },
    { x1: 200, y1: 95, x2: 225, y2: 115, color: '#D946EF' },
    { x1: 225, y1: 115, x2: 250, y2: 150, color: '#F43F5E' },
    { x1: 250, y1: 150, x2: 265, y2: 190, color: '#F59E0B' },
    { x1: 265, y1: 190, x2: 235, y2: 220, color: '#EC4899' },
    { x1: 200, y1: 95, x2: 215, y2: 140, color: '#8B5CF6' },
    { x1: 215, y1: 140, x2: 230, y2: 175, color: '#E879F9' },
    { x1: 230, y1: 175, x2: 205, y2: 190, color: '#D946EF' },
    { x1: 205, y1: 190, x2: 200, y2: 235, color: '#F59E0B' },
    { x1: 235, y1: 220, x2: 255, y2: 255, color: '#FBBF24' },
    { x1: 255, y1: 255, x2: 280, y2: 260, color: '#F59E0B' },
    { x1: 280, y1: 260, x2: 250, y2: 290, color: '#FBBF24' },
    { x1: 250, y1: 290, x2: 220, y2: 310, color: '#FCD34D' },
    { x1: 220, y1: 310, x2: 195, y2: 280, color: '#F59E0B' },
    { x1: 195, y1: 280, x2: 180, y2: 325, color: '#8B5CF6' },
    { x1: 180, y1: 325, x2: 175, y2: 355, color: '#EC4899' },

    // Corpus Callosum / Cross-Hemisphere Bridge Lines
    { x1: 165, y1: 55, x2: 195, y2: 55, color: '#38BDF8' },
    { x1: 160, y1: 95, x2: 200, y2: 95, color: '#818CF8' },
    { x1: 145, y1: 140, x2: 215, y2: 140, color: '#C084FC' },
    { x1: 155, y1: 190, x2: 205, y2: 190, color: '#E879F9' },
    { x1: 160, y1: 235, x2: 200, y2: 235, color: '#F472B6' },
    { x1: 165, y1: 280, x2: 195, y2: 280, color: '#FBBF24' },
  ];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient Neural Backlight Glow */}
      {showGlow && (
        <>
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-cyan-500/20 via-indigo-500/25 to-pink-500/20 blur-3xl -z-10 animate-pulse pointer-events-none" />
          <div className="absolute inset-10 rounded-full bg-blue-600/15 blur-2xl -z-10 pointer-events-none" />
        </>
      )}

      <svg
        viewBox="0 0 360 400"
        className="w-full h-full drop-shadow-lg filter transition-transform duration-700 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for central synapse beam */}
          <linearGradient id="synapseBridge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#A855F7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8" />
          </linearGradient>

          {/* Filter for glowing dots */}
          <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Synaptic Connection Network (Lines) */}
        <g opacity="0.65" strokeWidth="1.2">
          {connections.map((line, idx) => (
            <line
              key={`conn-${idx}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.color}
              strokeDasharray={idx % 3 === 0 ? '3 3' : undefined}
              className="transition-all duration-300 group-hover:opacity-100"
            />
          ))}
        </g>

        {/* Dynamic Synaptic Energy Pulses (Animated Circles gliding along connections) */}
        <circle cx="160" cy="95" r="2.5" fill="#FFFFFF">
          <animate attributeName="cx" values="160;200;160" dur="3s" repeatCount="indefinite" />
          <animate attributeName="cy" values="95;95;95" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="145" cy="140" r="2.5" fill="#00FFFF">
          <animate attributeName="cx" values="145;215;145" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="140;140;140" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;1;0.2" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="155" cy="190" r="2.5" fill="#FF80BF">
          <animate attributeName="cx" values="155;205;155" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="190;190;190" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.8s" repeatCount="indefinite" />
        </circle>

        {/* Left Hemisphere Neural Nodes (Cyan / Electric Blue / Emerald) */}
        <g id="left-hemisphere">
          {leftNodes.map((node, idx) => (
            <g key={`left-node-${idx}`}>
              {/* Outer Pulse Halo */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 3}
                fill={node.color}
                opacity="0.25"
                filter="url(#dotGlow)"
              >
                <animate
                  attributeName="r"
                  values={`${node.r + 1};${node.r + 5};${node.r + 1}`}
                  dur="2.5s"
                  begin={node.delay}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.2;0.5;0.2"
                  dur="2.5s"
                  begin={node.delay}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Core Solid Node */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={node.color}
                stroke="#FFFFFF"
                strokeWidth="0.8"
              />
            </g>
          ))}
        </g>

        {/* Right Hemisphere Neural Nodes (Violet / Magenta / Amber) */}
        <g id="right-hemisphere">
          {rightNodes.map((node, idx) => (
            <g key={`right-node-${idx}`}>
              {/* Outer Pulse Halo */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 3}
                fill={node.color}
                opacity="0.25"
                filter="url(#dotGlow)"
              >
                <animate
                  attributeName="r"
                  values={`${node.r + 1};${node.r + 5};${node.r + 1}`}
                  dur="2.5s"
                  begin={node.delay}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.2;0.5;0.2"
                  dur="2.5s"
                  begin={node.delay}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Core Solid Node */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={node.color}
                stroke="#FFFFFF"
                strokeWidth="0.8"
              />
            </g>
          ))}
        </g>

        {/* Central Cerebral Longitudinal Fissure Glow Line */}
        <path
          d="M180 50 Q178 120 180 180 Q182 240 180 330"
          stroke="url(#synapseBridge)"
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity="0.7"
        />

        {/* Subtle Decorative Floating Orbit Nodes */}
        <circle cx="50" cy="110" r="2" fill="#00D4FF" opacity="0.4" />
        <circle cx="310" cy="110" r="2" fill="#EC4899" opacity="0.4" />
        <circle cx="45" cy="200" r="2.5" fill="#38BDF8" opacity="0.5" />
        <circle cx="315" cy="200" r="2.5" fill="#F59E0B" opacity="0.5" />
        <circle cx="90" cy="45" r="2" fill="#00A3FF" opacity="0.3" />
        <circle cx="270" cy="45" r="2" fill="#C084FC" opacity="0.3" />
      </svg>
    </div>
  );
};
