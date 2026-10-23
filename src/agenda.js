// Transcribed from the supplied DevCon26_Agenda_onepager.pdf.
export const EVENT_DATE = '2026-10-26';
export const EVENT_TIMEZONE = 'Europe/Oslo';
export const EVENT_DAY = 'MONDAY 26 OCTOBER';
export const EVENT_VENUE = 'MESH Youngstorget';

const tracks = [
  { track: 'Track 1 · In the wild', room: 'Project Room 001 (downstairs)' },
  { track: 'Track 2 · Under the hood', room: 'Atrium' },
  { track: 'Track 3 · Behind the scenes', room: 'Corner Bar' },
];
const talk = (track, speaker, title) => ({ ...tracks[track - 1], speaker, title });
const plenary = (id, time, title, room, extra = {}) => ({ id, time, title, items: [{ room, ...extra }] });

export const agenda = [
  plenary('coffee', '09:00', 'Coffee & mingling', 'Atrium'),
  plenary('opening', '09:10', 'Opening', 'Atrium'),
  plenary('opening-keynote', '09:15', 'Opening keynote', 'Atrium', {
    speaker: 'Geir Engdahl, CTO', title: 'Architecture Principles Refresher. How CDF was built and going forward',
  }),
  { id: 'session-1-0945', time: '09:45', title: 'Session 1 · Parallel talks', items: [
    talk(1, 'Takuma Homma', 'Expanding CDF into Supply Chain Management: Building an Interactive Optimization Agent'),
    talk(2, 'Kristoffer Rakstad, Xin Kelly, Aryan TaheriMonfared', 'Self-hosting LLMs at Cognite: Early lessons from our GKE inference experiment'),
    talk(3, 'Håkon Treider', '(WIP) The very simple task of making the SDK async'),
  ] },
  { id: 'session-1-1015', time: '10:15', title: 'Session 1 · Parallel talks', items: [
    talk(1, 'Jan Eivind Danielsen', 'Can AI enable a future where basic human needs are guaranteed?'),
    talk(2, 'Peet Cremer, Erlend Aune, Andreas Solbrå', 'How to train dark horses'),
    talk(3, 'Elias Figenscou-Bjørne', 'Taming datamodeling: building a typescript sdk for the app developers'),
  ] },
  { id: 'session-1-1045', time: '10:45', title: 'Session 1 · Parallel talks', items: [
    talk(1, 'Pranav Kalwad', 'AdaptPro (Agentic AI and LLMs for the intersection of Business, tech and Product)'),
    talk(2, 'Aliaksei Taliuk', 'APIs Are Not Just Endpoints'),
    talk(3, 'Lars Moastuen', 'wtf-datamodeling'),
  ] },
  plenary('lunch', '11:15', 'Lunch', 'Atrium & all rooms'),
  { id: 'session-2-1200', time: '12:00', title: 'Session 2 · Parallel talks', items: [
    talk(1, 'Lise Hauger, Edel Hvesser Andersen', 'Phrase it simply: an introduction to our new AI-native translation platform'),
    talk(2, 'Sara Kaoukabi', 'Hack Faster Than You Deploy: Integrating Continuous Penetration Testing into the SDLC'),
    talk(3, 'Leegin Bernads', 'O11y at 10x: What happens when your Observability platform becomes the bottleneck?'),
  ] },
  { id: 'session-2-1230', time: '12:30', title: 'Session 2 · Parallel talks', items: [
    talk(1, 'Henrik Brinch van Meenen', 'Neater? Experiments in opinionated data modeling and personal CLI-tools'),
    talk(2, 'Carlos Pereira', 'To upgrade or not to upgrade software dependencies? A supply chain security dilemma'),
    talk(3, 'Robert Collins', 'The opportunities of scale'),
  ] },
  { id: 'session-2-1245', time: '12:45', title: 'Session 2 · Parallel talks', items: [
    talk(1, 'Anders Hafreager', 'Choosing the best data exploration UI by going back to the 90s'),
    talk(2, 'Hendrik Teuber', 'A scalable and secure homelab 2.0: Kubernetes edition'),
  ] },
  plenary('break', '13:00', 'Break', ''),
  { id: 'session-3-1330', time: '13:30', title: 'Session 3 · Parallel talks', items: [
    talk(1, 'Lars Arne Skår', 'Test driving your custom extractor for scale'),
    talk(2, 'Niek Beckers', 'Our trial of AI code review tools: the good, the bad, and the hallucinated'),
    talk(3, 'Trygve Utstumo', 'Compression algorithms to fit 3 kids, 10 messaging platforms and after school activities into 24 hours'),
  ] },
  { id: 'session-3-1345', time: '13:45', title: 'Session 3 · Parallel talks', items: [
    talk(2, 'Aleksandar Dobrasinovic', 'Architecture as code: creating guardrails to embrace agentic coding at scale'),
    talk(3, 'Audun Skaugen', 'The optimal way to bike to work: a bit of mathematical nonsense'),
  ] },
  { id: 'session-3-1400', time: '14:00', title: 'Session 3 · Parallel talks', items: [
    talk(1, 'Finn Arne Gangstad, Aryan TaheriMonfared', 'Tuning per-pod load'),
    talk(2, 'Manju Krishna', 'Let the bot do the paperwork, and keep the human in the loop.'),
    talk(3, 'Ole A P Konstad', 'Confessions of a security professional: how not to make stupid mistakes. Vibing skills and scripts with claude'),
  ] },
  { id: 'session-3-1415', time: '14:15', title: 'Session 3 · Parallel talks', items: [
    talk(1, 'Johannes Kohlmann', "Big O isn't everything: Galactic Algorithms"),
    talk(2, 'Dag Brattli', "The Actor Model: The next leap in software quality won't come from a better model. It will come from pointing the model at the work we forgot"),
    talk(3, 'Åsmund Eldhuset', 'Git t(h)ree'),
  ] },
  plenary('cinnamon', '14:30', 'Cinnamon bun break', ''),
  plenary('closing', '15:00', 'Closing keynote', 'Atrium'),
];

const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: EVENT_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
const minutes = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };

export function eventClock(now = Date.now()) {
  const parts = Object.fromEntries(clockFormatter.formatToParts(new Date(now)).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) + Number(parts.second) / 60 };
}

export function agendaView(state, now = Date.now()) {
  const clock = eventClock(now);
  const manual = agenda.find(item => item.id === state.agendaSelection);
  if (manual) return { entry: manual, clock, label: 'UP NEXT', manual: true };
  if (clock.date > EVENT_DATE) return { entry: null, clock, label: 'UNTIL NEXT TIME', manual: false };
  const grace = Number.isFinite(state.agendaGraceMinutes) ? Math.max(0, Math.min(15, state.agendaGraceMinutes)) : 5;
  const entry = clock.date < EVENT_DATE ? agenda[0] : agenda.find(item => clock.minutes < minutes(item.time) + grace);
  // The PDF gives no closing-keynote end time. Keep the final session on the
  // event day rather than inventing an end time or rolling into another day.
  if (!entry) return { entry: agenda.at(-1), clock, label: 'FINAL SESSION', manual: false };
  const starting = clock.date === EVENT_DATE && clock.minutes >= minutes(entry.time);
  return { entry, clock, label: starting ? 'STARTING NOW' : 'UP NEXT', manual: false };
}
