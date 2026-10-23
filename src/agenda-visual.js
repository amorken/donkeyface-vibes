import { EVENT_DAY, EVENT_VENUE } from './agenda.js';

function lines(ctx, text, width) {
  const result = []; let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && ctx.measureText(`${line} ${word}`).width > width) { result.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) result.push(line);
  return result;
}

function textBlock(ctx, text, x, y, width, height, size, { weight = 500, color = '#f4eee9' } = {}) {
  let wrapped;
  do {
    ctx.font = `${weight} ${size}px "Space Grotesk", sans-serif`;
    wrapped = lines(ctx, text, width);
    if (wrapped.length * size * 1.25 <= height) break;
    size *= 0.93;
  } while (size > 8);
  ctx.fillStyle = color;
  wrapped.forEach((line, i) => ctx.fillText(line, x, y + i * size * 1.25));
}

export function drawAgenda(ctx, w, h, view, colors) {
  ctx.save(); ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#100d14a0'; ctx.fillRect(0, 0, w, h);
  const left = w * 0.065, right = w * 0.935;
  ctx.font = `500 ${h * 0.013}px "Space Grotesk", sans-serif`; ctx.fillStyle = '#c3aeb8';
  ctx.fillText(EVENT_DAY, left, h * 0.07);
  ctx.font = `400 ${h * 0.014}px "Space Grotesk", sans-serif`;
  ctx.fillText(EVENT_VENUE, left, h * 0.095);
  ctx.font = `500 ${h * 0.07}px "Space Grotesk", sans-serif`; ctx.fillStyle = '#f5f0e9';
  ctx.fillText('What’s next', left, h * 0.205);
  ctx.textAlign = 'right'; ctx.font = `400 ${h * 0.036}px "Space Grotesk", sans-serif`;
  ctx.fillText(view.clock.time, right, h * 0.223);
  ctx.font = `400 ${h * 0.012}px "Space Grotesk", sans-serif`; ctx.fillStyle = '#b6a0ad';
  ctx.fillText('OSLO TIME', right, h * 0.275);
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#f7d7e52b'; ctx.lineWidth = Math.max(1, h / 1000);
  ctx.beginPath(); ctx.moveTo(left, h * 0.32); ctx.lineTo(right, h * 0.32); ctx.stroke();

  const { entry } = view;
  if (!entry) {
    textBlock(ctx, 'Thanks for a great DevCon.', left, h * 0.43, w * 0.8, h * 0.2, h * 0.065);
    ctx.font = `400 ${h * 0.025}px "Space Grotesk", sans-serif`; ctx.fillStyle = '#c6b2be';
    ctx.fillText('See you next time.', left, h * 0.66);
  } else {
    ctx.font = `400 ${h * 0.09}px "Space Grotesk", sans-serif`; ctx.fillStyle = colors[0];
    ctx.fillText(entry.time, left, h * 0.355);
    const contentX = w * 0.285;
    ctx.font = `500 ${h * 0.012}px "Space Grotesk", sans-serif`; ctx.fillStyle = '#bfa5b2';
    ctx.fillText(view.label, contentX, h * 0.353);
    textBlock(ctx, entry.title, contentX, h * 0.38, right - contentX, h * 0.075, h * 0.039);
    const gap = w * 0.015, cardY = h * 0.49, cardH = h * 0.35;
    const cardW = (right - left - gap * (entry.items.length - 1)) / entry.items.length;
    const padding = h * 0.02;
    for (let i = 0; i < entry.items.length; i++) {
      const item = entry.items[i], x = left + i * (cardW + gap), contentW = cardW - padding * 2;
      ctx.fillStyle = '#211b26d9'; ctx.fillRect(x, cardY, cardW, cardH);
      ctx.strokeStyle = '#f7d7e526'; ctx.strokeRect(x, cardY, cardW, cardH);
      ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(x, cardY, cardW, Math.max(1.5, h * 0.002));
      ctx.font = `500 ${h * 0.013}px "Space Grotesk", sans-serif`; ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(item.track?.toUpperCase() || (item.title ? 'MAIN PROGRAM' : 'WHERE'), x + padding, cardY + padding);
      if (item.title) {
        textBlock(ctx, item.room, x + padding, cardY + h * 0.052, contentW, h * 0.045, h * 0.017, { weight: 400, color: '#c3aebd' });
        textBlock(ctx, item.title, x + padding, cardY + h * 0.105, contentW, h * 0.15, h * (entry.items.length === 1 ? 0.036 : 0.025));
        textBlock(ctx, item.speaker || '', x + padding, cardY + h * 0.275, contentW, h * 0.055, h * 0.017, { weight: 400, color: '#d1b9c7' });
      } else {
        textBlock(ctx, item.room || EVENT_VENUE, x + padding, cardY + h * 0.11, contentW, h * 0.15, h * 0.043);
        ctx.font = `400 ${h * 0.018}px "Space Grotesk", sans-serif`; ctx.fillStyle = '#b9a2b0';
        ctx.fillText('DevCon 2026', x + padding, cardY + h * 0.285);
      }
    }
  }
  ctx.textAlign = 'center'; ctx.font = `400 ${h * 0.012}px "Space Grotesk", sans-serif`; ctx.fillStyle = '#a28a99';
  ctx.fillText('Times and locations may change on the day', w / 2, h * 0.93);
  ctx.restore();
}
