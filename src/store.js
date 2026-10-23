import { songs } from './songs.js';

export const STATE_KEY = 'donkeyface.show.v1';
export const ART_KEY = 'donkeyface.artwork.v1';
export const defaults = {
  song: 0, bpm: 124, epoch: Date.now(), intensity: 0.65, brightness: 0.9,
  palette: 0, blackout: false, spotlight: false, logo: true, cognite: true, titles: false,
  paused: false, motionStart: Date.now(), frozenAt: Date.now(), tapCount: 0, tempoSource: 'Song preset', artVersion: 0,
};

export function sanitizeState(raw = {}) {
  const result = { ...defaults };
  for (const key of ['blackout', 'spotlight', 'logo', 'cognite', 'titles', 'paused']) {
    if (typeof raw[key] === 'boolean') result[key] = raw[key];
  }
  for (const [key, min, max] of [['song', 0, songs.length - 1], ['bpm', 40, 220], ['intensity', 0, 1], ['brightness', 0, 1], ['palette', 0, 4], ['tapCount', 0, 8], ['epoch', 0, Number.MAX_SAFE_INTEGER], ['motionStart', 0, Number.MAX_SAFE_INTEGER], ['frozenAt', 0, Number.MAX_SAFE_INTEGER], ['artVersion', 0, Number.MAX_SAFE_INTEGER]]) {
    if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) result[key] = Math.max(min, Math.min(max, raw[key]));
  }
  result.song = Math.floor(result.song);
  result.palette = Math.floor(result.palette);
  if (['Song preset', 'Tap synced', 'Manual tempo'].includes(raw.tempoSource)) result.tempoSource = raw.tempoSource;
  return result;
}

export function createStore() {
  let state;
  let storageAvailable = true;
  try { state = sanitizeState(JSON.parse(localStorage.getItem(STATE_KEY) || '{}')); }
  catch { state = { ...defaults }; }
  const listeners = new Set();
  const messages = new Set();
  let channel = null;
  try { channel = new BroadcastChannel('donkeyface.live.v1'); } catch { /* File origins can use window messaging instead. */ }
  const peers = new Set();
  function send(data) {
    channel?.postMessage(data);
    for (const peer of [window.opener, ...peers]) {
      if (peer && !peer.closed) peer.postMessage({ ...data, scope: 'donkeyface.live.v1' }, '*');
    }
  }
  function receive(next) {
    state = sanitizeState(next);
    for (const fn of listeners) fn(state);
  }
  channel?.addEventListener('message', ({ data }) => {
    if (data?.type === 'state') receive(data.state);
    else for (const fn of messages) fn(data);
  });
  window.addEventListener('message', ({ source, data }) => {
    if (data?.scope !== 'donkeyface.live.v1' || (source !== window.opener && !peers.has(source))) return;
    if (data.type === 'state') receive(data.state);
    else if (data.type === 'hello') {
      source.postMessage({ scope: 'donkeyface.live.v1', type: 'state', state }, '*');
      let artwork = null;
      try { artwork = localStorage.getItem(ART_KEY); } catch { /* Optional artwork. */ }
      source.postMessage({ scope: 'donkeyface.live.v1', type: 'artwork', artwork }, '*');
    } else for (const fn of messages) fn(data);
  });
  window.addEventListener('storage', ({ key, newValue }) => {
    if (key === STATE_KEY && newValue) {
      try { receive(JSON.parse(newValue)); } catch { /* Ignore malformed external writes. */ }
    }
    if (key === 'donkeyface.stage.heartbeat') {
      try { for (const fn of messages) fn({ type: 'heartbeat', ...JSON.parse(newValue) }); } catch { /* A stale heartbeat is harmless. */ }
    }
  });
  return {
    get: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    onMessage: (fn) => { messages.add(fn); return () => messages.delete(fn); },
    message: send,
    linkWindow: (peer) => { peers.add(peer); },
    set(patch) {
      state = sanitizeState({ ...state, ...patch });
      try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
      catch { storageAvailable = false; }
      send({ type: 'state', state });
      for (const fn of listeners) fn(state);
    },
    storageAvailable: () => storageAvailable,
  };
}
