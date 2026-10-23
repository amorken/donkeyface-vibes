export const MIN_BPM = 40;
export const MAX_BPM = 220;

// Keep up to seven intervals (eight taps), rejecting half/double-time accidents.
export class TapTempo {
  constructor() { this.reset(); }
  reset() { this.last = null; this.intervals = []; this.count = 0; }
  tap(now) {
    if (this.last === null || now - this.last > 2500) {
      this.reset(); this.last = now; this.count = 1;
      return { bpm: null, count: 1, accepted: true };
    }
    const interval = now - this.last;
    if (interval < 60000 / MAX_BPM) return { bpm: null, count: this.count, accepted: false };
    if (interval > 60000 / MIN_BPM) {
      this.reset(); this.last = now; this.count = 1;
      return { bpm: null, count: 1, accepted: true };
    }
    if (this.intervals.length >= 2) {
      const sorted = [...this.intervals].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      if (interval < median * 0.65) return { bpm: null, count: this.count, accepted: false };
      if (interval > median * 1.5) {
        this.reset(); this.last = now; this.count = 1;
        return { bpm: null, count: 1, accepted: true };
      }
    }
    this.last = now;
    this.intervals.push(interval);
    this.intervals = this.intervals.slice(-7);
    this.count = Math.min(8, this.count + 1);
    return { bpm: Math.round(60000 / (this.intervals.reduce((a, b) => a + b, 0) / this.intervals.length)), count: this.count, accepted: true };
  }
}
