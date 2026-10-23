import test from 'node:test';
import assert from 'node:assert/strict';
import { TapTempo } from '../src/tempo.js';
import { sanitizeState } from '../src/store.js';
import { songs } from '../src/songs.js';
import { motionTime, changeMotion, motionAmplitude } from '../src/motion.js';

test('averages a human-tapped 120 BPM and caps the window at eight taps', () => {
  const tap = new TapTempo();
  let time = 0, result = tap.tap(time);
  assert.equal(result.bpm, null);
  for (const interval of [490, 510, 505, 495, 500, 502, 498, 500, 500]) {
    time += interval; result = tap.tap(time);
  }
  assert.equal(result.bpm, 120);
  assert.equal(result.count, 8);
  assert.equal(tap.intervals.length, 7);
});

test('accidental double taps do not move the beat anchor or corrupt the average', () => {
  const tap = new TapTempo();
  tap.tap(0); tap.tap(500); tap.tap(1000);
  assert.equal(tap.tap(1070).accepted, false);
  assert.equal(tap.tap(1500).bpm, 120);
});

test('a long gap starts a fresh tempo rather than averaging across songs', () => {
  const tap = new TapTempo();
  tap.tap(0); tap.tap(500); tap.tap(1000);
  assert.deepEqual(tap.tap(5000), { bpm: null, count: 1, accepted: true });
  assert.equal(tap.tap(5400).bpm, 150);
});

test('a missed beat resets the tap sequence without a sudden BPM change', () => {
  const tap = new TapTempo(); tap.tap(0); tap.tap(500); tap.tap(1000);
  const result = tap.tap(2000);
  assert.equal(result.bpm, null); assert.equal(result.count, 1);
  assert.equal(tap.tap(2500).bpm, 120);
});

test('supports a slow 40 BPM and fast 220 BPM within the documented range', () => {
  const slow = new TapTempo(); slow.tap(0); assert.equal(slow.tap(1500).bpm, 40);
  const fast = new TapTempo(); fast.tap(0); assert.equal(fast.tap(60000 / 220).bpm, 220);
});

test('rejects corrupt persisted state and clamps externally supplied control values', () => {
  const state = sanitizeState({ song: 99, bpm: -20, intensity: NaN, brightness: 2, palette: 4.7, blackout: 'false', logo: false });
  assert.equal(state.song, songs.length - 1); assert.equal(state.bpm, 40); assert.equal(state.intensity, 0.65);
  assert.equal(state.brightness, 1); assert.equal(state.palette, 4); assert.equal(state.blackout, false); assert.equal(state.logo, false);
});

test('motion changes preserve the animation position while changing its subsequent speed', () => {
  const state = { motion: 0.5, motionOffset: 3, motionStart: 1000, paused: false };
  const before = motionTime(state, 6000);
  const faster = { ...state, ...changeMotion(state, 1, 6000) };
  assert.equal(motionTime(faster, 6000), before);
  assert.equal(motionTime(faster, 7000) - before, 2);
  const still = { ...faster, ...changeMotion(faster, 0, 7000) };
  assert.equal(motionTime(still, 9000), motionTime(faster, 7000));
});

test('adjusting motion while paused does not move the scene or count paused time', () => {
  const state = { motion: 0.5, motionOffset: 3, motionStart: 1000, paused: true, frozenAt: 6000 };
  const changed = { ...state, ...changeMotion(state, 1, 9000) };
  assert.equal(motionTime(changed, 10000), motionTime(state, 6000));
  const resumed = { ...changed, paused: false, motionStart: changed.motionStart + 10000 - changed.frozenAt };
  assert.equal(motionTime(resumed, 10000), motionTime(state, 6000));
  assert.equal(motionTime(resumed, 11000), motionTime(state, 6000) + 2);
});

test('motion starts with the existing look, supports stillness and stronger amplitude, and migrates saved shows', () => {
  assert.equal(motionAmplitude(0), 0);
  assert.equal(motionAmplitude(0.5), 1);
  assert.ok(motionAmplitude(0.25) < 0.5);
  assert.ok(motionAmplitude(1) > 2);
  assert.equal(sanitizeState({}).motion, 0.5);
  assert.equal(sanitizeState({ motion: -1 }).motion, 0);
  assert.equal(sanitizeState({ motion: 3 }).motion, 1);
});
