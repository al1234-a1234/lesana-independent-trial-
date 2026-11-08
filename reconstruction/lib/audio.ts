"use client";
let context: AudioContext | undefined;
export function sound(correct: boolean) {
  try {
    context ??= new AudioContext();
    void context.resume();
    const o = context.createOscillator(),
      g = context.createGain();
    o.type = "sine";
    o.frequency.value = correct ? 620 : 180;
    g.gain.setValueAtTime(0.035, context.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.09);
    o.connect(g).connect(context.destination);
    o.start();
    o.stop(context.currentTime + 0.1);
  } catch {
    /* Optional effects must not interrupt writing. */
  }
}
