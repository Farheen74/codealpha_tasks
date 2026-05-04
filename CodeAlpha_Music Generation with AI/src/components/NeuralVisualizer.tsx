/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { NeuralLayer } from '../types';

interface NeuralVisualizerProps {
  layers: NeuralLayer[];
  isGenerating: boolean;
}

export const NeuralVisualizer: React.FC<NeuralVisualizerProps> = ({ layers, isGenerating }) => {
  const connections = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; id: string }[] = [];
    for (let i = 0; i < layers.length - 1; i++) {
      const currentLayer = layers[i];
      const nextLayer = layers[i + 1];
      const layerSpacing = 100 / (layers.length + 1);
      const x1 = (i + 1) * layerSpacing;
      const x2 = (i + 2) * layerSpacing;

      for (let j = 0; j < currentLayer.nodes; j++) {
        for (let k = 0; k < nextLayer.nodes; k++) {
          const y1 = ((j + 1) * 100) / (currentLayer.nodes + 1);
          const y2 = ((k + 1) * 100) / (nextLayer.nodes + 1);
          lines.push({ x1, y1, x2, y2, id: `${i}-${j}-${k}` });
        }
      }
    }
    return lines;
  }, [layers]);

  return (
    <div className="relative w-full h-96 bg-[#151619] rounded-xl overflow-hidden border border-[#2A2B2F] shadow-2xl">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full opacity-30">
        {connections.map((line) => (
          <motion.line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#4A4B4F"
            strokeWidth="0.1"
            initial={{ opacity: 0.1 }}
            animate={{
              opacity: isGenerating ? [0.1, 0.4, 0.1] : 0.1,
              stroke: isGenerating ? "#6366F1" : "#4A4B4F"
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </svg>

      <div className="absolute inset-0 flex justify-between px-8 py-4">
        {layers.map((layer, lIdx) => (
          <div key={layer.id} className="flex flex-col justify-around h-full">
            {Array.from({ length: layer.nodes }).map((_, nIdx) => (
              <motion.div
                key={nIdx}
                className="w-3 h-3 rounded-full bg-[#3F4045] border border-[#5A5B60]"
                animate={{
                  scale: isGenerating ? [1, 1.5, 1] : 1,
                  backgroundColor: isGenerating ? "#6366F1" : "#3F4045",
                  boxShadow: isGenerating ? "0 0 10px rgba(99, 102, 241, 0.8)" : "none"
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: (lIdx * 0.2) + (nIdx * 0.1)
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 font-mono text-[10px] text-[#8E9299] uppercase tracking-widest">
        {isGenerating ? "Neural Network Active: Propagating..." : "Model Idle"}
      </div>
    </div>
  );
};
