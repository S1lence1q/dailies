"use client";

class AudioFX {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("dailies_muted") === "true";
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  unlock() {
    this.initCtx();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("dailies_muted", String(this.isMuted));
    }
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  playSuccess() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    // Ascending arpeggio chime (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.075);

      gain.gain.setValueAtTime(0, now + idx * 0.075);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.075 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.075 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.075);
      osc.stop(now + idx * 0.075 + 0.35);
    });
  }

  playError() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Muted low-frequency tone sliding down (warm tom/woodblock feel)
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playClick() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Very fast noise click to simulate mechanical switch pop
    const bufferSize = ctx.sampleRate * 0.012; // 12ms buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400; // slightly lower than 1600Hz for a meatier keyboard pop
    filter.Q.value = 2.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now); // louder click (0.08 instead of 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.015);
  }
}

export const audioFX = new AudioFX();

// Auto-unlock AudioContext on first user interaction (safari/chrome policy bypass)
if (typeof window !== "undefined") {
  const unlock = () => {
    audioFX.unlock();
    window.removeEventListener("click", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("click", unlock);
  window.addEventListener("touchstart", unlock);
  window.addEventListener("keydown", unlock);
}
