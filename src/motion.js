// A shared timeline keeps both windows aligned and avoids phase jumps when the
// operator changes motion speed during a song or while motion is paused.
export const motionAmplitude = (motion = 0.5) => Math.pow(motion * 2, 1.5);

export function motionTime(state, now = Date.now()) {
  const at = state.paused ? state.frozenAt : now;
  return state.motionOffset + Math.max(0, at - state.motionStart) / 1000 * state.motion * 2;
}

export function changeMotion(state, motion, now = Date.now()) {
  return {
    motion,
    motionOffset: motionTime(state, now),
    motionStart: state.paused ? state.frozenAt : now,
  };
}
