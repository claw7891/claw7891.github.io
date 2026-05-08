// === Music Theory Course: Shared Audio Engine ===
// Level 1: Web Audio API synthesized tones, no sample loading

const AudioEngine = (() => {
  let ctx = null;
  let initialized = false;
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  
  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    if (!initialized) {
      initialized = true;
      console.log('🔊 AudioEngine initialized');
    }
  }

  // Auto-init AudioContext on first user gesture (required by mobile browsers)
  function _autoInit() { init(); }
  document.addEventListener('touchstart', _autoInit, { once: true });
  document.addEventListener('mousedown', _autoInit, { once: true });

  // Frequency of a MIDI note number
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Note name + octave → MIDI number
  function noteToMidi(name, octave) {
    const idx = NOTE_NAMES.indexOf(name);
    if (idx === -1) return null;
    // C4 = MIDI 60
    return idx + (octave + 1) * 12;
  }

  function freqForNote(name, octave) {
    const midi = noteToMidi(name, octave);
    if (midi === null) return null;
    return midiToFreq(midi);
  }

  function playNote(name, octave, duration = 0.5, velocity = 0.7) {
    init();
    const freq = freqForNote(name, octave);
    if (!freq) return;
    
    const now = ctx.currentTime;
    const release = Math.min(duration * 0.15, 0.2);

    // Oscillator — warm sawtooth filtered
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.setValueAtTime(freq * 0.999, now + release); // slight decay wobble

    // Gain envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(velocity * 0.5, now + 0.01); // attack
    gain.gain.setValueAtTime(velocity * 0.5, now + 0.01);
    gain.gain.linearRampToValueAtTime(velocity * 0.3, now + duration - release); // sustain
    gain.gain.linearRampToValueAtTime(0, now + duration);

    // Low-pass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3, now);
    filter.Q.setValueAtTime(4, now);

    // Add subtle reverb-like release tone
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now + 0.005);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(velocity * 0.08, now + 0.01);
    gain2.gain.linearRampToValueAtTime(0, now + duration * 0.5);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + duration * 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);

    return { osc, gain, filter };
  }

  function playNotes(notes, duration = 0.5) {
    notes.forEach(n => {
      if (Array.isArray(n)) playNote(n[0], n[1], duration);
      else playNote(n, 4, duration);
    });
  }

  function playChord(notes, duration = 0.8) {
    notes.forEach(n => {
      const [name, oct = 4] = Array.isArray(n) ? n : [n, 4];
      playNote(name, oct, duration, 0.5);
    });
  }

  // Play a scale (list of [note, octave] pairs)
  function playScale(scaleNotes, msPerNote = 200) {
    scaleNotes.forEach((note, i) => {
      setTimeout(() => {
        const [name, oct = 4] = Array.isArray(note) ? note : [note, 4];
        playNote(name, oct, msPerNote / 1000 * 1.8, 0.6);
      }, i * msPerNote);
    });
  }

  // Get all semitones in an octave for a given root
  function chromaticFrom(root, octave = 4) {
    const idx = NOTE_NAMES.indexOf(root);
    if (idx === -1) return [];
    const notes = [];
    for (let i = 0; i < 12; i++) {
      let noteIdx = (idx + i) % 12;
      let oct = octave + Math.floor((idx + i) / 12);
      notes.push([NOTE_NAMES[noteIdx], oct]);
    }
    return notes;
  }

  function noteNameOnly(full) {
    const match = full.match(/^[A-G]#?b?/);
    return match ? match[0] : full;
  }

  return {
    init, playNote, playNotes, playChord, playScale,
    chrom: chromaticFrom, NOTE_NAMES, noteNameOnly,
    freqForNote, noteToMidi, midiToFreq,
    ctx: () => ctx
  };
})();

// === Shared UI: Piano Keyboard Widget ===
class PianoWidget {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.startOct = options.startOctave || 3;
    this.numOctaves = options.numOctaves || 2;
    this.highlightNotes = options.highlightNotes || []; // ["C","E","G"]
    this.highlightColor = options.highlightColor || '#4ecdc4';
    this.onNoteClick = options.onNoteClick || null;
    this.rootNote = options.rootNote || 'C';
    this.scaleNotes = options.scaleNotes || null; // array of note names in scale

    this.whiteNotes = [];
    this.blackNotes = [];
    this.heldNotes = new Set();

    this._buildLayout();
    this._bindEvents();
  }

  _buildLayout() {
    this.whiteNotes = [];
    this.blackNotes = [];
    // Black key positions relative to each white key
    const hasBlackAfter = [true, true, false, true, true, true, false]; // C D E F G A B

    let whiteIdx = 0;
    for (let oct = this.startOct; oct < this.startOct + this.numOctaves; oct++) {
      for (let i = 0; i < 7; i++) {
        const noteIdx = [0, 2, 4, 5, 7, 9, 11][i]; // C D E F G A B
        const noteName = AudioEngine.NOTE_NAMES[noteIdx];
        this.whiteNotes.push({ name: noteName, octave: oct, idx: whiteIdx, noteIdx });
        if (hasBlackAfter[i]) {
          const blackName = AudioEngine.NOTE_NAMES[noteIdx + 1];
          this.blackNotes.push({ name: blackName, octave: oct, whiteIdx });
        }
        whiteIdx++;
      }
    }
    this.totalWhites = whiteIdx;
  }

  _bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      let x, y;
      if (e.touches) {
        x = (e.touches[0].clientX - rect.left) * scaleX;
        y = (e.touches[0].clientY - rect.top) * scaleY;
      } else {
        x = (e.clientX - rect.left) * scaleX;
        y = (e.clientY - rect.top) * scaleY;
      }
      return { x, y };
    };

    const findKey = (pos) => {
      const ww = this.canvas.width / this.totalWhites;
      const bh = this.canvas.height * 0.58;
      // Check black keys first (they're on top)
      for (const bk of this.blackNotes) {
        const bx = (bk.whiteIdx + 1) * ww - ww * 0.22;
        if (pos.x >= bx && pos.x <= bx + ww * 0.44 && pos.y <= bh) {
          return bk;
        }
      }
      // White keys
      const wi = Math.floor(pos.x / ww);
      const wk = this.whiteNotes.find(w => w.idx === wi);
      return wk || null;
    };

    const handleStart = (e) => {
      e.preventDefault();
      const key = findKey(getPos(e));
      if (!key) return;
      this.heldNotes.add(`${key.name}${key.octave}`);
      AudioEngine.playNote(key.name, key.octave, 0.4, 0.6);
      if (this.onNoteClick) this.onNoteClick(key);
      this.draw();
    };

    const handleMove = (e) => {
      e.preventDefault();
      const key = findKey(getPos(e));
      if (!key) return;
      const id = `${key.name}${key.octave}`;
      if (!this.heldNotes.has(id)) {
        this.heldNotes.add(id);
        AudioEngine.playNote(key.name, key.octave, 0.3, 0.5);
        this.draw();
      }
    };

    const handleEnd = (e) => {
      this.heldNotes.clear();
      this.draw();
    };

    this.canvas.addEventListener('mousedown', handleStart);
    this.canvas.addEventListener('mousemove', handleMove);
    this.canvas.addEventListener('mouseup', handleEnd);
    this.canvas.addEventListener('mouseleave', handleEnd);
    this.canvas.addEventListener('touchstart', handleStart, { passive: false });
    this.canvas.addEventListener('touchmove', handleMove, { passive: false });
    this.canvas.addEventListener('touchend', handleEnd);
  }

  draw() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);
    const ww = w / this.totalWhites;
    const blackH = h * 0.58;
    const blackW = ww * 0.44;

    // Draw white keys
    for (const wk of this.whiteNotes) {
      const x = wk.idx * ww;
      const held = this.heldNotes.has(`${wk.name}${wk.octave}`);
      ctx.fillStyle = held ? '#7c6ff7' : '#2a2a38';
      ctx.strokeStyle = '#1a1a1f';
      ctx.lineWidth = 0.5;
      ctx.fillRect(x, 0, ww - 0.5, h);
      ctx.strokeRect(x, 0, ww - 0.5, h);

      // Label
      if (wk.name === 'C' || wk.name === this.rootNote) {
        ctx.fillStyle = '#9292a4';
        ctx.font = `${Math.max(8, ww * 0.28)}px var(--font)`;
        ctx.textAlign = 'center';
        ctx.fillText(wk.name, x + ww/2, h - 4);
      }
    }

    // Draw black keys
    for (const bk of this.blackNotes) {
      const x = (bk.whiteIdx + 1) * ww - blackW / 2;
      const held = this.heldNotes.has(`${bk.name}${bk.octave}`);
      ctx.fillStyle = held ? '#7c6ff7' : '#15151a';
      ctx.fillRect(x, 0, blackW, blackH);
    }

    // Highlight scale notes
    if (this.scaleNotes) {
      for (const wk of this.whiteNotes) {
        if (this.scaleNotes.includes(wk.name)) {
          const x = wk.idx * ww;
          ctx.fillStyle = 'rgba(124, 111, 247, 0.15)';
          ctx.fillRect(x, h * 0.75, ww - 0.5, h * 0.25);
        }
      }
    }
  }
}

// === Tone Generator (for ear training demos) ===
function playDemoSequence(notes, intervalMs = 300) {
  notes.forEach((n, i) => {
    setTimeout(() => {
      if (Array.isArray(n) && n.length > 2) {
        // chord
        AudioEngine.playChord(n);
      } else {
        const [name, oct = 4] = Array.isArray(n) ? n : [n, 4];
        AudioEngine.playNote(name, oct, 0.5, 0.6);
      }
    }, i * intervalMs);
  });
}

// === Note name → display name ===
function displayNote(note) {
  // Convert sharps to unicode ♯ for display, flats to ♭
  return note.replace('#', '♯').replace('b', '♭');
}