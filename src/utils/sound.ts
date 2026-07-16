/**
 * Utilitaire audio pour synthétiser des effets sonores (sonneries) de type natif.
 * Utilise la Web Audio API pour garantir le fonctionnement hors ligne et sans latence.
 */

export function playChimeNotification() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const audioCtx = new AudioContextClass()

    // --- Note 1 (G#5 - 830.61 Hz) ---
    const osc1 = audioCtx.createOscillator()
    const gain1 = audioCtx.createGain()
    osc1.connect(gain1)
    gain1.connect(audioCtx.destination)

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(830.61, audioCtx.currentTime)
    gain1.gain.setValueAtTime(0, audioCtx.currentTime)
    gain1.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.03) // fade in rapide
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3) // fade out doux

    osc1.start(audioCtx.currentTime)
    osc1.stop(audioCtx.currentTime + 0.3)

    // --- Note 2 (C6 - 1046.50 Hz) - Carillon décalé ---
    const osc2 = audioCtx.createOscillator()
    const gain2 = audioCtx.createGain()
    osc2.connect(gain2)
    gain2.connect(audioCtx.destination)

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.08)
    gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.08)
    gain2.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.11) // fade in
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45) // fade out plus long

    osc2.start(audioCtx.currentTime + 0.08)
    osc2.stop(audioCtx.currentTime + 0.45)
  } catch (error) {
    console.warn('Web Audio API non supportée ou bloquée par les permissions de navigation :', error)
  }
}

/** Joue un signal sonore de succès (tâche complétée) */
export function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const audioCtx = new AudioContextClass()

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)

    osc.type = 'sine'
    
    // Accord ascendant rapide (effet réussite)
    const now = audioCtx.currentTime
    osc.frequency.setValueAtTime(523.25, now) // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08) // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16) // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.24) // C6
    
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc.start(now)
    osc.stop(now + 0.6)
  } catch (error) {
    console.warn('Audio feedback failed:', error)
  }
}
