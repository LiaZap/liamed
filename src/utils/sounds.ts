// Sound utility using Web Audio API for notification sounds

type SoundType = 'success' | 'error' | 'notification' | 'complete';

export function playSound(type: SoundType = 'success') {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        switch (type) {
            case 'success':
                playSuccessChime(audioContext);
                break;
            case 'complete':
                playCompleteSound(audioContext);
                break;
            case 'notification':
                playNotificationSound(audioContext);
                break;
            case 'error':
                playErrorSound(audioContext);
                break;
            default:
                playSuccessChime(audioContext);
        }
    } catch (e) {
        console.warn('Sound not supported:', e);
    }
}

// Pleasant success chime (two ascending notes)
function playSuccessChime(ctx: AudioContext) {
    const now = ctx.currentTime;

    // First note (C5)
    playTone(ctx, 523.25, now, 0.15, 0.3);
    // Second note (E5) - higher
    playTone(ctx, 659.25, now + 0.12, 0.2, 0.35);
    // Third note (G5) - even higher
    playTone(ctx, 783.99, now + 0.24, 0.25, 0.3);
}

// Complete sound (satisfying completion sound)
function playCompleteSound(ctx: AudioContext) {
    const now = ctx.currentTime;

    // Rising arpeggio
    playTone(ctx, 440, now, 0.1, 0.2);        // A4
    playTone(ctx, 554.37, now + 0.08, 0.1, 0.25); // C#5
    playTone(ctx, 659.25, now + 0.16, 0.15, 0.3); // E5
    playTone(ctx, 880, now + 0.24, 0.3, 0.35);    // A5
}

// Simple notification ping
function playNotificationSound(ctx: AudioContext) {
    const now = ctx.currentTime;
    playTone(ctx, 880, now, 0.15, 0.3);
}

// Error sound (descending)
function playErrorSound(ctx: AudioContext) {
    const now = ctx.currentTime;
    playTone(ctx, 400, now, 0.15, 0.3);
    playTone(ctx, 300, now + 0.1, 0.2, 0.25);
}

// Helper to play a single tone
function playTone(
    ctx: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    volume: number
) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Smooth volume envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, startTime + duration * 0.5);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

export default playSound;
