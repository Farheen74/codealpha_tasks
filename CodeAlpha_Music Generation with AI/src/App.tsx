/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause,
  Square, 
  Sparkles, 
  Music, 
  Layers, 
  Cpu, 
  Settings2,
  Download,
  Activity,
  Github,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { generateMusic } from './services/geminiMusic';
import { audioEngine } from './services/audioEngine';
import { NeuralVisualizer } from './components/NeuralVisualizer';
import { PianoRoll } from './components/PianoRoll';
import { MusicSequence, GenerationState, NeuralLayer } from './types';
import confetti from 'canvas-confetti';
import MidiWriter from 'midi-writer-js';
import * as Tone from 'tone';

const GENRES = ['Cinematic Orchestral', 'Cyberpunk Synthwave', 'Minimalist Piano', 'Jazz Fusion', 'Dark Techno'];

const MOCK_LAYERS: NeuralLayer[] = [
  { id: 'input', nodes: 6, activations: [] },
  { id: 'hidden1', nodes: 12, activations: [] },
  { id: 'hidden2', nodes: 12, activations: [] },
  { id: 'hidden3', nodes: 8, activations: [] },
  { id: 'output', nodes: 4, activations: [] },
];

export default function App() {
  const [genre, setGenre] = useState(GENRES[0]);
  const [prompt, setPrompt] = useState('');
  const [state, setState] = useState<GenerationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sequence, setSequence] = useState<MusicSequence | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<'stopped' | 'playing' | 'paused'>('stopped');
  const [audioInited, setAudioInited] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    let interval: number;
    if (playbackStatus === 'playing') {
      interval = window.setInterval(() => {
        setCurrentTime(audioEngine.getCurrentTime());
      }, 100);
    }
    return () => clearInterval(interval);
  }, [playbackStatus]);

  const initAudio = async () => {
    if (!audioInited) {
      await audioEngine.init();
      setAudioInited(true);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    await initAudio();
    setState('generating');

    // Ensure playback is stopped before generating new content
    audioEngine.stop();
    setPlaybackStatus('stopped');

    try {
      const fullPrompt = `Genre: ${genre}. User Description: ${prompt || 'Create a unique composition'}. Use a complex structure.`;
      const result = await generateMusic(fullPrompt, genre);
      
      setSequence(result);
      setState('idle');
      
      // Calculate duration approx based on the notes
      if (result.notes.length > 0) {
        await initAudio(); // Ensure Tone is started for Time calculations
        const lastNote = result.notes[result.notes.length - 1];
        const durationInSeconds = Tone.Time(lastNote.time).toSeconds() + Tone.Time(lastNote.duration).toSeconds() + 2;
        setDuration(durationInSeconds);
      } else {
        setDuration(16);
      }

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#A5B4FC', '#FFFFFF']
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'The neural network encountered an unexpected error. Please try again.');
      setState('idle');
    }
  };

  const handleExport = () => {
    if (!sequence) return;

    const track = new MidiWriter.Track();
    track.setTempo(sequence.tempo);
    track.addTrackName(sequence.name);
    
    // Map instrument to a general MIDI program if needed, 
    // but for now just add the notes
    
    sequence.notes.forEach(note => {
      // Convert bars:quarters:sixteenths to total sixteenths
      const [m, q, s] = note.time.split(':').map(Number);
      const startSixteenths = (m * 16) + (q * 4) + s;
      
      // MidiWriter uses "wait" for the offset from the PREVIOUS event or start
      // This is tricky with absolute times. 
      // A simpler way with MidiWriter is to often use a specific tick offset if supported,
      // or sort notes and calculate relative waits.
    });

    // Actually, let's use a simpler approach for the user: 
    // provide the MIDI data based on the sequence
    const track2 = new MidiWriter.Track();
    track2.setTempo(sequence.tempo);
    
    // Sort notes by time for correct wait calculation
    const sortedNotes = [...sequence.notes].sort((a, b) => {
      const [am, aq, as] = a.time.split(':').map(Number);
      const [bm, bq, bs] = b.time.split(':').map(Number);
      return (am * 16 + aq * 4 + as) - (bm * 16 + bq * 4 + bs);
    });

    let lastEventSixteenth = 0;
    sortedNotes.forEach(note => {
      const [m, q, s] = note.time.split(':').map(Number);
      const currentSixteenth = (m * 16) + (q * 4) + s;
      const waitSixteenths = Math.max(0, currentSixteenth - lastEventSixteenth);
      
      const durationMap: Record<string, string> = {
        '16n': '16',
        '8n': '8',
        '4n': '4',
        '2n': '2',
        '1n': '1'
      };

      track2.addEvent(new MidiWriter.NoteEvent({
        pitch: [note.note],
        duration: durationMap[note.duration] || '4',
        wait: `T${waitSixteenths * 32}`, // 32 ticks per 16th (128 per quarter)
        velocity: Math.floor(note.velocity * 100)
      }));
      
      lastEventSixteenth = currentSixteenth;
    });

    const write = new MidiWriter.Writer(track2);
    const dataUri = write.dataUri();
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `${sequence.name.replace(/\s+/g, '_')}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePlayPause = async () => {
    if (!sequence) return;
    await initAudio();

    if (playbackStatus === 'playing') {
      audioEngine.pause();
      setPlaybackStatus('paused');
    } else if (playbackStatus === 'paused') {
      audioEngine.resume();
      setPlaybackStatus('playing');
    } else {
      audioEngine.setInstrument(sequence.instrument);
      setPlaybackStatus('playing');
      audioEngine.playSequence(sequence.notes, sequence.tempo, () => {
        setPlaybackStatus('stopped');
      });
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setPlaybackStatus('stopped');
    setCurrentTime(0);
  };

  const handleSeek = (newTime: number) => {
    if (!sequence) return;
    audioEngine.seek(newTime);
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioEngine.setVolume(newVolume);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#FFFFFF] font-sans selection:bg-[#6366F1] selection:text-white">
      {/* Top Navigation */}
      <header className="h-14 border-bottom border-[#1A1B1E] bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">Music Generation with AI</h1>
            <p className="text-[10px] text-[#8E9299] uppercase tracking-tighter opacity-70">Neural Music Composer v3.1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#1A1B1E] rounded-full border border-[#2A2B2F]">
            <Activity size={12} className="text-[#6366F1] animate-pulse" />
            <span className="text-[10px] font-mono text-[#8E9299]">Latent Space: Connected</span>
          </div>
          <button className="p-2 text-[#8E9299] hover:text-[#FFFFFF] transition-colors">
            <Github size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 grid grid-cols-12 gap-6">
        {/* Left Column: Input Rack */}
        <section className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-[#151619] rounded-2xl border border-[#2A2B2F] p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 size={16} className="text-[#6366F1]" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#8E9299]">Compose Rack</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#8E9299] mb-2">Neural Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the mood, scale, or journey..."
                  className="w-full h-24 bg-[#1A1B1E] border border-[#2A2B2F] rounded-xl p-3 text-xs text-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] outline-none transition-all placeholder:text-[#3F4045] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#8E9299] mb-2">Neural Template</label>
                <div className="space-y-2">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      id={`genre-${g.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setGenre(g)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-xs transition-all ${
                        genre === g
                          ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                          : 'bg-[#1A1B1E] border-[#2A2B2F] text-[#8E9299] hover:border-[#3F4045]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#2A2B2F]">
                <button
                  id="generate-button"
                  onClick={handleGenerate}
                  disabled={state !== 'idle'}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#E2E2E2] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
                  {state === 'idle' ? (
                    <>
                      <Sparkles size={18} />
                      Generate Original Music
                    </>
                  ) : (
                    <span className="animate-pulse">{state.toUpperCase()}...</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Theory Panel */}
          <div className="bg-[#151619] rounded-2xl border border-[#2A2B2F] p-5">
             <div className="flex items-center gap-2 mb-4">
              <Layers size={16} className="text-[#8E9299]" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#8E9299]">Analysis Kernel</h2>
            </div>
            <p className="text-[11px] text-[#5A5B60] leading-relaxed mb-4">
              Music Generation with AI utilizes internal algorithmic composition patterns for music theory analysis, pitch quantization, and harmonic progression.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#8E9299]">Pitch Quantization</span>
                <span className="text-[#6366F1]">Active</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#8E9299]">Mode Inference</span>
                <span className="text-[#6366F1]">Dorian / Lydian</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#8E9299]">Temporal Coherence</span>
                <span className="text-[#6366F1]">98.4%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Center Column: Visualizer & Player */}
        <section className="col-span-12 lg:col-span-9 space-y-6">
          <div className="relative">
             <NeuralVisualizer layers={MOCK_LAYERS} isGenerating={state !== 'idle'} />
             
             {/* Overlay status */}
             <AnimatePresence>
               {state !== 'idle' && (
                 <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                 >
                    <div className="px-6 py-3 bg-black/80 backdrop-blur-xl border border-[#6366F1]/30 rounded-full shadow-2xl">
                      <p className="text-sm font-mono text-[#6366F1] flex items-center gap-3">
                         <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-ping" />
                         {state === 'generating' && 'Algorithmic Composition Active...'}
                      </p>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Transport / Player Bar */}
          <div className="bg-[#151619] rounded-2xl border border-[#2A2B2F] p-6 shadow-xl relative overflow-hidden">
             {/* Scrubbing bar */}
             <div className="absolute top-0 left-0 w-full h-1 bg-[#1A1B1E] cursor-pointer group">
                <div 
                  className="h-full bg-[#6366F1] transition-all duration-100 relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-opacity" />
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
             </div>
             
             <div className="flex flex-col md:flex-row items-center gap-6 mt-2">
                <div className="flex items-center gap-3">
                  <button
                    id="play-pause-button"
                    onClick={handlePlayPause}
                    disabled={!sequence}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      !sequence ? 'bg-[#1A1B1E] text-[#3F4045]' : 'bg-[#6366F1] text-white hover:scale-110 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                    }`}
                  >
                    {playbackStatus === 'playing' ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                  </button>

                  <button
                    id="stop-button"
                    onClick={handleStop}
                    disabled={!sequence || playbackStatus === 'stopped'}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border border-[#2A2B2F] ${
                      !sequence || playbackStatus === 'stopped' ? 'text-[#3F4045]' : 'text-[#8E9299] hover:text-white hover:border-[#6366F1]'
                    }`}
                  >
                    <Square size={16} fill="currentColor" />
                  </button>
                </div>

                <div className="flex-1 min-w-0 text-center md:text-left">
                   <div className="flex items-baseline gap-2">
                     <h3 className="text-lg font-bold truncate">
                       {sequence ? sequence.name : "Waiting for Neural Input..."}
                     </h3>
                     <span className="text-[10px] font-mono text-[#5A5B60]">
                       {formatTime(currentTime)} / {formatTime(duration)}
                     </span>
                   </div>
                   <div className="flex items-center justify-center md:justify-start gap-4 mt-1">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#8E9299]">
                        <Music size={12} />
                        {sequence ? sequence.genre : '---'}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-[#2A2B2F]" />
                      <div className="text-[11px] font-mono text-[#8E9299]">
                        {sequence ? `${sequence.tempo} BPM` : '0 BPM'}
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-6">
                   {/* Volume Control */}
                   <div className="flex items-center gap-3 bg-[#1A1B1E] px-4 py-2 rounded-xl border border-[#2A2B2F]">
                      {volume === 0 ? <VolumeX size={14} className="text-[#5A5B60]" /> : <Volume2 size={14} className="text-[#6366F1]" />}
                      <input 
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-20 accent-[#6366F1] h-1 bg-[#2A2B2F] rounded-lg appearance-none cursor-pointer"
                      />
                   </div>

                   <button 
                     onClick={handleExport}
                     className="px-4 py-2 bg-[#1A1B1E] border border-[#2A2B2F] rounded-lg text-[11px] font-mono text-[#8E9299] hover:text-[#FFFFFF] hover:border-[#3F4045] flex items-center gap-2 transition-all disabled:opacity-30"
                     disabled={!sequence}
                   >
                     <Download size={14} />
                     Export MIDI
                   </button>
                </div>
             </div>
          </div>

          <PianoRoll sequence={sequence} />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-red-950/30 border border-red-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8E9299] mb-1">
                    {error.split('|')[0].replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-red-200/80 leading-relaxed max-w-xl">
                    {error.split('|')[1] || error}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-center">
                <button 
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono uppercase tracking-wider rounded-lg border border-red-500/20 transition-all"
                >
                  Retry Transmission
                </button>
                <button 
                  onClick={() => setError(null)}
                  className="p-2 text-[#5A5B60] hover:text-white transition-colors"
                >
                  <Square size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </section>
      </main>

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_50%_0%,#1a1b1e_0%,transparent_100%)] opacity-40" />
    </div>
  );
}

