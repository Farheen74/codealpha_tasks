/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { MusicSequence } from '../types';

interface PianoRollProps {
  sequence: MusicSequence | null;
}

export const PianoRoll: React.FC<PianoRollProps> = ({ sequence }) => {
  if (!sequence) return null;

  return (
    <div className="w-full bg-[#1A1B1E] rounded-xl border border-[#2A2B2F] p-4 overflow-x-auto scrollbar-hide">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-[#8E9299]">Sequence View: {sequence.name}</h3>
        <div className="text-[10px] font-mono text-[#6366F1]">{sequence.tempo} BPM | {sequence.genre}</div>
      </div>
      
      <div className="relative h-48 min-w-[800px] border-l border-t border-[#2A2B2F]">
        {/* Simple grid lines */}
        <div className="absolute inset-0 grid grid-cols-16 pointer-events-none opacity-5">
           {Array.from({ length: 16 }).map((_, i) => (
             <div key={i} className="border-r border-[#FFFFFF]" />
           ))}
        </div>
        
        {/* Notes */}
        {sequence.notes.map((note, idx) => {
          // Mocking positioning logic for visualization
          const timeParts = note.time.split(':').map(Number);
          const left = (timeParts[0] * 192 + timeParts[1] * 48 + timeParts[2] * 12) / 4;
          const noteMap: Record<string, number> = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
          const baseNote = note.note.slice(0, -1);
          const octave = parseInt(note.note.slice(-1)) || 4;
          const top = 100 - (octave * 12 + (noteMap[baseNote] || 0) - 24) * 2;

          return (
            <motion.div
              key={idx}
              className="absolute h-2 bg-[#6366F1] rounded-sm shadow-[0_0_8px_rgba(99,102,241,0.3)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{
                left: `${left}%`,
                top: `${top % 90}%`,
                width: note.duration === '4n' ? '10%' : note.duration === '8n' ? '5%' : '20%',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
