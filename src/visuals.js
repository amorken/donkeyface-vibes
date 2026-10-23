import { songs, palettes } from './songs.js';
import { ART_KEY } from './store.js';
import devconArtwork from './assets/devcon-2026.png';
import cogniteArtwork from './assets/cognite.svg';
import { motionAmplitude, motionTime } from './motion.js';

const TAU = Math.PI * 2;
const fract = (n) => n - Math.floor(n);
const noise = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

export function drawScene(ctx, w, h, time, phase, colors, intensity, spotlight, mode, motion = 0.5) {
  const cx = w / 2, cy = h / 2;
  const scale = Math.min(w, h);
  const amplitude = motionAmplitude(motion);
  const pulse = Math.exp(-fract(phase) * 5) * (0.25 + intensity * 0.75) * amplitude;
  ctx.fillStyle = '#100e10';
  ctx.fillRect(0, 0, w, h);
  const ambient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.65);
  ambient.addColorStop(0, `${colors[0]}24`);
  ambient.addColorStop(0.45, `${colors[0]}0c`);
  ambient.addColorStop(1, '#0b0c0e');
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(1, scale / 520);

  if (mode === 'tunnel') {
    ctx.rotate(-0.13 + Math.sin(time * 0.08) * 0.035 * amplitude);
    for (let i = 0; i < 24; i++) {
      const progress = fract(i / 24 + time * 0.045);
      const radius = Math.pow(progress, 2) * Math.max(w, h) * 1.15;
      ctx.strokeStyle = colors[i % 3];
      ctx.globalAlpha = Math.min(1, Math.sin(progress * Math.PI) * (0.2 + intensity * 0.5 + pulse * 0.16));
      ctx.lineWidth = scale / 600 * (1 + progress * 2.2);
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = j * TAU / 6 + Math.PI / 6 + Math.sin(time * 0.35 + i * 0.14) * 0.025 * amplitude;
        const x = Math.cos(angle) * radius * 1.25, y = Math.sin(angle) * radius * 0.8;
        j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
  } else if (mode === 'columns') {
    for (let i = -14; i <= 14; i++) {
      const x = i * w / 22;
      const height = h * Math.max(0.03, 0.31 + Math.sin(i * 1.23 + time * 0.9) * 0.16 * amplitude + pulse * 0.16);
      const grd = ctx.createLinearGradient(0, h / 2, 0, -h / 2);
      grd.addColorStop(0, `${colors[0]}00`); grd.addColorStop(0.5, `${colors[0]}88`); grd.addColorStop(1, `${colors[1]}11`);
      ctx.fillStyle = grd;
      ctx.fillRect(x, -height / 2, w / 40, height);
      ctx.globalAlpha = Math.min(1, 0.3 + pulse * 0.4);
      ctx.fillStyle = colors[1]; ctx.fillRect(x, -height / 2, w / 40, 2);
    }
  } else if (mode === 'grid') {
    ctx.strokeStyle = colors[0]; ctx.globalAlpha = 0.4 + pulse * 0.2;
    const horizon = -h * 0.08 + Math.sin(time * 0.35) * h * 0.025 * amplitude;
    for (let i = -18; i <= 18; i++) {
      ctx.beginPath(); ctx.moveTo(i * w / 40, horizon); ctx.lineTo(i * w / 8, h / 2); ctx.stroke();
    }
    for (let i = 0; i < 22; i++) {
      const p = fract(i / 22 + time * 0.07);
      const y = horizon + p * p * h * 0.6;
      ctx.beginPath(); ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y); ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = colors[i % 3]; ctx.globalAlpha = 0.1 + i / 70;
      const rad = scale * (0.16 + i * 0.027) + pulse * 6;
      ctx.beginPath(); ctx.arc(0, -h * 0.1, rad, Math.PI, TAU); ctx.stroke();
    }
  } else if (mode === 'waves') {
    for (let j = 0; j < 34; j++) {
      ctx.strokeStyle = colors[j % 3]; ctx.globalAlpha = 0.12 + Math.sin(j / 34 * Math.PI) * 0.45;
      ctx.beginPath();
      for (let x = -w / 2; x <= w / 2; x += w / 130) {
        const y = Math.sin(x / w * 7 + time * 0.5 + j * 0.07) * h * (0.14 + intensity * 0.09) * amplitude
          + Math.cos(x / w * 11 - time * 0.6 + j * 0.11) * h * 0.07 * amplitude + (j - 17) * h / 85 + pulse * 8;
        x === -w / 2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (mode === 'orbits') {
    ctx.rotate(time * 0.025);
    for (let i = 0; i < 13; i++) {
      ctx.save(); ctx.rotate(i * 0.28);
      ctx.strokeStyle = colors[i % 3]; ctx.globalAlpha = 0.15 + (i % 3) * 0.09;
      ctx.beginPath(); ctx.ellipse(0, 0, scale * (0.25 + i * 0.035) + pulse * 5, scale * (0.09 + i * 0.02) * (1 + Math.sin(time + i) * 0.1 * amplitude), 0, 0, TAU); ctx.stroke();
      const a = time * (0.2 + i * 0.014) + i * 1.4;
      ctx.fillStyle = colors[i % 3]; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(Math.cos(a) * scale * (0.25 + i * 0.035), Math.sin(a) * scale * (0.09 + i * 0.02), scale * (0.003 + noise(i) * 0.004), 0, TAU); ctx.fill();
      ctx.restore();
    }
  } else if (mode === 'confetti') {
    for (let i = 0; i < 130; i++) {
      const x = (noise(i + 4) - 0.5) * w * 1.15;
      const y = (fract(noise(i + 9) + time * (0.025 + noise(i) * 0.04)) - 0.5) * h * 1.2;
      ctx.save(); ctx.translate(x + Math.sin(time + i) * scale * 0.025 * amplitude, y); ctx.rotate(time * 0.3 + i);
      ctx.globalAlpha = 0.25 + noise(i + 22) * 0.55; ctx.fillStyle = colors[i % 3];
      const size = scale * (0.006 + noise(i + 2) * 0.014) * (1 + pulse * 0.15);
      if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, TAU); ctx.fill(); }
      else ctx.fillRect(-size / 2, -size / 2, size, size * 0.42);
      ctx.restore();
    }
  } else if (mode === 'embers') {
    for (let i = 0; i < 140; i++) {
      const p = fract(noise(i) + time * (0.03 + noise(i + 1) * 0.045));
      const x = (noise(i + 2) - 0.5) * w + Math.sin(p * 5 + i + time * 0.2) * w * 0.04 * amplitude;
      const y = h * 0.6 - p * h * 1.3;
      ctx.fillStyle = colors[i % 3]; ctx.globalAlpha = Math.sin(p * Math.PI) * (0.3 + noise(i) * 0.6);
      ctx.beginPath(); ctx.ellipse(x, y, scale * (0.001 + noise(i + 5) * 0.004), scale * (0.003 + noise(i + 6) * 0.01 + pulse * 0.004), 0.2, 0, TAU); ctx.fill();
    }
    const glow = ctx.createRadialGradient(0, h * 0.6, 0, 0, h * 0.6, h * 0.9);
    glow.addColorStop(0, `${colors[0]}55`); glow.addColorStop(1, `${colors[0]}00`);
    ctx.globalAlpha = Math.min(1, 0.7 + pulse * 0.2); ctx.fillStyle = glow; ctx.fillRect(-w / 2, -h / 2, w, h);
  } else if (mode === 'stars') {
    for (let i = 0; i < 110; i++) {
      const x = (noise(i + 2) - 0.5) * w, y = (noise(i + 3) - 0.5) * h;
      const sway = Math.sin(time * 0.13 + i) * h * 0.015 * amplitude;
      ctx.globalAlpha = Math.max(0, Math.min(1, 0.5 + Math.sin(time * 0.8 + i) * 0.25 * amplitude));
      ctx.fillStyle = colors[i % 3]; ctx.beginPath(); ctx.arc(x, y + sway, scale * (0.001 + noise(i + 9) * 0.003) * (1 + pulse * 0.2), 0, TAU); ctx.fill();
      if (i % 4 === 0) {
        ctx.globalAlpha = 0.12; ctx.strokeStyle = colors[0]; ctx.beginPath(); ctx.moveTo(x, y + sway);
        ctx.lineTo(x + Math.cos(i) * w * 0.09, y + sway + Math.sin(i) * h * 0.15); ctx.stroke();
      }
    }
  } else if (mode === 'lasers') {
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 22; i++) {
        ctx.globalAlpha = 0.12 + (i % 3) * 0.12 + pulse * 0.08;
        ctx.strokeStyle = colors[i % 3];
        const startX = side * w * 0.28, startY = h * 0.55;
        const angle = -Math.PI / 2 + (i - 11) * 0.05 + Math.sin(time * 0.4 + side) * 0.3 * amplitude;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(startX + Math.cos(angle) * h * 2, startY + Math.sin(angle) * h * 2); ctx.stroke();
      }
    }
  } else if (mode === 'burst') {
    ctx.rotate(time * 0.035);
    for (let i = 0; i < 80; i++) {
      const angle = i * TAU / 80, offset = fract(time * 0.07 + noise(i));
      const r = scale * (0.15 + offset * 0.8), len = scale * (0.04 + noise(i + 1) * 0.16 + pulse * 0.02);
      ctx.strokeStyle = colors[i % 3]; ctx.globalAlpha = Math.sin(offset * Math.PI) * 0.6;
      ctx.lineWidth = scale * (0.001 + noise(i + 2) * 0.005);
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r); ctx.lineTo(Math.cos(angle) * (r + len), Math.sin(angle) * (r + len)); ctx.stroke();
    }
  } else if (mode === 'ambient') {
    // Free-flowing and deliberately restrained, even at high motion settings.
    for (let j = 0; j < 22; j++) {
      ctx.strokeStyle = colors[j % 3]; ctx.globalAlpha = 0.05 + Math.sin(j / 22 * Math.PI) * 0.08;
      ctx.lineWidth = Math.max(1, scale / 650);
      ctx.beginPath();
      for (let x = -w / 2; x <= w / 2; x += w / 120) {
        const y = Math.sin(x / w * 4 + time * 0.055 + j * 0.075) * h * (0.12 + amplitude * 0.015)
          + Math.cos(x / w * 2 - time * 0.035) * h * 0.04 + (j - 11) * h / 120;
        x === -w / 2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // A gradual, warm halo adds focus without a strobe or full-screen flash.
  if (spotlight) {
    const halo = ctx.createRadialGradient(cx, cy, scale * 0.12, cx, cy, scale * 0.7);
    halo.addColorStop(0, '#f9d99300'); halo.addColorStop(0.5, '#f9d99320'); halo.addColorStop(1, '#f9d99300');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = '#f7d99b'; ctx.globalAlpha = 0.3;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, scale * (0.29 + i * 0.035) + Math.sin(time * 1.5) * scale * 0.01 * amplitude, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }

  const vignette = ctx.createRadialGradient(cx, cy, h * 0.18, cx, cy, Math.max(w, h) * 0.62);
  vignette.addColorStop(0, '#07070900'); vignette.addColorStop(1, '#070709bd');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
}

export class Visualizer {
  constructor(canvas, getState, { preview = false } = {}) {
    this.canvas = canvas; this.getState = getState; this.preview = preview;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.time = 0; this.last = 0; this.lastRender = 0; this.previousSong = -1; this.artVersion = -1;
    this.logoImage = null; this.disposed = false;
    this.defaultLogo = null;
    const eventLogo = new Image();
    eventLogo.onload = () => {
      // Key the charcoal backing so the supplied visual identity sits within the scene.
      const asset = document.createElement('canvas'); asset.width = eventLogo.width; asset.height = eventLogo.height;
      const ac = asset.getContext('2d'); ac.drawImage(eventLogo, 0, 0);
      const pixels = ac.getImageData(0, 0, asset.width, asset.height);
      for (let p = 0; p < pixels.data.length; p += 4) {
        const high = Math.max(pixels.data[p], pixels.data[p + 1], pixels.data[p + 2]);
        pixels.data[p + 3] = Math.round(Math.min(1, Math.max(0, (high - 58) / 62)) * 255);
      }
      ac.putImageData(pixels, 0, 0); this.defaultLogo = asset;
    };
    eventLogo.src = devconArtwork;
    this.cogniteImage = new Image(); this.cogniteImage.src = cogniteArtwork;
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas);
    this.resize();
    this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
  }
  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, this.preview ? 1.5 : 2);
    this.canvas.width = Math.round(width * dpr); this.canvas.height = Math.round(height * dpr);
  }
  loadArtwork(version) {
    this.artVersion = version; this.logoImage = null;
    let source = this.artworkOverride;
    if (source === undefined) try { source = localStorage.getItem(ART_KEY); } catch { return; }
    if (!source) return;
    const img = new Image(); img.onload = () => { if (this.artVersion === version) this.logoImage = img; }; img.src = source;
  }
  setArtwork(source) {
    this.artworkOverride = source;
    this.logoImage = null;
    if (!source) return;
    const img = new Image(); img.onload = () => { this.logoImage = img; }; img.src = source;
  }
  frame(timestamp) {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    if (timestamp - this.lastRender < (this.preview ? 32 : 15)) return;
    this.lastRender = timestamp;
    const state = this.getState();
    const visualNow = state.paused ? state.frozenAt : Date.now();
    this.time = motionTime(state, visualNow) * 0.8;
    const { width: w, height: h } = this.canvas;
    if (!w || !h) return;
    const ctx = this.ctx;
    if (state.artVersion !== this.artVersion) this.loadArtwork(state.artVersion);
    if (state.song !== this.previousSong) {
      if (this.previousSong !== -1 && !state.blackout) {
        this.oldFrame = document.createElement('canvas'); this.oldFrame.width = w; this.oldFrame.height = h;
        this.oldFrame.getContext('2d').drawImage(this.canvas, 0, 0);
        this.transitionStart = timestamp;
      }
      this.previousSong = state.song;
    }
    if (state.blackout) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); return; }
    const song = songs[state.song];
    const colors = palettes[state.palette].colors || song.colors;
    this.phase = (visualNow - state.epoch) / (60000 / state.bpm);
    drawScene(ctx, w, h, this.time, this.phase || 0, colors, state.intensity, state.spotlight && !song.interlude, song.mode, state.motion);
    if (state.logo) this.drawLogo(w, h, state, colors);
    if (state.cognite) this.drawCognite(w, h, state);
    ctx.textAlign = 'right'; ctx.fillStyle = '#f1e9ddaa';
    ctx.font = `500 ${h * 0.014}px "Space Grotesk", sans-serif`;
    ctx.fillText(song.interlude ? 'DEVCON 2026' : 'DONKEY FACE / DEVCON 2026', w * 0.95, h * 0.94);
    if (state.titles && !song.interlude) {
      ctx.textAlign = 'center'; ctx.fillStyle = '#f6f2e9';
      ctx.font = `500 ${h * 0.023}px "Space Grotesk", sans-serif`;
      ctx.fillText(`DONKEY FACE  /  ${song.title.toUpperCase()}`, w / 2, h * 0.88);
    }
    if (this.oldFrame) {
      const progress = (timestamp - this.transitionStart) / 1100;
      if (progress >= 1) this.oldFrame = null;
      else { ctx.globalAlpha = 1 - progress; ctx.drawImage(this.oldFrame, 0, 0, w, h); ctx.globalAlpha = 1; }
    }
    if (state.brightness < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - state.brightness})`; ctx.fillRect(0, 0, w, h); }
  }
  drawLogo(w, h, state, colors) {
    const ctx = this.ctx;
    const pulse = songs[state.song].interlude ? 0 : Math.exp(-fract(this.phase || 0) * 5) * state.intensity * motionAmplitude(state.motion);
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(1 + pulse * 0.014, 1 + pulse * 0.014);
    const artwork = this.logoImage || this.defaultLogo;
    if (artwork) {
      const factor = Math.min(w * 0.66 / artwork.width, h * 0.45 / artwork.height);
      ctx.drawImage(artwork, -artwork.width * factor / 2, -artwork.height * factor / 2, artwork.width * factor, artwork.height * factor);
    } else {
      const size = Math.min(w * 0.106, h * 0.18);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${size}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = '#faf6ee';
      ctx.shadowColor = '#000'; ctx.shadowBlur = size * 0.4;
      ctx.fillText('DEVCON', 0, -size * 0.08);
      ctx.shadowBlur = 0;
      const wordWidth = ctx.measureText('DEVCON').width;
      ctx.fillStyle = colors[0]; ctx.font = `500 ${size * 1.45}px "Space Grotesk", sans-serif`;
      ctx.fillText('{', -wordWidth / 2 - size * 0.41, -size * 0.12); ctx.fillText('}', wordWidth / 2 + size * 0.41, -size * 0.12);
      ctx.font = `600 ${size * 0.245}px "Space Grotesk", sans-serif`; ctx.fillStyle = '#faf6ee'; ctx.fillText('2026', 0, size * 0.7);
    }
    ctx.restore();
  }
  drawCognite(w, h, state) {
    const img = this.cogniteImage;
    if (!img.complete || !img.naturalWidth) return;
    const ctx = this.ctx;
    const width = Math.min(w * 0.085, h * 0.13);
    const height = width * img.naturalHeight / img.naturalWidth;
    const interlude = songs[state.song].interlude;
    const amplitude = motionAmplitude(state.motion) * (interlude ? 0.18 : 1);
    const pulse = interlude ? 0 : Math.exp(-fract(this.phase || 0) * 5) * state.intensity * amplitude;
    const x = w * 0.045, y = h * 0.92 - height;
    // In the original SVG, the symbol ends at y=44.55 and the lettering starts
    // at y=58.57. Split in that empty gap so the wordmark is drawn once, fixed.
    const split = img.naturalHeight * 52 / 84;
    const symbolHeight = height * 52 / 84;
    const strips = 40;
    ctx.save(); ctx.globalAlpha = 0.78;
    for (let i = 0; i < strips; i++) {
      const offset = Math.sin(i / strips * TAU + this.time * (interlude ? 0.15 : 1.2)) * h * 0.0025 * amplitude - pulse * h * 0.004;
      ctx.drawImage(img, i * img.naturalWidth / strips, 0, img.naturalWidth / strips, split,
        x + i * width / strips, y + offset, width / strips + 0.35, symbolHeight);
    }
    ctx.drawImage(img, 0, split, img.naturalWidth, img.naturalHeight - split,
      x, y + symbolHeight, width, height - symbolHeight);
    ctx.restore();
  }
  dispose() { this.disposed = true; cancelAnimationFrame(this.raf); this.observer.disconnect(); }
}
