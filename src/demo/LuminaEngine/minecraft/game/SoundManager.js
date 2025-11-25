export class SoundManager {
    constructor(settingsManager) {
        this.settings = settingsManager;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    get volume() {
        return this.settings.get('volume');
    }

    createOscillator(type, freq, startTime, duration) {
        if(this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(this.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    createNoise(duration) {
        if(this.ctx.state === 'suspended') this.ctx.resume();
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        
        gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playBreak(blockId) {
        this.createNoise(0.1); 
        this.createOscillator('square', 100, this.ctx.currentTime, 0.1);
    }

    playPlace(blockId) {
        this.createOscillator('square', 300, this.ctx.currentTime, 0.05);
    }

    playJump() {
        this.createOscillator('triangle', 150, this.ctx.currentTime, 0.15);
    }

    playStep() {
        this.createNoise(0.05);
    }
}