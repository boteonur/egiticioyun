export const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  },
  playTone(freq, type, duration, vol = 0.05) {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  
  playClick(timeOffset, baseFreq, vol) {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const startTime = this.ctx.currentTime + timeOffset;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(300, startTime);
    osc1.frequency.exponentialRampToValueAtTime(50, startTime + 0.05); 
    gain1.gain.setValueAtTime(vol, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(startTime);
    osc1.stop(startTime + 0.06);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq, startTime);
    gain2.gain.setValueAtTime(vol * 0.8, startTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.02); 
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(startTime);
    osc2.stop(startTime + 0.03);
  },

  roll() {
    const rollTimings = [0, 0.09, 0.165, 0.225, 0.275, 0.315, 0.345, 0.365, 0.380];
    
    rollTimings.forEach((timeOffset, index) => {
       const freq = 1200 + Math.random() * 400; 
       const vol = Math.max(0.01, 0.15 - (index * 0.015));
       this.playClick(timeOffset, freq, vol);
    });
  },
  
  step() {
    this.playTone(400, 'sine', 0.1, 0.04);
  },
  lock() {
    this.playTone(523.25, 'sine', 0.1, 0.05); 
    setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.05), 100); 
    setTimeout(() => this.playTone(783.99, 'sine', 0.3, 0.05), 200); 
  },
  win() {
    [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.2, 0.05), i * 150));
    setTimeout(() => this.playTone(880, 'square', 0.4, 0.05), 600);
  },
  lose() {
    [300, 280, 260, 200].forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.3, 0.05), i * 250));
  }
};
