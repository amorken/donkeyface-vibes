import './style.css';
import { songs, palettes } from './songs.js';
import { createStore, ART_KEY, STATE_KEY, sanitizeState } from './store.js';
import { TapTempo } from './tempo.js';
import { changeMotion } from './motion.js';
import { Visualizer, drawScene } from './visuals.js';
import { icon } from './icons.js';
import devconArtwork from './assets/devcon-2026.png';

const seedElement = document.getElementById('donkeyface-show-data');
if (seedElement) {
  try {
    const seed = JSON.parse(seedElement.textContent);
    if (!localStorage.getItem(STATE_KEY)) {
      localStorage.setItem(STATE_KEY, JSON.stringify(sanitizeState({ ...seed.state, epoch: Date.now(), blackout: false, paused: false })));
      if (seed.artwork) localStorage.setItem(ART_KEY, seed.artwork);
    }
  } catch { /* Storage may be disabled; the show can still run. */ }
}
const store = createStore();
const app = document.getElementById('app');
const isStage = new URLSearchParams(location.search).has('stage');
const tapper = new TapTempo();
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let visualizer;
let stageWindow;
let lastHeartbeat = 0;
let helpDialog;

function toast(message) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = message; el.classList.add('visible');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 4200);
}

function tap() {
  if (songs[store.get().song].interlude) return;
  const now = Date.now();
  const result = tapper.tap(now);
  if (!result.accepted) return;
  store.set({ ...(result.bpm ? { bpm: result.bpm, tempoSource: 'Tap synced' } : {}), epoch: now, tapCount: result.count });
  const pad = $('#tap-pad');
  if (pad) { pad.classList.remove('tapped'); void pad.offsetWidth; pad.classList.add('tapped'); }
}

function selectSong(index) {
  if (index < 0 || index >= songs.length || index === store.get().song) return;
  tapper.reset();
  store.set({ song: index, bpm: songs[index].bpm, tempoSource: 'Song preset', tapCount: 0, spotlight: false, palette: 0, epoch: Date.now() });
}

function toggle(key) {
  const state = store.get();
  if (key === 'spotlight' && songs[state.song].interlude) return;
  if (key === 'paused') {
    const now = Date.now();
    store.set(state.paused ? { paused: false, motionStart: state.motionStart + now - state.frozenAt } : { paused: true, frozenAt: now });
  } else store.set({ [key]: !state[key] });
}

function connectArtwork() {
  store.onMessage((data) => {
    if (data?.type === 'artwork') {
      try { data.artwork ? localStorage.setItem(ART_KEY, data.artwork) : localStorage.removeItem(ART_KEY); } catch { /* Direct transport remains available. */ }
      visualizer.setArtwork(data.artwork);
    }
  });
}

if (isStage) {
  document.title = 'Donkey Face — Stage';
  document.body.className = 'stage-body';
  app.innerHTML = `<main class="stage-screen"><canvas id="stage-canvas" aria-label="Live concert visualization"></canvas>
    <div class="stage-hint"><span id="stage-output-name"></span><button id="stage-fullscreen">${icon('expand')} Enter fullscreen <kbd>F</kbd></button><span>Move this window to the stage screen</span></div></main>`;
  visualizer = new Visualizer($('#stage-canvas'), store.get);
  connectArtwork();
  const updateStageLabel = (state) => {
    const ambient = songs[state.song].interlude;
    $('#stage-output-name').textContent = ambient ? 'DEVCON 2026 / AMBIENT OUTPUT' : 'DONKEY FACE / STAGE OUTPUT';
    document.title = ambient ? 'DevCon 2026 — Pause time' : 'Donkey Face — Stage';
  };
  store.subscribe(updateStageLabel); updateStageLabel(store.get());
  const heartbeat = () => {
    const payload = { type: 'heartbeat', at: Date.now(), fullscreen: !!document.fullscreenElement };
    store.message(payload);
    try { localStorage.setItem('donkeyface.stage.heartbeat', JSON.stringify(payload)); } catch { /* Window transport is sufficient. */ }
  };
  setInterval(heartbeat, 1000); heartbeat();
  store.message({ type: 'hello' });
  const fullscreen = async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }
    catch { toast('Use your browser’s fullscreen command (F11).'); }
  };
  $('#stage-fullscreen').onclick = fullscreen;
  document.addEventListener('dblclick', fullscreen);
  let hintTimer;
  const revealHint = () => {
    document.body.classList.add('show-hint');
    clearTimeout(hintTimer); hintTimer = setTimeout(() => document.body.classList.remove('show-hint'), 1000);
  };
  document.addEventListener('mousemove', revealHint); revealHint();
  document.addEventListener('keydown', (event) => { if (event.code === 'KeyF') fullscreen(); });
} else {
  app.innerHTML = `
    <header class="app-header">
      <a class="brand" href="./" aria-label="Donkey Face home"><span class="brand-mark">d<span>f</span><i></i></span><span class="brand-name">donkey face<span>THE LIVE VISUAL DESK</span></span></a>
      <nav class="main-nav" aria-label="Main navigation"><button class="nav-link active" id="live-tab">${icon('monitor')} Live desk</button><button class="nav-link" id="library-tab">${icon('layers')} Scene library <span class="nav-count">${songs.length}</span></button></nav>
      <div class="header-right"><img class="event-logo" src="${devconArtwork}" alt="DevCon 2026"/><span class="header-divider"></span><button class="icon-button" id="settings" aria-label="Show settings">${icon('settings')}</button></div>
    </header>
    <main class="desk">
      <section class="page-heading"><div><div class="eyebrow"><span class="status-dot"></span> COGNITE HOUSE BAND <span class="eyebrow-slash">/</span> LIVE VISUALS</div><h1>Good music. <span>Great visuals.</span></h1><p>You bring the band. We’ll bring the atmosphere.</p></div>
        <div class="heading-actions"><button id="compact-desk" class="button button-quiet" aria-pressed="false" title="Simplified controls for a small supporting window">${icon('settings')} <span>Compact desk</span></button><button id="open-stage" class="button button-primary">${icon('monitor')} Open stage window ${icon('arrow')}</button></div>
      </section>
      <div class="workspace">
        <aside class="setlist-panel panel" aria-label="Concert setlist">
          <div class="panel-heading"><h2>Tonight’s setlist</h2><span class="count-pill">10 SONGS + PAUSE</span></div>
          <div class="setlist" role="list">${songs.map((song, i) => `<button role="listitem" class="song-row ${song.interlude ? 'interlude-row' : ''} ${i === 0 ? 'selected' : ''}" data-song="${i}" aria-label="Play ${song.title}"><span class="song-index">${song.interlude ? icon('moon') : String(i + 1).padStart(2, '0')}</span><span class="song-copy"><span class="song-title">${song.title}</span><span class="song-artist">${song.artist}</span></span><span class="song-indicator">${i === 0 ? '<i></i><i></i><i></i>' : song.sax ? icon('spark') : ''}</span></button>`).join('')}</div>
          <div class="setlist-footer">${icon('music')} A little louder. A little weirder.</div>
        </aside>
        <section class="visual-column" aria-label="Live visualization">
          <div class="preview-panel panel">
            <div class="preview-header"><h2><span class="status-dot coral"></span> LIVE PREVIEW</h2><span id="stage-status" class="connection-status">${icon('monitor')} Stage not connected</span></div>
            <div class="preview-frame"><canvas id="preview" aria-label="Stage visualization preview"></canvas><div class="preview-top"><span class="preview-tag" id="preview-tag">RED SIGNAL</span><span class="aspect-tag">16:9 <span>·</span> OUTPUT</span></div><div class="preview-bottom"><span></span><button class="preview-expand" id="expand-stage" aria-label="Open stage output">${icon('expand')}</button></div><span class="blackout-label" hidden>STAGE BLACKED OUT</span><span class="paused-label" hidden>${icon('pause')} MOTION PAUSED</span></div>
            <div class="preview-caption"><span>${icon('eye')} This is what the audience sees</span><span class="live-pill"><span class="status-dot coral"></span> <span id="output-label">LIVE OUTPUT</span></span></div>
          </div>
          <div class="now-playing panel"><div class="scene-art" id="scene-art"><canvas id="scene-thumb" width="128" height="128"></canvas>${icon('bolt')}</div><div class="now-copy"><div class="eyebrow" id="song-tag">THE OPENER</div><h2 id="current-title">Seven Nation Army</h2><p id="current-artist">The White Stripes <span>·</span> <span id="song-position">01 / 10</span></p></div><div class="track-navigation"><button class="icon-button" id="prev-song" aria-label="Previous song">${icon('chevron', 'flip')}</button><button class="icon-button" id="next-song" aria-label="Next song">${icon('chevron')}</button></div></div>
          <section class="look-panel panel"><div class="look-title"><div><span class="eyebrow">THE LOOK</span><h2 id="scene-name">Red signal</h2></div><span class="mode-pill" id="scene-mood">Heavy · hypnotic</span></div><p id="scene-note">A slow-burning red tunnel. Big shapes for an iconic riff.</p><div class="palette-line"><span>Color palette</span><div class="palette-options" role="group" aria-label="Color palette">${palettes.map((p, i) => `<button class="palette-option ${i === 0 ? 'selected' : ''}" data-palette="${i}" aria-label="${p.name}" title="${p.name}" style="--swatch:${p.colors?.[0] || '#ed5b45'}">${i === 0 ? icon('spark') : ''}</button>`).join('')}</div><span id="palette-name">Song colors</span></div></section>
          <div class="stage-tip">${icon('monitor')}<p>Two screens. One show.<span>Open the stage window, move it to your big screen, then press <kbd>F</kbd>.</span></p>${icon('arrow')}</div>
        </section>
        <aside class="controls-column" aria-label="Live controls">
          <section class="tempo-panel panel"><div class="panel-heading"><h2>Keep the beat</h2>${icon('music')}</div><div class="tempo-source"><span class="status-dot"></span><span id="tempo-source">Song preset</span></div><div class="bpm-display"><button id="bpm-minus" class="bpm-nudge" aria-label="Decrease BPM">−</button><div><input id="bpm-input" type="number" min="40" max="220" value="124" aria-label="Tempo in beats per minute"/><span>BPM</span></div><button id="bpm-plus" class="bpm-nudge" aria-label="Increase BPM">+</button></div><div class="beat-dots" aria-label="Beat indicator"><i></i><i></i><i></i><i></i></div><button class="tap-pad" id="tap-pad"><span>${icon('bolt')} Tap to the beat</span><span>or press <kbd>SPACE</kbd></span></button><p class="tap-help" id="tap-help">Tap a few times. We’ll find the rhythm.</p></section>
          <section class="energy-panel panel"><div class="panel-heading"><h2>Set the energy</h2>${icon('sun')}</div><div class="motion-control"><div class="slider-label"><label for="motion">Motion aggressiveness</label><output id="motion-value">50%</output></div><input class="range" id="motion" type="range" min="0" max="100" value="50"/><div class="range-hints"><span>Still</span><span>Unleashed</span></div></div><div class="slider-label"><label for="intensity">Beat intensity</label><output id="intensity-value">65%</output></div><input class="range" id="intensity" type="range" min="0" max="100" value="65"/><div class="range-hints"><span>Easy does it</span><span>All in</span></div><div class="slider-label brightness-label"><label for="brightness">Brightness</label><output id="brightness-value">90%</output></div><input class="range" id="brightness" type="range" min="0" max="100" value="90"/><div class="control-divider"></div><label class="switch-row"><span>${icon('eye')} DevCon artwork</span><input class="switch-input" type="checkbox" id="logo-toggle" checked/><span class="switch"></span></label><label class="switch-row"><span>${icon('spark')} Cognite wave</span><input class="switch-input" type="checkbox" id="cognite-toggle" checked/><span class="switch"></span></label><label class="switch-row"><span>${icon('music')} Song titles on stage</span><input class="switch-input" type="checkbox" id="titles-toggle"/><span class="switch"></span></label></section>
          <button class="spotlight-button" id="spotlight" aria-pressed="false"><span class="spotlight-icon">${icon('spark')}</span><span>Sax spotlight<span>A little extra main character energy</span></span><kbd>S</kbd></button>
          <div class="safety-controls"><button id="pause" aria-pressed="false">${icon('pause')} <span>Pause motion</span></button><button id="blackout" aria-pressed="false">${icon('moon')} <span>Blackout</span><kbd>B</kbd></button></div>
        </aside>
      </div>
      <footer class="desk-footer"><span><span class="status-dot"></span> READY WHEN YOU ARE <span class="footer-sep">/</span> BUILT FOR THE BIG SCREEN</span><button id="shortcuts">${icon('keyboard')} Keyboard shortcuts <kbd>?</kbd></button><span class="footer-credit">MADE FOR <b>DONKEY FACE</b> <span class="tiny-flower">✳</span></span></footer>
    </main>
    <dialog id="modal"><div class="modal-heading"><h2 id="modal-title"></h2><button class="icon-button" id="close-modal" aria-label="Close dialog">${icon('close')}</button></div><div id="modal-content"></div></dialog>`;

  visualizer = new Visualizer($('#preview'), store.get, { preview: true });
  connectArtwork();
  helpDialog = $('#modal');
  $('#close-modal').onclick = () => helpDialog.close();
  helpDialog.addEventListener('click', (event) => { if (event.target === helpDialog) { const r = helpDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) helpDialog.close(); } });
  helpDialog.addEventListener('close', () => $('#library-tab').classList.remove('active'));

  function showModal(title, html) { $('#modal-title').textContent = title; $('#modal-content').innerHTML = html; helpDialog.showModal(); }

  function openStage() {
    const url = new URL(location.href); url.searchParams.set('stage', '1'); url.hash = '';
    stageWindow = window.open(url.href, 'donkeyface-stage', 'popup,width=1280,height=720');
    if (!stageWindow) { toast('Allow pop-ups for this page, then open the stage window again.'); return; }
    store.linkWindow(stageWindow);
    stageWindow.focus();
  }
  $('#open-stage').onclick = openStage; $('#expand-stage').onclick = openStage;
  const updateCompact = () => {
    const compact = document.body.classList.contains('compact-mode');
    $('#compact-desk').setAttribute('aria-pressed', String(compact));
    $('#compact-desk span').textContent = compact ? 'Full desk' : 'Compact desk';
  };
  $('#compact-desk').onclick = () => { document.body.classList.toggle('compact-mode'); updateCompact(); };
  updateCompact();
  $$('.song-row').forEach((button) => button.onclick = () => selectSong(Number(button.dataset.song)));
  $('#prev-song').onclick = () => selectSong(store.get().song - 1);
  $('#next-song').onclick = () => selectSong(store.get().song + 1);
  $('#tap-pad').onclick = tap;
  $('#blackout').onclick = () => toggle('blackout');
  $('#pause').onclick = () => toggle('paused');
  $('#spotlight').onclick = () => toggle('spotlight');
  $('#logo-toggle').onchange = (e) => store.set({ logo: e.target.checked });
  $('#cognite-toggle').onchange = (e) => store.set({ cognite: e.target.checked });
  $('#titles-toggle').onchange = (e) => store.set({ titles: e.target.checked });
  $('#motion').oninput = (e) => store.set(changeMotion(store.get(), Number(e.target.value) / 100));
  for (const key of ['intensity', 'brightness']) $(`#${key}`).oninput = (e) => store.set({ [key]: Number(e.target.value) / 100 });
  $$('.palette-option').forEach((button) => button.onclick = () => store.set({ palette: Number(button.dataset.palette) }));
  function manualTempo(bpm) {
    if (!Number.isFinite(bpm)) { $('#bpm-input').value = store.get().bpm; return; }
    tapper.reset(); store.set({ bpm: Math.round(Math.max(40, Math.min(220, bpm))), tapCount: 0, tempoSource: 'Manual tempo', epoch: Date.now() });
  }
  $('#bpm-input').onchange = (e) => manualTempo(e.target.value === '' ? NaN : Number(e.target.value));
  $('#bpm-minus').onclick = () => manualTempo(store.get().bpm - 1);
  $('#bpm-plus').onclick = () => manualTempo(store.get().bpm + 1);

  $('#library-tab').onclick = () => {
    $('#library-tab').classList.add('active');
    showModal('A different world for every song.', `<p class="modal-intro">Ten songs and a mellow pause scene, made for tonight’s show. Choose a scene to take it live.</p><div class="scene-grid">${songs.map((s, i) => `<button class="scene-card" data-scene="${i}"><canvas width="360" height="180" data-scene-canvas="${i}"></canvas><span>${s.scene}${i === store.get().song ? '<b>LIVE</b>' : ''}</span><small>${String(i + 1).padStart(2, '0')} / ${s.title}</small></button>`).join('')}</div>`);
    $$('[data-scene-canvas]').forEach((c) => { const s = songs[Number(c.dataset.sceneCanvas)]; drawScene(c.getContext('2d'), 360, 180, 4, 0.2, s.colors, 0.7, false, s.mode); });
    $$('[data-scene]').forEach((b) => b.onclick = () => { selectSong(Number(b.dataset.scene)); helpDialog.close(); });
  };
  $('#live-tab').onclick = () => helpDialog.close();

  const shortcuts = () => showModal('Stay in the moment.', `<p class="modal-intro">Your hands know the show. These work in either window.</p><div class="shortcut-list">${[['Space', 'Tap the tempo'], ['← / →', 'Previous / next song'], ['B', 'Blackout / restore stage'], ['S', 'Toggle sax spotlight'], ['P', 'Pause / resume motion'], ['1 – 9, 0', 'Jump to song 1–10'], ['A', 'Pause time / ambient scene'], ['F', 'Fullscreen (stage window)'], ['?', 'Show these shortcuts']].map(([key, meaning]) => `<div><span>${meaning}</span><kbd>${key}</kbd></div>`).join('')}</div><p class="modal-footnote">Shortcuts pause while you’re typing or adjusting a control. Blackout keeps the beat running, so you can come back right on time.</p>`);
  $('#shortcuts').onclick = shortcuts;

  $('#settings').onclick = () => {
    let hasArt = false; try { hasArt = !!localStorage.getItem(ART_KEY); } catch { /* Optional. */ }
    showModal('Make it your show.', `<p class="modal-intro">Your event artwork, your stage. Everything stays on this machine.</p><section class="settings-section"><div class="eyebrow">EVENT ARTWORK</div><h3>Give DevCon center stage.</h3><p>Upload the original logo to replace the default DevCon artwork. PNG, JPEG or WebP, up to 2 MB. A transparent PNG looks best.</p><div class="artwork-status" id="artwork-status">${icon('check')} ${hasArt ? 'Custom artwork loaded' : 'Default DevCon artwork'}</div><label class="button button-secondary upload-label">${icon('upload')} Upload artwork<input type="file" id="art-upload" accept="image/png,image/jpeg,image/webp" hidden/></label> <button class="text-button" id="reset-art">Use default DevCon artwork</button></section><section class="settings-section"><div class="eyebrow">TAKE IT WITH YOU</div><h3>One file. The whole show.</h3><p>The release HTML runs offline. Save a show file to include your artwork, selected scene, and settings. Open it in Chrome or Edge on the concert machine.</p><button class="button button-secondary" id="export-show" ${import.meta.env.DEV ? 'disabled' : ''}>${icon('download')} Save show file</button>${import.meta.env.DEV ? '<p class="modal-footnote">Available in the packaged release. Run <code>npm run package</code> to create it.</p>' : ''}</section><p class="modal-footnote">Song tempos are starting points. Tap along to the live band to dial them in. No microphone, sign-in, or network connection needed.</p>`);
    $('#art-upload').onchange = uploadArtwork;
    $('#reset-art').onclick = () => {
      try { localStorage.removeItem(ART_KEY); } catch { /* Direct transport works without storage. */ }
      store.set({ artVersion: Date.now() }); store.message({ type: 'artwork', artwork: null }); visualizer.setArtwork(null);
      $('#artwork-status').innerHTML = `${icon('check')} Default DevCon artwork`; toast('Default artwork restored.');
    };
    $('#export-show').onclick = exportShow;
  };

  async function uploadArtwork(event) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { toast('Choose a PNG, JPEG or WebP smaller than 2 MB.'); return; }
    try {
      const artwork = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
      await new Promise((resolve, reject) => { const i = new Image(); i.onload = resolve; i.onerror = reject; i.src = artwork; });
      try { localStorage.setItem(ART_KEY, artwork); }
      catch { toast('Browser storage is full. Choose a smaller image so it can be saved.'); return; }
      store.set({ artVersion: Date.now(), logo: true }); store.message({ type: 'artwork', artwork }); visualizer.setArtwork(artwork);
      $('#artwork-status').innerHTML = `${icon('check')} Custom artwork loaded`;
      toast('Artwork is live. Save a show file to take it with you.');
    } catch { toast('This image could not be read. Try a PNG or JPEG.'); }
  }

  function exportShow() {
    let artwork = null; try { artwork = localStorage.getItem(ART_KEY); } catch { /* Export without custom artwork. */ }
    const doc = document.documentElement.cloneNode(true);
    doc.querySelector('#app').innerHTML = '';
    doc.querySelector('#toast')?.remove();
    doc.querySelector('#donkeyface-show-data')?.remove();
    const seed = document.createElement('script'); seed.type = 'application/json'; seed.id = 'donkeyface-show-data';
    seed.textContent = JSON.stringify({ state: { ...store.get(), blackout: false, paused: false }, artwork }).replaceAll('<', '\\u003c');
    doc.querySelector('head').append(seed);
    const file = new Blob(['<!doctype html>\n' + doc.outerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(file); const a = document.createElement('a'); a.href = url; a.download = 'Donkey-Face-Show.html'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast('Show file saved, including your artwork and settings.');
  }

  let renderedSong = -1;
  function render(state) {
    const song = songs[state.song];
    if (renderedSong !== state.song) {
      renderedSong = state.song;
      $$('.song-row').forEach((row, i) => {
        row.classList.toggle('selected', i === state.song); row.setAttribute('aria-current', i === state.song ? 'true' : 'false');
        row.querySelector('.song-indicator').innerHTML = i === state.song ? '<i></i><i></i><i></i>' : songs[i].sax ? icon('spark') : '';
      });
      $('#current-title').textContent = song.title; $('#current-artist').innerHTML = `${song.artist} <span>·</span> <span id="song-position">${song.interlude ? 'INTERLUDE' : String(state.song + 1).padStart(2, '0') + ' / 10'}</span>`;
      $('#song-tag').textContent = song.tag; $('#scene-name').textContent = song.scene; $('#scene-mood').textContent = song.mood;
      $('#scene-note').textContent = song.note; $('#preview-tag').textContent = song.scene.toUpperCase();
      $('#prev-song').disabled = state.song === 0; $('#next-song').disabled = state.song === songs.length - 1;
      const c = $('#scene-thumb'); drawScene(c.getContext('2d'), 128, 128, 4, 0.25, song.colors, 0.8, false, song.mode);
      document.documentElement.style.setProperty('--scene-color', song.colors[0]);
      $('.palette-option').style.setProperty('--swatch', song.colors[0]);
    }
    $('#bpm-input').value = state.bpm; $('#tempo-source').textContent = song.interlude ? 'Ambient · no beat' : state.tempoSource;
    for (const id of ['bpm-input', 'bpm-minus', 'bpm-plus', 'tap-pad', 'spotlight', 'titles-toggle']) $(`#${id}`).disabled = !!song.interlude;
    $('#tap-help').textContent = song.interlude ? 'Slow drifting visuals. No tapping needed.' : state.tapCount ? `${state.tapCount} ${state.tapCount === 1 ? 'tap' : 'taps'} ${state.tapCount === 1 ? '— keep going…' : 'averaged · keep tapping to refine'}` : 'Tap a few times. We’ll find the rhythm.';
    for (const key of ['intensity', 'brightness', 'motion']) { const value = Math.round(state[key] * 100); $(`#${key}`).value = value; $(`#${key}`).style.setProperty('--range-fill', `${value}%`); $(`#${key}-value`).textContent = `${value}%`; }
    $('#logo-toggle').checked = state.logo; $('#cognite-toggle').checked = state.cognite; $('#titles-toggle').checked = state.titles;
    $$('.palette-option').forEach((b, i) => { b.classList.toggle('selected', i === state.palette); b.setAttribute('aria-pressed', String(i === state.palette)); });
    $('#palette-name').textContent = palettes[state.palette].name;
    for (const key of ['spotlight', 'blackout', 'pause']) { const on = state[key === 'pause' ? 'paused' : key]; $(`#${key}`).classList.toggle('active', on); $(`#${key}`).setAttribute('aria-pressed', String(on)); }
    $('#pause').innerHTML = `${icon(state.paused ? 'play' : 'pause')} <span>${state.paused ? 'Resume motion' : 'Pause motion'}</span>`;
    $('#blackout').innerHTML = `${icon(state.blackout ? 'eye' : 'moon')} <span>${state.blackout ? 'Restore stage' : 'Blackout'}</span><kbd>B</kbd>`;
    $('#blackout').setAttribute('aria-label', state.blackout ? 'Restore stage' : 'Blackout');
    $('.blackout-label').hidden = !state.blackout; $('.paused-label').hidden = !state.paused || state.blackout;
    $('#output-label').textContent = state.blackout ? 'BLACKOUT' : state.paused ? 'MOTION PAUSED' : song.interlude ? 'AMBIENT OUTPUT' : 'LIVE OUTPUT';
  }
  store.subscribe(render); render(store.get());

  store.onMessage((data) => { if (data?.type === 'heartbeat') lastHeartbeat = Date.now(); });
  setInterval(() => {
    const connected = Date.now() - lastHeartbeat < 3500;
    const el = $('#stage-status'); el.classList.toggle('connected', connected); el.innerHTML = `${icon('monitor')} ${connected ? 'Stage connected' : 'Stage not connected'}`;
  }, 800);
  function beatTick() {
    const state = store.get(); const beat = ((Math.floor((Date.now() - state.epoch) / (60000 / state.bpm)) % 4) + 4) % 4;
    const elapsed = ((Date.now() - state.epoch) % (60000 / state.bpm)) / (60000 / state.bpm);
    $$('.beat-dots i').forEach((el, i) => el.classList.toggle('on', !songs[state.song].interlude && i === beat && elapsed < 0.55));
    requestAnimationFrame(beatTick);
  }
  beatTick();
  window.addEventListener('show-shortcuts', shortcuts);
}

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
  if (helpDialog?.open) return;
  if (event.code === 'Space') { event.preventDefault(); tap(); }
  else if (event.code === 'ArrowRight') { event.preventDefault(); selectSong(store.get().song + 1); }
  else if (event.code === 'ArrowLeft') { event.preventDefault(); selectSong(store.get().song - 1); }
  else if (event.code === 'KeyA') selectSong(songs.findIndex(song => song.interlude));
  else if (event.code === 'KeyB') toggle('blackout');
  else if (event.code === 'KeyS') toggle('spotlight');
  else if (event.code === 'KeyP') toggle('paused');
  else if (/^Digit[0-9]$/.test(event.code)) selectSong((Number(event.code.slice(-1)) + 9) % 10);
  else if (event.key === '?' && !isStage) window.dispatchEvent(new Event('show-shortcuts'));
});

window.addEventListener('beforeunload', () => visualizer.dispose());
