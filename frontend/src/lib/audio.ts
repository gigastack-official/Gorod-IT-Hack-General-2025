let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export async function beep(frequency: number, durationMs: number, volume = 0.2) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  await new Promise((r) => setTimeout(r, durationMs));
  osc.stop();
}

export async function successTone() {
  await beep(880, 120);
  await beep(1175, 140);
}

export async function failTone() {
  await beep(300, 180);
  await beep(220, 220);
}

export async function infoTone() {
  await beep(660, 100);
}


