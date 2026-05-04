/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Note {
  note: string;     // e.g., "C4", "Eb5"
  time: string;     // Tone.js time format, e.g., "0:0:0", "4n"
  duration: string; // Tone.js duration, e.g., "8n", "4n"
  velocity: number; // 0 to 1
}

export interface MusicSequence {
  name: string;
  genre: string;
  tempo: number;
  notes: Note[];
  instrument: 'piano' | 'synth' | 'bell' | 'strings';
}

export type GenerationState = 'idle' | 'analyzing' | 'training' | 'generating' | 'perfecting';

export interface NeuralLayer {
  id: string;
  nodes: number;
  activations: number[]; // 0 to 1
}
