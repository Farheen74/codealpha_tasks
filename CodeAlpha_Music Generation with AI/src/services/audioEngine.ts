/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Tone from "tone";
import { Note } from "../types";

class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private part: Tone.Part | null = null;
  private onCompleteCallback: (() => void) | null = null;

  async init() {
    console.log("AudioEngine: Initializing...");
    try {
      await Tone.start();
      if (Tone.context.state !== "running") {
        await Tone.context.resume();
      }
      console.log("AudioEngine: Context state:", Tone.context.state);

      if (!this.synth) {
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.synth.set({
          envelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.6,
            release: 1.2,
          },
        });
        // Ensure starting volume is audible
        Tone.getDestination().volume.value = -3; 
        console.log("AudioEngine: Synth initialized and master volume set.");
      }
    } catch (err) {
      console.error("AudioEngine: Initialization failed:", err);
    }
  }

  setInstrument(type: string) {
    if (!this.synth) return;
    console.log(`AudioEngine: Setting instrument to ${type}`);
    
    // Simple mock switching logic
    if (type === 'strings') {
      this.synth.set({ oscillator: { type: 'sine' }, envelope: { attack: 0.5, release: 2 } });
    } else if (type === 'bell') {
      this.synth.set({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, release: 2 } });
    } else if (type === 'synth') {
      this.synth.set({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.1, release: 0.5 } });
    } else {
      this.synth.set({ oscillator: { type: 'square' }, envelope: { attack: 0.1, release: 0.8 } });
    }
  }

  playSequence(notes: Note[], tempo: number, onComplete?: () => void) {
    console.log(`AudioEngine: Playing sequence with ${notes.length} notes at ${tempo} BPM`);
    this.stop();

    Tone.getTransport().bpm.value = tempo;
    this.onCompleteCallback = onComplete || null;

    this.part = new Tone.Part((time, value) => {
      // console.log(`Triggering note: ${value.note} at ${time}`);
      this.synth?.triggerAttackRelease(value.note, value.duration, time, value.velocity);
    }, notes);

    this.part.start(0);
    Tone.getTransport().start();
    console.log("AudioEngine: Transport started.");

    // End playback detection: schedule a stop event at the absolute end of the sequence
    const lastNote = notes[notes.length - 1];
    if (lastNote) {
      // Calculate exact end time on the transport
      const endTime = Tone.Time(lastNote.time).toSeconds() + Tone.Time(lastNote.duration).toSeconds() + 1;
      
      Tone.getTransport().schedule((time) => {
        Tone.Draw.schedule(() => {
          this.stop();
          if (this.onCompleteCallback) {
            this.onCompleteCallback();
            this.onCompleteCallback = null;
          }
        }, time);
      }, endTime);
    }
  }

  pause() {
    Tone.getTransport().pause();
  }

  resume() {
    Tone.getTransport().start();
  }

  seek(seconds: number) {
    // Clamp to 0 to prevent RangeError with tiny negative floating point values
    Tone.getTransport().seconds = Math.max(0, seconds);
  }

  setVolume(normalizedVolume: number) {
    // Map 0-1 to -60dB to 0dB, clamp input
    const volume = Math.max(0, Math.min(1, normalizedVolume));
    const db = volume === 0 ? -Infinity : 20 * Math.log10(volume);
    Tone.getDestination().volume.value = db;
  }

  getDuration(): number {
    if (!this.part) return 0;
    return Math.max(0, Tone.getTransport().seconds); 
  }

  getCurrentTime(): number {
    return Math.max(0, Tone.getTransport().seconds);
  }

  stop() {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    if (this.part) {
      this.part.stop();
      this.part.dispose();
      this.part = null;
    }
  }

  getState() {
    return Tone.getTransport().state;
  }
}

export const audioEngine = new AudioEngine();
