let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	const AudioCtxClass =
		window.AudioContext ||
		(window as unknown as { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext;
	if (!AudioCtxClass) return null;

	if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
		try {
			sharedAudioCtx = new AudioCtxClass();
		} catch {
			return null;
		}
	}
	if (sharedAudioCtx.state === "suspended") {
		void sharedAudioCtx.resume();
	}
	return sharedAudioCtx;
}

export function playPageTurnSound(): void {
	const ctx = getAudioContext();
	if (!ctx) return;

	try {
		const sampleRate = ctx.sampleRate;
		const duration = 0.22;
		const frameCount = Math.floor(sampleRate * duration);
		const buffer = ctx.createBuffer(1, frameCount, sampleRate);
		const data = buffer.getChannelData(0);

		for (let i = 0; i < frameCount; i++) {
			const progress = i / frameCount;
			const envelope = Math.sin(progress * Math.PI) * Math.exp(-progress * 2.5);
			data[i] = (Math.random() * 2 - 1) * envelope * 0.25;
		}

		const noise = ctx.createBufferSource();
		noise.buffer = buffer;

		const filter = ctx.createBiquadFilter();
		filter.type = "bandpass";
		filter.frequency.setValueAtTime(1400, ctx.currentTime);
		filter.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + duration);
		filter.Q.setValueAtTime(2.2, ctx.currentTime);

		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.01, ctx.currentTime);
		gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.04);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);

		noise.start();
	} catch {
		// Ignore audio autoplay restrictions
	}
}
