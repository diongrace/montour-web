let contexteAudio = null;

/**
 * Les navigateurs bloquent le son tant que l'utilisateur n'a pas touché la page.
 * On appelle donc activerSon() lors d'un clic (prendre un ticket, toucher l'écran de salle).
 */
export function activerSon() {
  try {
    contexteAudio ??= new AudioContext();
    contexteAudio.resume();
  } catch {
    // Pas de son disponible sur cet appareil : ce n'est pas bloquant.
  }
}

/** Fait vibrer le téléphone et joue un court bip. */
export function alerter() {
  navigator.vibrate?.([300, 150, 300]);
  try {
    contexteAudio ??= new AudioContext();
    const oscillateur = contexteAudio.createOscillator();
    const volume = contexteAudio.createGain();
    oscillateur.frequency.value = 880;
    volume.gain.setValueAtTime(0.25, contexteAudio.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, contexteAudio.currentTime + 0.6);
    oscillateur.connect(volume).connect(contexteAudio.destination);
    oscillateur.start();
    oscillateur.stop(contexteAudio.currentTime + 0.6);
  } catch {
    // Le navigateur peut refuser le son : la vibration et l'affichage suffisent.
  }
}
