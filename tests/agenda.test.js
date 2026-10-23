import test from 'node:test';
import assert from 'node:assert/strict';
import { agenda, agendaView, eventClock } from '../src/agenda.js';
import { sanitizeState } from '../src/store.js';

const state = { agendaSelection: 'auto', agendaGraceMinutes: 5 };
// Oslo returned to CET on October 25: 08:00 UTC is 09:00 on the event day.
const at = (time, date = '2026-10-26') => Date.parse(`${date}T${time}+01:00`);

test('uses the actual event date and Oslo time, including the DST change before the event', () => {
  assert.equal(eventClock(Date.parse('2026-10-26T08:00:00Z')).time, '09:00');
  assert.equal(eventClock(Date.parse('2026-10-24T07:00:00Z')).time, '09:00');
  assert.equal(agendaView(state, at('08:30')).entry.id, 'coffee');
  assert.equal(agendaView(state, at('23:30', '2026-10-25')).entry.id, 'coffee');
  assert.equal(agendaView(state, at('00:00', '2026-10-27')).entry, null);
});

test('keeps a just-started item until five minutes after its start, then shows the next block', () => {
  assert.equal(agendaView(state, at('09:44:59')).entry.id, 'session-1-0945');
  assert.equal(agendaView(state, at('09:45')).label, 'STARTING NOW');
  assert.equal(agendaView(state, at('09:49:59')).entry.id, 'session-1-0945');
  assert.equal(agendaView(state, at('09:50')).entry.id, 'session-1-1015');
  assert.equal(agendaView(state, at('09:50')).label, 'UP NEXT');
});

test('advances correctly at each grace boundary and retains the final keynote without inventing an end', () => {
  for (let i = 0; i < agenda.length - 1; i++) {
    const cutoff = at(agenda[i].time) + 5 * 60000;
    assert.equal(agendaView(state, cutoff - 1).entry.id, agenda[i].id);
    assert.equal(agendaView(state, cutoff).entry.id, agenda[i + 1].id);
  }
  const final = agendaView(state, at('15:05'));
  assert.equal(final.entry.id, 'closing'); assert.equal(final.label, 'FINAL SESSION');
  assert.equal(agendaView(state, at('23:59')).entry.id, 'closing');
});

test('supports custom grace and manual selection on any date until automatic is restored', () => {
  assert.equal(agendaView({ ...state, agendaGraceMinutes: 0 }, at('09:45')).entry.id, 'session-1-1015');
  assert.equal(agendaView({ ...state, agendaGraceMinutes: 10 }, at('09:54:59')).entry.id, 'session-1-0945');
  const manual = { ...state, agendaSelection: 'lunch' };
  assert.equal(agendaView(manual, at('08:00', '2026-10-27')).entry.id, 'lunch');
  assert.equal(agendaView(manual, at('14:00')).manual, true);
  assert.equal(agendaView({ ...manual, agendaSelection: 'auto' }, at('14:00')).entry.id, 'session-3-1400');
});

test('includes the complete 17-block agenda and omits blank track slots in the PDF', () => {
  assert.equal(agenda.length, 17);
  assert.equal(agenda.find(e => e.time === '09:45').items.length, 3);
  assert.equal(agenda.find(e => e.time === '12:45').items.length, 2);
  assert.deepEqual(agenda.find(e => e.time === '13:45').items.map(i => i.track), ['Track 2 · Under the hood', 'Track 3 · Behind the scenes']);
  assert.equal(agenda.find(e => e.id === 'lunch').items[0].room, 'Atrium & all rooms');
  assert.equal(agenda.find(e => e.time === '14:15').items[2].speaker, 'Åsmund Eldhuset');
});

test('migrates existing shows and validates manual selections and grace periods', () => {
  assert.equal(sanitizeState({}).agendaSelection, 'auto');
  assert.equal(sanitizeState({}).agendaGraceMinutes, 5);
  assert.equal(sanitizeState({ agendaSelection: 'lunch' }).agendaSelection, 'lunch');
  assert.equal(sanitizeState({ agendaSelection: 'unknown' }).agendaSelection, 'auto');
  assert.equal(sanitizeState({ agendaGraceMinutes: -1 }).agendaGraceMinutes, 0);
  assert.equal(sanitizeState({ agendaGraceMinutes: 99 }).agendaGraceMinutes, 15);
});
