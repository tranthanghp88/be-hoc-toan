// Dịch vụ âm thanh tổng hợp bằng Web Audio API
// Tránh dùng file tĩnh bên ngoài để đảm bảo ứng dụng chạy tức thì offline

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Lưu trạng thái cài đặt âm thanh của bé
export function isSoundEnabled(): boolean {
  const saved = localStorage.getItem('behoctoan_sound_enabled');
  return saved === null ? true : saved === 'true';
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem('behoctoan_sound_enabled', enabled ? 'true' : 'false');
}

// 1. Âm thanh "Ting" / "Star" (Khi trả lời đúng)
export function playCorrectSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Ting -> Ting Ting / Magic Chime
    // C5 -> G5 -> C6
    const notes = [523.25, 783.99, 1046.50];
    const delays = [0, 0.08, 0.16];
    const durations = [0.15, 0.15, 0.35];

    notes.forEach((freq, index) => {
      // 1st Oscillator: Sine wave for pure sweet tone
      const osc1 = ctx.createOscillator();
      const gainNode1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now + delays[index]);
      
      gainNode1.gain.setValueAtTime(0, now + delays[index]);
      gainNode1.gain.linearRampToValueAtTime(0.15, now + delays[index] + 0.02);
      gainNode1.gain.exponentialRampToValueAtTime(0.0001, now + delays[index] + durations[index]);
      
      osc1.connect(gainNode1);
      gainNode1.connect(ctx.destination);
      osc1.start(now + delays[index]);
      osc1.stop(now + delays[index] + durations[index]);

      // 2nd Oscillator (Triangle wave for warmth / toy vibe, slightly detuned)
      const osc2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq + 3, now + delays[index]);
      
      gainNode2.gain.setValueAtTime(0, now + delays[index]);
      gainNode2.gain.linearRampToValueAtTime(0.08, now + delays[index] + 0.02);
      gainNode2.gain.exponentialRampToValueAtTime(0.0001, now + delays[index] + durations[index]);
      
      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      osc2.start(now + delays[index]);
      osc2.stop(now + delays[index] + durations[index]);
    });
  } catch (e) {
    console.warn("Web Audio API not supported or blocked: ", e);
  }
}

// 2. Âm thanh "Boop" nhẹ nhàng (Khi trả lời sai)
export function playWrongSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Chuỗi 2 nốt thấp mềm theo yêu cầu: 260Hz trong 0.12s, sau đó 200Hz trong 0.16s
    const freqs = [260.00, 200.00]; 
    const delays = [0, 0.10];
    const durations = [0.12, 0.16];

    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[index]);
      
      // Gain ở mức 0.45 để nghe rõ ràng hơn nhưng vẫn mềm mại, không giật mình
      gainNode.gain.setValueAtTime(0, now + delays[index]);
      gainNode.gain.linearRampToValueAtTime(0.45, now + delays[index] + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delays[index] + durations[index]);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + delays[index]);
      osc.stop(now + delays[index] + durations[index]);
    });
  } catch (e) {
    console.warn("Web Audio API not supported or blocked: ", e);
  }
}

// 3. Âm thanh chúc mừng chiến thắng (Khi hoàn thành tất cả các câu)
export function playVictorySound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Joyful educational game victory fanfare major chord climb
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    const delays = [0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.52];
    const durations = [0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.8];

    notes.forEach((freq, index) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now + delays[index]);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.005, now + delays[index]); // rich warmth

      gainNode.gain.setValueAtTime(0, now + delays[index]);
      gainNode.gain.linearRampToValueAtTime(0.2, now + delays[index] + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delays[index] + durations[index]);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now + delays[index]);
      osc1.stop(now + delays[index] + durations[index]);
      osc2.start(now + delays[index]);
      osc2.stop(now + delays[index] + durations[index]);
    });
  } catch (e) {
    console.warn("Web Audio API not supported or blocked: ", e);
  }
}

// 4. Âm thanh Streak đặc sắc (Khi bé đạt chuỗi đúng liên tiếp mốc thưởng)
export function playStreakSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Chuỗi arpeggio bay bổng, rực rỡ: C5 -> E5 -> G5 -> C6 -> E6 -> G6
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    const delays = [0, 0.06, 0.12, 0.18, 0.24, 0.30];
    const durations = [0.2, 0.2, 0.2, 0.25, 0.3, 0.6];

    notes.forEach((freq, index) => {
      // Layer 1: Sine wave for pure crystal chimes
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[index]);
      
      if (index >= 4) {
        osc.frequency.setValueAtTime(freq, now + delays[index]);
        osc.frequency.linearRampToValueAtTime(freq + 15, now + delays[index] + 0.1);
        osc.frequency.linearRampToValueAtTime(freq - 15, now + delays[index] + 0.2);
        osc.frequency.linearRampToValueAtTime(freq, now + delays[index] + 0.35);
      }

      gainNode.gain.setValueAtTime(0, now + delays[index]);
      gainNode.gain.linearRampToValueAtTime(0.24, now + delays[index] + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delays[index] + durations[index]);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delays[index]);
      osc.stop(now + delays[index] + durations[index]);

      // Layer 2: Triangle wave for sweet toy-like body warmth
      const oscWarm = ctx.createOscillator();
      const gainWarm = ctx.createGain();

      oscWarm.type = 'triangle';
      oscWarm.frequency.setValueAtTime(freq, now + delays[index]);

      gainWarm.gain.setValueAtTime(0, now + delays[index]);
      gainWarm.gain.linearRampToValueAtTime(0.12, now + delays[index] + 0.02);
      gainWarm.gain.exponentialRampToValueAtTime(0.0001, now + delays[index] + durations[index]);

      oscWarm.connect(gainWarm);
      gainWarm.connect(ctx.destination);

      oscWarm.start(now + delays[index]);
      oscWarm.stop(now + delays[index] + durations[index]);
    });
  } catch (e) {
    console.warn("Web Audio API not supported or blocked: ", e);
  }
}

