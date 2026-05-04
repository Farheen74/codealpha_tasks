/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MusicSequence, Note } from "../types";

const SCALES: Record<string, string[]> = {
  'Cinematic Orchestral': ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
  'Cyberpunk Synthwave': ['C3', 'D#3', 'F3', 'G3', 'A#3', 'C4'],
  'Minimalist Piano': ['A3', 'B3', 'C4', 'E4', 'G4', 'A4'],
  'Jazz Fusion': ['C4', 'D4', 'Eb4', 'E4', 'G4', 'A4', 'Bb4'],
  'Dark Techno': ['F2', 'Gb2', 'Ab2', 'Bb2', 'C3'],
};

const DURATIONS = ['4n', '8n', '8n', '16n', '2n'];

const ADJECTIVES = ['Ethereal', 'Quantum', 'Midnight', 'Emerald', 'Solar', 'Velvet', 'Primal', 'Neon', 'Cosmic', 'Abyssal', 'Vibrant', 'Silent'];
const NOUNS = ['Echoes', 'Pulse', 'Overture', 'Nexus', 'Dreams', 'Vortex', 'Glitch', 'Symphony', 'Atmosphere', 'Current', 'Frequencies', 'Cascade'];

export async function generateMusic(prompt: string, genre: string): Promise<MusicSequence> {
  // Simulate heavy computation (latent space mapping)
  await new Promise(resolve => setTimeout(resolve, 800));

  const scale = SCALES[genre] || SCALES['Minimalist Piano'];
  const notes: Note[] = [];
  const totalSteps = 32;
  
  let currentTime = 0; // in 16th notes
  
  for (let i = 0; i < totalSteps; i++) {
    // Markov-ish probability for next note
    const degree = Math.floor(Math.random() * scale.length);
    const noteName = scale[degree];
    
    // Convert current 16th step to Tone.js time (measures:quarters:sixteenths)
    const measures = Math.floor(currentTime / 16);
    const quarters = Math.floor((currentTime % 16) / 4);
    const sixteenths = currentTime % 4;
    const time = `${measures}:${quarters}:${sixteenths}`;
    
    const duration = DURATIONS[Math.floor(Math.random() * DURATIONS.length)];
    const velocity = 0.5 + Math.random() * 0.4;
    
    notes.push({
      note: noteName,
      time,
      duration,
      velocity
    });
    
    // Advance time
    const durationMap: Record<string, number> = { '16n': 1, '8n': 2, '4n': 4, '2n': 8 };
    currentTime += durationMap[duration] || 4;
    
    // Stop if we exceed 4 measures
    if (currentTime >= 64) break;
  }

  const randomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const creativeName = `${randomItem(ADJECTIVES)} ${randomItem(NOUNS)} in ${genre.split(' ')[0]}`;

  return {
    name: creativeName,
    genre,
    tempo: 100 + Math.floor(Math.random() * 40),
    instrument: genre.includes('Piano') ? 'piano' : 
                genre.includes('Synth') ? 'synth' : 
                genre.includes('Jazz') ? 'bell' : 'strings',
    notes
  };
}

